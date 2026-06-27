<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Private channel for user-specific notifications.
// It authorizes the user if their Karyawan record ID matches the target karyawanId.
Broadcast::channel('user-notification.{karyawanId}', function ($user, $karyawanId) {
    return (int) $user->karyawan?->id === (int) $karyawanId;
});
