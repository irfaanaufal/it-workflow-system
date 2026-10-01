<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Models\Role;
use App\Models\User;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('profile.edit');
    }

    /**
     * Link a Karyawan FID to the authenticated user's account.
     */
    public function linkFid(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'fid' => 'required|string|exists:karyawans,fid',
        ]);

        $user = $request->user();
        $fid = $request->fid;

        // Check if this FID is already linked to another user
        $existingUser = User::where('fid', $fid)->where('id', '!=', $user->id)->first();
        if ($existingUser) {
            return response()->json([
                'message' => 'FID ini sudah terhubung dengan akun lain.'
            ], 422);
        }

        // Update user's FID
        $user->fid = $fid;

        // Belum punya role → antre sebagai "Menunggu Persetujuan";
        // role sesuai divisi ditetapkan otomatis saat disetujui di
        // Kelola Permintaan (assignRoleFromDivisi dari toggleAccess).
        if (!$user->role_id) {
            $user->role_id = Role::where('name', 'Menunggu Persetujuan')->value('id');
        }

        $user->save();

        // Baris permintaan akses TIDAK dibuat di sini — dibuat otomatis
        // saat login pertama (AuthenticatedSessionController, 1 baris
        // it-workflow saja; lihat .agents/AGENTS.md).

        // Reload the karyawan relation
        $user->load('karyawan');

        return response()->json([
            'success' => true,
            'message' => 'FID berhasil dihubungkan.',
            'user' => $user,
        ]);
    }

    /**
     * Upload / update avatar photo.
     */
    public function updateAvatar(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpg,jpeg,png,webp,gif', 'max:3000'],
        ]);

        $user = $request->user();
        $oldPath = $user->avatar_path;

        // Ekstensi dari isi file (bukan nama file klien) — mencegah
        // ekstensi buatan penyerang ikut tersimpan di disk public.
        $extension = $request->file('avatar')->guessExtension() ?: 'png';
        $filename = 'avatar_' . $user->id . '_' . time() . '.' . $extension;
        $request->file('avatar')->storeAs('profile-photos', $filename, 'public');
        $newPath = 'profile-photos/' . $filename;

        DB::transaction(function () use ($user, $newPath, $oldPath) {
            $user->avatar_path = $newPath;
            $user->save();

            if ($oldPath) {
                Storage::disk('public')->delete($oldPath);
            }
        });

        return response()->json([
            'success'    => true,
            'avatar_url' => asset('storage/' . $newPath),
        ]);
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
