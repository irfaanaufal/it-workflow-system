<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckAdminITTicket
{
    /**
     * Only users with the IT role (level 1) can manage tickets.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->isIT('it-workflow')) {
            return $next($request);
        }

        abort(403, 'Unauthorized. Hanya tim IT yang dapat mengakses halaman ini.');
    }
}