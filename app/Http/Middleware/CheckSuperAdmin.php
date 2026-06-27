<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

class CheckSuperAdmin
{
    /**
     * Handle an incoming request.
     * Only users with 'superadmin' role are allowed through.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check()) {
            $user = Auth::user();
            $user->load('role');

            if ($user->role?->name === 'superadmin') {
                return $next($request);
            }
        }

        abort(403, 'Unauthorized. Hanya Super Admin yang dapat mengakses halaman ini.');
    }
}
