<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Karyawan;
use App\Models\Role;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:'.User::class.'|regex:/^[a-zA-Z0-9._-]+$/',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'fid' => 'nullable|string|exists:karyawans,fid|unique:users,fid',
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        $fid = $request->fid;
        if (!$fid) {
            // Attempt to match with karyawan list to auto-assign division
            $karyawan = Karyawan::where('nama_karyawan', 'like', trim($request->name))->first();
            if ($karyawan && !User::where('fid', $karyawan->fid)->exists()) {
                $fid = $karyawan->fid;
            }
        }

        $userRole = Role::where('name', 'user')->first();

        $user = User::create([
            'name' => $request->name,
            'username' => $request->username,
            'email' => $request->email,
            'fid' => $fid,
            'role_id' => $userRole?->id,
            'password' => Hash::make($request->password),
        ]);

        // Automatically verify email and generate remember_token on registration
        $user->email_verified_at = now();
        $user->remember_token = \Illuminate\Support\Str::random(10);
        $user->save();

        event(new Registered($user));

        Auth::login($user);

        return redirect(route('dashboard', absolute: false));
    }

    /**
     * Check if karyawan exists and is not already linked.
     */
    public function checkKaryawan($fid): \Illuminate\Http\JsonResponse
    {
        $karyawan = Karyawan::where('fid', $fid)->first();

        if (!$karyawan) {
            return response()->json([
                'success' => false,
                'message' => 'FID Karyawan tidak ditemukan.'
            ], 404);
        }

        $linkedUserExists = User::where('fid', $fid)->exists();
        if ($linkedUserExists) {
            return response()->json([
                'success' => false,
                'message' => 'Karyawan dengan FID ini sudah memiliki akun.'
            ], 400);
        }

        return response()->json([
            'success' => true,
            'karyawan' => [
                'fid' => $karyawan->fid,
                'nama_karyawan' => $karyawan->nama_karyawan,
                'divisi' => $karyawan->divisi ?? 'Umum',
            ]
        ]);
    }
}
