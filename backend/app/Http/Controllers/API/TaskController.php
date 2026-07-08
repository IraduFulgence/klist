<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Task;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    public function index(Request $request)
    {
        $user = $request->user();

        $tasks = $user->tasks()->orderBy('due_date')->get();

        return response()->json($tasks);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'due_date' => 'nullable|date',
        ]);

        $task = $request->user()->tasks()->create($data);

        return response()->json($task, 201);
    }

    public function show(Task $task, Request $request)
    {
        $this->authorizeTask($task, $request->user());
        return response()->json($task);
    }

    public function update(Task $task, Request $request)
    {
        $this->authorizeTask($task, $request->user());

        $data = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'due_date' => 'nullable|date',
            'completed' => 'nullable|boolean',
        ]);

        $task->update($data);

        return response()->json($task);
    }

    public function destroy(Task $task, Request $request)
    {
        $this->authorizeTask($task, $request->user());
        $task->delete();
        return response()->json(['message' => 'Deleted']);
    }

    protected function authorizeTask(Task $task, $user)
    {
        if ($task->user_id !== $user->id) {
            abort(403);
        }
    }
}
