<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->unsignedBigInteger('system_ptsam_id')->nullable()->after('karyawan_id');
            $table->foreign('system_ptsam_id')->references('id')->on('system_ptsam')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropForeign(['system_ptsam_id']);
            $table->dropColumn('system_ptsam_id');
        });
    }
};
