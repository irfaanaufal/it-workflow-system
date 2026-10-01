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
            try {
                $karyawan = Karyawan::where('nama_karyawan', trim($request->name))
                    ->where('status', 'Active')
                    ->first();
                if ($karyawan && !User::where('fid', $karyawan->fid)->exists()) {
                    $fid = $karyawan->fid;
                }
            } catch (\Exception $e) {
                // Karyawan table may not exist yet (e.g., in tests)
            }
        }

        $user = User::create([
            'name' => $request->name,
            'username' => $request->username,
            'email' => $request->email,
            'fid' => $fid,
            'password' => Hash::make($request->password),
            'remember_token' => \Illuminate\Support\Str::random(10),
        ]);

        // role_id tidak fillable — set eksplisit: antre sebagai
        // "Menunggu Persetujuan" sampai disetujui di Kelola Permintaan.
        $user->role_id = Role::where('name', 'Menunggu Persetujuan')->value('id');
        $user->save();

        // Aturan seragam lintas aplikasi: registrasi = 1 baris permintaan
        // akses (it-workflow, is_active=false) + notifikasi admin.
        // Aktivasi hanya via Kelola Permintaan (assignRoleFromDivisi).
        $user->ensureUserApplications();
        $user->sendAccessRequestNotifications();

        event(new Registered($user));

        return redirect()->route('login')->with('status', 'Pendaftaran berhasil. Silakan masuk menggunakan akun Anda.');
    }

    /**
     * Check if karyawan exists and is not already linked.
     */
    public function checkKaryawan($fid): \Illuminate\Http\JsonResponse
    {
        $karyawan = Karyawan::byFid($fid)->first();

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
