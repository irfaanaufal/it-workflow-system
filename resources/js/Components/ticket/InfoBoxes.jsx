export default function InfoBoxes({ ticket }) {
    return (
        <>
            {ticket.revision_reason && (
                <div className="mb-4 pl-4 border-l-2 border-amber-400 dark:border-amber-500 bg-amber-50/50 dark:bg-amber-950/10 rounded-r-xl py-3 pr-4">
                    <p className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Alasan Revisi</p>
                    <p className="text-xs text-amber-900 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">{ticket.revision_reason}</p>
                </div>
            )}

            {ticket.reject_reason && (
                <div className="mb-4 pl-4 border-l-2 border-rose-400 dark:border-rose-500 bg-rose-50/50 dark:bg-rose-950/10 rounded-r-xl py-3 pr-4">
                    <p className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider mb-1">Alasan Penolakan</p>
                    <p className="text-xs text-rose-900 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">{ticket.reject_reason}</p>
                </div>
            )}

            {ticket.uat_feedback && (
                <div className="mb-4 pl-4 border-l-2 border-emerald-400 dark:border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-r-xl py-3 pr-4">
                    <p className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">UAT Feedback</p>
                    <p className="text-xs text-emerald-900 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">{ticket.uat_feedback}</p>
                </div>
            )}
        </>
    );
}
