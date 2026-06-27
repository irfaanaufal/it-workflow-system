<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Karyawan extends Model
{
    use HasFactory;

    protected $table = 'karyawans';

    protected $primaryKey = 'fid';
    
    public $incrementing = false;
    
    protected $keyType = 'string';

    protected $fillable = [
        'fid',
        'nama_karyawan',
        'divisi',
        'jabatan',
        'status',
    ];

    /**
     * Get the user associated with the Karyawan.
     */
    public function user(): HasOne
    {
        return $this->hasOne(User::class, 'fid', 'fid');
    }

    /**
     * Get the tickets created by this karyawan (as a reporter).
     */
    public function tickets(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Ticket::class, 'karyawan_id', 'id');
    }

    /**
     * Get the tickets handled by this karyawan (as an IT Admin).
     */
    public function handledTickets(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Ticket::class, 'admin_it_id', 'id');
    }
}
