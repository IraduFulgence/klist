<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\Task;
use App\Models\User;

class ActivityLogger
{
    public static function log(User $user, string $action, Task $task, ?string $description = null): Activity
    {
        return $user->activities()->create([
            'task_id' => $task->id,
            'project_id' => $task->project_id,
            'action' => $action,
            'task_title' => $task->title,
            'description' => $description,
        ]);
    }
}
