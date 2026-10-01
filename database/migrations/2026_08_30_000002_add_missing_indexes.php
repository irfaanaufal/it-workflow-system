<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_applications', function (Blueprint $table) {
            if (!Schema::hasIndex('user_applications', ['user_id', 'application_id'])) {
                $table->index(['user_id', 'application_id']);
            }
        });

        Schema::table('log_notifikasi', function (Blueprint $table) {
            if (!Schema::hasIndex('log_notifikasi', ['user_id', 'visible_in_bell'])) {
                $table->index(['user_id', 'visible_in_bell']);
            }
        });
    }

    public function down(): void
    {
        Schema::table('user_applications', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'application_id']);
        });

        Schema::table('log_notifikasi', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'visible_in_bell']);
        });
    }
};
