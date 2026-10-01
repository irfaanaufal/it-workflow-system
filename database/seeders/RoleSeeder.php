<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            'IT' => 1,
            'Direktur Utama' => 2,
            'Head Admin' => 3,
            'HRD' => 4,
            'Admin' => 5,
            'Teknisi' => 6,
            'QA' => 7,
            'QC' => 8,
            'Ekspedisi' => 9,
            'Menunggu Persetujuan' => 10,
        ];

        foreach ($roles as $name => $level) {
            Role::updateOrCreate(
                ['name' => $name],
                ['level' => $level]
            );
        }
    }
}