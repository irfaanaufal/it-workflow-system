<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LogNotifikasi extends Model
{
    use HasFactory;

    protected $table = 'log_notifikasi';

    protected $fillable = [
        'user_id',
        'ticket_id',
        'actor_user_id',
        'actor_name',
        'recipient_type',
        'action',
        'title',
        'message',
        'status',
        'read_at',
        'visible_in_bell',
    ];

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
            'visible_in_bell' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }
}