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

    public function test_register_assigns_role_from_divisi_and_creates_active_row(): void
    {
        // Nama cocok dengan karyawan ber-divisi IT → registrasi langsung
        // memberi role IT + tepat 1 baris it-workflow AKTIF, tanpa
        // permintaan akses dan tanpa notifikasi admin.
        Karyawan::create([
            'fid' => 'F1001',
            'nama_karyawan' => 'Budi Santoso',
            'divisi' => 'IT',
            'status' => 'Active',
        ]);

        $this->post('/register', [
            'name' => 'Budi Santoso',
            'username' => 'budi.santoso',
            'email' => 'budi@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertRedirect('/login');

        $user = User::where('email', 'budi@example.com')->firstOrFail();

        $this->assertSame(Role::where('name', 'IT')->value('id'), $user->role_id);

        $this->assertSame(1, $user->userApplications()->count());
        $userApp = $user->userApplications()->first();
        $this->assertSame('it-workflow', $userApp->application->slug);
        $this->assertTrue((bool) $userApp->is_active);

        $this->assertSame(0, $user->accessRequestNotificationCount());
        $this->assertDatabaseMissing('log_notifikasi', [
            'actor_user_id' => $user->id,
            'action' => 'new_access_request',
        ]);
    }

    public function test_register_without_karyawan_falls_back_to_pending_role(): void
    {
        // Bukan karyawan / divisi tak dikenal → fallback role
        // "Menunggu Persetujuan" (role terbatas, BUKAN gerbang —
        // tetap bisa login) + baris tetap aktif.
        $this->post('/register', [
            'name' => 'Tamu Asing',
            'username' => 'tamu.asing',
            'email' => 'tamu@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ])->assertRedirect('/login');

        $user = User::where('email', 'tamu@example.com')->firstOrFail();

        $this->assertSame(
            Role::where('name', 'Menunggu Persetujuan')->value('id'),
            $user->role_id
        );

        $this->assertSame(1, $user->userApplications()->count());
        $this->assertTrue((bool) $user->userApplications()->first()->is_active);

        // Role terbatas TIDAK menghalangi login.
        $this->post('/login', [
            'username' => 'tamu.asing',
            'password' => 'password',
        ])->assertRedirect();
        $this->assertAuthenticatedAs($user);
    }

    public function test_login_auto_activates_inactive_row_and_assigns_role_from_divisi(): void
    {
        Karyawan::create([
            'fid' => 'F1010',
            'nama_karyawan' => 'Sari Legacy',
            'divisi' => 'HRD',
            'status' => 'Active',
        ]);

        // Simulasikan akun lama: role masih "Menunggu Persetujuan" +
        // baris it-workflow inactive (dulu dibuat oleh gerbang registrasi).
        $pendingId = Role::where('name', 'Menunggu Persetujuan')->value('id');
        $user = User::factory()->create([
            'fid' => 'F1010',
            'role_id' => $pendingId,
        ]);
        UserApplication::create([
            'user_id' => $user->id,
            'application_id' => $this->workflowApp->id,
            'role_id' => $pendingId,
            'is_active' => false,
        ]);

        $response = $this->post('/login', [
            'username' => $user->username,
            'password' => 'password',
        ]);

        // Gerbang dihapus → login SUKSES, baris otomatis aktif,
        // role ditentukan dari divisi karyawan (HRD).
        $response->assertRedirect();
        $this->assertAuthenticatedAs($user);

        $this->assertSame(1, $user->userApplications()->count());
        $userApp = $user->userApplications()->first();
        $this->assertTrue((bool) $userApp->is_active);

        $user->refresh();
        $this->assertSame(Role::where('name', 'HRD')->value('id'), $user->role_id);

        // Tidak ada notifikasi "Permintaan akses baru" yang dibuat saat login.
        $this->assertSame(0, $user->accessRequestNotificationCount());
    }

    public function test_login_without_row_creates_active_row(): void
    {
        // Admin (level 1) tanpa baris sama sekali → login SUKSES,
        // baris it-workflow dibuat aktif otomatis (tanpa gerbang).
        $admin = User::factory()->role('IT')->create();
        // Factory role() memberi baris aktif semua app — hapus dulu untuk
        // mensimulasikan akun yang barisnya belum pernah ada.
        $admin->userApplications()->delete();

        $this->post('/login', [
            'username' => $admin->username,
            'password' => 'password',
        ])->assertRedirect();
        $this->assertAuthenticatedAs($admin);

        $this->assertSame(1, $admin->userApplications()->count());
        $userApp = $admin->userApplications()->first();
        $this->assertSame('it-workflow', $userApp->application->slug);
        $this->assertTrue((bool) $userApp->is_active);
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
