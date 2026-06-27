<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SystemPtsam extends Model
{
    use HasFactory;

    protected $table = 'system_ptsam';

    protected $fillable = [
        'nama_sistem',
        'link_sistem',
    ];

    /**
     * Get the tickets related to this system.
     */
    public function tickets(): HasMany
    {
        return $this->hasMany(Ticket::class, 'system_ptsam_id');
    }
}
