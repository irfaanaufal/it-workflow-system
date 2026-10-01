<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('karyawans')) {
            Schema::create('karyawans', function (Blueprint $table) {
                $table->id();
                $table->string('fid')->unique();
                $table->string('nama_karyawan');
                $table->string('divisi')->nullable();
                $table->string('jabatan')->nullable();
                $table->string('status')->default('Active');
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('karyawans');
    }
};
