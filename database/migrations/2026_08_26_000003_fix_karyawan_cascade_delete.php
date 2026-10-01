<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        // Check if FK constraint exists before dropping
        $hasFk = DB::select(
            "SELECT 1 FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'tickets' AND CONSTRAINT_NAME = 'tickets_karyawan_id_foreign' AND CONSTRAINT_TYPE = 'FOREIGN KEY'"
        );
        if (!empty($hasFk)) {
            DB::statement('ALTER TABLE `tickets` DROP FOREIGN KEY `tickets_karyawan_id_foreign`');
        }

        // Drop the index (named same as FK by Laravel convention)
        $hasIndex = DB::select("SHOW INDEX FROM `tickets` WHERE Key_name = 'tickets_karyawan_id_foreign'");
        if (!empty($hasIndex)) {
            DB::statement('ALTER TABLE `tickets` DROP INDEX `tickets_karyawan_id_foreign`');
        }

        // Make column nullable
        DB::statement('ALTER TABLE `tickets` MODIFY COLUMN `karyawan_id` BIGINT UNSIGNED NULL');

        // Add FK with SET NULL
        Schema::table('tickets', function ($table) {
            $table->foreign('karyawan_id')->references('id')->on('karyawans')->onDelete('set null');
        });
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        Schema::table('tickets', function ($table) {
            $table->dropForeign(['karyawan_id']);
        });

        DB::statement('ALTER TABLE `tickets` MODIFY COLUMN `karyawan_id` BIGINT UNSIGNED NOT NULL');

        Schema::table('tickets', function ($table) {
            $table->index('karyawan_id');
        });
    }
};
