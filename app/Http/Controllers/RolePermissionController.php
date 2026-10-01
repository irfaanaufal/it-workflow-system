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
        $currentUser = $request->user();

        if ($user->id === $currentUser->id) {
            return redirect()->back()->withErrors(['message' => 'Anda tidak dapat mengubah peran Anda sendiri.']);
        }

        $newRole = Role::find($validated['role_id']);
        if ($currentUser->level() === null) {
            return redirect()->back()->withErrors(['message' => 'Anda tidak memiliki role untuk mengubah peran pengguna lain.']);
        }
        if ($newRole && $newRole->level < $currentUser->level()) {
            return redirect()->back()->withErrors(['message' => 'Tidak dapat menetapkan peran dengan level lebih tinggi.']);
        }
        if ($user->level() !== null && $currentUser->level() > $user->level()) {
            return redirect()->back()->withErrors(['message' => 'Tidak dapat mengubah peran pengguna dengan level lebih tinggi dari Anda.']);
        }

        $user->role_id = $validated['role_id'];
        $user->save();

        return redirect()->back()->with('success', 'Peran pengguna berhasil diperbarui.');
    }

    public function briefingRoles(): Response
    {
        $roles = Role::all();
        $app = Application::where('name', 'Meeting Attendance')->first();

        $userApps = UserApplication::with(['user.role', 'user.karyawan', 'role'])
            ->where('application_id', $app?->id)
            ->where('is_active', true)
            ->get();

        return Inertia::render('Admin/RolesSystemAccess', [
            'roles' => $roles,
            'userApps' => $userApps,
            'title' => 'Peran Pengguna Briefing/Meeting',
            'subtitle' => 'Pengaturan peran pengguna khusus untuk sistem Briefing/Meeting',
            'routeName' => 'admin.users.update-briefing-role',
            'systemLabel' => 'Briefing/Meeting',
            'showGlobalRole' => true,
        ]);
    }

    public function updateBriefingRole(Request $request, $id): RedirectResponse
    {
        $validated = $request->validate([
            'role_id' => ['nullable', 'exists:roles,id'],
        ]);

        $userApp = UserApplication::findOrFail($id);
        $currentUser = $request->user();

        if ($currentUser->level() === null) {
            return redirect()->back()->withErrors(['message' => 'Anda tidak memiliki role untuk mengubah peran pengguna lain.']);
        }

        $targetUser = $userApp->user;
        if ($targetUser && $targetUser->level() !== null && $currentUser->level() > $targetUser->level()) {
            return redirect()->back()->withErrors(['message' => 'Tidak dapat mengubah peran pengguna dengan level lebih tinggi dari Anda.']);
        }

        $userApp->update([
            'role_id' => $validated['role_id'],
        ]);

        return redirect()->back()->with('success', 'Peran pengguna untuk sistem Briefing/Meeting berhasil diperbarui.');
    }

    public function reminderRoles(): Response
    {
        $roles = Role::all();
        $app = Application::where('slug', 'reminder')->first();

        $userApps = UserApplication::with(['user.role', 'user.karyawan', 'role'])
            ->where('application_id', $app?->id)
            ->where('is_active', true)
            ->get();

        return Inertia::render('Admin/RolesSystemAccess', [
            'roles' => $roles,
            'userApps' => $userApps,
            'title' => 'Peran Pengguna - Reminder',
            'subtitle' => 'Pengaturan pengingat otomatis peran',
            'routeName' => 'admin.users.update-reminder-role',
            'systemLabel' => 'Reminder',
            'showGlobalRole' => false,
        ]);
    }

    public function updateReminderRole(Request $request, $id): RedirectResponse
    {
        $validated = $request->validate([
            'role_id' => ['nullable', 'exists:roles,id'],
        ]);

        $userApp = UserApplication::findOrFail($id);
        $currentUser = $request->user();

        if ($currentUser->level() === null) {
            return redirect()->back()->withErrors(['message' => 'Anda tidak memiliki role untuk mengubah peran pengguna lain.']);
        }

        $targetUser = $userApp->user;
        if ($targetUser && $targetUser->level() !== null && $currentUser->level() > $targetUser->level()) {
            return redirect()->back()->withErrors(['message' => 'Tidak dapat mengubah peran pengguna dengan level lebih tinggi dari Anda.']);
        }

        $userApp->update([
            'role_id' => $validated['role_id'],
        ]);

        return redirect()->back()->with('success', 'Peran pengguna untuk sistem Reminder berhasil diperbarui.');
    }
}
