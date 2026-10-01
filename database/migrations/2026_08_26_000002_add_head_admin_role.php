<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::beginTransaction();

        try {
            // 1. Nullify user_applications.role_id for roles that will be resequenced (3-8)
            DB::table('user_applications')
                ->whereBetween('role_id', [3, 8])
                ->update(['role_id' => DB::raw('role_id + 1')]);

            // 2. Delete old roles 3-8 (will be reinserted with new IDs)
            DB::table('roles')->whereIn('id', [3, 4, 5, 6, 7, 8])->delete();

            // 3. Insert new roles: Head Admin (3) + resequenced old roles (4-9)
            DB::table('roles')->insert([
                ['id' => 3, 'name' => 'Head Admin', 'level' => 3, 'created_at' => now(), 'updated_at' => now()],
                ['id' => 4, 'name' => 'HRD',        'level' => 4, 'created_at' => now(), 'updated_at' => now()],
                ['id' => 5, 'name' => 'Admin',      'level' => 5, 'created_at' => now(), 'updated_at' => now()],
                ['id' => 6, 'name' => 'Teknisi',    'level' => 6, 'created_at' => now(), 'updated_at' => now()],
                ['id' => 7, 'name' => 'QA',          'level' => 7, 'created_at' => now(), 'updated_at' => now()],
                ['id' => 8, 'name' => 'QC',          'level' => 8, 'created_at' => now(), 'updated_at' => now()],
                ['id' => 9, 'name' => 'Ekspedisi',   'level' => 9, 'created_at' => now(), 'updated_at' => now()],
            ]);

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function down(): void
    {
        DB::beginTransaction();

        try {
            // Shift role_id back: 9→8, 8→7, ..., 4→3
            DB::table('user_applications')
                ->whereBetween('role_id', [4, 9])
                ->update(['role_id' => DB::raw('role_id - 1')]);

            // Delete Head Admin + new resequenced roles
            DB::table('roles')->whereIn('id', [3, 4, 5, 6, 7, 8, 9])->delete();

            // Restore original roles 3-8
            DB::table('roles')->insert([
                ['id' => 3, 'name' => 'HRD',        'level' => 3, 'created_at' => now(), 'updated_at' => now()],
                ['id' => 4, 'name' => 'Admin',      'level' => 4, 'created_at' => now(), 'updated_at' => now()],
                ['id' => 5, 'name' => 'Teknisi',    'level' => 5, 'created_at' => now(), 'updated_at' => now()],
                ['id' => 6, 'name' => 'QA',          'level' => 6, 'created_at' => now(), 'updated_at' => now()],
                ['id' => 7, 'name' => 'QC',          'level' => 7, 'created_at' => now(), 'updated_at' => now()],
                ['id' => 8, 'name' => 'Ekspedisi',   'level' => 8, 'created_at' => now(), 'updated_at' => now()],
            ]);

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }
};
