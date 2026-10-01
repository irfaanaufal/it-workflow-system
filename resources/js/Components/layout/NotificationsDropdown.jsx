import React from 'react';

const ICON = 'h-[18px] w-[18px]';

export default function NotificationsDropdown({
    notifications,
    unreadCount,
    notifDot,
    onMarkAllRead,
    onNotifClick,
}) {
    return (
        <div className="absolute right-0 top-[calc(100%+10px)] w-80 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
                <span className="text-sm font-bold text-gray-800 dark:text-zinc-100">Notifikasi</span>
                {notifications.length > 0 && (
                    <button onClick={onMarkAllRead} className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer transition">Tandai semua</button>
                )}
            </div>
            <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="py-8 text-center">
                        <svg className="w-8 h-8 text-gray-300 dark:text-zinc-700 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        <p className="text-xs text-gray-400 dark:text-zinc-500 font-semibold">Belum ada notifikasi</p>
                    </div>
                ) : notifications.map(n => (
                    <div key={n.id} onClick={() => onNotifClick(n)} className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 dark:border-zinc-800/60 last:border-0 transition cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/40 ${!n.read ? 'bg-indigo-50/40 dark:bg-indigo-950/10' : ''}`}>
                        <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${notifDot(n.status)}`} />
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-700 dark:text-zinc-300 leading-snug">{n.msg}</p>
                            <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">{n.time.toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-2" />}
                    </div>
                ))}
            </div>
        </div>
    );
}
