<?php

namespace App\Http\Controllers;

use App\Models\SystemPtsam;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SystemPtsamController extends Controller
{
    /**
     * Display a listing of systems for Super Admin management page.
     */
    public function index(): Response
    {
        $systems = SystemPtsam::orderBy('nama_sistem', 'asc')->get();
        return Inertia::render('Admin/Systems', [
            'systems' => $systems
        ]);
    }

    /**
     * Store a newly created system in database.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nama_sistem' => ['required', 'string', 'max:255', 'unique:system_ptsam,nama_sistem'],
            'link_sistem' => ['nullable', 'url', 'max:1000'],
        ], [
            'nama_sistem.required' => 'Nama sistem wajib diisi.',
            'nama_sistem.unique' => 'Nama sistem sudah terdaftar.',
            'link_sistem.url' => 'Format link sistem tidak valid. Pastikan diawali http:// atau https://.',
        ]);

        SystemPtsam::create($validated);

        return redirect()->back()->with('success', 'Sistem berhasil ditambahkan.');
    }

    /**
     * Update the specified system in database.
     */
    public function update(Request $request, $id): RedirectResponse
    {
        $system = SystemPtsam::findOrFail($id);

        $validated = $request->validate([
            'nama_sistem' => ['required', 'string', 'max:255', 'unique:system_ptsam,nama_sistem,' . $id],
            'link_sistem' => ['nullable', 'url', 'max:1000'],
        ], [
            'nama_sistem.required' => 'Nama sistem wajib diisi.',
            'nama_sistem.unique' => 'Nama sistem sudah terdaftar.',
            'link_sistem.url' => 'Format link sistem tidak valid. Pastikan diawali http:// atau https://.',
        ]);

        $system->update($validated);

        return redirect()->back()->with('success', 'Sistem berhasil diperbarui.');
    }

    /**
     * Remove the specified system from database.
     */
    public function destroy($id): RedirectResponse
    {
        $system = SystemPtsam::findOrFail($id);

        // Check if the system is referenced by any tickets
        if ($system->tickets()->exists()) {
            return redirect()->back()->withErrors([
                'message' => 'Sistem tidak dapat dihapus karena masih digunakan dalam beberapa tiket laporan.'
            ]);
        }

        $system->delete();

        return redirect()->back()->with('success', 'Sistem berhasil dihapus.');
    }

    /**
     * Return all systems as a JSON list for dropdown selection in ticket forms.
     */
    public function apiIndex(): JsonResponse
    {
        $systems = SystemPtsam::orderBy('nama_sistem', 'asc')->get();
        return response()->json($systems);
    }
}
