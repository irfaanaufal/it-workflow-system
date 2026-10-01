import React from 'react';

export default function FilterDropdown({
    filterOpen,
    setFilterOpen,
    filterRef,
    statusFilter,
    setStatusFilter,
    filterCategory,
    setFilterCategory,
    filterUrgency,
    setFilterUrgency,
    filterDivisi,
    setFilterDivisi,
    divisiOptions,
    filterStatus,
    setFilterStatus,
    dateRangeType,
    setDateRangeType,
    dateRangeLabel,
    setDateRangeLabel,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
}) {
    return (
        <div className="relative" ref={filterRef}>
            <button onClick={() => setFilterOpen(p => !p)} title="Filter Data"
                className={`h-9 w-9 md:h-10 md:w-10 bg-white dark:bg-zinc-900 hover:bg-gray-100 dark:hover:bg-zinc-800 border border-gray-200 dark:border-zinc-800 rounded-xl flex items-center justify-center text-gray-500 dark:text-zinc-400 shadow-sm transition cursor-pointer shrink-0 ${filterOpen ? 'ring-2 ring-indigo-500/20 border-indigo-400' : ''}`}>
                <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
            </button>
            {filterOpen && (
                <div className="fixed left-4 right-4 top-[64px] sm:absolute sm:left-auto sm:right-0 sm:top-[calc(100%+10px)] sm:w-64 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-xl z-50 p-4 space-y-4">
                    {route().current('admin.applications.requests') && (
                        <div>
                            <label className="block text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Status</label>
                            <div className="inline-flex rounded-lg border border-gray-200 dark:border-zinc-800 p-0.5 bg-gray-50 dark:bg-zinc-900 w-full">
                                {['all', 'pending', 'active'].map(s => (
                                    <button key={s}
                                        onClick={() => setStatusFilter(s)}
                                        className={`flex-1 px-2 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                                            statusFilter === s
                                                ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-sm'
                                                : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200'
                                        }`}
                                    >
                                        {s === 'all' ? 'Semua' : s === 'pending' ? 'Pending' : 'Aktif'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {route().current('history') && (
                        <>
                            <div>
                                <label className="block text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Status</label>
                                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                                    className="w-full text-xs border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-800 dark:text-white rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer">
                                    <option value="all">Semua Status</option>
                                    <option value="inbox">Menunggu Antrian</option>
                                    <option value="review">Sedang Review</option>
                                    <option value="to_do">Antrean Kerja</option>
                                    <option value="in_progress">Dikerjakan</option>
                                    <option value="testing">Pengujian</option>
                                    <option value="approved">Selesai</option>
                                    <option value="rejected">Ditolak</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Kategori</label>
                                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                                    className="w-full text-xs border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-800 dark:text-white rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer">
                                    <option value="all">Semua Kategori</option>
                                    <option value="new system">New System</option>
                                    <option value="add feature">Add Feature</option>
                                    <option value="fix bug">Fix Bug</option>
                                    <option value="maintenance">Maintenance</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Urgensi</label>
                                <select value={filterUrgency} onChange={e => setFilterUrgency(e.target.value)}
                                    className="w-full text-xs border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-800 dark:text-white rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer">
                                    <option value="all">Semua Urgensi</option>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="blocker">Blocker</option>
                                </select>
                            </div>
                        </>
                    )}
                    {route().current('admin.karyawan.index') && (
                        <>
                            <div>
                                <label className="block text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Divisi</label>
                                <select value={filterDivisi} onChange={e => setFilterDivisi(e.target.value)}
                                    className="w-full text-xs border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-800 dark:text-white rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer">
                                    <option value="all">Semua Divisi</option>
                                    {divisiOptions.map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">Status</label>
                                <div className="inline-flex rounded-lg border border-gray-200 dark:border-zinc-800 p-0.5 bg-gray-50 dark:bg-zinc-900 w-full">
                                    {['all', 'Active', 'Inactive'].map(s => (
                                        <button key={s}
                                            onClick={() => setFilterStatus(s)}
                                            className={`flex-1 px-2 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                                                filterStatus === s
                                                    ? 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white shadow-sm'
                                                    : 'text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200'
                                            }`}
                                        >
                                            {s === 'all' ? 'Semua' : s}
                                        </button>
                                     ))}
                                </div>
                            </div>
                        </>
                    )}
                    {!route().current('admin.karyawan.index') && (
                    <>
                    <div>
                        <label className="block text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                            {route().current('admin.systems.index') ? 'Waktu Registrasi' : 'Waktu Laporan'}
                        </label>
                        <select value={dateRangeType} onChange={e => {
                            const type = e.target.value;
                            setDateRangeType(type);
                            if (type !== 'custom') {
                                const labels = {
                                    all: 'Semua Waktu',
                                    this_month: 'Bulan Ini',
                                    last_30_days: '30 Hari Terakhir',
                                    this_year: 'Tahun Ini'
                                };
                                setDateRangeLabel(labels[type] || 'Semua Waktu');
                                setStartDate('');
                                setEndDate('');
                            }
                        }}
                            className="w-full text-xs border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-800 dark:text-white rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer">
                            <option value="all">Semua Waktu</option>
                            <option value="this_month">Bulan Ini</option>
                            <option value="last_30_days">30 Hari Terakhir</option>
                            <option value="this_year">Tahun Ini</option>
                            <option value="custom">Kustom Tanggal...</option>
                        </select>
                    </div>

                    {dateRangeType === 'custom' && (
                        <div className="pt-3 border-t border-gray-100 dark:border-zinc-800/80 space-y-2 mt-1 animate-fadeIn">
                            <div>
                                <label className="block text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Mulai</label>
                                <input type="date" value={startDate} onChange={e => {
                                    setStartDate(e.target.value);
                                    const lbl = `${e.target.value || '?'} - ${endDate || '?'}`;
                                    setDateRangeLabel(lbl);
                                }} className="w-full text-xs border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-800 dark:text-white rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Sampai</label>
                                <input type="date" value={endDate} onChange={e => {
                                    setEndDate(e.target.value);
                                    const lbl = `${startDate || '?'} - ${e.target.value || '?'}`;
                                    setDateRangeLabel(lbl);
                                }} className="w-full text-xs border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-800 dark:text-white rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none" />
                            </div>
                        </div>
                    )}
                    </>
                    )}
                </div>
            )}
        </div>
    );
}
