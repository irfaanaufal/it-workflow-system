<?php

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
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
}
