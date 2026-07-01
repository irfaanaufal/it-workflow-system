<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use Symfony\Component\HttpFoundation\Response;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function rootView(Request $request): string
    {
        if ($request->is('api/*')) {
            return 'app';
        }

        return parent::rootView($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();
        if ($user) {
            $user->load(['karyawan', 'role']);
        }

        $userData = null;
        if ($user) {
            $userData = $user->toArray();
            $userData['role_name'] = $user->role?->name ?? 'user';
            $userData['divisi']    = $user->karyawan?->divisi ?? null;
            $userData['is_it']     = $user->karyawan?->divisi === 'IT' || $user->isAdmin();
            $userData['is_superadmin'] = $user->isSuperAdmin();
            $userData['is_admin'] = $user->isAdmin();
            $userData['has_it_workflow_access'] = $user->isAdmin()
                || $user->userApplications()
                    ->whereHas('application', fn($q) => $q->where('slug', 'it-workflow'))
                    ->where('is_active', true)
                    ->exists();
            $userData['avatar_url'] = $user->avatar_path
                ? asset('storage/' . $user->avatar_path)
                : null;
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $userData,
            ],
            'asset_url' => asset(''),
        ];
    }
}
