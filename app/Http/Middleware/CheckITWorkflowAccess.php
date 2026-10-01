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

        // Aturan seragam lintas aplikasi: TANPA bypass admin — hanya baris
        // it-workflow dengan is_active=true yang diizinkan.
        $hasAccess = $user->userApplications()
            ->whereHas('application', function ($query) {
                $query->where('slug', 'it-workflow');
            })
            ->where('is_active', true)
            ->exists();

        if (!$hasAccess) {
            if ($request->expectsJson() || $request->header('X-Inertia')) {
                return response()->json([
                    'message' => 'Akun belum diaktifkan. Hubungi tim IT'
                ], 403);
            }

            abort(403, 'Akun belum diaktifkan. Hubungi tim IT');
        }

        return $next($request);
    }
}
