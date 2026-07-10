<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\Task;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class TaskController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        if ($request->filled('project_id')) {
            $project = Project::findOrFail($request->query('project_id'));
            $this->authorizeProjectMember($project, $user);

            $tasks = $project->tasks()
                ->with('assignee:id,name,email')
                ->orderBy('status')
                ->orderBy('position')
                ->get();

            return response()->json($tasks);
        }

        $tasks = Task::where('user_id', $user->id)
            ->orWhere('assignee_id', $user->id)
            ->with(['assignee:id,name,email', 'project:id,name,color'])
            ->orderBy('due_date')
            ->get();

        return response()->json($tasks);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'due_date' => 'nullable|date',
            'project_id' => 'nullable|exists:projects,id',
            'assignee_id' => 'nullable|exists:users,id',
            'status' => 'nullable|in:todo,in_progress,done',
            'priority' => 'nullable|in:low,medium,high',
        ]);

        $project = null;
        if (! empty($data['project_id'])) {
            $project = Project::findOrFail($data['project_id']);
            $this->authorizeProjectMember($project, $request->user());

            if (! empty($data['assignee_id']) && ! $project->isMember(\App\Models\User::find($data['assignee_id']))) {
                abort(422, 'Assignee must be a project member');
            }
        } else {
            unset($data['assignee_id']);
        }

        if (! empty($data['status'])) {
            $data['completed'] = $data['status'] === 'done';
        }

        if (! empty($data['project_id'])) {
            $data['position'] = (int) Task::where('project_id', $data['project_id'])
                ->where('status', $data['status'] ?? 'todo')
                ->max('position') + 1;
        }

        $task = $request->user()->tasks()->create($data);

        ActivityLogger::log($request->user(), 'created', $task, 'Task created');

        return response()->json($task->load('assignee:id,name,email'), 201);
    }

    public function show(Task $task, Request $request)
    {
        $this->authorizeTask($task, $request->user());
        return response()->json($task->load(['assignee:id,name,email', 'project:id,name,color']));
    }

    public function update(Task $task, Request $request)
    {
        $this->authorizeTask($task, $request->user());

        $project = $task->project;

        $data = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'due_date' => 'nullable|date',
            'completed' => 'nullable|boolean',
            'status' => 'nullable|in:todo,in_progress,done',
            'priority' => 'nullable|in:low,medium,high',
            'assignee_id' => [
                'nullable',
                'exists:users,id',
                Rule::prohibitedIf(! $project),
            ],
            'position' => 'nullable|integer',
        ]);

        if ($project && ! empty($data['assignee_id']) && ! $project->isMember(\App\Models\User::find($data['assignee_id']))) {
            abort(422, 'Assignee must be a project member');
        }

        $wasCompleted = $task->completed;
        $previousAssigneeId = $task->assignee_id;

        if (array_key_exists('status', $data) && $data['status']) {
            $data['completed'] = $data['status'] === 'done';
        } elseif (array_key_exists('completed', $data)) {
            $data['status'] = $data['completed'] ? 'done' : ($task->status === 'done' ? 'todo' : $task->status);
        }

        $task->update($data);
        $task->refresh();

        if (array_key_exists('completed', $data) && $data['completed'] && ! $wasCompleted) {
            ActivityLogger::log($request->user(), 'completed', $task, 'Task marked as complete');
        } elseif (array_key_exists('completed', $data) && ! $data['completed'] && $wasCompleted) {
            ActivityLogger::log($request->user(), 'reopened', $task, 'Task reopened');
        } elseif (array_key_exists('assignee_id', $data) && $data['assignee_id'] !== $previousAssigneeId) {
            ActivityLogger::log($request->user(), 'assigned', $task, 'Task reassigned');
        } else {
            ActivityLogger::log($request->user(), 'updated', $task, 'Task updated');
        }

        return response()->json($task->load('assignee:id,name,email'));
    }

    public function destroy(Task $task, Request $request)
    {
        $this->authorizeTask($task, $request->user());

        ActivityLogger::log($request->user(), 'deleted', $task, 'Task deleted');

        $task->delete();

        return response()->json(['message' => 'Deleted']);
    }

    /**
     * Bulk-update column/position for a project's board after a drag-and-drop change.
     */
    public function reorder(Project $project, Request $request)
    {
        $this->authorizeProjectMember($project, $request->user());

        $data = $request->validate([
            'columns' => 'required|array',
            'columns.todo' => 'array',
            'columns.in_progress' => 'array',
            'columns.done' => 'array',
            'columns.*.*' => 'integer|exists:tasks,id',
        ]);

        DB::transaction(function () use ($data, $project) {
            foreach ($data['columns'] as $status => $ids) {
                foreach (array_values($ids) as $index => $taskId) {
                    Task::where('id', $taskId)
                        ->where('project_id', $project->id)
                        ->update([
                            'status' => $status,
                            'completed' => $status === 'done',
                            'position' => $index,
                        ]);
                }
            }
        });

        return response()->json(
            $project->tasks()->with('assignee:id,name,email')->orderBy('status')->orderBy('position')->get()
        );
    }

    protected function authorizeTask(Task $task, $user)
    {
        $ownsTask = $task->user_id === $user->id || $task->assignee_id === $user->id;
        $inProject = $task->project_id && $task->project && $task->project->isMember($user);

        if (! $ownsTask && ! $inProject) {
            abort(403);
        }
    }

    protected function authorizeProjectMember(Project $project, $user)
    {
        if (! $project->isMember($user)) {
            abort(403);
        }
    }
}
