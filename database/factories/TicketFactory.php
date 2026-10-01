<?php

namespace Database\Factories;

use App\Models\Ticket;
use App\Models\Karyawan;
use App\Models\SystemPtsam;
use Illuminate\Database\Eloquent\Factories\Factory;

class TicketFactory extends Factory
{
    protected $model = Ticket::class;

    public function definition(): array
    {
        return [
            'judul_laporan' => fake()->sentence(),
            'kategori_laporan' => fake()->randomElement(['new system', 'add feature', 'maintenance', 'fix bug']),
            'urgensi_laporan' => fake()->randomElement(['low', 'medium', 'high', 'blocker']),
            'kondisi_lapangan' => fake()->paragraph(),
            'keinginan_sistem' => fake()->paragraph(),
            'dampak_positif' => fake()->paragraph(),
            'status' => 'inbox',
            'karyawan_id' => Karyawan::factory(),
        ];
    }

    public function inbox(): static
    {
        return $this->state(fn (array $attributes) => ['status' => 'inbox']);
    }

    public function review(): static
    {
        return $this->state(fn (array $attributes) => ['status' => 'review']);
    }

    public function toDo(): static
    {
        return $this->state(fn (array $attributes) => ['status' => 'to_do']);
    }

    public function inProgress(): static
    {
        return $this->state(fn (array $attributes) => ['status' => 'in_progress']);
    }

    public function testing(): static
    {
        return $this->state(fn (array $attributes) => ['status' => 'testing']);
    }

    public function approved(): static
    {
        return $this->state(fn (array $attributes) => ['status' => 'approved']);
    }
}
