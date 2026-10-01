<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // Host yang sah — hanya host ini yang boleh menentukan app.url,
        // mencegah host header injection (tautan reset-password, dll).
        $allowedHosts = [
            'sindangasih-makmur.com',
            'www.sindangasih-makmur.com',
            'localhost',
            '127.0.0.1',
        ];

        if ($request = request()) {
            if (in_array($request->getHost(), $allowedHosts, true)) {
                config(['app.url' => $request->root()]);
            }
        }

        if (str_starts_with(config('app.url'), 'https://')) {
            \Illuminate\Support\Facades\URL::forceScheme('https');
        }
    }
}
