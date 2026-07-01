<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="h-full bg-gray-100 dark:bg-zinc-900">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title inertia>{{ config('app.name', 'SINDANGASIH MAKMUR') }}</title>

    <!-- CSRF Token – required for Echo authentication -->
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <!-- Vite assets – Laravel Vite plugin -->
    @vite(['resources/js/app.jsx', 'resources/css/app.css'])
</head>
<body class="font-sans antialiased h-full">
    @inertia
</body>
</html>
