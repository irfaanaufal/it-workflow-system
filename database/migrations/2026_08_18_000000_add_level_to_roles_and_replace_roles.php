<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private array $newRoles = [
        'IT' => 1,
        'Direktur Utama' => 2,
        'HRD' => 3,
        'Admin' => 4,
        'Teknisi' => 5,
        'QA' => 6,
        'QC' => 7,
        'Ekspedisi' => 8,
    ];

    public function up(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            $table->integer('level')->nullable()->unique()->after('name');
        });

        $oldRoleIds = DB::table('roles')
            ->whereIn('name', ['superadmin', 'admin', 'user'])
            ->pluck('id', 'name')
            ->toArray();

        $newRoleIds = [];
        foreach ($this->newRoles as $name => $level) {
            $existing = DB::table('roles')
                ->whereRaw('LOWER(name) = ?', [strtolower($name)])
                ->whereNotIn('id', array_values($oldRoleIds))
                ->first();

            if ($existing) {
                DB::table('roles')->where('id', $existing->id)->update([
                    'name' => $name,
                    'level' => $level,
                    'updated_at' => now(),
                ]);
                $newRoleIds[$name] = $existing->id;
            } else {
                $newRoleIds[$name] = DB::table('roles')->insertGetId([
                    'name' => $name,
                    'level' => $level,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        $this->remapUsers($oldRoleIds, $newRoleIds);
        $this->remapUserApplications($oldRoleIds, $newRoleIds);

        DB::table('roles')->whereIn('id', array_values($oldRoleIds))->delete();
    }

    public function down(): void
    {
        $oldRoles = [
            'superadmin' => 1,
            'admin' => 2,
            'user' => 3,
        ];

        $newRoleIds = DB::table('roles')
            ->whereIn('name', array_keys($this->newRoles))
            ->pluck('id', 'name')
            ->toArray();

        $oldRoleIds = [];
        foreach ($oldRoles as $name => $level) {
            $oldRoleIds[$name] = DB::table('roles')->insertGetId([
                'name' => $name,
                'level' => $level,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        $reverseMap = [
            'IT' => 'superadmin',
            'Direktur Utama' => 'user',
            'HRD' => 'user',
            'Admin' => 'admin',
            'Teknisi' => 'user',
            'QA' => 'user',
            'QC' => 'user',
            'Ekspedisi' => 'user',
        ];

        $users = DB::table('users')->whereNotNull('role_id')->get();
        foreach ($users as $user) {
            $newName = array_search($user->role_id, $newRoleIds) ?: null;
            if ($newName && isset($reverseMap[$newName])) {
                DB::table('users')->where('id', $user->id)->update(['role_id' => $oldRoleIds[$reverseMap[$newName]]]);
            }
        }

        $userApps = DB::table('user_applications')->whereNotNull('role_id')->get();
        foreach ($userApps as $ua) {
            $newName = array_search($ua->role_id, $newRoleIds) ?: null;
            if ($newName && isset($reverseMap[$newName])) {
                DB::table('user_applications')->where('id', $ua->id)->update(['role_id' => $oldRoleIds[$reverseMap[$newName]]]);
            }
        }

        DB::table('roles')->whereIn('name', array_keys($this->newRoles))->delete();

        Schema::table('roles', function (Blueprint $table) {
            $table->dropUnique(['level']);
            $table->dropColumn('level');
        });
    }

    private function remapUsers(array $oldRoleIds, array $newRoleIds): void
    {
        $hasKaryawans = Schema::hasTable('karyawans');

        $query = DB::table('users')->whereNotNull('users.role_id');
        if ($hasKaryawans) {
            $query = $query->leftJoin('karyawans', 'users.fid', '=', 'karyawans.fid')
                ->select('users.id', 'users.role_id', 'karyawans.divisi');
        } else {
            $query = $query->select('users.id', 'users.role_id');
        }

        $users = $query->get();

        foreach ($users as $user) {
            $oldName = array_search($user->role_id, $oldRoleIds);
            if ($oldName === false) {
                continue;
            }

            $newName = $this->mapOldRole($oldName, $hasKaryawans ? $user->divisi : null);
            DB::table('users')->where('id', $user->id)->update(['role_id' => $newRoleIds[$newName]]);
        }
    }

    private function remapUserApplications(array $oldRoleIds, array $newRoleIds): void
    {
        $hasKaryawans = Schema::hasTable('karyawans');
        $userApps = DB::table('user_applications')->whereNotNull('role_id')->get();

        foreach ($userApps as $ua) {
            $oldName = array_search($ua->role_id, $oldRoleIds);
            if ($oldName === false) {
                continue;
            }

            $divisi = null;
            if ($hasKaryawans) {
                $divisi = DB::table('users')
                    ->leftJoin('karyawans', 'users.fid', '=', 'karyawans.fid')
                    ->where('users.id', $ua->user_id)
                    ->value('karyawans.divisi');
            }

            $newName = $this->mapOldRole($oldName, $divisi);
            DB::table('user_applications')->where('id', $ua->id)->update(['role_id' => $newRoleIds[$newName]]);
        }
    }

    private function mapOldRole(string $oldName, ?string $divisi): string
    {
        if ($oldName === 'admin') {
            return 'Admin';
        }

        $divisiMap = [
            'it' => 'IT',
            'direktur' => 'Direktur Utama',
            'direktur utama' => 'Direktur Utama',
            'hrd' => 'HRD',
            'qa' => 'QA',
            'qc' => 'QC',
            'teknisi' => 'Teknisi',
            'ekspedisi' => 'Ekspedisi',
        ];

        // superadmin & user both map by karyawan divisi; fallback to Admin
        return $divisiMap[strtolower(trim((string) $divisi))] ?? 'Admin';
    }
};