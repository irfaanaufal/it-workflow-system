import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';

const normalizeNotification = (notification) => ({
    ...notification,
    msg: notification.message ?? notification.msg,
    time: new Date(notification.created_at ?? notification.time),
    read: notification.read === true,
});

export default function useNotifications(asset_url) {
    const [notifications, setNotifications] = useState([]);
    const unreadCount = notifications.filter(n => !n.read).length;

    const fetchNotifications = () => {
        axios.get('/api/notifications')
            .then(res => setNotifications(res.data.map(normalizeNotification)))
            .catch(console.error);
    };

    const markAllRead = () => {
        axios.patch('/api/notifications/read-all')
            .then(() => setNotifications(prev => prev.map(n => ({ ...n, read: true }))))
            .catch(console.error);
    };

    const markOneRead = (id) => {
        axios.patch('/api/notifications/read-all', { ids: [id] })
            .then(() => setNotifications(prev => prev.map(p => p.id === id ? { ...p, read: true } : p)))
            .catch(console.error);
    };

    const handleNotifClick = (n) => {
        if (!n.read) markOneRead(n.id);

        let path;
        if (n.recipient_type === 'admin') {
            if (n.action === 'new_ticket') path = '/admin/inbox';
            else if (n.action === 'new_access_request') path = '/admin/applications/requests';
            else if (n.action === 'activation_required') path = '/admin/applications/requests';
            else path = n.ticket_id ? `/admin/tickets/${n.ticket_id}` : '/admin/inbox';
        } else {
            switch (n.action) {
                case 'created':
                    path = '/my-requests';
                    break;
                case 'ticket_taken':
                case 'entered_review':
                case 'entered_to_do':
                case 'entered_in_progress':
                    path = n.ticket_id ? `/tickets/${n.ticket_id}` : '/my-requests';
                    break;
                case 'entered_testing':
                case 'revision_requested':
                    path = '/my-requests';
                    break;
                case 'approved':
                case 'uat_approved':
                    path = `/tickets/${n.ticket_id}`;
                    break;
                default:
                    path = n.ticket_id ? `/tickets/${n.ticket_id}` : '/global-monitor';
            }
        }
        router.visit(asset_url + path);
    };

    const notifDot = (status) => {
        const dots = {
            inbox: 'bg-gray-400',
            review: 'bg-amber-400',
            to_do: 'bg-sky-400',
            in_progress: 'bg-indigo-500',
            testing: 'bg-violet-500',
            approved: 'bg-emerald-500',
        };
        return dots[status] || 'bg-gray-400';
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(() => {
            if (!document.hidden) fetchNotifications();
        }, 15000);

        const handleVisibility = () => {
            if (!document.hidden) fetchNotifications();
        };
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            clearInterval(interval);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, []);

    return { notifications, unreadCount, markAllRead, markOneRead, handleNotifClick, notifDot };
}
