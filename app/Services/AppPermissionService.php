<?php

namespace App\Services;

use App\Models\User;

class AppPermissionService
{
    /**
     * Get merged permissions for a user in a specific app.
     *
     * Priority:
     * 1. Custom override from user_applications.permissions
     * 2. Default from config/permissions.php based on role
     * 3. ['read'] as fallback
     */
    public function getPermissions(User $user, string $appSlug): array
    {
        // Use eager-loaded collection if available to avoid N+1
        $userApp = $user->userApplications
            ? $user->userApplications->first(fn($ua) => $ua->application?->slug === $appSlug)
            : $user->userApplications()
                ->whereHas('application', fn($q) => $q->where('slug', $appSlug))
                ->first();

        // Custom override exists → use it
        if ($userApp && $userApp->permissions) {
            return $userApp->permissions;
        }

        // No override → use default from config based on role
        $roleName = $user->role?->name;

        return config("permissions.{$appSlug}.{$roleName}", ['read']);
    }

    /**
     * Check if a user has a specific permission in an app.
     *
     * '*' permission means full access (all permissions granted).
     */
    public function hasPermission(User $user, string $appSlug, string $permission): bool
    {
        $permissions = $this->getPermissions($user, $appSlug);

        return in_array('*', $permissions) || in_array($permission, $permissions);
    }
}
