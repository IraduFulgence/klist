<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\Request;

class ProjectMemberController extends Controller
{
    public function index(Project $project, Request $request)
    {
        $this->authorizeMember($project, $request->user());

        return response()->json($project->members()->get(['users.id', 'users.name', 'users.email']));
    }

    public function store(Project $project, Request $request)
    {
        $this->authorizeOwner($project, $request->user());

        $data = $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        $member = User::where('email', $data['email'])->firstOrFail();

        if ($project->members()->where('user_id', $member->id)->exists()) {
            return response()->json(['message' => 'User is already a member'], 422);
        }

        $project->members()->attach($member->id, ['role' => 'member']);

        return response()->json($project->members()->get(['users.id', 'users.name', 'users.email']), 201);
    }

    public function destroy(Project $project, User $user, Request $request)
    {
        $this->authorizeOwner($project, $request->user());

        if ($user->id === $project->owner_id) {
            abort(422, 'Cannot remove the project owner');
        }

        $project->members()->detach($user->id);

        return response()->json(['message' => 'Removed']);
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
