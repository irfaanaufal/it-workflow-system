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
        $ticket = Ticket::with('karyawan')->findOrFail($ticketId);
        $user = $request->user();
        $user->load('karyawan');

        $isAdmin = $user->isAdmin();
        $isOwner = $user->karyawan && $ticket->karyawan_id === $user->karyawan->id;

        if (!$isAdmin && !$isOwner) {
            abort(403, 'Anda tidak memiliki izin untuk melihat timeline tiket ini.');
        }

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
            ])
            ->orderBy('created_at')
            ->orderBy('id')
            ->get()
            ->unique(fn (LogNotifikasi $log) => $log->action . '|' . $log->created_at?->timestamp)
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

        return response()->json($timeline);
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
