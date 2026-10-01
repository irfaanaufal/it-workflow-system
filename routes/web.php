<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\ChecklistController;
use App\Http\Controllers\LogNotifikasiController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\ApplicationController;

Route::get('/', function () {
    return redirect()->route('login');
});

use App\Models\LogNotifikasi;
use App\Models\Ticket;
use Illuminate\Support\Facades\DB;

Route::get('/dashboard', function () {
    $user = auth()->user();
    $user->load('karyawan');

    $showAdminDashboard = in_array($user->level('it-workflow'), [1, 2, 3]);

    if (!$showAdminDashboard) {
        $karyawan = $user->karyawan;
        $tickets = $karyawan
            ? Ticket::with(['karyawan', 'adminIt'])
                ->where('karyawan_id', $karyawan->id)
                ->latest('updated_at')
                ->limit(100)
                ->get()
            : collect();

        $stats = [
            'total' => $tickets->count(),
            'active' => $tickets->whereNotIn('status', ['approved'])->count(),
            'testing' => $tickets->where('status', 'testing')->count(),
            'approved' => $tickets->where('status', 'approved')->count(),
        ];

        $statusCounts = $tickets
            ->groupBy('status')
            ->map(fn ($items) => $items->count())
            ->toArray();

        $recentTickets = $tickets
            ->whereNotIn('status', ['approved'])
            ->take(6)
            ->values();

        $timeline = LogNotifikasi::query()
            ->where('user_id', $user->id)
            ->latest()
            ->limit(10)
            ->get();

        return Inertia::render('User/Dashboard', [
            'stats' => $stats,
            'statusCounts' => $statusCounts,
            'recentTickets' => $recentTickets,
            'timeline' => $timeline,
            'tickets' => $tickets,
        ]);
    }

    $inboxTickets = Ticket::with('karyawan')
        ->where('status', 'inbox')
        ->orderBy('created_at', 'desc')
        ->limit(5)
        ->get();

    $statsRaw = Ticket::select('kategori_laporan', DB::raw('count(*) as total'))
        ->groupBy('kategori_laporan')
        ->get()
        ->pluck('total', 'kategori_laporan')
        ->toArray();

    $totalTickets = array_sum($statsRaw);

    $formattedStats = [
        'new_system' => [
            'count' => $statsRaw['new system'] ?? 0,
            'percentage' => $totalTickets > 0 ? round((($statsRaw['new system'] ?? 0) / $totalTickets) * 100) : 0
        ],
        'add_feature' => [
            'count' => $statsRaw['add feature'] ?? 0,
            'percentage' => $totalTickets > 0 ? round((($statsRaw['add feature'] ?? 0) / $totalTickets) * 100) : 0
        ],
        'maintenance' => [
            'count' => $statsRaw['maintenance'] ?? 0,
            'percentage' => $totalTickets > 0 ? round((($statsRaw['maintenance'] ?? 0) / $totalTickets) * 100) : 0
        ],
        'fix_bug' => [
            'count' => $statsRaw['fix bug'] ?? 0,
            'percentage' => $totalTickets > 0 ? round((($statsRaw['fix bug'] ?? 0) / $totalTickets) * 100) : 0
        ],
    ];

    $allTickets = Ticket::with('karyawan')
        ->latest('created_at')
        ->limit(100)
        ->get();

    $chartDataRaw = Ticket::whereYear('created_at', date('Y'))
        ->selectRaw('MONTH(created_at) as month, COUNT(*) as count')
        ->groupByRaw('MONTH(created_at)')
        ->pluck('count', 'month')
        ->toArray();

    $chartData = [];
    for ($i = 1; $i <= 12; $i++) {
        $chartData[] = $chartDataRaw[$i] ?? 0;
    }

    return Inertia::render('Dashboard', [
        'inboxTickets' => $inboxTickets,
        'stats' => $formattedStats,
        'chartData' => $chartData,
        'tickets' => $allTickets,
        'currentYear' => (int) date('Y'),
        'isIT' => $user->isIT('it-workflow'),
    ]);
})->middleware(['auth', 'applications.access'])->name('dashboard');

Route::middleware(['auth', 'verified', 'manage.master'])->group(function () {
    Route::get('/admin/applications/requests', [ApplicationController::class, 'requests'])->name('admin.applications.requests');
    Route::patch('/applications/toggle', [ApplicationController::class, 'toggleAccess'])->name('applications.toggle');
    
    Route::get('/admin/applications', [ApplicationController::class, 'manage'])->name('admin.applications.index');
    Route::post('/admin/applications', [ApplicationController::class, 'store'])->name('admin.applications.store');
    Route::patch('/admin/applications/{id}', [ApplicationController::class, 'update'])->name('admin.applications.update');
    Route::delete('/admin/applications/{id}', [ApplicationController::class, 'destroy'])->name('admin.applications.destroy');
});

