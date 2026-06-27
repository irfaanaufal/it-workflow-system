import axios from 'axios';
window.axios = axios;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
window.axios.defaults.withCredentials = true;

import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

// Enable Pusher's internal logging for debugging
Pusher.logToConsole = true;

console.log('Initializing Echo with config:', {
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST || window.location.hostname,
    wsPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
    wssPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'ws') === 'wss',
    enabledTransports: ['ws'],
});

window.Echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST || window.location.hostname,
    wsPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
    wssPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'ws') === 'wss',
    // Only use ws — no wss fallback for local dev (avoids the failed wss attempt)
    enabledTransports: ['ws'],
    disableStats: true,
    authEndpoint: '/broadcasting/auth',
    auth: {
        headers: {
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
        },
    },
});

// Log when Echo connects
window.Echo.connector.pusher.connection.bind('connected', () => {
    console.log('✅ Echo connected to Reverb successfully!');
});

window.Echo.connector.pusher.connection.bind('disconnected', () => {
    console.log('❌ Echo disconnected from Reverb');
});

window.Echo.connector.pusher.connection.bind('error', (error) => {
    console.error('❌ Echo connection error:', error);
});
