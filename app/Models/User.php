<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable(['name', 'username', 'email', 'password', 'fid', 'avatar_path', 'remember_token'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $appends = ['avatar_url'];

    private array $levelCache = [];

    public function getAvatarUrlAttribute(): ?string
    {
        return $this->avatar_path ? asset('storage/' . $this->avatar_path) : null;
    }

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function karyawan(): BelongsTo
    {
        return $this->belongsTo(Karyawan::class, 'fid', 'fid');
    }

    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function getDivisiAttribute()
    {
        return $this->karyawan?->divisi ?? null;
    }

    /**
     * Numeric level of the user's role for a specific application.
     * Source of truth: users.role_id → roles.level
     * Returns null when the user has no role assigned.
     */
    public function level(?string $appSlug = 'it-workflow'): ?int
    {
        if (array_key_exists($appSlug, $this->levelCache)) {
            return $this->levelCache[$appSlug];
        }

        $level = $this->role?->level;
        $this->levelCache[$appSlug] = $level;

        return $level;
    }

    public function isIT(?string $appSlug = 'it-workflow'): bool
    {
        return $this->level($appSlug) === 1;
    }

    public function canManageMaster(?string $appSlug = 'it-workflow'): bool
    {
        return in_array($this->level($appSlug), [1, 2, 3, 4, 7], true);
    }

    public function canSeeGlobalMonitor(?string $appSlug = 'it-workflow'): bool
    {
        $level = $this->level($appSlug);
        return $level !== null && $level !== 1;
    }

    /**
     * Assign the user's role automatically based on their karyawan divisi
     * for all applications.
     */
    public function assignRoleFromDivisi(): void
    {
        $divisiMap = [
            'it' => 'IT',
            'direktur' => 'Direktur Utama',
            'direktur utama' => 'Direktur Utama',
            'hrd' => 'HRD',
            'admin' => 'Admin',
            'teknisi' => 'Teknisi',
            'qa' => 'QA',
            'qc' => 'QC',
            'ekspedisi' => 'Ekspedisi',
        ];

        $roleName = $divisiMap[strtolower(trim((string) $this->karyawan?->divisi))] ?? null;

        if ($roleName) {
            $roleId = Role::where('name', $roleName)->value('id');

            if ($roleId) {
                $this->role_id = $roleId;
                $this->save();

                // Sinkronkan role_id HANYA pada baris aplikasi yang sudah ada.
                // Jangan membuat baris baru — permintaan akses sistem lain
                // dibuat saat dibutuhkan, bukan sebagai efek samping approve.
                UserApplication::where('user_id', $this->id)
                    ->update(['role_id' => $roleId]);
            }
        }
    }

    /**
     * Pastikan ada tepat SATU baris akses it-workflow, langsung aktif.
     * Sistem lain (Meeting/Reminder/Shortly) tidak ikut dibuat —
     * lihat .agents/AGENTS.md (reminder = satu-satunya yang bergerbang).
     */
    public function ensureUserApplications(): void
    {
        $app = Application::firstOrCreate(
            ['slug' => 'it-workflow'],
            ['name' => 'IT Workflow', 'description' => 'Sistem manajemen workflow teknologi informasi.']
        );

        UserApplication::firstOrCreate(
            ['user_id' => $this->id, 'application_id' => $app->id],
            ['role_id' => $this->role_id, 'is_active' => true]
        );
    }

    public function accessRequestNotificationCount(): int
    {
        return LogNotifikasi::where('actor_user_id', $this->id)
            ->where('action', 'new_access_request')
            ->count();
    }

    /**
     * Beri tahu semua pemegang hak akses Kelola Permintaan (level 1,2,3,4,7)
     * bahwa ada permintaan akses baru. Aturan seragam lintas aplikasi.
     */
    public function sendAccessRequestNotifications(): void
    {
        User::whereHas('role', fn ($q) => $q->whereIn('level', [1, 2, 3, 4, 7]))
            ->get()
            ->each(function ($admin) {
                LogNotifikasi::create([
                    'user_id' => $admin->id,
                    'ticket_id' => null,
                    'actor_user_id' => $this->id,
                    'actor_name' => $this->name,
                    'recipient_type' => 'admin',
                    'action' => 'new_access_request',
                    'title' => 'Permintaan akses baru',
                    'message' => $this->name . ' (' . $this->username . ') mengajukan akses ke "IT Workflow".',
                    'status' => null,
                    'visible_in_bell' => true,
                ]);
            });
    }

    public function logNotifikasi(): HasMany
    {
        return $this->hasMany(LogNotifikasi::class);
    }

    public function userApplications(): HasMany
    {
        return $this->hasMany(UserApplication::class);
    }

    public function applications(): BelongsToMany
    {
        return $this->belongsToMany(Application::class, 'user_applications')
            ->withPivot('is_active', 'approved_by', 'approved_at', 'role_id')
            ->withTimestamps();
    }
}
