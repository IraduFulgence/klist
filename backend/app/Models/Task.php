<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['title', 'description', 'due_date', 'completed', 'user_id', 'project_id', 'assignee_id', 'status', 'priority', 'position'])]
class Task extends Model
{
    use HasFactory;

    protected $casts = [
        'due_date' => 'datetime',
        'completed' => 'boolean',
        'position' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function assignee()
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }
}
