<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\TicketChecklist;
use Illuminate\Http\JsonResponse;

class ChecklistController extends Controller
{
    /**
     * Store a newly created checklist item for a ticket.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'ticket_id' => ['required', 'exists:tickets,id'],
            'task_name' => ['required', 'string', 'max:255'],
        ]);

        $checklist = TicketChecklist::create([
            'ticket_id' => $request->input('ticket_id'),
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
        $checklist = TicketChecklist::findOrFail($id);
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
        $checklist = TicketChecklist::findOrFail($id);
        $checklist->is_completed = !$checklist->is_completed;
        $checklist->save();

        return response()->json([
            'message' => 'Checklist completion toggled successfully.',
            'checklist' => $checklist
        ]);
    }
}
