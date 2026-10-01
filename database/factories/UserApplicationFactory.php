<?php

namespace Database\Factories;

use App\Models\UserApplication;
use App\Models\User;
use App\Models\Application;
use App\Models\Role;
use Illuminate\Database\Eloquent\Factories\Factory;

class UserApplicationFactory extends Factory
{
    protected $model = UserApplication::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'application_id' => Application::factory(),
            'role_id' => Role::factory(),
            'is_active' => true,
        ];
    }
}
