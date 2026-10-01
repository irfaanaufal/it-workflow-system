<?php

namespace Tests\Feature;

use App\Models\Application;
use App\Models\Karyawan;
use App\Models\LogNotifikasi;
use App\Models\Role;
use App\Models\SystemPtsam;
use App\Models\Ticket;
use App\Models\User;
use App\Models\UserApplication;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class LevelAccessTest extends TestCase
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

    public static function rolesProvider(): array
    {
        return [
            'IT' => ['IT'],
            'Direktur Utama' => ['Direktur Utama'],
            'Head Admin' => ['Head Admin'],
            'HRD' => ['HRD'],
            'Admin' => ['Admin'],
            'Teknisi' => ['Teknisi'],
            'QA' => ['QA'],
            'QC' => ['QC'],
            'Ekspedisi' => ['Ekspedisi'],
        ];
    }

    private function makeUser(string $roleName): User
    {
        return User::factory()->role($roleName)->create();
    }

    #[DataProvider('rolesProvider')]
    public function test_basic_pages_accessible_for_all_active_users(string $roleName): void
    {
        $user = $this->makeUser($roleName);

        $this->actingAs($user)->get('/my-requests')->assertStatus(200);
        $this->actingAs($user)->get('/history')->assertStatus(200);
        $this->actingAs($user)->get('/api/tickets')->assertStatus(200);

        // The admin branch of /dashboard (levels 1-3) uses MySQL-specific
        // MONTH() in its chart query, which the sqlite test driver does not support.
        if (! in_array($roleName, ['IT', 'Direktur Utama', 'Head Admin'])) {
            $this->actingAs($user)->get('/dashboard')->assertStatus(200);
        }
    }

    #[DataProvider('rolesProvider')]
    public function test_inbox_and_kanban_only_for_it(string $roleName): void
    {
        $user = $this->makeUser($roleName);
        $expected = $roleName === 'IT' ? 200 : 403;

        $this->actingAs($user)->get('/admin/inbox')->assertStatus($expected);
        $this->actingAs($user)->get('/admin/kanban')->assertStatus($expected);
        $this->actingAs($user)->get('/api/tickets/inbox')->assertStatus($expected);
    }

    #[DataProvider('rolesProvider')]
    public function test_global_monitor_for_all_roles_except_it(string $roleName): void
    {
        $user = $this->makeUser($roleName);
        $expected = $roleName === 'IT' ? 403 : 200;

        $this->actingAs($user)->get('/global-monitor')->assertStatus($expected);
    }

    #[DataProvider('rolesProvider')]
    public function test_master_data_only_for_levels_1_2_3_6(string $roleName): void
    {
        $user = $this->makeUser($roleName);
        $expected = in_array($roleName, ['IT', 'Direktur Utama', 'Head Admin', 'HRD', 'QA']) ? 200 : 403;

        $this->actingAs($user)->get('/admin/systems')->assertStatus($expected);
        $this->actingAs($user)->get('/admin/roles-permissions')->assertStatus($expected);
        $this->actingAs($user)->get('/admin/karyawan')->assertStatus($expected);
        $this->actingAs($user)->get('/admin/applications')->assertStatus($expected);
    }

    public function test_user_without_role_and_without_active_access_is_forbidden(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get('/my-requests')->assertStatus(403);
    }

    #[DataProvider('rolesProvider')]
    public function test_manage_master_roles_can_login_without_access_request(string $roleName): void
    {
        $user = User::factory()->role($roleName)->create();

        // All roles can access because factory creates user_applications with is_active=true
        $this->actingAs($user)->get('/my-requests')->assertStatus(200);
    }

    public function test_roles_table_contains_exactly_the_nine_levels(): void
    {
        $roles = Role::orderBy('level')->pluck('name', 'level')->toArray();

        $this->assertSame([
            1 => 'IT',
            2 => 'Direktur Utama',
            3 => 'Head Admin',
            4 => 'HRD',
            5 => 'Admin',
            6 => 'Teknisi',
            7 => 'QA',
            8 => 'QC',
            9 => 'Ekspedisi',
        ], $roles);
    }

    private function makeTicket(int $reporterFid, string $status = 'review', array $overrides = []): Ticket
    {
        $karyawan = Karyawan::create([
            'fid' => $reporterFid,
            'nama_karyawan' => 'Reporter ' . $reporterFid,
            'divisi' => 'Admin',
        ]);

        $karyawanId = $karyawan->id
            ?? \Illuminate\Support\Facades\DB::table('karyawans')->where('fid', $reporterFid)->value('id');

        return Ticket::create(array_merge([
            'karyawan_id' => $karyawanId,
            'judul_laporan' => 'Laporan test',
            'kategori_laporan' => 'new system',
            'urgensi_laporan' => 'low',
            'kondisi_lapangan' => 'Kondisi di lapangan',
            'keinginan_sistem' => 'Keinginan sistem',
            'dampak_positif' => 'Dampak positif',
            'status' => $status,
        ], $overrides));
    }

    public function test_it_can_update_ticket_classification(): void
    {
        $it = $this->makeUser('IT');
        $reporter = User::factory()->role('Admin')->create(['fid' => 901]);
        $system = SystemPtsam::create(['nama_sistem' => 'Sistem A']);
        $ticket = $this->makeTicket(901);

        $this->actingAs($it)->patchJson("/api/tickets/{$ticket->id}/classification", [
            'kategori_laporan' => 'fix bug',
            'urgensi_laporan' => 'blocker',
            'system_ptsam_id' => $system->id,
        ])->assertStatus(200);

        $this->assertDatabaseHas('tickets', [
            'id' => $ticket->id,
            'kategori_laporan' => 'fix bug',
            'urgensi_laporan' => 'blocker',
            'system_ptsam_id' => $system->id,
        ]);

        $this->assertDatabaseHas('log_notifikasi', [
            'ticket_id' => $ticket->id,
            'user_id' => $reporter->id,
            'action' => 'classification_changed',
        ]);

        $this->actingAs($it)->getJson("/api/tickets/{$ticket->id}/timeline")
            ->assertJsonFragment(['action' => 'classification_changed']);
    }

    public function test_non_it_cannot_update_ticket_classification(): void
    {
        $admin = $this->makeUser('Admin');
        $ticket = $this->makeTicket(902);

        $this->actingAs($admin)->patchJson("/api/tickets/{$ticket->id}/classification", [
            'kategori_laporan' => 'fix bug',
            'urgensi_laporan' => 'high',
            'system_ptsam_id' => null,
        ])->assertStatus(403);
    }

    public function test_it_cannot_update_classification_of_approved_ticket(): void
    {
        $it = $this->makeUser('IT');
        $ticket = $this->makeTicket(903, 'approved');

        $this->actingAs($it)->patchJson("/api/tickets/{$ticket->id}/classification", [
            'kategori_laporan' => 'new system',
            'urgensi_laporan' => 'medium',
            'system_ptsam_id' => null,
        ])->assertStatus(400);
    }

    public function test_classification_validation_rules_are_enforced(): void
    {
        $it = $this->makeUser('IT');
        $ticket = $this->makeTicket(904);

        // Blocker tidak boleh untuk kategori selain Fix Bug / Maintenance
        $this->actingAs($it)->patchJson("/api/tickets/{$ticket->id}/classification", [
            'kategori_laporan' => 'new system',
            'urgensi_laporan' => 'blocker',
            'system_ptsam_id' => null,
        ])->assertStatus(422);

        // Sistem wajib untuk kategori Add Feature
        $this->actingAs($it)->patchJson("/api/tickets/{$ticket->id}/classification", [
            'kategori_laporan' => 'add feature',
            'urgensi_laporan' => 'high',
            'system_ptsam_id' => null,
        ])->assertStatus(422);
    }

    public function test_it_can_set_ticket_deadline(): void
    {
        $it = $this->makeUser('IT');
        $reporter = User::factory()->role('Admin')->create(['fid' => 905]);
        $ticket = $this->makeTicket(905);
        $deadline = now()->addDays(5)->format('Y-m-d');

        $this->actingAs($it)->patchJson("/api/tickets/{$ticket->id}/deadline", [
            'deadline' => $deadline,
        ])->assertStatus(200);

        $this->assertDatabaseHas('tickets', [
            'id' => $ticket->id,
            'deadline' => $deadline,
        ]);

        $this->assertDatabaseHas('log_notifikasi', [
            'ticket_id' => $ticket->id,
            'user_id' => $reporter->id,
            'action' => 'deadline_changed',
        ]);

        $this->actingAs($it)->getJson("/api/tickets/{$ticket->id}/timeline")
            ->assertJsonFragment(['action' => 'deadline_changed']);
    }

    public function test_non_it_cannot_set_ticket_deadline(): void
    {
        $admin = $this->makeUser('Admin');
        $ticket = $this->makeTicket(906);

        $this->actingAs($admin)->patchJson("/api/tickets/{$ticket->id}/deadline", [
            'deadline' => now()->addDays(5)->format('Y-m-d'),
        ])->assertStatus(403);
    }

    public function test_it_cannot_set_deadline_of_approved_ticket(): void
    {
        $it = $this->makeUser('IT');
        $ticket = $this->makeTicket(907, 'approved');

        $this->actingAs($it)->patchJson("/api/tickets/{$ticket->id}/deadline", [
            'deadline' => now()->addDays(5)->format('Y-m-d'),
        ])->assertStatus(400);
    }

    public function test_deadline_must_not_be_in_the_past(): void
    {
        $it = $this->makeUser('IT');
        $ticket = $this->makeTicket(908);

        $this->actingAs($it)->patchJson("/api/tickets/{$ticket->id}/deadline", [
            'deadline' => now()->subDay()->format('Y-m-d'),
        ])->assertStatus(422);
    }

    public function test_it_can_clear_ticket_deadline(): void
    {
        $it = $this->makeUser('IT');
        $ticket = $this->makeTicket(909, 'review', [
            'deadline' => now()->addDays(3)->format('Y-m-d'),
        ]);

        $this->actingAs($it)->patchJson("/api/tickets/{$ticket->id}/deadline", [
            'deadline' => null,
        ])->assertStatus(200);

        $this->assertDatabaseHas('tickets', [
            'id' => $ticket->id,
            'deadline' => null,
        ]);
    }

    public function test_timeline_returns_accumulated_stage_durations(): void
    {
        $it = $this->makeUser('IT');
        $ticket = $this->makeTicket(910, 'approved');
        $base = Carbon::now()->subDays(10);

        $this->createStageLog($ticket, $it, 'entered_review', $base);
        $this->createStageLog($ticket, $it, 'entered_to_do', $base->copy()->addHours(2));
        $this->createStageLog($ticket, $it, 'entered_in_progress', $base->copy()->addDays(1));
        $this->createStageLog($ticket, $it, 'entered_testing', $base->copy()->addDays(3));
        $this->createStageLog($ticket, $it, 'approved', $base->copy()->addDays(5));

        $res = $this->actingAs($it)->getJson("/api/tickets/{$ticket->id}/timeline")
            ->assertStatus(200)
            ->assertJsonFragment(['action' => 'entered_review']);

        $this->assertSame(7200, $res->json('stage_durations.review.seconds'));
        $this->assertSame(79200, $res->json('stage_durations.to_do.seconds'));
        $this->assertSame(172800, $res->json('stage_durations.in_progress.seconds'));
        $this->assertSame(172800, $res->json('stage_durations.testing.seconds'));
        $this->assertFalse($res->json('stage_durations.review.ongoing'));
        $this->assertFalse($res->json('stage_durations.testing.ongoing'));
        $this->assertSame('2 jam', $res->json('stage_durations.review.label'));
    }

    public function test_timeline_marks_current_stage_as_ongoing(): void
    {
        $it = $this->makeUser('IT');
        $ticket = $this->makeTicket(911, 'in_progress');

        $this->createStageLog($ticket, $it, 'entered_review', Carbon::now()->subDays(3));
        $this->createStageLog($ticket, $it, 'entered_to_do', Carbon::now()->subDays(2));
        $this->createStageLog($ticket, $it, 'entered_in_progress', Carbon::now()->subHours(5));

        $res = $this->actingAs($it)->getJson("/api/tickets/{$ticket->id}/timeline")
            ->assertStatus(200);

        $this->assertTrue($res->json('stage_durations.in_progress.ongoing'));
        $this->assertSame(86400, $res->json('stage_durations.review.seconds'));
        $this->assertSame(154800, $res->json('stage_durations.to_do.seconds'));
        $this->assertNull($res->json('stage_durations.testing'));
    }

    public function test_timeline_stage_durations_empty_for_inbox_ticket(): void
    {
        $it = $this->makeUser('IT');
        $ticket = $this->makeTicket(912, 'inbox');

        $this->actingAs($it)->getJson("/api/tickets/{$ticket->id}/timeline")
            ->assertStatus(200)
            ->assertJson(['stage_durations' => []]);
    }

    public function test_it_can_change_reporter_during_testing(): void
    {
        $it = $this->makeUser('IT');
        $ticket = $this->makeTicket(913, 'testing');
        Karyawan::create([
            'fid' => 914,
            'nama_karyawan' => 'User Baru',
            'divisi' => 'Produksi',
            'status' => 'Active',
        ]);
        $newKaryawanId = \Illuminate\Support\Facades\DB::table('karyawans')->where('fid', 914)->value('id');
        $newUser = User::factory()->role('Admin')->create(['fid' => 914]);

        $this->actingAs($it)->patchJson("/api/tickets/{$ticket->id}/reporter", [
            'karyawan_id' => $newKaryawanId,
        ])->assertStatus(200);

        $this->assertDatabaseHas('tickets', [
            'id' => $ticket->id,
            'karyawan_id' => $newKaryawanId,
        ]);

        $this->assertDatabaseHas('log_notifikasi', [
            'ticket_id' => $ticket->id,
            'user_id' => $newUser->id,
            'action' => 'reporter_changed',
        ]);

        $this->actingAs($it)->getJson("/api/tickets/{$ticket->id}/timeline")
            ->assertJsonFragment(['action' => 'reporter_changed']);
    }

    public function test_reporter_candidates_only_active_karyawan_with_account(): void
    {
        $it = $this->makeUser('IT');
        $ticket = $this->makeTicket(915, 'testing');

        $withAccount = Karyawan::create([
            'fid' => 916,
            'nama_karyawan' => 'Dengan Akun',
            'divisi' => 'Produksi',
            'status' => 'Active',
        ]);
        User::factory()->role('Admin')->create(['fid' => 916]);

        $withoutAccount = Karyawan::create([
            'fid' => 917,
            'nama_karyawan' => 'Tanpa Akun',
            'divisi' => 'Produksi',
            'status' => 'Active',
        ]);

        $res = $this->actingAs($it)->getJson("/api/tickets/{$ticket->id}/reporter-candidates")
            ->assertStatus(200);

        $ids = collect($res->json())->pluck('id')->all();
        $withAccountId = \Illuminate\Support\Facades\DB::table('karyawans')->where('fid', 916)->value('id');
        $withoutAccountId = \Illuminate\Support\Facades\DB::table('karyawans')->where('fid', 917)->value('id');
        $this->assertContains($withAccountId, $ids);
        $this->assertNotContains($withoutAccountId, $ids);
    }

    public function test_non_it_cannot_change_reporter(): void
    {
        $admin = $this->makeUser('Admin');
        $ticket = $this->makeTicket(918, 'testing');

        $this->actingAs($admin)->patchJson("/api/tickets/{$ticket->id}/reporter", [
            'karyawan_id' => $ticket->karyawan_id,
        ])->assertStatus(403);
    }

    public function test_reporter_only_changeable_during_testing(): void
    {
        $it = $this->makeUser('IT');
        $ticket = $this->makeTicket(919, 'review');

        $this->actingAs($it)->patchJson("/api/tickets/{$ticket->id}/reporter", [
            'karyawan_id' => $ticket->karyawan_id,
        ])->assertStatus(400);
    }

    public function test_reporter_must_have_user_account(): void
    {
        $it = $this->makeUser('IT');
        $ticket = $this->makeTicket(920, 'testing');
        $noUser = Karyawan::create([
            'fid' => 921,
            'nama_karyawan' => 'Tanpa Akun',
            'status' => 'Active',
        ]);

        $this->actingAs($it)->patchJson("/api/tickets/{$ticket->id}/reporter", [
            'karyawan_id' => $noUser->id,
        ])->assertStatus(422);
    }

    public function test_it_can_set_system_link_for_new_system(): void
    {
        $it = $this->makeUser('IT');
        $reporter = User::factory()->role('Admin')->create(['fid' => 922]);
        $ticket = $this->makeTicket(922);
        $link = 'https://sistem-baru.example.com';

        $this->actingAs($it)->patchJson("/api/tickets/{$ticket->id}/system-link", [
            'link_sistem' => $link,
        ])->assertStatus(200);

        $this->assertDatabaseHas('tickets', [
            'id' => $ticket->id,
            'link_sistem' => $link,
        ]);

        $this->assertDatabaseHas('log_notifikasi', [
            'ticket_id' => $ticket->id,
            'user_id' => $reporter->id,
            'action' => 'system_link_changed',
        ]);

        $this->actingAs($it)->getJson("/api/tickets/{$ticket->id}/timeline")
            ->assertJsonFragment(['action' => 'system_link_changed']);
    }

    public function test_system_link_only_for_new_system_category(): void
    {
        $it = $this->makeUser('IT');
        $ticket = $this->makeTicket(923, 'review', ['kategori_laporan' => 'fix bug']);

        $this->actingAs($it)->patchJson("/api/tickets/{$ticket->id}/system-link", [
            'link_sistem' => 'https://sistem.example.com',
        ])->assertStatus(422);
    }

    public function test_non_it_cannot_set_system_link(): void
    {
        $admin = $this->makeUser('Admin');
        $ticket = $this->makeTicket(924);

        $this->actingAs($admin)->patchJson("/api/tickets/{$ticket->id}/system-link", [
            'link_sistem' => 'https://sistem.example.com',
        ])->assertStatus(403);
    }

    public function test_system_link_must_be_valid_url(): void
    {
        $it = $this->makeUser('IT');
        $ticket = $this->makeTicket(925);

        $this->actingAs($it)->patchJson("/api/tickets/{$ticket->id}/system-link", [
            'link_sistem' => 'bukan-url',
        ])->assertStatus(422);
    }

    public function test_it_cannot_set_system_link_of_approved_ticket(): void
    {
        $it = $this->makeUser('IT');
        $ticket = $this->makeTicket(926, 'approved');

        $this->actingAs($it)->patchJson("/api/tickets/{$ticket->id}/system-link", [
            'link_sistem' => 'https://sistem.example.com',
        ])->assertStatus(400);
    }

    public function test_it_can_clear_system_link(): void
    {
        $it = $this->makeUser('IT');
        $ticket = $this->makeTicket(927, 'review', [
            'link_sistem' => 'https://sistem.example.com',
        ]);

        $this->actingAs($it)->patchJson("/api/tickets/{$ticket->id}/system-link", [
            'link_sistem' => null,
        ])->assertStatus(200);

        $this->assertDatabaseHas('tickets', [
            'id' => $ticket->id,
            'link_sistem' => null,
        ]);
    }

    private function createStageLog(Ticket $ticket, User $actor, string $action, Carbon $when): void
    {
        $log = new LogNotifikasi();
        $log->ticket_id = $ticket->id;
        $log->user_id = $actor->id;
        $log->actor_user_id = $actor->id;
        $log->actor_name = $actor->name;
        $log->recipient_type = 'user';
        $log->action = $action;
        $log->title = 'Test log';
        $log->message = 'Test log tahapan.';
        $log->visible_in_bell = false;
        $log->created_at = $when;
        $log->save();
    }
}