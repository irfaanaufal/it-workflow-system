<?php

namespace Database\Seeders;

use App\Models\Application;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ApplicationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $apps = [
            [
                'name' => 'IT Workflow',
                'description' => 'Sistem manajemen workflow teknologi informasi.',
            ],
            [
                'name' => 'Meeting Attendance',
                'description' => 'Aplikasi pencatatan absensi rapat.',
            ],
            [
                'name' => 'Reminder',
                'description' => 'Sistem pengingat jadwal dan tugas.',
            ],
            [
                'name' => 'Shortly',
                'description' => 'Aplikasi pemendek kustom tautan internal.',
            ],
        ];

        foreach ($apps as $app) {
            Application::updateOrCreate(
                ['slug' => Str::slug($app['name'])],
                [
                    'name' => $app['name'],
                    'description' => $app['description'],
                ]
            );
        }
    }
}
