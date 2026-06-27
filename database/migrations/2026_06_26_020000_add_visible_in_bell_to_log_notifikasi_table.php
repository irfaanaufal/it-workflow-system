<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('log_notifikasi', function (Blueprint $table) {
            $table->boolean('visible_in_bell')->default(true)->after('status');
        });

        DB::table('log_notifikasi')
            ->where('recipient_type', 'admin')
            ->where('action', '!=', 'new_ticket')
            ->update(['visible_in_bell' => false]);

        DB::table('log_notifikasi')
            ->where('action', 'created')
            ->update(['visible_in_bell' => false]);
    }

    public function down(): void
    {
        Schema::table('log_notifikasi', function (Blueprint $table) {
            $table->dropColumn('visible_in_bell');
        });
    }
};