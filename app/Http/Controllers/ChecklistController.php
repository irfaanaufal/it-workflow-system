<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\Ticket;
use App\Models\TicketChecklist;
use Illuminate\Http\JsonResponse;

class ChecklistController extends Controller
{
    /**
     * Store a newly created checklist item for a ticket.
     */
    public function store(Request $request): JsonResponse
    {
        abort_unless(auth()->user()->isIT('it-workflow'), 403, 'Hanya tim IT yang dapat mengelola checklist.');

        $request->validate([
            'ticket_id' => ['required', 'exists:tickets,id'],
            'task_name' => ['required', 'string', 'max:255'],
        ]);

        $ticket = Ticket::findOrFail($request->input('ticket_id'));

        $checklist = TicketChecklist::create([
            'ticket_id' => $ticket->id,
            'task_name' => $request->input('task_name'),
            'is_approved' => false,
            'is_completed' => false,
        ]);

        return response()->json([
            'message' => 'Checklist item created successfully.',
            'checklist' => $checklist
        ], 201);
    }

    /**
     * Toggle the approved status of a checklist item.
     */
    public function toggleApprove($id): JsonResponse
    {
        abort_unless(auth()->user()->isIT('it-workflow'), 403, 'Hanya tim IT yang dapat mengelola checklist.');

        $checklist = TicketChecklist::with('ticket')->findOrFail($id);

        if (!$checklist->ticket) {
            abort(404, 'Tiket terkait tidak ditemukan.');
        }

        $checklist->is_approved = !$checklist->is_approved;
        $checklist->save();

        return response()->json([
            'message' => 'Checklist approval toggled successfully.',
            'checklist' => $checklist
        ]);
    }

    /**
     * Toggle the completed status of a checklist item.
     */
    public function toggleComplete($id): JsonResponse
    {
        abort_unless(auth()->user()->isIT('it-workflow'), 403, 'Hanya tim IT yang dapat mengelola checklist.');

        $checklist = TicketChecklist::with('ticket')->findOrFail($id);

        if (!$checklist->ticket) {
            abort(404, 'Tiket terkait tidak ditemukan.');
        }

        $checklist->is_completed = !$checklist->is_completed;
        $checklist->save();

        return response()->json([
            'message' => 'Checklist completion toggled successfully.',
            'checklist' => $checklist
        ]);
    }
}
