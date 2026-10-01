<?php

namespace App\Http\Controllers;

use App\Models\LogNotifikasi;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LogNotifikasiController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $notifications = LogNotifikasi::query()
            ->where('user_id', $request->user()->id)
            ->where('visible_in_bell', true)
            ->latest()
            ->limit(30)
            ->get()
            ->map(fn (LogNotifikasi $notification) => $this->formatNotification($notification));

        return response()->json($notifications);
    }

    public function ticketTimeline(Request $request, int $ticketId): JsonResponse
    {
        $ticket = Ticket::with('karyawan')->withTrashed()->findOrFail($ticketId);
        $user = $request->user();
        $user->load('karyawan');

        $logs = LogNotifikasi::query()
            ->where('ticket_id', $ticket->id)
            ->whereIn('action', [
                'created',
                'ticket_taken',
                'entered_review',
                'entered_to_do',
                'entered_in_progress',
                'entered_testing',
                'revision_requested',
                'approved',
                'uat_approved',
                'ticket_rejected',
                'returned_to_inbox',
                'classification_changed',
                'deadline_changed',
                'reporter_changed',
                'system_link_changed',
            ])
            ->orderBy('created_at')
            ->orderBy('id')
            ->get()
            ->unique(fn (LogNotifikasi $log) => $log->action . '|' . $log->id)
            ->values();

        $previous = null;
        $timeline = $logs->map(function (LogNotifikasi $log) use (&$previous) {
            $durationSeconds = $previous
                ? $previous->created_at->diffInSeconds($log->created_at)
                : null;

            $previous = $log;

            return [
                ...$this->formatNotification($log),
                'duration_since_previous_seconds' => $durationSeconds,
                'duration_since_previous_label' => $durationSeconds === null ? null : $this->formatDuration($durationSeconds),
            ];
        });

        return response()->json([
            'timeline' => $timeline,
            'stage_durations' => $this->buildStageDurations($logs, $ticket),
        ]);
    }

    /**
     * Hitung durasi yang dihabiskan tiket di setiap tahapan kerja
     * (review, to_do, in_progress, testing) dari log yang sudah ada.
     * Durasi diakumulasi jika tiket bolak-balik ke tahap yang sama (revisi),
     * dan tahap yang sedang berjalan dihitung live sampai sekarang.
     *
     * @param \Illuminate\Support\Collection<int, LogNotifikasi> $logs
     * @return array<string, array{seconds: int, label: string, ongoing: bool}>
     */
    private function buildStageDurations($logs, Ticket $ticket): array
    {
        $stageActions = [
            'review' => 'entered_review',
            'to_do' => 'entered_to_do',
            'in_progress' => 'entered_in_progress',
            'testing' => 'entered_testing',
        ];
        $closeActions = ['approved', 'uat_approved', 'returned_to_inbox'];

        $durations = [];
        $lastStage = null;
        $lastStageTime = null;

        foreach ($logs as $log) {
            $stage = array_search($log->action, $stageActions, true);

            if ($stage !== false) {
                if ($lastStage !== null && $lastStageTime !== null) {
                    $durations[$lastStage]['seconds'] += $lastStageTime->diffInSeconds($log->created_at);
                }

                $lastStage = $stage;
                $lastStageTime = $log->created_at;

                if (!isset($durations[$stage])) {
                    $durations[$stage] = ['seconds' => 0, 'ongoing' => false];
                }

                continue;
            }

            if (in_array($log->action, $closeActions, true) && $lastStage !== null && $lastStageTime !== null) {
                $durations[$lastStage]['seconds'] += $lastStageTime->diffInSeconds($log->created_at);
                $lastStage = null;
                $lastStageTime = null;
            }

            if ($log->action === 'returned_to_inbox') {
                $durations = [];
            }
        }

        if ($lastStage !== null && $lastStageTime !== null && $ticket->status === $lastStage) {
            $durations[$lastStage]['seconds'] += $lastStageTime->diffInSeconds(now());
            $durations[$lastStage]['ongoing'] = true;
        }

        foreach ($durations as $stage => &$duration) {
            $duration['label'] = $this->formatDuration($duration['seconds']);
        }
        unset($duration);

        return $durations;
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $query = LogNotifikasi::query()
            ->where('user_id', $request->user()->id)
            ->where('visible_in_bell', true)
            ->whereNull('read_at');

        if ($request->filled('ids')) {
            $query->whereIn('id', (array) $request->input('ids'));
        }

        $query->update(['read_at' => now()]);

        return response()->json(['message' => 'Notifikasi ditandai sudah dibaca.']);
    }

    private function formatNotification(LogNotifikasi $notification): array
    {
        return [
            'id' => $notification->id,
            'ticket_id' => $notification->ticket_id,
            'actor_user_id' => $notification->actor_user_id,
            'actor_name' => $notification->actor_name,
            'recipient_type' => $notification->recipient_type,
            'action' => $notification->action,
            'title' => $notification->title,
            'message' => $notification->message,
            'status' => $notification->status,
            'visible_in_bell' => $notification->visible_in_bell,
            'read' => $notification->read_at !== null,
            'read_at' => $notification->read_at,
            'created_at' => $notification->created_at,
        ];
    }

    private function formatDuration(int $seconds): string
    {
        if ($seconds < 60) {
            return $seconds . ' detik';
        }

        $minutes = intdiv($seconds, 60);
        if ($minutes < 60) {
            return $minutes . ' menit';
        }

        $hours = intdiv($minutes, 60);
        if ($hours < 24) {
            $remainingMinutes = $minutes % 60;
            return trim($hours . ' jam ' . ($remainingMinutes ? $remainingMinutes . ' menit' : ''));
        }

        $days = intdiv($hours, 24);
        $remainingHours = $hours % 24;
        return trim($days . ' hari ' . ($remainingHours ? $remainingHours . ' jam' : ''));
    }
}
