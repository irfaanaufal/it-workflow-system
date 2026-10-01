import React, { useState, useEffect } from 'react';

export default function DataTable({
    data = [],
    columns = [],
    keyField = 'id',
    emptyState = null,
    maxHeight = null,
    tableClassName = '',
}) {
    const [currentPage, setCurrentPage] = useState(1);
    const [effectiveItemsPerPage, setEffectiveItemsPerPage] = useState(15);

    useEffect(() => {
        const calculate = () => {
            const vh = window.innerHeight;
            setEffectiveItemsPerPage(Math.max(1, Math.floor((vh - 227) / 48)));
        };
        calculate();
        window.addEventListener('resize', calculate);
        return () => window.removeEventListener('resize', calculate);
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [data.length, effectiveItemsPerPage]);

    const totalPages = Math.ceil(data.length / effectiveItemsPerPage);
    const startIndex = (currentPage - 1) * effectiveItemsPerPage;
    const paginatedData = data.slice(startIndex, startIndex + effectiveItemsPerPage);

    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else if (currentPage <= 3) {
            for (let i = 1; i <= 5; i++) pages.push(i);
        } else if (currentPage >= totalPages - 2) {
            for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
        } else {
            for (let i = currentPage - 2; i <= currentPage + 2; i++) pages.push(i);
        }
        return pages;
    };

    const isScrollable = !!maxHeight;
    const hasPagination = data.length > effectiveItemsPerPage;

    const tableContent = (
        <table className={`w-full table-auto text-left border-collapse ${tableClassName}`}>
            <thead className={`${isScrollable ? 'sticky top-0 z-10' : ''} bg-gray-50 dark:bg-zinc-900/60 border-b border-gray-200 dark:border-zinc-800`}>
                <tr>
                    {columns.map((col, i) => (
                        <th
                            key={col.key || col.label || i}
                            className={`py-3 px-6 text-xs font-extrabold text-gray-500 dark:text-zinc-400 uppercase tracking-wider ${col.thClassName || col.className || ''}`}
                        >
                            {col.label}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800/80">
                {paginatedData.length === 0 ? (
                    <tr>
                        <td colSpan={columns.length}>
                            {emptyState || (
                                <div className="py-16 text-center text-sm text-gray-400 dark:text-zinc-500">
                                    Tidak ada data untuk ditampilkan.
                                </div>
                            )}
                        </td>
                    </tr>
                ) : paginatedData.map((row, idx) => (
                    <tr
                        key={row[keyField] ?? idx}
                        className="hover:bg-gray-50/50 dark:hover:bg-zinc-900/40 transition-colors h-12"
                    >
                        {columns.map((col, ci) => {
                            const isNo = col.key === 'no';
                            return (
                                <td
                                    key={col.key || col.label || ci}
                                    className={`py-2 px-6 whitespace-nowrap ${isNo ? '' : 'truncate'} text-sm dark:text-zinc-300 ${col.tdClassName || col.className || ''}`}
                                >
                                    {col.render ? col.render(row, startIndex + idx) : (row[col.key] ?? '-')}
                                </td>
                            );
                        })}
                    </tr>
                ))}
            </tbody>
        </table>
    );

    const paginationContent = hasPagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-3 border-t border-gray-100 dark:border-zinc-800 shrink-0 bg-white dark:bg-zinc-900">
            <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400">
                Menampilkan {startIndex + 1}–{Math.min(startIndex + effectiveItemsPerPage, data.length)} dari {data.length} data
            </p>
            <div className="flex items-center gap-1">
                <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                >
                    ‹ Prev
                </button>
                {getPageNumbers().map(pageNum => (
                    <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 text-xs font-bold rounded-lg transition cursor-pointer ${
                            currentPage === pageNum
                                ? 'bg-gray-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                                : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
                        }`}
                    >
                        {pageNum}
                    </button>
                ))}
                <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                >
                    Next ›
                </button>
            </div>
        </div>
    );

    if (isScrollable) {
        return (
            <div className="w-full flex-1 flex flex-col overflow-hidden min-h-0">
                <div className="overflow-y-auto" style={{ maxHeight }}>
                    {tableContent}
                </div>
                {paginationContent}
            </div>
        );
    }

    return (
        <div className="w-full flex-1 flex flex-col justify-between overflow-hidden min-h-0">
            <div className="w-full flex-1 min-h-0 overflow-auto">
                {tableContent}
            </div>
            {paginationContent}
        </div>
    );
}
