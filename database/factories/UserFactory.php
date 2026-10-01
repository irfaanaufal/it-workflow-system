<?php

namespace Database\Factories;

use App\Models\Application;
use App\Models\User;
use App\Models\UserApplication;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'username' => fake()->unique()->userName(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            'role_id' => null,
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    public function role(string $name): static
    {
        return $this->afterCreating(function (User $user) use ($name) {
            $role = \App\Models\Role::where('name', $name)->first();
            if (!$role) {
                return;
            }

            // Source of truth: users.role_id
            $user->role_id = $role->id;
            $user->save();

            // Ensure standard applications exist
            $apps = Application::all();
            if ($apps->isEmpty()) {
                $apps = collect([
                    Application::create(['name' => 'IT Workflow', 'slug' => 'it-workflow', 'description' => 'Sistem manajemen workflow teknologi informasi.']),
                    Application::create(['name' => 'Meeting Attendance', 'slug' => 'absensi-meeting', 'description' => 'Aplikasi pencatatan absensi rapat.']),
                    Application::create(['name' => 'Reminder', 'slug' => 'reminder', 'description' => 'Sistem pengingat jadwal dan tugas.']),
                    Application::create(['name' => 'Shortly', 'slug' => 'shortly', 'description' => 'Aplikasi pemendek kustom tautan internal.']),
                ]);
            }

            foreach ($apps as $app) {
                UserApplication::create([
                    'user_id' => $user->id,
                    'application_id' => $app->id,
                    'role_id' => $role->id,
                    'is_active' => true,
                ]);
            }
        });
    }
}
