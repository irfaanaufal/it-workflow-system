import React, { useEffect, useState, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const SHORT_MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MEI', 'JUN', 'JUL', 'AGU', 'SEP', 'OKT', 'NOV', 'DES'];
const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const CATEGORY_CONFIG = [
    { key: 'new system', label: 'New System', track: 'bg-emerald-100 dark:bg-emerald-950/30', fill: 'bg-emerald-500', dot: 'border-emerald-500' },
    { key: 'add feature', label: 'Add Feature', track: 'bg-amber-100 dark:bg-amber-950/30', fill: 'bg-amber-400', dot: 'border-amber-400' },
    { key: 'maintenance', label: 'Maintenance', track: 'bg-sky-100 dark:bg-sky-950/30', fill: 'bg-sky-400', dot: 'border-sky-400' },
    { key: 'fix bug', label: 'Fix Bug', track: 'bg-rose-100 dark:bg-rose-950/30', fill: 'bg-rose-500', dot: 'border-rose-500' },
];

const STATUS_CONFIG = [
    { key: 'inbox', label: 'Inbox', color: '#94a3b8', cls: 'bg-slate-400' },
    { key: 'review', label: 'Review', color: '#f59e0b', cls: 'bg-amber-500' },
    { key: 'to_do', label: 'To Do', color: '#38bdf8', cls: 'bg-sky-400' },
    { key: 'in_progress', label: 'Progress', color: '#6366f1', cls: 'bg-indigo-500' },
    { key: 'testing', label: 'Testing', color: '#8b5cf6', cls: 'bg-violet-500' },
    { key: 'approved', label: 'Approved', color: '#10b981', cls: 'bg-emerald-500' },
];

export default function UserDashboard({ stats, statusCounts, recentTickets, timeline, tickets = [] }) {
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const handler = (e) => {
            console.log('Real-time status update received on Dashboard:', e.detail.ticket);
            router.reload({ only: ['stats', 'statusCounts', 'recentTickets', 'timeline', 'tickets'] });
        };

        window.addEventListener('ticket-status-updated', handler);
        return () => window.removeEventListener('ticket-status-updated', handler);
    }, []);

    const now = new Date();
    const initialYear = now.getFullYear();
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
    const [selectedYear, setSelectedYear] = useState(initialYear);
    const [selectedDay, setSelectedDay] = useState(null);

    const years = useMemo(() => {
        const allYears = tickets
            .map(t => new Date(t.created_at).getFullYear())
            .filter(Boolean);
        return Array.from(new Set([initialYear, ...allYears])).sort((a, b) => b - a);
    }, [tickets, initialYear]);

    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();
    const calendarDays = [
        ...Array(firstDay).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (calendarDays.length % 7 !== 0) calendarDays.push(null);

    const monthTickets = useMemo(() => tickets.filter(ticket => {
        const date = new Date(ticket.created_at);
        return date.getFullYear() === selectedYear && date.getMonth() === selectedMonth;
    }), [tickets, selectedMonth, selectedYear]);

    const filteredTickets = useMemo(() => {
        let list = monthTickets;
        if (selectedDay) {
            list = list.filter(ticket => new Date(ticket.created_at).getDate() === selectedDay);
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            list = list.filter(t =>
                t.judul_laporan?.toLowerCase().includes(q) ||
                t.kondisi_lapangan?.toLowerCase().includes(q) ||
                t.kategori_laporan?.toLowerCase().includes(q) ||
                t.status?.toLowerCase().includes(q)
            );
        }
        return list;
    }, [monthTickets, selectedDay, searchQuery]);

    const dailyData = useMemo(() => {
        const totals = Array(daysInMonth).fill(0);
        monthTickets.forEach(ticket => {
            const day = new Date(ticket.created_at).getDate();
            totals[day - 1] += 1;
        });
        return totals;
    }, [monthTickets, daysInMonth]);

    const projectBars = useMemo(() => {
        const total = filteredTickets.length;
        return CATEGORY_CONFIG.map(item => {
            const count = filteredTickets.filter(t => t.kategori_laporan === item.key).length;
            return {
                ...item,
                count,
                pct: total > 0 ? Math.round((count / total) * 100) : 0,
            };
        });
    }, [filteredTickets]);

    const taskSegments = useMemo(() => {
        const total = filteredTickets.length;
        return STATUS_CONFIG.map(status => ({
            ...status,
            count: filteredTickets.filter(t => t.status === status.key).length,
            total,
        })).filter(item => item.count > 0);
    }, [filteredTickets]);

    const activeRequests = useMemo(() => {
        return filteredTickets.filter(t => t.status !== 'approved').slice(0, 5);
    }, [filteredTickets]);

    const changeMonth = (delta) => {
        const next = new Date(selectedYear, selectedMonth + delta, 1);
        setSelectedYear(next.getFullYear());
        setSelectedMonth(next.getMonth());
        setSelectedDay(null);
    };

    const lineChart = buildLineChart(dailyData);
    const selectedLabel = selectedDay
        ? `${selectedDay} ${MONTHS[selectedMonth]} ${selectedYear}`
        : `${MONTHS[selectedMonth]} ${selectedYear}`;

    return (
        <AuthenticatedLayout
            title="Dashboard Saya"
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
        >
            <Head title="Dashboard Saya" />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 py-4 lg:h-full lg:min-h-0 flex-1">
                {/* Left Area (Line Chart & Stats) */}
                <div className="lg:col-span-3 flex flex-col gap-4 lg:h-full">
                    {/* Monthly Activity Card */}
                    <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between flex-1">
                        <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
                            <div>
                                <h2 className="text-sm font-bold text-gray-800 dark:text-zinc-100">Aktivitas Laporan Saya</h2>
                                <p className="text-[10px] font-semibold text-gray-400 dark:text-zinc-500 mt-0.5">{selectedLabel}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <select
                                    value={selectedMonth}
                                    onChange={e => { setSelectedMonth(Number(e.target.value)); setSelectedDay(null); }}
                                    className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border-none rounded-lg py-1 px-2.5 focus:ring-0 cursor-pointer outline-none"
                                >
                                    {MONTHS.map((month, index) => <option value={index} key={month}>{month}</option>)}
                                </select>
                                <select
                                    value={selectedYear}
                                    onChange={e => { setSelectedYear(Number(e.target.value)); setSelectedDay(null); }}
                                    className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 border-none rounded-lg py-1 px-2.5 focus:ring-0 cursor-pointer outline-none"
                                >
                                    {years.map(year => <option value={year} key={year}>{year}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Line Chart */}
                        <div className="flex-1 min-h-[150px] relative w-full mt-2">
                            <svg viewBox="0 0 800 220" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                                <defs>
                                    <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.18" />
                                        <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                                <line x1="0" y1="190" x2="800" y2="190" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="6,4" />
                                {lineChart.path ? (
                                    <>
                                        <path d={lineChart.area} fill="url(#cg)" />
                                        <path d={lineChart.path} fill="none" stroke="#4f46e5" strokeWidth="4" strokeLinecap="round" />
                                        {lineChart.points.map((point, index) => (
                                            <circle key={index} cx={point.x} cy={point.y} r="3" fill="#4f46e5" />
                                        ))}
                                    </>
                                ) : null}
                            </svg>
                        </div>
                        <div className="flex justify-between text-[9px] font-bold text-gray-400 dark:text-zinc-600 mt-1.5 px-1">
                            {[1, Math.ceil(daysInMonth / 4), Math.ceil(daysInMonth / 2), Math.ceil(daysInMonth * 3 / 4), daysInMonth].map(day => (
                                <span key={day}>{day} {SHORT_MONTHS[selectedMonth]}</span>
                            ))}
                        </div>
                    </div>

                    {/* Project & Task Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:h-[240px] shrink-0">
                        {/* Category Progress Bars */}
                        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-gray-800 dark:text-zinc-100">Kategori Laporan</h3>
                                <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500">{filteredTickets.length} tiket</span>
                            </div>
                            <div className="space-y-4">
                                {projectBars.map(b => (
                                    <div key={b.label} className="flex items-center gap-3">
                                        <span className="text-xs font-semibold text-gray-650 dark:text-zinc-400 w-24 shrink-0">{b.label}</span>
                                        <div className={`flex-1 ${b.track} h-2 rounded-full relative`}>
                                            <div className={`${b.fill} h-2 rounded-full transition-all duration-500`} style={{ width: `${b.pct}%` }} />
                                            <div className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white dark:bg-zinc-900 border-2 ${b.dot} transition-all duration-500`} style={{ left: `calc(${b.pct}% - 6px)` }} />
                                        </div>
                                        <span className="text-xs font-bold text-gray-700 dark:text-zinc-300 w-12 text-right">{b.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Status Task Pie Chart */}
                        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-gray-800 dark:text-zinc-100">Status Laporan</h3>
                                <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500">Status</span>
                            </div>
                            <div className="flex-1 grid grid-cols-[120px_1fr] items-center gap-4 min-h-0">
                                <PieChart segments={taskSegments} />
                                <div className="space-y-2 overflow-y-auto max-h-[150px] pr-1">
                                    {taskSegments.length === 0 ? (
                                        <p className="text-xs font-semibold text-gray-400 dark:text-zinc-500">Belum ada data pada filter ini.</p>
                                    ) : taskSegments.map(item => (
                                        <div key={item.key} className="flex items-center justify-between gap-3 text-xs">
                                            <span className="flex items-center gap-2 min-w-0 text-gray-600 dark:text-zinc-400 font-semibold">
                                                <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${item.cls}`} />
                                                <span className="truncate">{item.label}</span>
                                            </span>
                                            <span className="font-bold text-gray-800 dark:text-zinc-200">{item.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Area (Calendar & Active Tickets List) */}
                <div className="lg:col-span-1 flex flex-col gap-4 lg:h-full">
                    {/* Calendar date picker */}
                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm shrink-0">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xs font-bold text-gray-700 dark:text-zinc-300">Pilih Tanggal</h3>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">{MONTHS[selectedMonth]} {selectedYear}</span>
                                <div className="flex gap-0.5 text-gray-400 dark:text-zinc-600">
                                    <button onClick={() => changeMonth(-1)} className="hover:text-gray-600 dark:hover:text-zinc-300 p-0.5 cursor-pointer" type="button">
                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                                    </button>
                                    <button onClick={() => changeMonth(1)} className="hover:text-gray-600 dark:hover:text-zinc-300 p-0.5 cursor-pointer" type="button">
                                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setSelectedDay(null)}
                            className={`mb-2 w-full text-[10px] font-bold rounded-lg py-1 transition cursor-pointer ${selectedDay ? 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-zinc-700' : 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'}`}
                            type="button"
                        >
                            Semua tanggal
                        </button>
                        <div className="grid grid-cols-7 gap-y-1 text-center text-[9px] leading-tight">
                            {DAYS.map(d => <span key={d} className="text-gray-400 dark:text-zinc-600 font-bold">{d}</span>)}
                            {calendarDays.map((day, i) => (
                                <button
                                    key={`${day}-${i}`}
                                    onClick={() => day && setSelectedDay(day)}
                                    disabled={!day}
                                    className={`py-1 font-bold rounded-lg transition disabled:text-transparent disabled:cursor-default ${day ? 'cursor-pointer text-gray-700 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800' : ''} ${day === selectedDay ? 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 ring-1 ring-indigo-300 dark:ring-indigo-700' : ''}`}
                                    type="button"
                                >
                                    {day || ''}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Active Requests List */}
                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col flex-1 min-h-0">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-bold text-gray-800 dark:text-zinc-100">Laporan Aktif</h3>
                            <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500">{selectedLabel}</span>
                        </div>
                        <div className="space-y-2 flex-1 overflow-y-auto lg:max-h-none max-h-48 pr-1">
                            {activeRequests.length === 0 ? (
                                <p className="text-xs text-gray-450 dark:text-zinc-500 py-6 text-center">Tidak ada laporan aktif pada filter ini.</p>
                            ) : activeRequests.map(t => (
                                <div key={t.id} className="p-3 bg-gray-50/80 dark:bg-zinc-800/80 border border-gray-150 dark:border-zinc-700/60 rounded-xl flex items-center justify-between gap-2 hover:shadow-xs transition">
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-bold text-gray-900 dark:text-zinc-100 text-xs truncate">{t.judul_laporan}</h4>
                                        <div className="flex gap-1 text-[9px] text-gray-400 dark:text-zinc-500 font-semibold mt-0.5">
                                            <span className="uppercase font-bold text-gray-500 dark:text-zinc-400">{t.kategori_laporan}</span>
                                            <span>-</span>
                                            <span className="truncate">{t.admin_it?.nama_karyawan ? `PIC: ${t.admin_it.nama_karyawan.split(' ')[0]}` : 'Belum ada PIC'}</span>
                                        </div>
                                    </div>
                                    <Link href={route('tickets.detail', t.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] py-1 px-2.5 rounded-lg shadow-xs transition whitespace-nowrap shrink-0">
                                        Detail
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function buildLineChart(data) {
    if (!data.length) return { path: '', area: '', points: [] };
    const maxVal = Math.max(...data, 1);
    const width = 800;
    const baseY = 190;
    const chartHeight = 160;
    const points = data.map((val, idx) => ({
        x: data.length === 1 ? 0 : (idx * width) / (data.length - 1),
        y: baseY - (val / maxVal) * chartHeight,
    }));

    let path = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
        const current = points[i];
        const next = points[i + 1];
        const middle = (next.x - current.x) / 2;
        path += ` C ${current.x + middle},${current.y} ${current.x + middle},${next.y} ${next.x},${next.y}`;
    }

    return {
        path,
        area: `${path} L ${width},${baseY} L 0,${baseY} Z`,
        points,
    };
}

function PieChart({ segments }) {
    const total = segments.reduce((sum, item) => sum + item.count, 0);
    let offset = 25;

    if (total === 0) {
        return (
            <div className="h-[120px] w-[120px] rounded-full border-[18px] border-gray-100 dark:border-zinc-800 flex items-center justify-center">
                <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500">0</span>
            </div>
        );
    }

    return (
        <div className="relative h-[120px] w-[120px]">
            <svg viewBox="0 0 42 42" className="h-full w-full -rotate-90">
                <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#e5e7eb" strokeWidth="7" />
                {segments.map(segment => {
                    const pct = (segment.count / total) * 100;
                    const circle = (
                        <circle
                            key={segment.key}
                            cx="21"
                            cy="21"
                            r="15.915"
                            fill="transparent"
                            stroke={segment.color}
                            strokeWidth="7"
                            strokeDasharray={`${pct} ${100 - pct}`}
                            strokeDashoffset={offset}
                            strokeLinecap="butt"
                        />
                    );
                    offset -= pct;
                    return circle;
                })}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-black text-gray-900 dark:text-zinc-100">{total}</span>
                <span className="text-[9px] font-bold text-gray-400 dark:text-zinc-500 uppercase">Laporan</span>
            </div>
        </div>
    );
}