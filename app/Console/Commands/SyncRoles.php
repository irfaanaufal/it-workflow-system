<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class SyncRoles extends Command
{
    protected $signature = 'roles:sync';
    protected $description = 'Sync roles to 9-role structure (idempotent — safe to re-run)';

    private array $divisiMap = [
        'it'              => 'IT',
        'direktur'        => 'Direktur Utama',
        'direktur utama'  => 'Direktur Utama',
        'head admin'      => 'Head Admin',
        'hrd'             => 'HRD',
        'admin'           => 'Admin',
        'teknisi'         => 'Teknisi',
        'qa'              => 'QA',
        'qc'              => 'QC',
        'ekspedisi'       => 'Ekspedisi',
    ];

    public function handle(): int
    {
        $this->newLine();
        $this->info('=== Roles Sync (Idempotent) ===');
        $this->newLine();

        try {
            $this->ensureMigrationsMarked();
            $this->ensureLevelColumn();
            $this->ensureOldRolesReplaced();
            $this->ensureRolesResequenced();
            $this->ensurePerAppRoles();
            $this->ensureHeadAdminRole();
            $this->ensureDdlColumns();
            $this->ensureBackfill();
            $this->ensureAllMigrationsMarked();

            $this->newLine();
            $this->info('=== SELESAI! ===');
            $this->newLine();
            $this->showStatus();
            return 0;

        } catch (\Throwable $e) {
            $this->error('ERROR: ' . $e->getMessage());
            return 1;
        }
    }

    private function isComplete(): bool
    {
        $roles = DB::table('roles')->orderBy('level')->pluck('level')->toArray();
        return $roles === [1, 2, 3, 4, 5, 6, 7, 8, 9];
    }

    private function ensureMigrationsMarked(): void
    {
        $oldMigrations = [
            '0001_01_01_000000_create_users_table',
            '0001_01_01_000001_create_cache_table',
            '0001_01_01_000002_create_jobs_table',
            '2026_06_24_000001_create_roles_table',
            '2026_06_24_070137_clean_users_role_column',
            '2026_06_24_070511_create_tickets_table',
            '2026_06_24_070521_create_ticket_checklists_table',
            '2026_06_24_070819_create_personal_access_tokens_table',
            '2026_06_25_034538_add_uat_fields_to_tickets_table',
            '2026_06_25_040628_add_avatar_to_users_table',
            '2026_06_25_083000_add_soft_deletes_to_tickets_table',
            '2026_06_26_000000_create_log_notifikasi_table',
            '2026_06_26_010000_add_tracking_fields_to_log_notifikasi_table',
            '2026_06_26_020000_add_visible_in_bell_to_log_notifikasi_table',
            '2026_06_27_063828_create_system_ptsam_table',
            '2026_06_27_063838_add_system_ptsam_id_to_tickets_table',
            '2026_06_29_100357_create_applications_table',
            '2026_06_29_100403_create_user_applications_table',
            '2026_06_29_103000_drop_permissions_tables',
            '2026_07_01_100000_add_username_fid_role_to_users_table',
            '2026_07_03_000001_add_unique_to_user_applications',
            '2026_07_03_000002_add_role_id_to_user_applications',
            '2026_07_08_000000_add_reject_reason_to_tickets_table',
            '2026_08_18_000001_add_deadline_to_tickets_table',
            '2026_08_18_000002_add_link_sistem_to_tickets_table',
            '2026_08_26_000003_fix_karyawan_cascade_delete',
            '2026_08_27_000002_add_performance_indexes',
        ];

        $newMigrations = [
            '2026_08_18_000000_add_level_to_roles_and_replace_roles',
            '2026_08_18_000001_resequence_role_ids',
            '2026_08_26_000001_migrate_role_to_per_app',
            '2026_08_26_000002_add_head_admin_role',
            '2026_08_27_000001_add_role_fk_to_users_table',
            '2026_08_27_000001_add_permissions_to_user_applications',
            '2026_08_29_000001_backfill_user_applications',
        ];

        $all = array_merge($oldMigrations, $newMigrations);
        $inserted = 0;

        foreach ($all as $name) {
            $exists = DB::table('migrations')->where('migration', $name)->exists();
            if (!$exists) {
                DB::table('migrations')->insert(['migration' => $name, 'batch' => 1]);
                $inserted++;
            }
        }

        $this->line("[Migrations] {$inserted} new records added (" . count($all) . " total)");
    }

    private function ensureLevelColumn(): void
    {
        if (Schema::hasColumn('roles', 'level')) {
            $this->line("[Roles] Column 'level' already exists");
            return;
        }

        Schema::table('roles', function ($table) {
            $table->integer('level')->nullable()->unique()->after('name');
        });
        $this->line("[Roles] Added 'level' column");
    }

    private function ensureOldRolesReplaced(): void
    {
        $oldRoles = DB::table('roles')
            ->where(function ($q) {
                $q->whereRaw('LOWER(name) = ?', ['superadmin'])
                  ->orWhereRaw('LOWER(name) = ?', ['user']);
            })
            ->get();

        if ($oldRoles->isEmpty()) {
            $this->line("[Roles] No old roles (superadmin/user) found — skipping replace");
            return;
        }

        $oldRoleIds = $oldRoles->pluck('id', 'name')->toArray();
        $this->line("[Roles] Found old roles: " . json_encode($oldRoleIds));

        $newRoles = [
            'IT'             => 1,
            'Direktur Utama' => 2,
            'HRD'            => 3,
            'Admin'          => 4,
            'Teknisi'        => 5,
            'QA'             => 6,
            'QC'             => 7,
            'Ekspedisi'      => 8,
        ];

        $indexExists = DB::selectOne(
            "SELECT INDEX_NAME FROM information_schema.STATISTICS "
            . "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'roles' AND INDEX_NAME = 'roles_name_unique'"
        );
        if ($indexExists) {
            DB::statement('ALTER TABLE roles DROP INDEX roles_name_unique');
        }

        foreach ($newRoles as $name => $level) {
            $existing = DB::table('roles')
                ->whereRaw('LOWER(name) = ?', [strtolower($name)])
                ->whereNotIn('id', array_values($oldRoleIds))
                ->first();

            if ($existing) {
                DB::table('roles')->where('id', $existing->id)->update([
                    'name' => $name, 'level' => $level, 'updated_at' => now(),
                ]);
            } else {
                DB::table('roles')->insert([
                    'name' => $name, 'level' => $level,
                    'created_at' => now(), 'updated_at' => now(),
                ]);
            }
        }

        $this->remapUsers($oldRoleIds, $newRoles);
        $this->remapUserApplications($oldRoleIds, $newRoles);

        DB::table('roles')->whereIn('id', array_values($oldRoleIds))->delete();

        $nameIndexExists = DB::selectOne(
            "SELECT INDEX_NAME FROM information_schema.STATISTICS "
            . "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'roles' AND INDEX_NAME = 'roles_name_unique'"
        );
        if (!$nameIndexExists) {
            DB::statement('ALTER TABLE roles ADD UNIQUE INDEX roles_name_unique (name)');
        }

        $this->line("[Roles] Old roles replaced with 8 new roles (IT-Ekspedisi)");
    }

    private function remapUsers(array $oldRoleIds, array $newRoles): void
    {
        $query = DB::table('users')->whereNotNull('users.role_id');
        if (Schema::hasTable('karyawans')) {
            $query->leftJoin('karyawans', 'users.fid', '=', 'karyawans.fid')
                  ->select('users.id', 'users.role_id', 'karyawans.divisi');
        } else {
            $query->select('users.id', 'users.role_id');
        }

        $users = $query->get();
        $remapped = 0;

        foreach ($users as $user) {
            $oldName = array_search($user->role_id, $oldRoleIds);
            if ($oldName === false) continue;

            $newName = $this->mapOldRole($oldName, $user->divisi ?? null);
            if (isset($newRoles[$newName])) {
                DB::table('users')->where('id', $user->id)->update(['role_id' => $newRoles[$newName]]);
                $remapped++;
            }
        }

        $this->line("  -> Remapped {$remapped} users");
    }

    private function remapUserApplications(array $oldRoleIds, array $newRoles): void
    {
        $userApps = DB::table('user_applications')->whereNotNull('role_id')->get();
        $remapped = 0;

        foreach ($userApps as $ua) {
            $oldName = array_search($ua->role_id, $oldRoleIds);
            if ($oldName === false) continue;

            $divisi = null;
            if (Schema::hasTable('karyawans')) {
                $divisi = DB::table('users')
                    ->leftJoin('karyawans', 'users.fid', '=', 'karyawans.fid')
                    ->where('users.id', $ua->user_id)
                    ->value('karyawans.divisi');
            }

            $newName = $this->mapOldRole($oldName, $divisi);
            if (isset($newRoles[$newName])) {
                DB::table('user_applications')->where('id', $ua->id)->update(['role_id' => $newRoles[$newName]]);
                $remapped++;
            }
        }

        $this->line("  -> Remapped {$remapped} user_applications");
    }

    private function mapOldRole(string $oldName, ?string $divisi): string
    {
        if ($oldName === 'admin') return 'Admin';
        return $this->divisiMap[strtolower(trim((string) $divisi))] ?? 'Admin';
    }

    private function ensureRolesResequenced(): void
    {
        $roles = DB::table('roles')->orderBy('id')->get(['id', 'level']);
        $needsResequence = false;

        foreach ($roles as $r) {
            if ($r->id !== $r->level) {
                $needsResequence = true;
                break;
            }
        }

        if (!$needsResequence) {
            $this->line("[Roles] IDs already match levels — skipping resequence");
            return;
        }

        $this->line("[Roles] Resequencing IDs to match levels...");

        Schema::dropIfExists('role_id_map');
        Schema::create('role_id_map', function ($table) {
            $table->unsignedBigInteger('old_id')->primary();
            $table->unsignedBigInteger('new_id');
        });

        DB::table('role_id_map')->insert(
            DB::table('roles')->whereNotNull('level')
                ->get(['id', 'level'])
                ->map(fn($r) => ['old_id' => $r->id, 'new_id' => $r->level])
                ->all()
        );

        $fkExists = DB::selectOne(
            "SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE "
            . "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_applications' "
            . "AND CONSTRAINT_NAME = 'user_applications_role_id_foreign'"
        );
        if ($fkExists) {
            Schema::table('user_applications', fn($t) => $t->dropForeign(['role_id']));
        }

        DB::statement('UPDATE roles SET id = id + 100000');

        foreach (DB::table('role_id_map')->get() as $row) {
            DB::table('roles')->where('id', $row->old_id + 100000)->update(['id' => $row->new_id]);
            DB::table('users')->where('role_id', $row->old_id)->update(['role_id' => $row->new_id]);
            DB::table('user_applications')->where('role_id', $row->old_id)->update(['role_id' => $row->new_id]);
        }

        Schema::table('user_applications', fn($t) => $t->foreign('role_id')->references('id')->on('roles')->nullOnDelete());
        Schema::dropIfExists('role_id_map');

        $maxId = (int) DB::table('roles')->max('id');
        DB::statement('ALTER TABLE roles AUTO_INCREMENT = ' . ($maxId + 1));

        $this->line("[Roles] IDs resequenced");
    }

    private function ensurePerAppRoles(): void
    {
        $usersWithRole = DB::table('users')->whereNotNull('role_id')->count();
        if ($usersWithRole === 0) {
            $this->line("[Per-App] users.role_id already null — skipping");
            return;
        }

        $apps = DB::table('applications')->pluck('id', 'slug');
        $users = DB::table('users')->whereNotNull('role_id')->get();
        $synced = 0;

        foreach ($users as $user) {
            foreach ($apps as $appId) {
                $existing = DB::table('user_applications')
                    ->where('user_id', $user->id)
                    ->where('application_id', $appId)
                    ->first();

                if ($existing) {
                    DB::table('user_applications')->where('id', $existing->id)->update([
                        'role_id' => $user->role_id, 'is_active' => true,
                    ]);
                } else {
                    DB::table('user_applications')->insert([
                        'user_id' => $user->id, 'application_id' => $appId,
                        'role_id' => $user->role_id, 'is_active' => true,
                        'created_at' => now(), 'updated_at' => now(),
                    ]);
                }
                $synced++;
            }
        }

        DB::table('users')->whereNotNull('role_id')->update(['role_id' => null]);
        $this->line("[Per-App] Synced {$synced} records, nullified users.role_id");
    }

    private function ensureHeadAdminRole(): void
    {
        $hasHeadAdmin = DB::table('roles')->where('name', 'Head Admin')->exists();
        if ($hasHeadAdmin) {
            $this->line("[Head Admin] Already exists — skipping");
            return;
        }

        $this->line("[Head Admin] Inserting Head Admin role...");

        Schema::table('user_applications', fn($t) => $t->dropForeign(['role_id']));

        DB::table('user_applications')->whereBetween('role_id', [3, 8])
            ->update(['role_id' => DB::raw('role_id + 1')]);

        DB::table('roles')->whereIn('id', [3, 4, 5, 6, 7, 8])->delete();

        DB::table('roles')->insert([
            ['id' => 3, 'name' => 'Head Admin', 'level' => 3, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 4, 'name' => 'HRD',        'level' => 4, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 5, 'name' => 'Admin',      'level' => 5, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 6, 'name' => 'Teknisi',    'level' => 6, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 7, 'name' => 'QA',          'level' => 7, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 8, 'name' => 'QC',          'level' => 8, 'created_at' => now(), 'updated_at' => now()],
            ['id' => 9, 'name' => 'Ekspedisi',   'level' => 9, 'created_at' => now(), 'updated_at' => now()],
        ]);

        Schema::table('user_applications', fn($t) => $t->foreign('role_id')->references('id')->on('roles')->nullOnDelete());

        $maxId = (int) DB::table('roles')->max('id');
        DB::statement('ALTER TABLE roles AUTO_INCREMENT = ' . ($maxId + 1));

        $this->line("[Head Admin] Inserted, all 9 roles complete (1-9)");
    }

    private function ensureDdlColumns(): void
    {
        $fkExists = DB::selectOne(
            "SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE "
            . "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' "
            . "AND CONSTRAINT_NAME = 'users_role_id_foreign'"
        );

        if (!$fkExists && Schema::hasColumn('users', 'role_id')) {
            Schema::table('users', fn($t) => $t->foreign('role_id')->references('id')->on('roles')->nullOnDelete());
            $this->line("[DDL] FK users_role_id_foreign added");
        } else {
            $this->line("[DDL] FK users_role_id_foreign already exists");
        }

        if (!Schema::hasColumn('user_applications', 'permissions')) {
            Schema::table('user_applications', function ($t) {
                $t->json('permissions')->nullable()->after('role_id');
            });
            $this->line("[DDL] Column permissions added to user_applications");
        } else {
            $this->line("[DDL] Column permissions already exists");
        }
    }

    private function ensureBackfill(): void
    {
        $missing = DB::table('users')
            ->whereNotIn('id', fn($q) => $q->select('user_id')->from('user_applications'))
            ->count();

        if ($missing === 0) {
            $this->line("[Backfill] All users have UserApplications — skipping");
            return;
        }

        $users = DB::table('users')
            ->whereNotIn('id', fn($q) => $q->select('user_id')->from('user_applications'))
            ->get();

        $apps = DB::table('applications')->get();
        $created = 0;

        foreach ($users as $user) {
            foreach ($apps as $app) {
                DB::table('user_applications')->insert([
                    'user_id' => $user->id, 'application_id' => $app->id,
                    'role_id' => $user->role_id, 'is_active' => false,
                    'created_at' => now(), 'updated_at' => now(),
                ]);
                $created++;
            }
        }

        $this->line("[Backfill] Created {$created} records for {$users->count()} users");
    }

    private function ensureAllMigrationsMarked(): void
    {
        $this->ensureMigrationsMarked();
    }

    private function showStatus(): void
    {
        $this->info('Roles:');
        $roles = DB::table('roles')->orderBy('level')->get(['id', 'name', 'level']);
        $this->table(['ID', 'Name', 'Level'], $roles->map(fn($r) => [$r->id, $r->name, $r->level])->toArray());

        $totalUsers = DB::table('users')->count();
        $uaCount = DB::table('user_applications')->count();
        $pendingCount = DB::table('migrations')->count();

        $this->line("Users: {$totalUsers}");
        $this->line("UserApplications: {$uaCount}");
        $this->line("Migrations tracked: {$pendingCount}");
    }
}
