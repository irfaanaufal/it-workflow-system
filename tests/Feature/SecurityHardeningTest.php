<?php

namespace Tests\Feature;

use App\Models\Application;
use App\Models\Karyawan;
use App\Models\Role;
use App\Models\Ticket;
use App\Models\User;
use App\Models\UserApplication;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SecurityHardeningTest extends TestCase
{
    use RefreshDatabase;

    private Application $workflowApp;

    protected function setUp(): void
    {
        parent::setUp();

        $this->workflowApp = Application::create([
            'name' => 'IT Workflow',
            'slug' => 'it-workflow',
            'description' => 'Sistem manajemen workflow teknologi informasi.',
        ]);
    }

    public function test_register_assigns_pending_role_and_creates_access_request(): void
    {
        // Nama cocok dengan karyawan ber-divisi IT — perilaku lama akan
        // langsung memberi role IT. Perilaku baru: role "Menunggu Persetujuan"
        // + tepat 1 baris permintaan akses (inactive) + notifikasi admin.
        Karyawan::create([
            'fid' => 'F1001',
            'nama_karyawan' => 'Budi Santoso',
            'divisi' => 'IT',
            'status' => 'Active',
        ]);

        $it = User::factory()->role('IT')->create();

        $this->post('/register', [
            'name' => 'Budi Santoso',
            'username' => 'budi.santoso',
            'email' => 'budi@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertRedirect('/login');

        $user = User::where('email', 'budi@example.com')->firstOrFail();
        $pendingId = Role::where('name', 'Menunggu Persetujuan')->value('id');

        $this->assertSame($pendingId, $user->role_id);

        // Aturan seragam: registrasi membuat tepat 1 baris it-workflow
        // (inactive) + notifikasi "Permintaan akses baru" ke level 1,2,3,4,7.
        $this->assertSame(1, $user->userApplications()->count());
        $userApp = $user->userApplications()->first();
        $this->assertSame('it-workflow', $userApp->application->slug);
        $this->assertFalse((bool) $userApp->is_active);

        $this->assertDatabaseHas('log_notifikasi', [
            'actor_user_id' => $user->id,
            'user_id' => $it->id,
            'action' => 'new_access_request',
            'title' => 'Permintaan akses baru',
        ]);
    }

    public function test_login_is_blocked_until_activation_without_bypass(): void
    {
        Karyawan::create([
            'fid' => 'F1010',
            'nama_karyawan' => 'Sari Pending',
            'divisi' => 'HRD',
            'status' => 'Active',
        ]);

        $it = User::factory()->role('IT')->create();

        $this->post('/register', [
            'name' => 'Sari Pending',
            'username' => 'sari.pending',
            'email' => 'sari@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertRedirect('/login');

        // Baris sudah dibuat saat registrasi → login pertama langsung
        // DIBLOKIR dengan pesan seragam (tanpa bypass admin).
        $response = $this->post('/login', [
            'username' => 'sari.pending',
            'password' => 'password',
        ]);

        $response->assertSessionHasErrors('activation_needed');
        $response->assertSessionHas('errors');
        $this->assertSame(
            'Akun belum diaktifkan. Hubungi tim IT',
            session('errors')->first('activation_needed')
        );
        $this->assertGuest();

        $user = User::where('email', 'sari@example.com')->firstOrFail();

        // Tetap tepat 1 baris, tidak ada duplikasi saat login berulang.
        $this->assertSame(1, $user->userApplications()->count());
        $userApp = $user->userApplications()->first();
        $this->assertFalse((bool) $userApp->is_active);
        $this->assertSame($user->role_id, $userApp->role_id);

        // Tidak ada notifikasi ganda (baris sudah ada → gate tidak create).
        $this->assertSame(1, $user->accessRequestNotificationCount());
        $this->assertDatabaseHas('log_notifikasi', [
            'actor_user_id' => $user->id,
            'action' => 'new_access_request',
            'user_id' => $it->id,
        ]);

        // Login kedua → tetap diblokir, tetap 1 row, tetap 1 notifikasi.
        $this->post('/login', [
            'username' => 'sari.pending',
            'password' => 'password',
        ])->assertSessionHasErrors('activation_needed');

        $this->assertSame(1, $user->userApplications()->count());
        $this->assertSame(1, $user->accessRequestNotificationCount());
    }

    public function test_admin_without_active_row_cannot_login(): void
    {
        // Aturan seragam: SEMUA akun diblokir, termasuk admin (level 1).
        $admin = User::factory()->role('IT')->create();
        // Factory role() memberi baris aktif semua app — hapus dulu untuk
        // mensimulasikan admin yang barisnya belum/bisa dinonaktifkan.
        $admin->userApplications()->delete();

        $this->post('/login', [
            'username' => $admin->username,
            'password' => 'password',
        ])->assertSessionHasErrors('activation_needed');
        $this->assertGuest();
        $this->assertSame(1, $admin->userApplications()->count());
        $this->assertFalse((bool) $admin->userApplications()->first()->is_active);

        // Setelah baris diaktifkan via Kelola Permintaan → baru bisa masuk.
        $admin->userApplications()->update(['is_active' => true]);

        $this->post('/login', [
            'username' => $admin->username,
            'password' => 'password',
        ])->assertRedirect();
        $this->assertAuthenticatedAs($admin);
    }

    public function test_approval_assigns_role_from_karyawan_divisi(): void
    {
        Karyawan::create([
            'fid' => 'F1002',
            'nama_karyawan' => 'Qori Kualitas',
            'divisi' => 'QC',
            'status' => 'Active',
        ]);

        $pendingId = Role::where('name', 'Menunggu Persetujuan')->value('id');
        $user = User::factory()->create([
            'fid' => 'F1002',
            'role_id' => $pendingId,
        ]);
        $userApp = UserApplication::create([
            'user_id' => $user->id,
            'application_id' => $this->workflowApp->id,
            'is_active' => false,
            'role_id' => $pendingId,
        ]);

        $it = User::factory()->role('IT')->create();

        $this->actingAs($it)->patch('/applications/toggle', [
            'user_application_id' => $userApp->id,
            'is_active' => true,
        ])->assertSessionHas('success');

        $userApp->refresh();
        $user->refresh();

        $this->assertTrue($userApp->is_active);
        $this->assertSame(Role::where('name', 'QC')->value('id'), $user->role_id);
        $this->assertSame('QC', $user->role->name);

        // Approve tidak membuat baris hantu untuk sistem lain —
        // jumlah baris tetap 1 (hanya it-workflow).
        $this->assertSame(1, $user->userApplications()->count());
    }

    public function test_ticket_detail_and_timeline_forbidden_for_unrelated_user(): void
    {
        $ownerKaryawan = Karyawan::create([
            'fid' => 'F1003',
            'nama_karyawan' => 'Pemilik Tiket',
            'divisi' => 'Admin',
            'status' => 'Active',
        ]);
        $owner = User::factory()->role('Admin')->create(['fid' => 'F1003']);

        $ticket = Ticket::create([
            'karyawan_id' => $ownerKaryawan->id,
            'judul_laporan' => 'Laporan rahasia',
            'kategori_laporan' => 'new system',
            'urgensi_laporan' => 'low',
            'kondisi_lapangan' => 'Kondisi di lapangan',
            'keinginan_sistem' => 'Keinginan sistem',
            'dampak_positif' => 'Dampak positif',
            'status' => 'inbox',
        ]);

        // User lain yang punya akses aplikasi tapi bukan pemilik → 403
        $stranger = User::factory()->role('Admin')->create();
        $this->actingAs($stranger)->get('/api/tickets/' . $ticket->id)->assertStatus(403);
        $this->actingAs($stranger)->get('/api/tickets/' . $ticket->id . '/timeline')->assertStatus(403);

        // Pemilik → 200
        $this->actingAs($owner)->get('/api/tickets/' . $ticket->id)->assertStatus(200);
        $this->actingAs($owner)->get('/api/tickets/' . $ticket->id . '/timeline')->assertStatus(200);

        // Tim IT → 200
        $it = User::factory()->role('IT')->create();
        $this->actingAs($it)->get('/api/tickets/' . $ticket->id)->assertStatus(200);
        $this->actingAs($it)->get('/api/tickets/' . $ticket->id . '/timeline')->assertStatus(200);
    }

    public function test_avatar_url_includes_storage_prefix(): void
    {
        $user = User::factory()->create([
            'avatar_path' => 'profile-photos/avatar_99_x.png',
        ]);

        $this->assertSame(
            asset('storage/profile-photos/avatar_99_x.png'),
            $user->avatar_url
        );
    }

    public function test_forgot_password_returns_same_message_for_unknown_email(): void
    {
        User::factory()->create(['email' => 'ada@example.com']);

        // Email tidak dikenal dan email valid harus memberi pesan yang sama
        // (anti-enumeration) — bukan error validasi yang membocorkan.
        $this->post('/forgot-password', ['email' => 'tidak-ada@example.com'])
            ->assertStatus(302)
            ->assertSessionHas('status', __('passwords.sent'));

        $this->post('/forgot-password', ['email' => 'ada@example.com'])
            ->assertStatus(302)
            ->assertSessionHas('status', __('passwords.sent'));
    }
}
