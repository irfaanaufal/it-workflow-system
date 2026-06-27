<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

class CheckAdminIT
{
    /**
     * Handle an incoming request.
     * Only employees from the IT division are allowed through.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check()) {
            $user = Auth::user();
            $user->load('karyawan');

            if ($user->karyawan?->divisi === 'IT') {
                return $next($request);
            }
        }

        abort(403, 'Unauthorized. Hanya karyawan divisi IT yang dapat mengakses halaman ini.');
    }
}
