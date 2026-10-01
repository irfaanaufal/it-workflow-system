import { STATUS_CONFIG, STATUS_COLORS } from './constants';

export default function StatusBadge({ status, size = 'sm' }) {
    const styles = {
        inbox: 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400',
        review: 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400',
        to_do: 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400',
        in_progress: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400',
        testing: 'bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400',
        approved: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400',
        rejected: 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400',
    };
    const sizeClasses = size === 'lg' ? 'px-3 py-1 text-[11px]' : 'px-2 py-0.5 text-[10px]';
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-extrabold uppercase tracking-wide ${sizeClasses} ${styles[status] || styles.inbox}`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_COLORS[status] || 'bg-gray-400'}`} />
            {STATUS_CONFIG[status]?.label || status}
        </span>
    );
}
