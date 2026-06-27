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
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('karyawan_id');
            $table->string('judul_laporan');
            $table->string('kategori_laporan');
            $table->string('urgensi_laporan');
            $table->text('kondisi_lapangan');
            $table->text('keinginan_sistem');
            $table->text('dampak_positif');
            $table->string('attachment_path')->nullable();
            $table->string('status')->default('inbox');
            $table->unsignedBigInteger('admin_it_id')->nullable();
            $table->timestamps();

            $table->foreign('karyawan_id')->references('id')->on('karyawans')->onDelete('cascade');
            $table->foreign('admin_it_id')->references('id')->on('karyawans')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tickets');
    }
};
