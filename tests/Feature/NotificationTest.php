<?php

namespace Tests\Feature;

use App\Models\LogNotifikasi;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_unauthenticated_user_unauthorized_for_notifications(): void
    {
        $this->getJson('/api/notifications')->assertStatus(401);
    }

    public function test_authenticated_user_can_list_notifications(): void
    {
        $user = User::factory()->role('IT')->create();

        $this->actingAs($user)->getJson('/api/notifications')
            ->assertStatus(200)
            ->assertJsonStructure([]);
    }

    public function test_user_sees_only_own_notifications(): void
    {
        $user1 = User::factory()->role('IT')->create();
        $user2 = User::factory()->role('Admin')->create();

        LogNotifikasi::create([
            'user_id' => $user1->id,
            'action' => 'new_ticket',
            'title' => 'Notif User 1',
            'message' => 'Test',
            'visible_in_bell' => true,
        ]);

        LogNotifikasi::create([
            'user_id' => $user2->id,
            'action' => 'new_ticket',
            'title' => 'Notif User 2',
            'message' => 'Test',
            'visible_in_bell' => true,
        ]);

        $response = $this->actingAs($user1)->getJson('/api/notifications');

        $response->assertStatus(200);
        $response->assertJsonCount(1);
        $response->assertJsonFragment(['title' => 'Notif User 1']);
    }

    public function test_user_can_mark_notifications_as_read(): void
    {
        $user = User::factory()->role('IT')->create();

        LogNotifikasi::create([
            'user_id' => $user->id,
            'action' => 'new_ticket',
            'title' => 'Unread Notif',
            'message' => 'Test',
            'visible_in_bell' => true,
            'read_at' => null,
        ]);

        $this->actingAs($user)->patchJson('/api/notifications/read-all')
            ->assertStatus(200);

        $this->assertDatabaseHas('log_notifikasi', [
            'user_id' => $user->id,
            'title' => 'Unread Notif',
        ]);

        $notification = LogNotifikasi::where('user_id', $user->id)->first();
        $this->assertNotNull($notification->read_at);
    }

    public function test_hidden_notifications_not_returned(): void
    {
        $user = User::factory()->role('IT')->create();

        LogNotifikasi::create([
            'user_id' => $user->id,
            'action' => 'internal_log',
            'title' => 'Hidden',
            'message' => 'Test',
            'visible_in_bell' => false,
        ]);

        LogNotifikasi::create([
            'user_id' => $user->id,
            'action' => 'new_ticket',
            'title' => 'Visible',
            'message' => 'Test',
            'visible_in_bell' => true,
        ]);

        $response = $this->actingAs($user)->getJson('/api/notifications');

        $response->assertStatus(200);
        $response->assertJsonCount(1);
        $response->assertJsonFragment(['title' => 'Visible']);
    }
}
