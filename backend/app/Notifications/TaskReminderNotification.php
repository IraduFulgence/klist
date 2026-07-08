<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class TaskReminderNotification extends Notification
{
    use Queueable;

    protected $tasks;

    public function __construct($tasks)
    {
        $this->tasks = $tasks;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        $mail = (new MailMessage)
            ->subject('Uncompleted tasks reminder')
            ->greeting('Hello '.$notifiable->name.',')
            ->line('You have the following uncompleted tasks:');

        foreach ($this->tasks as $task) {
            $mail->line("- {$task->title}" . ($task->due_date ? " (due: {$task->due_date->toDateString()})" : ''));
        }

        $mail->line('Please review and complete them.');

        return $mail;
    }
}
