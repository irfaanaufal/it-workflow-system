<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Models\Karyawan;
use App\Models\Role;
use App\Models\User;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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

        // Get karyawan data
        $karyawan = Karyawan::where('fid', $fid)->first();

        // Update user's FID
        $user->fid = $fid;

        // Also assign 'user' role if not set
        if (!$user->role_id) {
            $userRole = Role::where('name', 'user')->first();
            if ($userRole) {
                $user->role_id = $userRole->id;
            }
        }

        $user->save();

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

        // Delete old avatar if exists
        if ($user->avatar_path) {
            $oldFile = public_path($user->avatar_path);
            if (file_exists($oldFile)) {
                unlink($oldFile);
            }
        }

        // Save to public/profile-photos/
        $filename = 'avatar_' . $user->id . '_' . time() . '.' . $request->file('avatar')->getClientOriginalExtension();
        $request->file('avatar')->move(public_path('profile-photos'), $filename);
        $path = 'profile-photos/' . $filename;

        $user->avatar_path = $path;
        $user->save();

        return response()->json([
            'success'    => true,
            'avatar_url' => asset($path),
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
