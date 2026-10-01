import React, { useState } from 'react';

export default function UserAvatar({
    name = '',
    avatarUrl = null,
    className = 'w-8 h-8',
    textClassName = 'text-xs',
}) {
    const [imgError, setImgError] = useState(false);

    const initials = name
        ? name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
        : '?';

    // Soft modern pastel color palettes based on name string
    const colorStyles = [
        'bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800/60',
        'bg-sky-50 text-sky-700 border-sky-200/80 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800/60',
        'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60',
        'bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800/60',
        'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/60',
        'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/60',
    ];

    const charSum = (name || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const colorClass = colorStyles[charSum % colorStyles.length];

    if (avatarUrl && !imgError) {
        return (
            <div className={`${className} rounded-full overflow-hidden border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800 flex items-center justify-center shrink-0`}>
                <img
                    src={avatarUrl}
                    alt={name}
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                />
            </div>
        );
    }

    return (
        <div className={`${className} rounded-full border ${colorClass} flex items-center justify-center shrink-0 font-bold ${textClassName}`}>
            {initials}
        </div>
    );
}
