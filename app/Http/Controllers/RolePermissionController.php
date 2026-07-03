<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\Role;
use App\Models\User;
use App\Models\UserApplication;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RolePermissionController extends Controller
{
    public function index(): Response
    {
        $roles = Role::all();
        $users = User::with(['role', 'karyawan'])->get();

        return Inertia::render('Admin/RolesPermissions', [
            'roles' => $roles,
            'users' => $users,
        ]);
    }

    public function updateUserRole(Request $request, $id): RedirectResponse
    {
        $validated = $request->validate([
            'role_id' => ['required', 'exists:roles,id'],
        ]);

        $user = User::findOrFail($id);
        $user->update([
            'role_id' => $validated['role_id'],
        ]);

        return redirect()->back()->with('success', 'Peran pengguna berhasil diperbarui.');
    }

    public function briefingRoles(): Response
    {
        $roles = Role::all();
        $app = Application::where('slug', 'absensi-meeting')->first();

        $userApps = UserApplication::with(['user.role', 'user.karyawan', 'role'])
            ->where('application_id', $app?->id)
            ->where('is_active', true)
            ->get();

        return Inertia::render('Admin/RolesBriefing', [
            'roles' => $roles,
            'userApps' => $userApps,
        ]);
    }

    public function updateBriefingRole(Request $request, $id): RedirectResponse
    {
        $validated = $request->validate([
            'role_id' => ['nullable', 'exists:roles,id'],
        ]);

        $userApp = UserApplication::findOrFail($id);
        $userApp->update([
            'role_id' => $validated['role_id'],
        ]);

        return redirect()->back()->with('success', 'Peran pengguna untuk sistem Briefing/Meeting berhasil diperbarui.');
    }
}
