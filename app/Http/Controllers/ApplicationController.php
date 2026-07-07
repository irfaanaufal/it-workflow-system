<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\User;
use App\Models\UserApplication;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ApplicationController extends Controller
{
    public function requests(): Response
    {
        $currentUser = auth()->user();

        if (!$currentUser->isAdmin()) {
            abort(403, 'Unauthorized action.');
        }

        $allRequests = UserApplication::with(['user.karyawan', 'application', 'approver'])
            ->latest()
            ->get();

        return Inertia::render('Applications/Requests', [
            'allRequests' => $allRequests,
        ]);
    }

    public function manage(): Response
    {
        $currentUser = auth()->user();

        if (!$currentUser->isAdmin()) {
            abort(403, 'Unauthorized action.');
        }

        $applications = Application::orderBy('name', 'asc')->get();

        return Inertia::render('Applications/Manage', [
            'applications' => $applications,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $currentUser = auth()->user();

        if (!$currentUser->isAdmin()) {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:applications,slug'],
            'description' => ['nullable', 'string', 'max:1000'],
        ], [
            'name.required' => 'Nama aplikasi wajib diisi.',
            'slug.required' => 'Slug wajib diisi.',
            'slug.unique' => 'Slug sudah terdaftar.',
        ]);

        Application::create($validated);

        return redirect()->back()->with('success', 'Aplikasi berhasil ditambahkan.');
    }

    public function update(Request $request, $id): RedirectResponse
    {
        $currentUser = auth()->user();

        if (!$currentUser->isAdmin()) {
            abort(403, 'Unauthorized action.');
        }

        $app = Application::findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['required', 'string', 'max:255', 'unique:applications,slug,' . $id],
            'description' => ['nullable', 'string', 'max:1000'],
        ], [
            'name.required' => 'Nama aplikasi wajib diisi.',
            'slug.required' => 'Slug wajib diisi.',
            'slug.unique' => 'Slug sudah terdaftar.',
        ]);

        $app->update($validated);

        return redirect()->back()->with('success', 'Aplikasi berhasil diperbarui.');
    }

    public function destroy($id): RedirectResponse
    {
        $currentUser = auth()->user();

        if (!$currentUser->isAdmin()) {
            abort(403, 'Unauthorized action.');
        }

        $app = Application::findOrFail($id);

        $app->userApplications()->delete();
        $app->delete();

        return redirect()->back()->with('success', 'Aplikasi berhasil dihapus.');
    }

    public function toggleAccess(Request $request): RedirectResponse
    {
        $currentUser = auth()->user();

        if (!$currentUser->isAdmin()) {
            abort(403, 'Unauthorized action.');
        }

        $validated = $request->validate([
            'user_application_id' => ['required', 'exists:user_applications,id'],
            'is_active' => ['required', 'boolean'],
        ]);

        $userApp = UserApplication::findOrFail($validated['user_application_id']);

        if ($validated['is_active']) {
            $userApp->update([
                'is_active' => true,
                'approved_by' => $currentUser->id,
                'approved_at' => now(),
            ]);
            $message = 'Akses aplikasi berhasil disetujui.';
        } else {
            $userApp->update([
                'is_active' => false,
                'approved_by' => null,
                'approved_at' => null,
            ]);
            $message = 'Akses aplikasi berhasil dinonaktifkan.';
        }

        return redirect()->back()->with('success', $message);
    }
}
