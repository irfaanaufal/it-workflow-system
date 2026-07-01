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
            return $next($request);
        }

        // Superadmin dan admin selalu punya akses
        if ($user->isAdmin()) {
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
                if ($request->header('X-Inertia')) {
                    return redirect()->route('applications.index')
                        ->withErrors(['message' => 'Anda tidak memiliki akses aktif ke aplikasi IT Workflow.']);
                }
                return response()->json([
                    'message' => 'Anda tidak memiliki akses aktif ke aplikasi IT Workflow.'
                ], 403);
            }

            return redirect()->route('applications.index')
                ->withErrors(['message' => 'Anda tidak memiliki akses aktif ke aplikasi IT Workflow.']);
        }

        return $next($request);
    }
}
