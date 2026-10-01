<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckManageMaster
{
    /**
     * Only users with master-data management access
     * (levels 1 IT, 2 Direktur Utama, 3 Head Admin, 4 HRD, 7 QA) are allowed through.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->canManageMaster('it-workflow')) {
            return $next($request);
        }

        abort(403, 'Unauthorized. Anda tidak memiliki izin untuk mengakses halaman ini.');
    }
}