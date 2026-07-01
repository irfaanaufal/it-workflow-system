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
                ['name' => 'user'],
                ['name' => 'admin'],
                ['name' => 'superadmin'],
            ]);
        }
    }
}
