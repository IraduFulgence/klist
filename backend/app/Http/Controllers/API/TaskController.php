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
            'status' => 'nullable|in:todo,in_progress,completed',
            'priority' => 'nullable|in:low,medium,high',
            'milestone_id' => 'nullable|exists:milestones,id',
            'estimated_hours' => 'nullable|numeric|min:0',
            'actual_hours' => 'nullable|numeric|min:0',
        ]);

        $project = null;
        if (! empty($data['project_id'])) {
            $project = Project::findOrFail($data['project_id']);
            $this->authorizeProjectMember($project, $request->user());

            if (! empty($data['assignee_id'])) {
                if (! $project->isMember(\App\Models\User::find($data['assignee_id']))) {
                    abort(422, 'Assignee must be a project member');
                }
                $this->authorizeAssign($project, $request->user(), (int) $data['assignee_id']);
            } else {
                $data['assignee_id'] = $request->user()->id;
            }
        } else {
            unset($data['assignee_id']);
        }

        if (! empty($data['status'])) {
            $data['completed'] = $data['status'] === 'completed';
        }

        if (! empty($data['project_id'])) {
            $data['position'] = (int) Task::where('project_id', $data['project_id'])
                ->where('status', $data['status'] ?? 'todo')
                ->max('position') + 1;
        }

        $data['start_date'] = now()->toDateString();

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
            'status' => 'nullable|in:todo,in_progress,completed',
            'priority' => 'nullable|in:low,medium,high',
            'assignee_id' => [
                'nullable',
                'exists:users,id',
                Rule::prohibitedIf(! $project),
            ],
            'position' => 'nullable|integer',
            'milestone_id' => 'nullable|exists:milestones,id',
            'estimated_hours' => 'nullable|numeric|min:0',
            'actual_hours' => 'nullable|numeric|min:0',
        ]);

        if ($project && array_key_exists('assignee_id', $data) && ! empty($data['assignee_id'])) {
            if (! $project->isMember(\App\Models\User::find($data['assignee_id']))) {
                abort(422, 'Assignee must be a project member');
            }
            if ((int) $data['assignee_id'] !== (int) $task->assignee_id) {
                $this->authorizeAssign($project, $request->user(), (int) $data['assignee_id']);
            }
        }

        $wasCompleted = $task->completed;
        $previousAssigneeId = $task->assignee_id;

        if (array_key_exists('status', $data) && $data['status']) {
            $data['completed'] = $data['status'] === 'completed';
        } elseif (array_key_exists('completed', $data)) {
            $data['status'] = $data['completed'] ? 'completed' : ($task->status === 'completed' ? 'todo' : $task->status);
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
            'columns.completed' => 'array',
            'columns.*.*' => 'integer|exists:tasks,id',
        ]);

        DB::transaction(function () use ($data, $project) {
            foreach ($data['columns'] as $status => $ids) {
                foreach (array_values($ids) as $index => $taskId) {
                    Task::where('id', $taskId)
                        ->where('project_id', $project->id)
                        ->update([
                            'status' => $status,
                            'completed' => $status === 'completed',
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

    /**
     * Only admins, project managers generally, or the project's manager may assign a task to someone else.
     */
    protected function authorizeAssign(Project $project, $user, int $assigneeId): void
    {
        if ($assigneeId === $user->id) {
            return;
        }

        if (in_array($user->role, ['admin', 'project_manager'], true) || $project->isManager($user)) {
            return;
        }

        abort(403, 'Only the project manager or an admin can assign tasks to other members');
    }
}
