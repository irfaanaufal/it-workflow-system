<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserApplication extends Model
{
    use HasFactory;

    protected $table = 'user_applications';

    protected $fillable = [
        'user_id',
        'application_id',
        'is_active',
        'approved_by',
        'approved_at',
        'role_id',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'approved_at' => 'datetime',
        ];
    }

    /**
     * Get the user that owns the user application record.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the application that owns the user application record.
     */
    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }

    /**
     * Get the user who approved this application access.
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }
}
