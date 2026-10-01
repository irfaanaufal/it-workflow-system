<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $users = DB::table('users')
            ->whereNotIn('id', fn($q) => $q->select('user_id')->from('user_applications'))
            ->get();

        $apps = DB::table('applications')->get();

        foreach ($users as $user) {
            foreach ($apps as $app) {
                DB::table('user_applications')->insert([
                    'user_id' => $user->id,
                    'application_id' => $app->id,
                    'role_id' => $user->role_id,
                    'is_active' => false,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        // Tidak perlu rollback — data ini aman
    }
};
