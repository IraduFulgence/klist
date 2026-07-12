<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectExpense extends Model
{
    protected $fillable = ['project_id', 'expense_name', 'amount', 'expense_date', 'added_by', 'description', 'status', 'notes'];

    protected $casts = [
        'amount' => 'float',
        'expense_date' => 'date',
    ];

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function addedBy()
    {
        return $this->belongsTo(User::class, 'added_by');
    }
}
