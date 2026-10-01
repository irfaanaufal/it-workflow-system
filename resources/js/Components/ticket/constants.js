export const STATUS = {
    INBOX: 'inbox',
    REVIEW: 'review',
    TO_DO: 'to_do',
    IN_PROGRESS: 'in_progress',
    TESTING: 'testing',
    APPROVED: 'approved',
    REJECTED: 'rejected',
};

export const CATEGORY = {
    NEW_SYSTEM: 'new system',
    ADD_FEATURE: 'add feature',
    MAINTENANCE: 'maintenance',
    FIX_BUG: 'fix bug',
};

export const STATUS_CONFIG = {
    inbox: { label: 'Menunggu Antrian', icon: 'inbox' },
    review: { label: 'Sedang Review', icon: 'search' },
    to_do: { label: 'Antrean Kerja', icon: 'clipboard' },
    in_progress: { label: 'Dikerjakan', icon: 'settings' },
    testing: { label: 'Pengujian', icon: 'flask' },
    approved: { label: 'Selesai', icon: 'checkCircle' },
    rejected: { label: 'Ditolak', icon: 'xCircle' },
};

export const STATUS_ORDER = ['inbox', 'review', 'to_do', 'in_progress', 'testing', 'approved', 'rejected'];

export const BLOCKER_CATEGORIES = ['fix bug', 'maintenance'];
export const SYSTEM_CATEGORIES = ['add feature', 'maintenance', 'fix bug'];

export const CATEGORY_COLORS = {
    'new system': { accent: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300', ring: 'ring-emerald-200 dark:ring-emerald-800', emoji: '🚀' },
    'add feature': { accent: 'bg-amber-500', badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300', ring: 'ring-amber-200 dark:ring-amber-800', emoji: '✨' },
    'maintenance': { accent: 'bg-sky-500', badge: 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300', ring: 'ring-sky-200 dark:ring-sky-800', emoji: '🔧' },
    'fix bug': { accent: 'bg-rose-500', badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300', ring: 'ring-rose-200 dark:ring-rose-800', emoji: '🐛' },
};

export const STATUS_COLORS = {
    inbox: 'bg-slate-500',
    review: 'bg-amber-500',
    to_do: 'bg-sky-500',
    in_progress: 'bg-indigo-500',
    testing: 'bg-violet-500',
    approved: 'bg-emerald-500',
    rejected: 'bg-rose-500',
};

export const CONTENT_FIELDS = [
    { key: 'kondisi_lapangan', label: 'Kondisi di Lapangan' },
    { key: 'keinginan_sistem', label: 'Keinginan Sistem' },
    { key: 'dampak_positif', label: 'Dampak Positif' },
];

export const STATUS_TRANSITIONS = {
    inbox: ['review'],
    review: ['to_do', 'inbox'],
    to_do: ['in_progress', 'review'],
    in_progress: ['testing', 'to_do'],
    testing: ['approved', 'review'],
    approved: [],
    rejected: [],
};
