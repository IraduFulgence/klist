<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

// #[Fillable(['name', 'description', 'color', 'owner_id'])]
class Project extends Model
{
    protected $fillable =['name','owner','manager_id','end_date','description','color','start_date','status','budget','priority','completion_percentage' ];
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function members(): BelongsToMany
    {
        return $this->belongsToMany(User::class)
            ->withPivot('role')
            ->withTimestamps();
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function isMember(User $user): bool
    {
        return $this->owner_id === $user->id || $this->members()->where('user_id', $user->id)->exists();
    }
}
