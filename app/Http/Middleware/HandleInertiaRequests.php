<?php

namespace App\Http\Middleware;

use App\Models\Application;
use App\Services\AppPermissionService;
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
            $user->load(['karyawan']);
            if (!$user->userApplications()->exists()) {
                $user->ensureUserApplications();
            }
        }

        $userData = null;
        if ($user) {
            $userData = $user->toArray();
            unset($userData['role_id']);

            // Per-app roles (eager-loaded to avoid N+1)
            $apps = Application::all();
            $user->loadMissing('userApplications.application', 'userApplications.role');
            $permissionService = app(AppPermissionService::class);
            $userData['app_roles'] = [];
            foreach ($apps as $app) {
                $userApp = $user->userApplications->first(fn($ua) => $ua->application_id === $app->id);

                // it-workflow level synced from global users.role_id (source of truth)
                $level = $app->slug === 'it-workflow'
                    ? $user->level()
                    : ($userApp?->role?->level ?? null);

                $userData['app_roles'][$app->slug] = [
                    'role_name' => $app->slug === 'it-workflow'
                        ? ($user->role?->name ?? null)
                        : ($userApp?->role?->name ?? null),
                    'level'     => $level,
                    'is_active' => $userApp?->is_active ?? false,
                    'permissions' => $permissionService->getPermissions($user, $app->slug),
                ];
            }

            // Legacy fields (backward compat, source of truth: users.role_id)
            $userData['role_name'] = $user->role?->name ?? null;
            $userData['level']     = $user->level();
            $userData['divisi']    = $user->karyawan?->divisi ?? null;
            $userData['is_it']     = $user->isIT();
            $userData['can_manage_master']     = $user->canManageMaster();
            $userData['can_see_global_monitor'] = $user->canSeeGlobalMonitor();
            $userData['has_it_workflow_access'] = $user->canManageMaster()
                || $user->userApplications->contains(fn($ua) =>
                    $ua->application?->slug === 'it-workflow' && $ua->is_active
                );
            $userData['avatar_url'] = $user->avatar_path
                ? asset($user->avatar_path)
                : null;
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $userData,
            ],
            'asset_url' => rtrim(asset(''), '/'),
        ];
    }
}
