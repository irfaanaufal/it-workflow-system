<?php

namespace Tests;

use Illuminate\Support\Facades\Schema;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        if (Schema::hasTable('roles') && \App\Models\Role::count() === 0) {
            \App\Models\Role::insert([
                ['name' => 'IT', 'level' => 1],
                ['name' => 'Direktur Utama', 'level' => 2],
                ['name' => 'Head Admin', 'level' => 3],
                ['name' => 'HRD', 'level' => 4],
                ['name' => 'Admin', 'level' => 5],
                ['name' => 'Teknisi', 'level' => 6],
                ['name' => 'QA', 'level' => 7],
                ['name' => 'QC', 'level' => 8],
                ['name' => 'Ekspedisi', 'level' => 9],
            ]);
        }
    }
}
