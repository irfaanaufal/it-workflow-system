<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\Application;
use App\Models\LogNotifikasi;
use App\Models\User;
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

        // Superadmin & admin bypass workflow access check
        if (!$user->isAdmin()) {
            $app = Application::firstOrCreate(
                ['slug' => 'it-workflow'],
                [
                    'name' => 'IT Workflow',
                    'description' => 'Sistem manajemen workflow teknologi informasi.'
                ]
            );

            $userApp = UserApplication::where('user_id', $user->id)
                ->where('application_id', $app->id)
                ->first();

            if (!$userApp || !$userApp->is_active) {
                $notifExists = LogNotifikasi::where('actor_user_id', $user->id)
                    ->where('action', 'activation_required')
                    ->exists();

                if (!$notifExists) {
                    $adminUsers = User::whereHas('role', fn($q) => $q->whereIn('name', ['superadmin', 'admin']))->get();
                    $adminUsers->each(function ($admin) use ($user) {
                        LogNotifikasi::create([
                            'user_id' => $admin->id,
                            'ticket_id' => null,
                            'actor_user_id' => $user->id,
                            'actor_name' => $user->name,
                            'recipient_type' => 'admin',
                            'action' => 'activation_required',
                            'title' => 'Percobaan login oleh user non-aktif',
                            'message' => $user->name . ' (' . $user->username . ') mencoba masuk namun akun belum diaktifkan untuk aplikasi IT Workflow.',
                            'status' => null,
                            'visible_in_bell' => true,
                        ]);
                    });
                }

                Auth::guard('web')->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return redirect()->route('login')->withErrors([
                    'activation_needed' => 'Akun Anda belum diaktifkan. Silakan hubungi tim IT untuk mengaktifkan akun Anda.'
                ]);
            }
        }

        $request->session()->regenerate();

        if ($user->isSuperAdmin()) {
            $redirectUrl = route('dashboard');
        } elseif ($user->isAdmin()) {
            $redirectUrl = route('admin.inbox');
        } else {
            $redirectUrl = route('my-requests');
        }

        return redirect()->intended($redirectUrl);
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}
