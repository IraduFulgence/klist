<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Milestone;
use App\Models\Project;
use Illuminate\Http\Request;

class MilestoneController extends Controller
{
    public function index(Project $project, Request $request)
    {
        $this->authorizeMember($project, $request->user());

        return response()->json($project->milestones()->orderBy('due_date')->get());
    }

    public function store(Project $project, Request $request)
    {
        $this->authorizeManager($project, $request->user());

        $data = $request->validate([
            'title' => 'required|string|max:255',
            'due_date' => 'required|date',
            'status' => 'nullable|in:not_started,in_progress,completed,cancelled,onhold',
            'completion_percentage' => 'nullable|numeric|min:0|max:100',
            'color' => 'nullable|string|max:20',
        ]);

        $milestone = $project->milestones()->create($data);

        return response()->json($milestone, 201);
    }

    public function update(Milestone $milestone, Request $request)
    {
        $this->authorizeManager($milestone->project, $request->user());

        $data = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'due_date' => 'sometimes|required|date',
            'status' => 'nullable|in:not_started,in_progress,completed,cancelled,onhold',
            'completion_percentage' => 'nullable|numeric|min:0|max:100',
            'color' => 'nullable|string|max:20',
        ]);

        $milestone->update($data);

        return response()->json($milestone);
    }

    public function destroy(Milestone $milestone, Request $request)
    {
        $this->authorizeManager($milestone->project, $request->user());

        $milestone->delete();

        return response()->json(['message' => 'Deleted']);
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
