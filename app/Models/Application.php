<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Application extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
    ];

    /**
     * Get the user applications records for the application.
     */
    public function userApplications(): HasMany
    {
        return $this->hasMany(UserApplication::class);
    }

    /**
     * The users that belong to the application.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_applications')
            ->withPivot('is_active', 'approved_by', 'approved_at')
            ->withTimestamps();
    }
}