Route::middleware(['auth', 'applications.access'])->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::post('/profile/link-fid', [ProfileController::class, 'linkFid'])
        ->middleware('throttle:10,1')
        ->name('profile.link-fid');
    Route::post('/profile/avatar', [ProfileController::class, 'updateAvatar'])
        ->middleware('throttle:10,1')
        ->name('profile.avatar');

    Route::get('/my-requests', function () {
        return Inertia::render('User/MyRequests');
    })->name('my-requests');

    Route::get('/global-monitor', function () {
        abort_unless(auth()->user()->canSeeGlobalMonitor('it-workflow'), 403, 'Unauthorized. Anda tidak memiliki izin untuk mengakses halaman ini.');

        return Inertia::render('User/GlobalMonitor');
    })->name('global-monitor');

    Route::get('/tickets/{id}', function ($id) {
        return Inertia::render('Admin/TicketDetail', ['ticketId' => (int) $id]);
    })->name('tickets.detail');

    Route::get('/history', function () {
        $tickets = Ticket::with('karyawan')
            ->withTrashed()
            ->whereIn('status', ['approved', 'rejected'])
            ->orderBy('updated_at', 'desc')
            ->limit(500)
            ->get();

        return Inertia::render('History', [
            'tickets' => $tickets
        ]);
    })->name('history');

    Route::middleware('admin.it.ticket')->group(function () {
        Route::get('/admin/inbox', function () {
            return Inertia::render('Admin/Inbox');
        })->name('admin.inbox');

        Route::get('/admin/kanban', function () {
            return Inertia::render('Admin/Kanban');
        })->name('admin.kanban');

        Route::get('/admin/tickets/{id}', function ($id) {
            return Inertia::render('Admin/TicketDetail', ['ticketId' => (int) $id]);
        })->name('admin.ticket-detail');
    });

    Route::prefix('api')->middleware('throttle:60,1')->group(function () {
        Route::post('/tickets', [TicketController::class, 'store']);
        Route::get('/tickets', [TicketController::class, 'index']);
        Route::get('/my-tickets', [TicketController::class, 'myTickets']);
        Route::get('/notifications', [LogNotifikasiController::class, 'index']);
        Route::patch('/notifications/read-all', [LogNotifikasiController::class, 'markAllRead']);
        Route::get('/systems', [\App\Http\Controllers\SystemPtsamController::class, 'apiIndex']);

        Route::middleware('admin.it.ticket')->group(function () {
            Route::get('/tickets/inbox', [TicketController::class, 'getInbox']);
            Route::post('/tickets/{id}/take', [TicketController::class, 'takeTicket']);
            Route::post('/tickets/{id}/return-to-inbox', [TicketController::class, 'returnToInbox']);
            Route::post('/tickets/{id}/reject', [TicketController::class, 'rejectTicket']);
            Route::patch('/tickets/{id}/status', [TicketController::class, 'updateStatus']);
            Route::patch('/tickets/{id}/classification', [TicketController::class, 'updateClassification']);
            Route::patch('/tickets/{id}/deadline', [TicketController::class, 'updateDeadline']);
            Route::get('/tickets/{id}/reporter-candidates', [TicketController::class, 'reporterCandidates']);
            Route::patch('/tickets/{id}/reporter', [TicketController::class, 'updateReporter']);
            Route::patch('/tickets/{id}/system-link', [TicketController::class, 'updateSystemLink']);

            Route::post('/checklists', [ChecklistController::class, 'store']);
            Route::patch('/checklists/{id}/toggle-approve', [ChecklistController::class, 'toggleApprove']);
            Route::patch('/checklists/{id}/toggle-complete', [ChecklistController::class, 'toggleComplete']);
        });

        Route::get('/tickets/{id}', [TicketController::class, 'show']);
        Route::get('/tickets/{id}/timeline', [LogNotifikasiController::class, 'ticketTimeline']);

        Route::patch('/tickets/{id}/uat-approve', [TicketController::class, 'uatApprove']);
        Route::patch('/tickets/{id}/uat-revise', [TicketController::class, 'uatRevise']);

        Route::patch('/tickets/{id}', [TicketController::class, 'update']);

        Route::delete('/tickets/{id}', [TicketController::class, 'softDelete']);
    });

    Route::middleware('manage.master')->group(function () {
        Route::get('/admin/systems', [\App\Http\Controllers\SystemPtsamController::class, 'index'])->name('admin.systems.index');
        Route::post('/admin/systems', [\App\Http\Controllers\SystemPtsamController::class, 'store'])->name('admin.systems.store');
        Route::patch('/admin/systems/{id}', [\App\Http\Controllers\SystemPtsamController::class, 'update'])->name('admin.systems.update');
        Route::delete('/admin/systems/{id}', [\App\Http\Controllers\SystemPtsamController::class, 'destroy'])->name('admin.systems.destroy');

        Route::get('/admin/roles-permissions', [\App\Http\Controllers\RolePermissionController::class, 'index'])->name('admin.roles-permissions.index');
        Route::get('/admin/roles-permissions/briefing', [\App\Http\Controllers\RolePermissionController::class, 'briefingRoles'])->name('admin.roles-permissions.briefing');
        Route::patch('/admin/users/{id}/role', [\App\Http\Controllers\RolePermissionController::class, 'updateUserRole'])->name('admin.users.update-role');
        Route::patch('/admin/users/{id}/briefing-role', [\App\Http\Controllers\RolePermissionController::class, 'updateBriefingRole'])->name('admin.users.update-briefing-role');

        Route::get('/admin/roles-permissions/reminder', [\App\Http\Controllers\RolePermissionController::class, 'reminderRoles'])->name('admin.roles-permissions.reminder');
        Route::patch('/admin/users/{id}/reminder-role', [\App\Http\Controllers\RolePermissionController::class, 'updateReminderRole'])->name('admin.users.update-reminder-role');

        Route::get('/admin/karyawan', [\App\Http\Controllers\KaryawanController::class, 'index'])->name('admin.karyawan.index');
        Route::post('/admin/karyawan', [\App\Http\Controllers\KaryawanController::class, 'store'])->name('admin.karyawan.store');
        Route::patch('/admin/karyawan/{fid}', [\App\Http\Controllers\KaryawanController::class, 'update'])->name('admin.karyawan.update');
    });
});

require __DIR__.'/auth.php';
