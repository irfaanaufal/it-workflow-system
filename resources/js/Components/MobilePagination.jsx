import { getMobilePageNumbers } from '@/Utils/pagination';

export default function MobilePagination({ currentPage, totalPages, onPageChange }) {
    if (totalPages <= 1) return null;

    return (
        <div className="flex justify-center pt-2 pb-1">
            <div className="flex items-center gap-1.5">
                <button
                    onClick={() => onPageChange(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="min-w-[44px] h-[44px] flex items-center justify-center text-xs font-bold rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                >
                    ‹
                </button>
                {getMobilePageNumbers(currentPage, totalPages).map(pageNum => (
                    <button
                        key={pageNum}
                        onClick={() => onPageChange(pageNum)}
                        className={`min-w-[44px] h-[44px] flex items-center justify-center text-xs font-bold rounded-lg transition cursor-pointer ${
                            currentPage === pageNum
                                ? 'bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                                : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
                        }`}
                    >
                        {pageNum}
                    </button>
                ))}
                <button
                    onClick={() => onPageChange(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="min-w-[44px] h-[44px] flex items-center justify-center text-xs font-bold rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                >
                    ›
                </button>
            </div>
        </div>
    );
}
