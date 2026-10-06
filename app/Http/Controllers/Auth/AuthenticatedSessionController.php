<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\Application;
use App\Models\Role;
use App\Models\UserApplication;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $user = Auth::user();

        // Hanya sistem reminder yang bergerbang persetujuan — it-workflow
        // langsung aktif saat login (baris lama yang masih inactive ikut
        // diaktifkan otomatis).
        $app = Application::firstOrCreate(
            ['slug' => 'it-workflow'],
            ['name' => 'IT Workflow', 'description' => 'Sistem manajemen workflow teknologi informasi.']
        );

        $userApp = UserApplication::firstOrCreate(
            ['user_id' => $user->id, 'application_id' => $app->id],
            ['role_id' => $user->role_id, 'is_active' => true, 'approved_at' => now()]
        );

        if (!$userApp->is_active) {
            $userApp->update(['is_active' => true, 'approved_at' => now()]);
        }

        // Akun lama yang role-nya masih "Menunggu Persetujuan" (atau null)
        // → tentukan role dari divisi karyawan. Divisi tak dikenal tetap
        // "Menunggu Persetujuan" — role terbatas, bukan gerbang.
        $pendingId = Role::where('name', 'Menunggu Persetujuan')->value('id');
        if ($user->role_id === null || $user->role_id === $pendingId) {
            $user->assignRoleFromDivisi();
        }

        $request->session()->regenerate();

        // Auto-verify email for IT if not yet verified
        if ($user->isIT('it-workflow') && is_null($user->email_verified_at)) {
            $user->update(['email_verified_at' => now()]);
        }

        if ($user->level('it-workflow') === 2) {
            $redirectUrl = route('global-monitor');
        } else {
            $redirectUrl = route('dashboard');
        }

        return redirect()->intended($redirectUrl);
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
