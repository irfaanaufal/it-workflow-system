<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('log_notifikasi', function (Blueprint $table) {
            $table->string('action', 40)->nullable()->after('recipient_type');
            $table->foreignId('actor_user_id')->nullable()->after('ticket_id')->constrained('users')->nullOnDelete();
            $table->string('actor_name')->nullable()->after('actor_user_id');
        });
    }

    public function down(): void
    {
        Schema::table('log_notifikasi', function (Blueprint $table) {
            $table->dropConstrainedForeignId('actor_user_id');
            $table->dropColumn(['action', 'actor_name']);
        });
    }
};