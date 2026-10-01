<?php

use App\Models\Application;
use App\Models\Role;
use App\Models\User;
use App\Models\UserApplication;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $apps = Application::pluck('id', 'slug');
        $users = User::whereNotNull('role_id')->get();

        foreach ($users as $user) {
            foreach ($apps as $slug => $appId) {
                UserApplication::updateOrCreate(
                    ['user_id' => $user->id, 'application_id' => $appId],
                    [
                        'role_id' => $user->role_id,
                        'is_active' => $user->role_id !== null,
                    ]
                );
            }
        }

        DB::table('users')->whereNotNull('role_id')->update(['role_id' => null]);
    }

    public function down(): void
    {
        $workflowApp = Application::where('slug', 'it-workflow')->first();

        if ($workflowApp) {
            $userApps = UserApplication::where('application_id', $workflowApp->id)
                ->whereNotNull('role_id')
                ->get();

            foreach ($userApps as $ua) {
                DB::table('users')
                    ->where('id', $ua->user_id)
                    ->update(['role_id' => $ua->role_id]);
            }
        }
    }
};
