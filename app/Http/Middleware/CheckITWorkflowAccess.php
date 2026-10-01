<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckITWorkflowAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            abort(401, 'Unauthenticated.');
        }

        // Master-data managers (levels 1, 2, 3, 4, 7) always have access
        if ($user->canManageMaster('it-workflow')) {
            return $next($request);
        }

        // Cek akses aktif ke it-workflow via user_applications
        $hasAccess = $user->userApplications()
            ->whereHas('application', function ($query) {
                $query->where('slug', 'it-workflow');
            })
            ->where('is_active', true)
            ->exists();

        if (!$hasAccess) {
            if ($request->expectsJson() || $request->header('X-Inertia')) {
                return response()->json([
                    'message' => 'Anda tidak memiliki akses aktif ke aplikasi IT Workflow.'
                ], 403);
            }

            abort(403, 'Anda tidak memiliki akses aktif ke aplikasi IT Workflow. Hubungi Team IT untuk diaktifkan.');
        }

        return $next($request);
    }
}
