<?php

namespace Database\Factories;

use App\Models\Karyawan;
use Illuminate\Database\Eloquent\Factories\Factory;

class KaryawanFactory extends Factory
{
    protected $model = Karyawan::class;

    public function definition(): array
    {
        return [
            'fid' => fake()->unique()->numberBetween(100, 99999),
            'nama_karyawan' => fake()->name(),
            'divisi' => fake()->randomElement(['IT', 'HRD', 'Finance', 'Marketing', 'Operations']),
        ];
    }
}
