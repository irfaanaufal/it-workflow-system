<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTicketRequest;
use App\Http\Requests\UpdateTicketClassificationRequest;
use App\Http\Requests\UpdateTicketDeadlineRequest;
use App\Http\Requests\UpdateTicketReporterRequest;
use App\Http\Requests\UpdateTicketRequest;
use App\Http\Requests\UpdateTicketSystemLinkRequest;
use App\Models\Karyawan;
use App\Models\LogNotifikasi;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Throwable;

class TicketController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Ticket::with(['karyawan', 'adminIt', 'adminIt.user', 'systemPtsam'])
            ->orderBy('updated_at', 'desc');

        if (!$user->isIT('it-workflow') && !$user->canManageMaster()) {
            $karyawan = $user->karyawan;
            if (!$karyawan) {
                return response()->json([]);
            }
            $query->where('karyawan_id', $karyawan->id);
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $cleanSearch = str_replace(['%', '_', '\\'], '', $search);
            $query->where('judul_laporan', 'like', "%{$cleanSearch}%");
        }

        $limit = min((int) $request->input('limit', 200), 500);
        $tickets = $query->limit($limit)->get();

        $tickets->each(function ($ticket) {
            $ticket->append(['attachment_url', 'attachment_name']);
        });

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

        $ticket->append(['attachment_url', 'attachment_name']);

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
        $canEdit = $user->isIT('it-workflow') || ($isOwner && $ticket->status === 'inbox');

        if (!$canEdit) {
            return response()->json(['message' => 'Anda tidak memiliki izin untuk mengedit tiket ini.'], 403);
        }

        if (!$user->isIT('it-workflow') && $ticket->status !== 'inbox') {
            return response()->json(['message' => 'Tiket hanya dapat diedit selama masih dalam antrean (Inbox).'], 400);
        }

        $validated = $request->validated();
        if ($validated['kategori_laporan'] === 'new system') {
            $validated['system_ptsam_id'] = null;
        }

        if ($request->hasFile('attachment')) {
            $validated['attachment_path'] = $request->file('attachment')->store('attachments', 'public');
        }

        $oldAttachment = $ticket->attachment_path;
        unset($validated['attachment']);
        $ticket->fill($validated);
        $ticket->save();

        // Delete old attachment AFTER successful save
        if ($oldAttachment && !empty($validated['attachment_path']) && \Storage::disk('public')->exists($oldAttachment)) {
            \Storage::disk('public')->delete($oldAttachment);
        }

        $ticket->load(['karyawan', 'systemPtsam']);
        $ticket->append(['attachment_url', 'attachment_name']);

        return response()->json(['message' => 'Tiket berhasil diperbarui.', 'ticket' => $ticket]);
    }

    public function getInbox(): JsonResponse
    {
        $tickets = Ticket::with(['karyawan', 'systemPtsam'])
            ->where('status', 'inbox')
            ->orderBy('created_at', 'desc')
            ->limit(200)
            ->get()
            ->each(function ($ticket) {
                $ticket->append(['attachment_url', 'attachment_name']);
            });

        return response()->json($tickets);
    }

    public function takeTicket(Request $request, $id): JsonResponse
    {
        abort_unless(auth()->user()->isIT('it-workflow'), 403, 'Hanya tim IT yang dapat mengambil tiket.');

        $user = auth()->user();
        $karyawan = $user->karyawan;

        if (!$karyawan) {
            return response()->json([
                'message' => 'Your user account is not associated with any Karyawan record.'
            ], 403);
        }

        $updateData = [
            'status' => 'review',
            'admin_it_id' => $karyawan->id,
        ];

        if ($request->filled('deadline')) {
            $request->validate([
                'deadline' => ['date', 'date_format:Y-m-d', 'after_or_equal:today'],
            ], [
                'deadline.after_or_equal' => 'Target penyelesaian tidak boleh sebelum hari ini.',
            ]);
            $updateData['deadline'] = $request->input('deadline');
        }

        $updated = Ticket::where('id', $id)
            ->where('status', 'inbox')
            ->whereNull('admin_it_id')
            ->update($updateData);

        if (!$updated) {
            return response()->json([
                'message' => 'Tiket sudah diproses oleh IT lain.'
            ], 400);
        }

        $ticket = Ticket::with(['karyawan', 'adminIt'])->findOrFail($id);

        $this->broadcastTicketUpdate($ticket, 'taken');

        return response()->json([
            'message' => 'Ticket taken successfully.',
            'ticket' => $ticket
        ]);
    }

    public function returnToInbox($id): JsonResponse
    {
        abort_unless(auth()->user()->isIT('it-workflow'), 403, 'Hanya tim IT yang dapat mengembalikan tiket.');

        $ticket = Ticket::findOrFail($id);

        if ($ticket->status !== 'review') {
            return response()->json([
                'message' => 'Hanya tiket berstatus review yang dapat dikembalikan ke inbox.'
            ], 400);
        }

        $ticket->update([
            'status' => 'inbox',
            'admin_it_id' => null,
        ]);

        $this->broadcastTicketUpdate($ticket, 'returned_to_inbox');

        return response()->json([
            'message' => 'Tiket berhasil dikembalikan ke inbox.',
            'ticket' => $ticket
        ]);
    }

    public function rejectTicket(Request $request, $id): JsonResponse
    {
        abort_unless(auth()->user()->isIT('it-workflow'), 403, 'Hanya tim IT yang dapat menolak tiket.');

        $request->validate([
            'reject_reason' => ['required', 'string', 'max:500'],
        ]);

        $ticket = Ticket::findOrFail($id);

        if ($ticket->status !== 'inbox') {
            return response()->json([
                'message' => 'Tiket sudah diproses dan tidak bisa ditolak.'
            ], 400);
        }

        DB::transaction(function () use ($ticket, $request) {
            $ticket->status = 'rejected';
            $ticket->reject_reason = $request->reject_reason;
            $ticket->save();
            $ticket->delete();
        });

        if ($ticket->attachment_path) {
            try {
                if (\Storage::disk('public')->exists($ticket->attachment_path)) {
                    \Storage::disk('public')->delete($ticket->attachment_path);
                }
            } catch (\Exception $e) {
                \Log::warning('Gagal menghapus lampiran tiket: ' . $e->getMessage(), [
                    'ticket_id' => $ticket->id,
                    'path' => $ticket->attachment_path,
                ]);
            }
        }

        $this->broadcastTicketUpdate($ticket, 'rejected');

        return response()->json([
            'message' => 'Tiket berhasil ditolak.',
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

        if (!$user->isIT('it-workflow')) {
            return response()->json([
                'message' => 'Anda tidak memiliki hak akses untuk merubah status laporan ini.'
            ], 403);
        }

        $allowedTransitions = [
            'review'      => ['to_do'],
            'to_do'       => ['in_progress', 'review'],
            'in_progress' => ['testing', 'to_do'],
            'testing'     => [],
        ];

        $currentStatus = $ticket->status;
        $newStatus = $request->input('status');

        if (!isset($allowedTransitions[$currentStatus]) || !in_array($newStatus, $allowedTransitions[$currentStatus])) {
            return response()->json([
                'message' => "Transisi dari '{$currentStatus}' ke '{$newStatus}' tidak diizinkan."
            ], 422);
        }

        $ticket->status = $newStatus;
        $ticket->save();

        $this->broadcastTicketUpdate($ticket, 'status_changed');

        return response()->json([
            'message' => 'Ticket status updated successfully.',
            'ticket' => $ticket
        ]);
    }

    public function updateClassification(UpdateTicketClassificationRequest $request, $id): JsonResponse
    {
        if (!$request->user()->isIT('it-workflow')) {
            return response()->json([
                'message' => 'Anda tidak memiliki hak akses untuk mengubah klasifikasi laporan.'
            ], 403);
        }

        $ticket = Ticket::findOrFail($id);

        if ($ticket->status === 'approved') {
            return response()->json([
                'message' => 'Tiket sudah selesai (approved) dan tidak dapat diubah klasifikasinya.'
            ], 400);
        }

        $oldCategory = $ticket->kategori_laporan;
        $oldUrgency = $ticket->urgensi_laporan;
        $oldSystemName = $ticket->systemPtsam?->nama_sistem;

        $validated = $request->validated();
        $ticket->kategori_laporan = $validated['kategori_laporan'];
        $ticket->urgensi_laporan = $validated['urgensi_laporan'];
        $ticket->system_ptsam_id = $validated['kategori_laporan'] === 'new system'
            ? null
            : ($validated['system_ptsam_id'] ?? null);
        $ticket->save();

        $ticket->load(['karyawan', 'systemPtsam']);
        $ticket->append(['attachment_url', 'attachment_name']);

        $this->storeClassificationLog($ticket, $oldCategory, $oldUrgency, $oldSystemName);

        return response()->json([
            'message' => 'Klasifikasi tiket berhasil diperbarui.',
            'ticket' => $ticket,
        ]);
    }

    public function updateDeadline(UpdateTicketDeadlineRequest $request, $id): JsonResponse
    {
        if (!$request->user()->isIT('it-workflow')) {
            return response()->json([
                'message' => 'Anda tidak memiliki hak akses untuk mengubah target penyelesaian laporan.'
            ], 403);
        }

        $ticket = Ticket::findOrFail($id);

        if ($ticket->status === 'approved') {
            return response()->json([
                'message' => 'Tiket sudah selesai (approved) dan tidak dapat diubah target penyelesaiannya.'
            ], 400);
        }

        $oldDeadline = $ticket->deadline?->format('Y-m-d');
        $ticket->deadline = $request->input('deadline') ?: null;
        $ticket->save();

        $ticket->load(['karyawan', 'systemPtsam']);
        $ticket->append(['attachment_url', 'attachment_name']);

        $this->storeDeadlineLog($ticket, $oldDeadline);

        return response()->json([
            'message' => 'Target penyelesaian tiket berhasil diperbarui.',
            'ticket' => $ticket,
        ]);
    }

    public function reporterCandidates(): JsonResponse
    {
        $candidates = Karyawan::query()
            ->whereHas('user')
            ->where('status', 'Active')
            ->orderBy('nama_karyawan')
            ->get(['id', 'fid', 'nama_karyawan', 'divisi']);

        return response()->json($candidates);
    }

    public function updateReporter(UpdateTicketReporterRequest $request, $id): JsonResponse
    {
        abort_unless($request->user()->isIT('it-workflow'), 403);
        $ticket = Ticket::findOrFail($id);

        if ($ticket->status !== 'testing') {
            return response()->json([
                'message' => 'Pelapor hanya dapat diubah saat tiket berada di tahap testing (Ready for Testing).'
            ], 400);
        }

        $karyawan = Karyawan::where('id', $request->validated()['karyawan_id'])->first();

        if (!$karyawan || !$karyawan->user) {
            return response()->json([
                'message' => 'Karyawan yang dipilih tidak memiliki akun pengguna.'
            ], 422);
        }

        $oldReporterName = $ticket->karyawan?->nama_karyawan;

        $ticket->karyawan_id = $karyawan->id;
        $ticket->save();

        $ticket->load(['karyawan', 'systemPtsam']);
        $ticket->append(['attachment_url', 'attachment_name']);

        $this->storeReporterLog($ticket, $oldReporterName);

        return response()->json([
            'message' => 'Pelapor tiket berhasil diubah.',
            'ticket' => $ticket,
        ]);
    }

    public function updateSystemLink(UpdateTicketSystemLinkRequest $request, $id): JsonResponse
    {
        abort_unless($request->user()->isIT('it-workflow'), 403);
        $ticket = Ticket::findOrFail($id);

        if ($ticket->kategori_laporan !== 'new system') {
            return response()->json([
                'message' => 'Link sistem hanya dapat ditambahkan untuk tiket dengan kategori New System.'
            ], 422);
        }

        if ($ticket->status === 'approved') {
            return response()->json([
                'message' => 'Tiket sudah selesai (approved) dan tidak dapat diubah link sistemnya.'
            ], 400);
        }

        $oldLink = $ticket->link_sistem;
        $ticket->link_sistem = $request->input('link_sistem') ?: null;
        $ticket->save();

        $ticket->load(['karyawan', 'systemPtsam']);
        $ticket->append(['attachment_url', 'attachment_name']);

        $this->storeSystemLinkLog($ticket, $oldLink);

        return response()->json([
            'message' => 'Link sistem tiket berhasil diperbarui.',
            'ticket' => $ticket,
        ]);
    }

    public function myTickets(Request $request): JsonResponse
    {
        $karyawan = $request->user()->karyawan;

        if (!$karyawan) {
            return response()->json(['message' => 'Akun Anda tidak terkait dengan data karyawan.'], 404);
        }

        $tickets = Ticket::with(['karyawan', 'adminIt', 'adminIt.user', 'systemPtsam'])
            ->where('karyawan_id', $karyawan->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($ticket) {
                if ($ticket->adminIt && $ticket->adminIt->user) {
                    $ticket->adminIt->user->avatar_url = $ticket->adminIt->user->avatar_path
                        ? asset('storage/' . $ticket->adminIt->user->avatar_path)
                        : null;
                }
                $ticket->append(['attachment_url', 'attachment_name']);
                return $ticket;
            });

        return response()->json($tickets);
    }

    public function softDelete(Request $request, $id): JsonResponse
    {
        $user = $request->user();
        $karyawan = $user->karyawan;

        $query = Ticket::where('id', $id);
        if ($user->isIT('it-workflow')) {
            // IT can delete any ticket
        } else {
            if (!$karyawan) {
                return response()->json(['message' => 'Anda tidak memiliki izin untuk menghapus tiket ini.'], 403);
            }
            $query->where('karyawan_id', $karyawan->id)
                  ->where('status', 'inbox')
                  ->whereNull('admin_it_id');
        }

        $deleted = $query->delete();
        if (!$deleted) {
            return response()->json(['message' => 'Tiket tidak dapat dihapus. Pastikan Anda adalah pemilik tiket dan tiket masih dalam antrean.'], 400);
        }

        return response()->json(['message' => 'Tiket berhasil dihapus.']);
    }

    public function show(Request $request, $id): JsonResponse
    {
        $ticket = Ticket::with(['karyawan', 'adminIt', 'adminIt.user', 'checklists', 'systemPtsam'])
            ->findOrFail($id);

        $user = $request->user();
        $karyawan = $user->karyawan;

        // Aturan yang sama dengan index(): hanya IT/master-data atau
        // pemilik tiket yang boleh melihat detail.
        $isOwner = $karyawan && $ticket->karyawan_id === $karyawan->id;
        if (!$user->isIT('it-workflow') && !$user->canManageMaster('it-workflow') && !$isOwner) {
            return response()->json(['message' => 'Anda tidak memiliki izin untuk melihat tiket ini.'], 403);
        }

        if ($ticket->adminIt && $ticket->adminIt->user) {
            $ticket->adminIt->user->avatar_url = $ticket->adminIt->user->avatar_path
                ? asset('storage/' . $ticket->adminIt->user->avatar_path)
                : null;
        }

        $ticket->append(['attachment_url', 'attachment_name']);

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

        if ($action === 'rejected') {
            $message = 'Tiket "' . $ticket->judul_laporan . '" ditolak oleh ' . $actorName . '.';
            if ($ticket->reject_reason) {
                $message .= ' Alasan: ' . $ticket->reject_reason;
            }

            $this->createNotificationForUsers(
                $reporterOnly,
                $ticket,
                'user',
                'ticket_rejected',
                'Tiket ditolak',
                $message,
                $actor,
                $actorName,
                true
            );

            return;
        }

        if ($action === 'returned_to_inbox') {
            $this->createNotificationForUsers(
                $reporterOnly,
                $ticket,
                'user',
                'returned_to_inbox',
                'Tiket dikembalikan ke inbox',
                'Tiket "' . $ticket->judul_laporan . '" dikembalikan ke inbox oleh ' . $actorName . '.',
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

    private function storeClassificationLog(Ticket $ticket, string $oldCategory, string $oldUrgency, ?string $oldSystemName): void
    {
        $actor = auth()->user();
        $actorName = $actor?->name ?? 'System';
        $reporter = $this->reporterUser($ticket);

        $changes = [];
        if ($oldCategory !== $ticket->kategori_laporan) {
            $changes[] = 'Kategori: ' . ($oldCategory ?: '-') . ' → ' . $ticket->kategori_laporan;
        }
        if ($oldUrgency !== $ticket->urgensi_laporan) {
            $changes[] = 'Urgensi: ' . ($oldUrgency ?: '-') . ' → ' . $ticket->urgensi_laporan;
        }
        if ($oldSystemName !== $ticket->systemPtsam?->nama_sistem) {
            $changes[] = 'Sistem: ' . ($oldSystemName ?: '-') . ' → ' . ($ticket->systemPtsam?->nama_sistem ?: '-');
        }

        if (empty($changes)) {
            return;
        }

        $message = 'Tiket "' . $ticket->judul_laporan . '" klasifikasinya diubah oleh ' . $actorName . ': ' . implode(', ', $changes) . '.';

        if ($reporter) {
            $this->createNotificationForUsers(
                collect([$reporter]),
                $ticket,
                'user',
                'classification_changed',
                'Klasifikasi diubah',
                $message,
                $actor,
                $actorName,
                true
            );
        }
    }

    private function storeDeadlineLog(Ticket $ticket, ?string $oldDeadline): void
    {
        $actor = auth()->user();
        $actorName = $actor?->name ?? 'System';
        $reporter = $this->reporterUser($ticket);

        $newDeadline = $ticket->deadline?->format('Y-m-d');

        if ($oldDeadline === $newDeadline) {
            return;
        }

        if ($newDeadline) {
            $message = 'Target penyelesaian tiket "' . $ticket->judul_laporan . '" ditetapkan oleh ' . $actorName . ': ' . $newDeadline . '.';
            if ($oldDeadline) {
                $message = 'Target penyelesaian tiket "' . $ticket->judul_laporan . '" diubah oleh ' . $actorName . ': ' . $oldDeadline . ' → ' . $newDeadline . '.';
            }
        } else {
            $message = 'Target penyelesaian tiket "' . $ticket->judul_laporan . '" dihapus oleh ' . $actorName . '.';
        }

        if ($reporter) {
            $this->createNotificationForUsers(
                collect([$reporter]),
                $ticket,
                'user',
                'deadline_changed',
                'Target penyelesaian diubah',
                $message,
                $actor,
                $actorName,
                true
            );
        }
    }

    private function storeReporterLog(Ticket $ticket, ?string $oldReporterName): void
    {
        $actor = auth()->user();
        $actorName = $actor?->name ?? 'System';
        $newReporter = $this->reporterUser($ticket);

        $message = 'Pelapor tiket "' . $ticket->judul_laporan . '" diubah oleh ' . $actorName
            . ' dari ' . ($oldReporterName ?: '-')
            . ' menjadi ' . ($ticket->karyawan?->nama_karyawan ?: '-') . '.';

        if ($newReporter) {
            $this->createNotificationForUsers(
                collect([$newReporter]),
                $ticket,
                'user',
                'reporter_changed',
                'Pelapor diubah',
                $message,
                $actor,
                $actorName,
                true
            );
        }
    }

    private function storeSystemLinkLog(Ticket $ticket, ?string $oldLink): void
    {
        $actor = auth()->user();
        $actorName = $actor?->name ?? 'System';
        $reporter = $this->reporterUser($ticket);

        $newLink = $ticket->link_sistem;

        if ($oldLink === $newLink) {
            return;
        }

        if ($newLink) {
            $message = 'Link sistem tiket "' . $ticket->judul_laporan . '" ditambahkan oleh ' . $actorName . ': ' . $newLink . '.';
            if ($oldLink) {
                $message = 'Link sistem tiket "' . $ticket->judul_laporan . '" diubah oleh ' . $actorName . ': ' . $oldLink . ' → ' . $newLink . '.';
            }
        } else {
            $message = 'Link sistem tiket "' . $ticket->judul_laporan . '" dihapus oleh ' . $actorName . '.';
        }

        if ($reporter) {
            $this->createNotificationForUsers(
                collect([$reporter]),
                $ticket,
                'user',
                'system_link_changed',
                'Link sistem diubah',
                $message,
                $actor,
                $actorName,
                true
            );
        }
    }

    private function adminUsers()
    {
        return User::whereHas('role', function ($query) {
            $query->where('level', 1);
        })->get();
    }
}
