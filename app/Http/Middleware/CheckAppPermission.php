<?php

namespace App\Http\Middleware;

use App\Services\AppPermissionService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckAppPermission
{
    /**
     * Check if the authenticated user has the required permission for a specific app.
     *
     * Usage in routes: middleware('app.permission:it-workflow,take_ticket')
     */
    public function handle(Request $request, Closure $next, string $appSlug, string $permission): Response
    {
        $user = $request->user();

        if (!$user) {
            abort(401, 'Unauthenticated.');
        }

        $service = app(AppPermissionService::class);

        if (!$service->hasPermission($user, $appSlug, $permission)) {
            abort(403, 'Anda tidak memiliki izin untuk melakukan aksi ini.');
        }

        return $next($request);
    }
}
