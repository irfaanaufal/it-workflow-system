<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('role_id_map');

        Schema::create('role_id_map', function (Blueprint $table) {
            $table->unsignedBigInteger('old_id')->primary();
            $table->unsignedBigInteger('new_id');
        });

        DB::table('role_id_map')->insert(
            DB::table('roles')
                ->whereNotNull('level')
                ->get(['id', 'level'])
                ->map(fn ($row) => ['old_id' => $row->id, 'new_id' => $row->level])
                ->all()
        );

        if (DB::getDriverName() === 'mysql') {
            $fkExists = DB::selectOne(
                "SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE "
                . "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_applications' "
                . "AND CONSTRAINT_NAME = 'user_applications_role_id_foreign'"
            );

            if ($fkExists) {
                Schema::table('user_applications', function (Blueprint $table) {
                    $table->dropForeign(['role_id']);
                });
            }
        } else {
            Schema::table('user_applications', function (Blueprint $table) {
                $table->dropForeign(['role_id']);
            });
        }

        DB::statement('UPDATE roles SET id = id + 100000');

        $map = DB::table('role_id_map')->get();
        foreach ($map as $row) {
            DB::table('roles')->where('id', $row->old_id + 100000)->update(['id' => $row->new_id]);
            DB::table('users')->where('role_id', $row->old_id)->update(['role_id' => $row->new_id]);
            DB::table('user_applications')->where('role_id', $row->old_id)->update(['role_id' => $row->new_id]);
        }

        Schema::table('user_applications', function (Blueprint $table) {
            $table->foreign('role_id')->references('id')->on('roles')->nullOnDelete();
        });

        if (DB::getDriverName() === 'mysql') {
            $maxId = (int) DB::table('roles')->max('id');
            DB::statement('ALTER TABLE roles AUTO_INCREMENT = ' . ($maxId + 1));
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            $fkExists = DB::selectOne(
                "SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE "
                . "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user_applications' "
                . "AND CONSTRAINT_NAME = 'user_applications_role_id_foreign'"
            );

            if ($fkExists) {
                Schema::table('user_applications', function (Blueprint $table) {
                    $table->dropForeign(['role_id']);
                });
            }
        } else {
            Schema::table('user_applications', function (Blueprint $table) {
                $table->dropForeign(['role_id']);
            });
        }

        DB::statement('UPDATE roles SET id = id + 100000');

        $map = DB::table('role_id_map')->get();
        foreach ($map as $row) {
            DB::table('roles')->where('id', $row->new_id + 100000)->update(['id' => $row->old_id]);
            DB::table('users')->where('role_id', $row->new_id)->update(['role_id' => $row->old_id]);
            DB::table('user_applications')->where('role_id', $row->new_id)->update(['role_id' => $row->old_id]);
        }

        Schema::table('user_applications', function (Blueprint $table) {
            $table->foreign('role_id')->references('id')->on('roles')->nullOnDelete();
        });

        Schema::dropIfExists('role_id_map');
    }
};