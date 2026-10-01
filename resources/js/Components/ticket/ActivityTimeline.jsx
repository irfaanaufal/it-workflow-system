import Icon from './Icon';
import { STATUS_CONFIG } from './constants';

export default function ActivityTimeline({ timeline, showLogs, setShowLogs }) {
    return (
        <div className="border-t border-gray-100 dark:border-zinc-800 pt-4">
            <button
                onClick={() => setShowLogs(prev => !prev)}
                className="flex items-center gap-2 mb-3 cursor-pointer group"
            >
                <h3 className="text-xs font-extrabold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Riwayat Aktivitas</h3>
                <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-600 bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                    {timeline.length}
                </span>
                <svg className={`w-3 h-3 text-gray-400 transition-transform ${showLogs ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {showLogs && (
                <div className="relative">
                    {timeline.length > 0 ? (
                        <>
                            <div className="absolute left-[13px] top-3 bottom-3 w-px bg-gray-200 dark:bg-zinc-800" />
                            <div className="space-y-4">
                                {timeline.map((item, idx) => {
                                    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.inbox;
                                    return (
                                        <div key={idx} className="flex items-start gap-3 relative">
                                            <div className="w-[27px] h-[27px] rounded-full shrink-0 flex items-center justify-center z-10 bg-white dark:bg-zinc-900 border-2 border-gray-200 dark:border-zinc-700 shadow-sm">
                                                <div className="w-2 h-2 rounded-full bg-[#7a7a7a]" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-gray-800 dark:text-zinc-200">{item.title || cfg.label}</p>
                                                        {item.actor_name && (
                                                            <p className="text-[10px] text-gray-400 dark:text-zinc-500 mt-0.5">
                                                                oleh <span className="font-semibold text-gray-600 dark:text-zinc-400">{item.actor_name}</span>
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        {item.duration_since_previous_label && (
                                                            <span className="flex items-center gap-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 text-[9px] font-bold px-1.5 py-0.5 rounded">
                                                                <Icon name="clock" className="w-2.5 h-2.5" />
                                                                {item.duration_since_previous_label}
                                                            </span>
                                                        )}
                                                        <span className="text-[9px] font-bold text-gray-400 dark:text-zinc-600 whitespace-nowrap">
                                                            {new Date(item.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                                {item.message && (
                                                    <div className="mt-1.5 p-2.5 bg-gray-50 dark:bg-zinc-800/50 rounded-lg border border-gray-100 dark:border-zinc-800">
                                                        <p className="text-[11px] text-gray-600 dark:text-zinc-400 leading-relaxed">{item.message}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        <p className="text-xs text-gray-400 dark:text-zinc-600 italic">Belum ada catatan aktivitas.</p>
                    )}
                </div>
            )}
        </div>
    );
}
