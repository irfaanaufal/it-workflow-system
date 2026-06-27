<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class TicketChecklist extends Model
{
    use HasFactory;

    protected $table = 'ticket_checklists';

    protected $fillable = [
        'ticket_id',
        'task_name',
        'is_approved',
        'is_completed',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_approved' => 'boolean',
            'is_completed' => 'boolean',
        ];
    }

    /**
     * Get the ticket that owns the checklist item.
     */
    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class, 'ticket_id');
    }
}
