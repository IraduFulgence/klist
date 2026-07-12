<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Task;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function index(Task $task, Request $request)
    {
        $this->authorizeTask($task, $request->user());

        return response()->json($task->comments()->with('user:id,name,email')->oldest()->get());
    }

    public function store(Task $task, Request $request)
    {
        $this->authorizeTask($task, $request->user());

        $data = $request->validate([
            'content' => 'required|string',
        ]);

        $comment = $task->comments()->create([
            'user_id' => $request->user()->id,
            'content' => $data['content'],
        ]);

        return response()->json($comment->load('user:id,name,email'), 201);
    }

    public function update(Comment $comment, Request $request)
    {
        if ($comment->user_id !== $request->user()->id) {
            abort(403);
        }

        $data = $request->validate([
            'content' => 'required|string',
        ]);

        $comment->update($data);

        return response()->json($comment->load('user:id,name,email'));
    }

    public function destroy(Comment $comment, Request $request)
    {
        $user = $request->user();
        if ($comment->user_id !== $user->id && $user->role !== 'admin') {
            abort(403);
        }

        $comment->delete();

        return response()->json(['message' => 'Deleted']);
    }

    protected function authorizeTask(Task $task, $user): void
    {
        $ownsTask = $task->user_id === $user->id || $task->assignee_id === $user->id;
        $inProject = $task->project_id && $task->project && $task->project->isMember($user);

        if (! $ownsTask && ! $inProject) {
            abort(403);
        }
    }
}
