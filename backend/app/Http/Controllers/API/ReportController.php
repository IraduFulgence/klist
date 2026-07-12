<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function organization()
    {
        $totalTasks = Task::count();
        $completedTasks = Task::where('status', 'completed')->orWhere('completed', true)->count();

        return response()->json([
            'total_projects' => Project::count(),
            'total_employees' => User::count(),
            'total_departments' => Department::count(),
            'tasks_completed_pct' => $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100, 1) : 0,
            'overdue_tasks_count' => Task::where('due_date', '<', now())
                ->where('completed', false)
                ->count(),
            'projects_by_status' => Project::selectRaw('status, count(*) as count')
                ->groupBy('status')
                ->pluck('count', 'status'),
        ]);
    }

    public function project(Project $project, Request $request)
    {
        if (! $project->isManager($request->user())) {
            abort(403);
        }

        $spent = (float) $project->expenses()->where('status', 'approved')->sum('amount');

        $teamWorkload = $project->members()->get(['users.id', 'users.name'])->map(function ($member) use ($project) {
            return [
                'user' => ['id' => $member->id, 'name' => $member->name],
                'open_tasks_count' => $project->tasks()->where('assignee_id', $member->id)->where('completed', false)->count(),
                'completed_tasks_count' => $project->tasks()->where('assignee_id', $member->id)->where('completed', true)->count(),
            ];
        });

        return response()->json([
            'budget' => (float) $project->budget,
            'spent' => $spent,
            'remaining' => (float) $project->budget - $spent,
            'milestones' => $project->milestones()->orderBy('due_date')->get(['id', 'title', 'status', 'completion_percentage', 'due_date']),
            'team_workload' => $teamWorkload,
            'overdue_tasks' => $project->tasks()
                ->where('due_date', '<', now())
                ->where('completed', false)
                ->with('assignee:id,name')
                ->get(['id', 'title', 'due_date', 'assignee_id']),
        ]);
    }
}
