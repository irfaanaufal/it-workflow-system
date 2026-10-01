<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Role "Menunggu Persetujuan" (level 10) untuk hasil registrasi /
     * link-FID yang belum disetujui di Kelola Permintaan.
     */
    public function up(): void
    {
        $exists = DB::table('roles')->where('name', 'Menunggu Persetujuan')->exists();

        if (!$exists) {
            DB::table('roles')->insert([
                'name' => 'Menunggu Persetujuan',
                'level' => 10,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        DB::table('roles')->where('name', 'Menunggu Persetujuan')->delete();
    }
};
