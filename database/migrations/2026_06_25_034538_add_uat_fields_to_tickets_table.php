<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            // Feedback dari user saat Approve UAT
            $table->text('uat_feedback')->nullable()->after('admin_it_id');
            // Alasan revisi saat user minta Revisi
            $table->text('revision_reason')->nullable()->after('uat_feedback');
        });
    }

    public function down(): void
    {
        Schema::table('tickets', function (Blueprint $table) {
            $table->dropColumn(['uat_feedback', 'revision_reason']);
        });
    }
};
