<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

class CheckAdminITTicket
{
    /**
     * Only superadmin users from IT division can manage tickets.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (Auth::check()) {
            $user = Auth::user();
            $user->load('karyawan');

            if ($user->isSuperAdmin() && $user->karyawan?->divisi === 'IT') {
                return $next($request);
            }
        }

        abort(403, 'Unauthorized. Hanya tim IT yang dapat mengakses halaman ini.');
    }
}
