<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class Ticket extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'tickets';

    protected $fillable = [
        'karyawan_id',
        'judul_laporan',
        'kategori_laporan',
        'urgensi_laporan',
        'kondisi_lapangan',
        'keinginan_sistem',
        'dampak_positif',
        'attachment_path',
        'status',
        'admin_it_id',
        'uat_feedback',
        'revision_reason',
    ];

    /**
     * Get the karyawan (reporter) who created the ticket.
     */
    public function karyawan(): BelongsTo
    {
        return $this->belongsTo(Karyawan::class, 'karyawan_id', 'id');
    }

    /**
     * Get the admin IT who handles the ticket.
     */
    public function adminIt(): BelongsTo
    {
        return $this->belongsTo(Karyawan::class, 'admin_it_id', 'id');
    }

    /**
     * Get the checklist items for the ticket.
     */
    public function checklists(): HasMany
    {
        return $this->hasMany(TicketChecklist::class, 'ticket_id');
    }
}
