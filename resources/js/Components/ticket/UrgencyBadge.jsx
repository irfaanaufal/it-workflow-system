export default function UrgencyBadge({ urgency, size = 'sm' }) {
    const styles = {
        blocker: 'bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400',
        high: 'bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400',
        medium: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
        low: 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400',
    };
    const sizeClasses = size === 'lg' ? 'px-3 py-1 text-[11px]' : 'px-2 py-0.5 text-[10px]';
    return (
        <span className={`inline-flex items-center rounded-full font-extrabold uppercase tracking-wide ${sizeClasses} ${styles[urgency] || styles.low}`}>
            {urgency}
        </span>
    );
}
