<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $query = Project::with('manager:id,name,email')->withCount(['tasks', 'members']);

        if ($user->role !== 'admin') {
            $query->where(function ($q) use ($user) {
                $q->where('manager_id', $user->id)
                    ->orWhereHas('members', fn ($m) => $m->where('user_id', $user->id));
            });
        }

        return response()->json($query->orderBy('name')->get());
    }

    public function store(Request $request)
    {
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

        $project = Project::create($data);

        return response()->json($project, 201);
    }

    public function show(Project $project, Request $request)
    {
        $this->authorizeMember($project, $request->user());

        $project->load(['manager:id,name,email', 'members:id,name,email']);
        $project->loadCount('tasks');

        return response()->json($project);
    }

    public function update(Project $project, Request $request)
    {
        $this->authorizeManager($project, $request->user());

        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'color' => 'nullable|string|max:20',
            'start_date' => 'sometimes|required|date',
            'end_date' => 'sometimes|required|date|after_or_equal:start_date',
            'status' => 'sometimes|required|string|max:100',
            'budget' => 'sometimes|required|numeric|min:0',
            'priority' => 'sometimes|required|string|max:50',
            'completion_percentage' => 'nullable|numeric|min:0|max:100',
        ]);

        $project->update($data);

        return response()->json($project);
    }

    public function destroy(Project $project, Request $request)
    {
        $this->authorizeManager($project, $request->user());

        $project->delete();

        return response()->json(['message' => 'Deleted']);
    }

    public function assignManager(Project $project, Request $request)
    {
        if ($request->user()->role !== 'admin') {
            abort(403);
        }

        $data = $request->validate([
            'manager_id' => 'required|exists:users,id',
        ]);

        $manager = User::findOrFail($data['manager_id']);
        if ($manager->role !== 'project_manager') {
            abort(422, 'Assigned manager must have the project_manager role');
        }

        $project->update(['manager_id' => $manager->id]);

        return response()->json($project->load('manager:id,name,email'));
    }

    protected function authorizeMember(Project $project, $user): void
    {
        if (! $project->isMember($user)) {
            abort(403);
        }
    }

    protected function authorizeManager(Project $project, $user): void
    {
        if (! $project->isManager($user)) {
            abort(403);
        }
    }
}
