<?php

namespace App\Console\Commands;

use App\Models\Task;
use App\Notifications\TaskReminderNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SendTaskReminders extends Command
{
    protected $signature = 'tasks:send-reminders';

    protected $description = 'Send reminders for uncompleted tasks to users';

    public function handle()
    {
        $tasks = Task::where('completed', false)
            ->whereNotNull('due_date')
            ->where('due_date', '<=', now()->endOfDay())
            ->with('user')
            ->get()
            ->groupBy('user_id');

        foreach ($tasks as $userId => $userTasks) {
            $user = $userTasks->first()->user;
            if ($user && $user->email) {
                $user->notify(new TaskReminderNotification($userTasks));
                $this->info('Sent reminder to '.$user->email);
            }
        }

        return 0;
    }
}
