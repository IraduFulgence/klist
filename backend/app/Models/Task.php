<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['title', 'description', 'due_date', 'start_date', 'completed', 'user_id', 'project_id', 'assignee_id', 'status', 'priority', 'position', 'milestone_id', 'estimated_hours', 'actual_hours'])]
class Task extends Model
{
    use HasFactory;

    protected $casts = [
        'due_date' => 'datetime',
        'completed' => 'boolean',
        'position' => 'integer',
        'estimated_hours' => 'float',
        'actual_hours' => 'float',
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

    public function milestone()
    {
        return $this->belongsTo(Milestone::class);
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    public function files()
    {
        return $this->hasMany(ProjectFile::class);
    }
}
