<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->index('karyawan_id');
            $table->index('admin_it_id');
            $table->index('system_ptsam_id');
            $table->index('status');
        });

        Schema::table('log_notifikasi', function (Blueprint $table) {
            $table->index('ticket_id');
            $table->index('actor_user_id');
        });
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropIndex(['karyawan_id']);
            $table->dropIndex(['admin_it_id']);
            $table->dropIndex(['system_ptsam_id']);
            $table->dropIndex(['status']);
        });

        Schema::table('log_notifikasi', function (Blueprint $table) {
            $table->dropIndex(['ticket_id']);
            $table->dropIndex(['actor_user_id']);
        });
    }
};
