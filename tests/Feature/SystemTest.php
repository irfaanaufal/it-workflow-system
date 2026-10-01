<?php

namespace Tests\Feature;

use App\Models\SystemPtsam;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SystemTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_redirected_from_systems_page(): void
    {
        $this->get('/admin/systems')->assertRedirect(route('login'));
    }

    public function test_it_can_access_systems_page(): void
    {
        $user = User::factory()->role('IT')->create();

        $this->actingAs($user)->get('/admin/systems')->assertStatus(200);
    }

    public function test_non_it_user_denied_systems_page(): void
    {
        $user = User::factory()->role('Admin')->create();

        $this->actingAs($user)->get('/admin/systems')->assertStatus(403);
    }

    public function test_it_can_create_system(): void
    {
        $user = User::factory()->role('IT')->create();

        $this->actingAs($user)->post('/admin/systems', [
            'nama_sistem' => 'Sistem Akunting',
            'link_sistem' => 'https://akunting.example.com',
        ])->assertRedirect();

        $this->assertDatabaseHas('system_ptsam', [
            'nama_sistem' => 'Sistem Akunting',
            'link_sistem' => 'https://akunting.example.com',
        ]);
    }

    public function test_it_can_update_system(): void
    {
        $user = User::factory()->role('IT')->create();
        $system = SystemPtsam::create(['nama_sistem' => 'Sistem Lama']);

        $this->actingAs($user)->patch("/admin/systems/{$system->id}", [
            'nama_sistem' => 'Sistem Baru',
            'link_sistem' => 'https://baru.example.com',
        ])->assertRedirect();

        $this->assertDatabaseHas('system_ptsam', [
            'id' => $system->id,
            'nama_sistem' => 'Sistem Baru',
        ]);
    }

    public function test_it_can_delete_system_without_tickets(): void
    {
        $user = User::factory()->role('IT')->create();
        $system = SystemPtsam::create(['nama_sistem' => 'Sistem Test']);

        $this->actingAs($user)->delete("/admin/systems/{$system->id}")->assertRedirect();

        $this->assertDatabaseMissing('system_ptsam', ['id' => $system->id]);
    }
}
