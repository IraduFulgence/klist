<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Activity;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $projectIds = $user->projects()->pluck('projects.id');

        $activities = Activity::where('user_id', $user->id)
            ->orWhereIn('project_id', $projectIds)
            ->with(['user:id,name', 'project:id,name,color'])
            ->latest()
            ->limit(50)
            ->get();

        return response()->json($activities);
    }
}
