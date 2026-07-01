<?php

use App\Events\TicketStatusUpdated;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\ChecklistController;
use App\Http\Controllers\LogNotifikasiController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\ApplicationController;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

use App\Models\LogNotifikasi;
use App\Models\Ticket;
use Illuminate\Support\Facades\DB;

Route::get('/dashboard', function () {
    $user = auth()->user();
    $user->load('karyawan');

    $isAdmin = $user->isAdmin();

    if (!$isAdmin) {
        $karyawan = $user->karyawan;
        $tickets = $karyawan
            ? Ticket::with(['karyawan', 'adminIt'])
                ->where('karyawan_id', $karyawan->id)
                ->latest('updated_at')
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
        ->get();

    $monthlyData = Ticket::select(DB::raw('MONTH(created_at) as month'), DB::raw('count(*) as total'))
        ->whereYear('created_at', date('Y'))
        ->groupBy('month')
        ->get()
        ->pluck('total', 'month')
        ->toArray();

    $chartData = [];
    for ($i = 1; $i <= 12; $i++) {
        $chartData[] = $monthlyData[$i] ?? 0;
    }

    return Inertia::render('Dashboard', [
        'inboxTickets' => $inboxTickets,
        'stats' => $formattedStats,
        'chartData' => $chartData,
        'tickets' => $allTickets,
        'currentYear' => (int) date('Y'),
    ]);
})->middleware(['auth', 'verified', 'applications.access'])->name('dashboard');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/applications', [ApplicationController::class, 'index'])->name('applications.index');
    Route::post('/applications/request', [ApplicationController::class, 'requestAccess'])->name('applications.request');
    
    Route::get('/admin/applications/requests', [ApplicationController::class, 'requests'])->name('admin.applications.requests');
    Route::patch('/applications/toggle', [ApplicationController::class, 'toggleAccess'])->name('applications.toggle');
    
    Route::get('/admin/applications', [ApplicationController::class, 'manage'])->name('admin.applications.index');
    Route::post('/admin/applications', [ApplicationController::class, 'store'])->name('admin.applications.store');
    Route::patch('/admin/applications/{id}', [ApplicationController::class, 'update'])->name('admin.applications.update');
    Route::delete('/admin/applications/{id}', [ApplicationController::class, 'destroy'])->name('admin.applications.destroy');
});

Route::middleware(['auth', 'applications.access'])->group(function () {
    Route::get('/test-broadcast/{ticketId?}', function ($ticketId = null) {
        $ticket = $ticketId ? Ticket::find($ticketId) : Ticket::first();
        if (!$ticket) {
            return 'No ticket found to test broadcast';
        }
        event(new TicketStatusUpdated($ticket));
        return "Broadcasted TicketStatusUpdated event for ticket ID: " . $ticket->id;
    });
    
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::post('/profile/link-fid', [ProfileController::class, 'linkFid'])->name('profile.link-fid');
    Route::post('/profile/avatar', [ProfileController::class, 'updateAvatar'])->name('profile.avatar');

    Route::get('/my-requests', function () {
        return Inertia::render('User/MyRequests');
    })->name('my-requests');

    Route::get('/global-monitor', function () {
        return Inertia::render('User/GlobalMonitor');
    })->name('global-monitor');

    Route::get('/tickets/{id}', function ($id) {
        return Inertia::render('Admin/TicketDetail', ['ticketId' => (int) $id]);
    })->name('tickets.detail');

    Route::get('/history', function () {
        $user = auth()->user();
        $isAdmin = $user->isAdmin();

        if ($isAdmin) {
            $tickets = Ticket::with('karyawan')->where('status', 'approved')->orderBy('updated_at', 'desc')->get();
        } else {
            $divisi = $user->karyawan?->divisi;
            $tickets = $divisi
                ? Ticket::whereHas('karyawan', function ($q) use ($divisi) {
                    $q->where('divisi', $divisi);
                })->where('status', 'approved')->with('karyawan')->orderBy('updated_at', 'desc')->get()
                : collect();
        }

        return Inertia::render('History', [
            'tickets' => $tickets
        ]);
    })->name('history');

    Route::middleware('admin.it')->group(function () {
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

    Route::middleware('superadmin')->group(function () {
        Route::get('/admin/systems', [\App\Http\Controllers\SystemPtsamController::class, 'index'])->name('admin.systems.index');
        Route::post('/admin/systems', [\App\Http\Controllers\SystemPtsamController::class, 'store'])->name('admin.systems.store');
        Route::patch('/admin/systems/{id}', [\App\Http\Controllers\SystemPtsamController::class, 'update'])->name('admin.systems.update');
        Route::delete('/admin/systems/{id}', [\App\Http\Controllers\SystemPtsamController::class, 'destroy'])->name('admin.systems.destroy');

        Route::get('/admin/roles-permissions', [\App\Http\Controllers\RolePermissionController::class, 'index'])->name('admin.roles-permissions.index');
        Route::patch('/admin/users/{id}/role', [\App\Http\Controllers\RolePermissionController::class, 'updateUserRole'])->name('admin.users.update-role');
    });

    Route::prefix('api')->group(function () {
        Route::post('/tickets', [TicketController::class, 'store']);
        Route::get('/tickets', [TicketController::class, 'index']);
        Route::get('/my-tickets', [TicketController::class, 'myTickets']);
        Route::get('/notifications', [LogNotifikasiController::class, 'index']);
        Route::patch('/notifications/read-all', [LogNotifikasiController::class, 'markAllRead']);
        Route::get('/systems', [\App\Http\Controllers\SystemPtsamController::class, 'apiIndex']);

        Route::middleware('admin.it')->group(function () {
            Route::get('/tickets/inbox', [TicketController::class, 'getInbox']);
            Route::post('/tickets/{id}/take', [TicketController::class, 'takeTicket']);
            Route::patch('/tickets/{id}/status', [TicketController::class, 'updateStatus']);

            Route::post('/checklists', [ChecklistController::class, 'store']);
            Route::patch('/checklists/{id}/toggle-approve', [ChecklistController::class, 'toggleApprove']);
            Route::patch('/checklists/{id}/toggle-complete', [ChecklistController::class, 'toggleComplete']);
        });

        Route::get('/tickets/{id}', [TicketController::class, 'show']);
        Route::get('/tickets/{id}/timeline', [LogNotifikasiController::class, 'ticketTimeline']);

        Route::patch('/tickets/{id}/uat-approve', [TicketController::class, 'uatApprove']);
        Route::patch('/tickets/{id}/uat-revise',  [TicketController::class, 'uatRevise']);

        Route::patch('/tickets/{id}', [TicketController::class, 'update']);

        Route::delete('/tickets/{id}', [TicketController::class, 'softDelete']);
    });
});

require __DIR__.'/auth.php';
