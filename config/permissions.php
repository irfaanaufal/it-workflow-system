<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Default Permissions per Role per Application
    |--------------------------------------------------------------------------
    |
    | Each application defines the default permissions for each role.
    | '*' means all permissions (full access).
    | Permissions are checked by the AppPermissionService.
    |
    | Custom overrides can be stored in user_applications.permissions column.
    | If a user has custom permissions, they override these defaults.
    |
    */

    'it-workflow' => [
        'IT'              => ['*'],
        'Direktur Utama'  => ['read', 'create_ticket', 'view_global_monitor', 'view_history', 'manage_master'],
        'Head Admin'      => ['read', 'create_ticket', 'view_global_monitor', 'view_history', 'manage_master'],
        'HRD'             => ['read', 'create_ticket', 'view_global_monitor', 'view_history', 'manage_master'],
        'Admin'           => ['read', 'create_ticket', 'view_global_monitor', 'view_history'],
        'Teknisi'         => ['read', 'create_ticket', 'view_global_monitor', 'view_history'],
        'QA'              => ['read', 'create_ticket', 'view_global_monitor', 'view_history', 'manage_master'],
        'QC'              => ['read', 'create_ticket', 'view_global_monitor', 'view_history'],
        'Ekspedisi'       => ['read', 'create_ticket', 'view_global_monitor', 'view_history'],
    ],

    'absensi-meeting' => [
        'IT'              => ['*'],
        'Direktur Utama'  => ['read'],
        'Head Admin'      => ['read', 'create_meeting', 'create_briefing'],
        'HRD'             => ['read', 'create_meeting', 'create_briefing'],
        'Admin'           => ['read'],
        'Teknisi'         => ['read'],
        'QA'              => ['read', 'create_briefing'],
        'QC'              => ['read'],
        'Ekspedisi'       => ['read'],
    ],

    'reminder' => [
        'IT'              => ['*'],
        'Direktur Utama'  => ['read'],
        'Head Admin'      => ['read', 'create'],
        'HRD'             => ['read', 'create'],
        'Admin'           => ['read'],
        'Teknisi'         => ['read'],
        'QA'              => ['read'],
        'QC'              => ['read'],
        'Ekspedisi'       => ['read'],
    ],

    'shortly' => [
        'IT'              => ['*'],
        'Direktur Utama'  => ['read'],
        'Head Admin'      => ['read', 'create'],
        'HRD'             => ['read', 'create'],
        'Admin'           => ['read'],
        'Teknisi'         => ['read'],
        'QA'              => ['read'],
        'QC'              => ['read'],
        'Ekspedisi'       => ['read'],
    ],
];
