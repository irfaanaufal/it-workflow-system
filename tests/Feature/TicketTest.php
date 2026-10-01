<?php

namespace Tests\Feature;

use App\Models\Karyawan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TicketTest extends TestCase
{
    use RefreshDatabase;

    private function makeKaryawanUser(string $role = 'Admin', int $fid = 1001): User
    {
        Karyawan::create([
            'fid' => $fid,
            'nama_karyawan' => 'User ' . $fid,
            'divisi' => $role,
            'status' => 'Active',
        ]);

        return User::factory()->role($role)->create(['fid' => $fid]);
    }

    public function test_unauthenticated_user_redirected_to_login(): void
    {
        $this->get('/my-requests')->assertRedirect(route('login'));
        $this->get('/history')->assertRedirect(route('login'));
        $this->getJson('/api/tickets')->assertStatus(401);
    }

    public function test_authenticated_user_can_list_tickets(): void
    {
        $user = $this->makeKaryawanUser('Admin', 2001);

        $response = $this->actingAs($user)->getJson('/api/tickets');

        $response->assertStatus(200);
        $response->assertJsonStructure([]);
    }

    public function test_it_can_view_inbox(): void
    {
        $user = $this->makeKaryawanUser('IT', 3001);

        $this->actingAs($user)->get('/admin/inbox')->assertStatus(200);
        $this->actingAs($user)->getJson('/api/tickets/inbox')->assertStatus(200);
    }

    public function test_non_it_cannot_view_inbox(): void
    {
        $user = $this->makeKaryawanUser('Admin', 4001);

        $this->actingAs($user)->get('/admin/inbox')->assertStatus(403);
        $this->actingAs($user)->getJson('/api/tickets/inbox')->assertStatus(403);
    }

    public function test_non_it_cannot_change_ticket_status(): void
    {
        $user = $this->makeKaryawanUser('Admin', 5001);
        $karyawan = Karyawan::where('fid', 5001)->first();

        $ticket = \App\Models\Ticket::create([
            'karyawan_id' => $karyawan->id,
            'judul_laporan' => 'Test Ticket',
            'kategori_laporan' => 'new system',
            'urgensi_laporan' => 'low',
            'kondisi_lapangan' => 'Kondisi',
            'keinginan_sistem' => 'Keinginan',
            'dampak_positif' => 'Dampak',
            'status' => 'review',
        ]);

        $this->actingAs($user)->patchJson("/api/tickets/{$ticket->id}/status", [
            'status' => 'to_do',
        ])->assertStatus(403);
    }
}
