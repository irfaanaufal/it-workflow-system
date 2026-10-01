<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\Application;
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

        // Aturan seragam lintas aplikasi: TANPA bypass admin — semua akun
        // (termasuk admin) harus punya baris it-workflow AKTIF untuk masuk.
        // Aktivasi hanya via Kelola Permintaan di it-system.
        $app = Application::firstOrCreate(
            ['slug' => 'it-workflow'],
            ['name' => 'IT Workflow', 'description' => 'Sistem manajemen workflow teknologi informasi.']
        );

        $userApp = UserApplication::where('user_id', $user->id)
            ->where('application_id', $app->id)
            ->first();

        if (!$userApp) {
            // Baris belum ada (akun lama) → buat inactive + notifikasi admin.
            UserApplication::create([
                'user_id' => $user->id,
                'application_id' => $app->id,
                'role_id' => $user->role_id,
                'is_active' => false,
            ]);
            $user->sendAccessRequestNotifications();
        }

        if (!$userApp || !$userApp->is_active) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            throw \Illuminate\Validation\ValidationException::withMessages([
                'activation_needed' => 'Akun belum diaktifkan. Hubungi tim IT',
            ]);
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
