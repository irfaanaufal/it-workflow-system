<?php

namespace App\Http\Controllers;

use App\Events\TicketStatusUpdated;
use App\Http\Requests\StoreTicketRequest;
use App\Http\Requests\UpdateTicketRequest;
use App\Models\LogNotifikasi;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class TicketController extends Controller
{
    public function index(): JsonResponse
    {
        $tickets = Ticket::with(['karyawan', 'adminIt', 'adminIt.user', 'systemPtsam'])
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json($tickets);
    }

    public function store(StoreTicketRequest $request): JsonResponse
    {
        $user = $request->user();
        $karyawan = $user->karyawan;

        if (!$karyawan) {
            return response()->json([
                'message' => 'Your user account is not associated with any Karyawan record.'
            ], 403);
        }

        $validated = $request->validated();

        $attachmentPath = null;
        if ($request->hasFile('attachment')) {
            $attachmentPath = $request->file('attachment')->store('attachments', 'public');
        }

        $systemPtsamId = $validated['system_ptsam_id'] ?? null;
        if ($validated['kategori_laporan'] === 'new system') {
            $systemPtsamId = null;
        }

        $ticket = Ticket::create([
            'karyawan_id' => $karyawan->id,
            'judul_laporan' => $validated['judul_laporan'],
            'kategori_laporan' => $validated['kategori_laporan'],
            'urgensi_laporan' => $validated['urgensi_laporan'],
            'kondisi_lapangan' => $validated['kondisi_lapangan'],
            'keinginan_sistem' => $validated['keinginan_sistem'],
            'dampak_positif' => $validated['dampak_positif'],
            'attachment_path' => $attachmentPath,
            'status' => 'inbox',
            'system_ptsam_id' => $systemPtsamId,
        ]);

        $this->broadcastTicketUpdate($ticket, 'created');

        return response()->json([
            'message' => 'Ticket created successfully.',
            'ticket' => $ticket
        ], 201);
    }

    public function update(UpdateTicketRequest $request, $id): JsonResponse
    {
        $ticket = Ticket::findOrFail($id);
        $user = $request->user();
        $karyawan = $user->karyawan;

        $isOwner = $karyawan && $ticket->karyawan_id === $karyawan->id;
        $canEdit = $user->isAdmin() || ($isOwner && $ticket->status === 'inbox');

        if (!$canEdit) {
            return response()->json(['message' => 'Anda tidak memiliki izin untuk mengedit tiket ini.'], 403);
        }

        if (!$user->isAdmin() && $ticket->status !== 'inbox') {
            return response()->json(['message' => 'Tiket hanya dapat diedit selama masih dalam antrean (Inbox).'], 400);
        }

        $validated = $request->validated();
        if ($validated['kategori_laporan'] === 'new system') {
            $validated['system_ptsam_id'] = null;
        }

        $ticket->fill($validated);
        $ticket->save();

        return response()->json(['message' => 'Tiket berhasil diperbarui.', 'ticket' => $ticket->load(['karyawan', 'systemPtsam'])]);
    }

    public function getInbox(): JsonResponse
    {
        $tickets = Ticket::with(['karyawan', 'systemPtsam'])
            ->where('status', 'inbox')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($tickets);
    }

    public function takeTicket($id): JsonResponse
    {
        $ticket = Ticket::findOrFail($id);

        if ($ticket->status !== 'inbox') {
            return response()->json([
                'message' => 'This ticket is already taken or processed.'
            ], 400);
        }

        $user = auth()->user();
        $karyawan = $user->karyawan;

        if (!$karyawan) {
            return response()->json([
                'message' => 'Your user account is not associated with any Karyawan record.'
            ], 403);
        }

        $ticket->status = 'review';
        $ticket->admin_it_id = $karyawan->id;
        $ticket->save();

        $this->broadcastTicketUpdate($ticket, 'taken');

        return response()->json([
            'message' => 'Ticket taken successfully.',
            'ticket' => $ticket
        ]);
    }

    public function uatApprove(Request $request, $id): JsonResponse
    {
        $request->validate([
            'uat_feedback' => ['required', 'string', 'max:2000'],
        ]);

        $ticket = Ticket::findOrFail($id);

        if ($ticket->status !== 'testing') {
            return response()->json([
                'message' => 'Tiket ini tidak sedang dalam tahap testing.'
            ], 400);
        }

        $karyawan = $request->user()->karyawan;

        if (!$karyawan || $ticket->karyawan_id !== $karyawan->id) {
            return response()->json([
                'message' => 'Anda tidak memiliki izin untuk menyetujui tiket ini.'
            ], 403);
        }

        $ticket->status       = 'approved';
        $ticket->uat_feedback = $request->input('uat_feedback');
        $ticket->save();

        $this->broadcastTicketUpdate($ticket, 'uat_approved');

        return response()->json([
            'message' => 'Tiket berhasil disetujui.',
            'ticket'  => $ticket
        ]);
    }

    public function uatRevise(Request $request, $id): JsonResponse
    {
        $request->validate([
            'revision_reason' => ['required', 'string', 'max:2000'],
        ]);

        $ticket = Ticket::findOrFail($id);

        if ($ticket->status !== 'testing') {
            return response()->json([
                'message' => 'Tiket ini tidak sedang dalam tahap testing.'
            ], 400);
        }

        $karyawan = $request->user()->karyawan;

        if (!$karyawan || $ticket->karyawan_id !== $karyawan->id) {
            return response()->json([
                'message' => 'Anda tidak memiliki izin untuk merevisi tiket ini.'
            ], 403);
        }

        $ticket->status          = 'review';
        $ticket->revision_reason = $request->input('revision_reason');
        $ticket->save();

        $this->broadcastTicketUpdate($ticket, 'revision_requested');

        return response()->json([
            'message' => 'Permintaan revisi berhasil dikirim.',
            'ticket'  => $ticket
        ]);
    }

    public function updateStatus(Request $request, $id): JsonResponse
    {
        $request->validate([
            'status' => ['required', 'string', 'in:review,to_do,in_progress,testing,approved']
        ]);

        $ticket = Ticket::findOrFail($id);

        $user = auth()->user();
        $karyawan = $user->karyawan;

        if (!$karyawan) {
            return response()->json([
                'message' => 'Your user account is not associated with any Karyawan record.'
            ], 403);
        }

        if (!$user->isAdmin()) {
            return response()->json([
                'message' => 'Anda tidak memiliki hak akses untuk merubah status laporan ini.'
            ], 403);
        }

        $ticket->status = $request->input('status');
        $ticket->save();

        $this->broadcastTicketUpdate($ticket, 'status_changed');

        return response()->json([
            'message' => 'Ticket status updated successfully.',
            'ticket' => $ticket
        ]);
    }

    public function myTickets(Request $request): JsonResponse
    {
        $karyawan = $request->user()->karyawan;

        if (!$karyawan) {
            return response()->json([], 200);
        }

        $tickets = Ticket::with(['karyawan', 'adminIt', 'adminIt.user', 'systemPtsam'])
            ->where('karyawan_id', $karyawan->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($ticket) {
                if ($ticket->adminIt && $ticket->adminIt->user) {
                    $ticket->adminIt->user->avatar_url = $ticket->adminIt->user->avatar_path
                        ? asset($ticket->adminIt->user->avatar_path)
                        : null;
                }
                return $ticket;
            });

        return response()->json($tickets);
    }

    public function softDelete(Request $request, $id): JsonResponse
    {
        $ticket = Ticket::findOrFail($id);
        $user = $request->user();
        $karyawan = $user->karyawan;

        $isOwner = $karyawan && $ticket->karyawan_id === $karyawan->id;
        $canDelete = $user->isAdmin() || ($isOwner && $ticket->status === 'inbox');

        if (!$canDelete) {
            return response()->json(['message' => 'Anda tidak memiliki izin untuk menghapus tiket ini.'], 403);
        }

        if (!$user->isAdmin() && $ticket->status !== 'inbox') {
            return response()->json(['message' => 'Tiket hanya dapat dihapus selama masih dalam antrean (Inbox).'], 400);
        }

        $ticket->delete();

        return response()->json(['message' => 'Tiket berhasil dihapus.']);
    }

    public function show(Request $request, $id): JsonResponse
    {
        $ticket = Ticket::with(['karyawan', 'adminIt', 'adminIt.user', 'checklists', 'systemPtsam'])
            ->findOrFail($id);

        $user = $request->user();
        $karyawan = $user->karyawan;
        $isOwner = $karyawan && $ticket->karyawan_id === $karyawan->id;

        if (!$user->isAdmin() && !$isOwner) {
            return response()->json(['message' => 'Anda tidak memiliki izin untuk melihat tiket ini.'], 403);
        }

        if ($ticket->adminIt && $ticket->adminIt->user) {
            $ticket->adminIt->user->avatar_url = $ticket->adminIt->user->avatar_path
                ? asset($ticket->adminIt->user->avatar_path)
                : null;
        }

        return response()->json($ticket);
    }

    private function broadcastTicketUpdate(Ticket $ticket, string $action): void
    {
        try {
            $ticket->loadMissing(['karyawan', 'adminIt']);
            $this->storeNotificationLogs($ticket, $action);
        } catch (Throwable $e) {
            Log::warning('Notification logs failed.', [
                'ticket_id' => $ticket->id,
                'action' => $action,
                'error' => $e->getMessage(),
            ]);
        }

        try {
            event(new TicketStatusUpdated($ticket));
        } catch (Throwable $e) {
            Log::warning('Ticket status broadcast failed.', [
                'ticket_id' => $ticket->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function storeNotificationLogs(Ticket $ticket, string $action): void
    {
        $actor = auth()->user();
        $actorName = $actor?->name ?? 'System';
        $reporter = $this->reporterUser($ticket);
        $reporterOnly = $reporter ? collect([$reporter]) : collect();

        if ($action === 'created') {
            if ($reporter) {
                $this->createNotificationForUsers(
                    $reporterOnly,
                    $ticket,
                    'user',
                    'created',
                    'Laporan dibuat',
                    'Laporan "' . $ticket->judul_laporan . '" dibuat dan masuk antrean inbox.',
                    $actor,
                    $actorName,
                    false
                );
            }

            $this->createNotificationForUsers(
                $this->adminUsers(),
                $ticket,
                'admin',
                'new_ticket',
                'Tiket baru masuk',
                'Tiket baru masuk: "' . $ticket->judul_laporan . '".',
                $actor,
                $actorName,
                true
            );

            return;
        }

        if ($action === 'taken') {
            $this->createNotificationForUsers(
                $reporterOnly,
                $ticket,
                'user',
                'ticket_taken',
                'Tiket diambil',
                'Tiket "' . $ticket->judul_laporan . '" diambil oleh ' . $actorName . '.',
                $actor,
                $actorName,
                false
            );

            $this->createNotificationForUsers(
                $reporterOnly,
                $ticket,
                'user',
                'entered_review',
                'Masuk Review',
                'Tiket "' . $ticket->judul_laporan . '" masuk tahap review.',
                $actor,
                $actorName,
                true
            );

            return;
        }

        if ($action === 'revision_requested') {
            $message = 'Tiket "' . $ticket->judul_laporan . '" diminta revisi oleh ' . $actorName . '.';
            if ($ticket->revision_reason) {
                $message .= ' Alasan: ' . $ticket->revision_reason;
            }

            $this->createNotificationForUsers(
                $reporterOnly,
                $ticket,
                'user',
                'revision_requested',
                'Revisi diminta',
                $message,
                $actor,
                $actorName,
                false
            );

            $this->createNotificationForUsers(
                $reporterOnly,
                $ticket,
                'user',
                'entered_review',
                'Kembali ke Review',
                'Tiket "' . $ticket->judul_laporan . '" kembali ke tahap review.',
                $actor,
                $actorName,
                false
            );

            return;
        }

        $statusLogs = [
            'review' => ['entered_review', 'Masuk Review', 'masuk tahap review'],
            'to_do' => ['entered_to_do', 'Masuk To Do', 'masuk tahap to do'],
            'in_progress' => ['entered_in_progress', 'Masuk In Progress', 'mulai dikerjakan'],
            'testing' => ['entered_testing', 'Masuk Testing', 'masuk tahap testing'],
            'approved' => ['approved', 'Approved', 'telah approved dan selesai'],
        ];

        if (isset($statusLogs[$ticket->status])) {
            [$logAction, $title, $description] = $statusLogs[$ticket->status];
            $visibleInBell = true;

            if ($action === 'uat_approved') {
                $logAction = 'uat_approved';
                $title = 'Approved oleh user';
                $description = 'di-approve oleh ' . $actorName;
                $visibleInBell = false;
            }

            $this->createNotificationForUsers(
                $reporterOnly,
                $ticket,
                'user',
                $logAction,
                $title,
                'Tiket "' . $ticket->judul_laporan . '" ' . $description . '.',
                $actor,
                $actorName,
                $visibleInBell
            );
        }
    }

    private function createNotificationForUsers($users, Ticket $ticket, string $recipientType, string $action, string $title, string $message, ?User $actor, string $actorName, bool $visibleInBell): void
    {
        $users->filter()->unique('id')->each(function (User $user) use ($ticket, $recipientType, $action, $title, $message, $actor, $actorName, $visibleInBell) {
            LogNotifikasi::create([
                'user_id' => $user->id,
                'ticket_id' => $ticket->id,
                'actor_user_id' => $actor?->id,
                'actor_name' => $actorName,
                'recipient_type' => $recipientType,
                'action' => $action,
                'title' => $title,
                'message' => $message,
                'status' => $ticket->status,
                'visible_in_bell' => $visibleInBell,
            ]);
        });
    }

    private function reporterUser(Ticket $ticket): ?User
    {
        return $ticket->karyawan?->fid
            ? User::where('fid', $ticket->karyawan->fid)->first()
            : null;
    }

    private function adminUsers()
    {
        return User::whereHas('role', function ($query) {
            $query->whereIn('name', ['superadmin', 'admin']);
        })->get();
    }
}
