<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\ProjectFile;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProjectFileController extends Controller
{
    public function index(Project $project, Request $request)
    {
        $this->authorizeMember($project, $request->user());

        $query = $project->files()->with(['uploader:id,name,email', 'task:id,title']);

        if ($request->filled('task_id')) {
            $query->where('task_id', $request->query('task_id'));
        }

        return response()->json($query->latest()->get());
    }

    public function store(Project $project, Request $request)
    {
        $this->authorizeMember($project, $request->user());

        $data = $request->validate([
            'file' => 'required|file|max:20480',
            'task_id' => 'nullable|exists:tasks,id',
        ]);

        $task = null;
        if (! empty($data['task_id'])) {
            $task = Task::findOrFail($data['task_id']);
            if ($task->project_id !== $project->id) {
                abort(422, 'Task does not belong to this project');
            }
        }

        $this->authorizeUpload($project, $request->user(), $task);

        $path = $request->file('file')->store("projects/{$project->id}", 'local');

        $file = $project->files()->create([
            'file_name' => $request->file('file')->getClientOriginalName(),
            'file_path' => $path,
            'uploaded_by' => $request->user()->id,
            'task_id' => $task?->id,
        ]);

        return response()->json($file->load(['uploader:id,name,email', 'task:id,title']), 201);
    }

    public function download(ProjectFile $file, Request $request)
    {
        $this->authorizeMember($file->project, $request->user());

        return Storage::disk('local')->download($file->file_path, $file->file_name);
    }

    public function destroy(ProjectFile $file, Request $request)
    {
        $user = $request->user();
        if ($file->uploaded_by !== $user->id && ! $file->project->isManager($user)) {
            abort(403);
        }

        Storage::disk('local')->delete($file->file_path);
        $file->delete();

        return response()->json(['message' => 'Deleted']);
    }

    protected function authorizeMember(Project $project, $user): void
    {
        if (! $project->isMember($user)) {
            abort(403);
        }
    }

    /**
     * PM/admin may upload project-level docs; a team member may only upload
     * "completed work" attached to a task they're the assignee of.
     */
    protected function authorizeUpload(Project $project, $user, ?Task $task): void
    {
        if ($project->isManager($user)) {
            return;
        }

        if ($task && $task->assignee_id === $user->id) {
            return;
        }

        abort(403);
    }
}
