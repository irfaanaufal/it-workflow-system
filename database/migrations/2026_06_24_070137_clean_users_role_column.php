<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasColumn('users', 'role')) {
            return; // Column already removed/restructured, skip.
        }

        // 1. Clean up the data: convert 'host' to 'user'
        DB::table('users')
            ->where('role', 'host')
            ->update(['role' => 'user']);

        // 2. Change the role column type to string with default 'user'
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default('user')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert default value of role column to null and make it nullable
        Schema::table('users', function (Blueprint $table) {
            $table->string('role')->default(null)->nullable()->change();
        });
    }
};
