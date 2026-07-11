<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $projects = $request->user()
            ->projects()
            ->with('owner:id,name,email')
            ->withCount(['tasks', 'members'])
            ->orderBy('name')
            ->get();

        return response()->json($projects);
    }

    public function store(Request $request)
    {
        // check if the user is an admin or project manager
        if((!in_array($request->user()->role, ['admin', 'project_manager']))) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'manager_id' => 'required|exists:users,id',
            'status' => 'required|string|max:100',
            'budget' => 'required|numeric|min:0',
            'priority' => 'required|string|max:50',
            'owner' => 'required',
            'completion_percentage' => 'nullable|numeric|min:0|max:100',

            'color' => 'nullable|string|max:20',
        ]);

        $project = new Project($data);

        return response()->json($project, 201);
    }

    public function show(Project $project, Request $request)
    {
        $this->authorizeMember($project, $request->user());

        $project->load(['owner:id,name,email', 'members:id,name,email']);
        $project->loadCount('tasks');

        return response()->json($project);
    }

    public function update(Project $project, Request $request)
    {
        $this->authorizeOwner($project, $request->user());

        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'color' => 'nullable|string|max:20',
        ]);

        $project->update($data);

        return response()->json($project);
    }

    public function destroy(Project $project, Request $request)
    {
        $this->authorizeOwner($project, $request->user());

        $project->delete();

        return response()->json(['message' => 'Deleted']);
    }

    protected function authorizeMember(Project $project, $user): void
    {
        if (! $project->isMember($user)) {
            abort(403);
        }
    }

    protected function authorizeOwner(Project $project, $user): void
    {
        if ($project->owner_id !== $user->id) {
            abort(403);
        }
    }
}
