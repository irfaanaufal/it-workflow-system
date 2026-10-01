import React, { useState, useMemo } from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SimpleLineChart from '@/Components/SimpleLineChart';
import { STATUS_CONFIG } from '@/Utils/ticketHelpers';
import { STATUS, CATEGORY } from '@/Components/ticket/constants';

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const CATEGORY_CONFIG = [
    { key: CATEGORY.NEW_SYSTEM, label: 'New System', track: 'bg-emerald-100 dark:bg-emerald-950/30', fill: 'bg-emerald-500', dot: 'border-emerald-500' },
    { key: CATEGORY.ADD_FEATURE, label: 'Add Feature', track: 'bg-amber-100 dark:bg-amber-950/30', fill: 'bg-amber-400', dot: 'border-amber-400' },
    { key: CATEGORY.MAINTENANCE, label: 'Maintenance', track: 'bg-sky-100 dark:bg-sky-950/30', fill: 'bg-sky-400', dot: 'border-sky-400' },
    { key: CATEGORY.FIX_BUG, label: 'Fix Bug', track: 'bg-rose-100 dark:bg-rose-950/30', fill: 'bg-rose-500', dot: 'border-rose-500' },
];

const STATUS_HEX = { inbox: '#94a3b8', review: '#f59e0b', to_do: '#38bdf8', in_progress: '#6366f1', testing: '#8b5cf6', approved: '#10b981', rejected: '#f43f5e' };

export default function UserDashboard({ stats, statusCounts, recentTickets, timeline, tickets = [] }) {
    const [searchQuery, setSearchQuery] = useState('');

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

    const activeChartData = useMemo(() => {
        const counts = {};
        monthTickets.forEach(ticket => {
            const day = new Date(ticket.created_at).getDate();
            counts[day] = (counts[day] || 0) + 1;
        });

        const activeDays = Object.keys(counts).map(Number).sort((a, b) => a - b);
        return activeDays.map(day => ({
            day,
            value: counts[day],
            label: `${day} ${MONTHS[selectedMonth]} ${selectedYear}`,
        }));
    }, [monthTickets, selectedMonth, selectedYear]);

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
        return Object.entries(STATUS_CONFIG).map(([key, status]) => ({
            ...status,
            key,
            cls: status.color,
            color: STATUS_HEX[key] || '#94a3b8',
            count: filteredTickets.filter(t => t.status === key).length,
            total,
        })).filter(item => item.count > 0);
    }, [filteredTickets]);

    const activeRequests = useMemo(() => {
        return filteredTickets.filter(t => t.status !== STATUS.APPROVED).slice(0, 5);
    }, [filteredTickets]);

    const changeMonth = (delta) => {
        const next = new Date(selectedYear, selectedMonth + delta, 1);
        setSelectedYear(next.getFullYear());
        setSelectedMonth(next.getMonth());
        setSelectedDay(null);
    };

    const selectedLabel = selectedDay
        ? `${selectedDay} ${MONTHS[selectedMonth]} ${selectedYear}`
        : `${MONTHS[selectedMonth]} ${selectedYear}`;

    return (
        <AuthenticatedLayout
            title="Dashboard Saya"
            subtitle="Pantau aktivitas laporan pribadi Anda"
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
        >
            <Head title="Dashboard" />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:h-full lg:min-h-0 flex-1">
                {/* Left Area (Line Chart & Stats) */}
                <div className="lg:col-span-3 flex flex-col gap-4 lg:h-full lg:min-h-0">
                    {/* Monthly Activity Card */}
                    <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between flex-1 min-h-0">
                        <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
                            <div>
                                <h2 className="text-sm font-bold text-gray-800 dark:text-zinc-100">Aktivitas Laporan Saya</h2>
                                <p className="text-[10px] font-semibold text-gray-400 dark:text-zinc-500 mt-0.5">{selectedLabel}</p>
                            </div>
                            <div className="flex items-center gap-2.5">
                                <div className="relative">
                                    <select
                                        value={selectedMonth}
                                        onChange={e => { setSelectedMonth(Number(e.target.value)); setSelectedDay(null); }}
                                        className="appearance-none text-xs font-semibold text-gray-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg py-1.5 pl-3 pr-7 shadow-sm hover:shadow-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all duration-200 cursor-pointer outline-none"
                                    >
                                        {MONTHS.map((month, index) => <option value={index} key={month}>{month}</option>)}
                                    </select>
                                    <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 dark:text-zinc-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                                <div className="relative">
                                    <select
                                        value={selectedYear}
                                        onChange={e => { setSelectedYear(Number(e.target.value)); setSelectedDay(null); }}
                                        className="appearance-none text-xs font-semibold text-gray-700 dark:text-zinc-200 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg py-1.5 pl-3 pr-7 shadow-sm hover:shadow-md focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all duration-200 cursor-pointer outline-none"
                                    >
                                        {years.map(year => <option value={year} key={year}>{year}</option>)}
                                    </select>
                                    <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 dark:text-zinc-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Line Chart */}
                        <div className="flex-1 w-full min-h-[180px] relative mt-2 overflow-hidden">
                            <SimpleLineChart
                                className="w-full h-full"
                                data={activeChartData}
                                monthName={MONTHS[selectedMonth]}
                                year={selectedYear}
                                yAxisLabel="Tiket"
                                selectedDay={selectedDay}
                                onSelectDay={setSelectedDay}
                            />
                        </div>
                    </div>

                    {/* Project & Task Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:h-[210px] shrink-0">
                        {/* Category Progress Bars */}
                        <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm flex flex-col">
                            <div className="flex items-center justify-between mb-3.5">
                                <h3 className="text-sm font-bold text-gray-800 dark:text-zinc-100">Kategori Laporan</h3>
                                <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500">{filteredTickets.length} tiket</span>
                            </div>
                            <div className="space-y-3">
                                {projectBars.map(b => (
                                    <div key={b.label} className="flex items-center gap-3">
                                        <span className="text-xs font-semibold text-gray-600 dark:text-zinc-400 w-24 shrink-0">{b.label}</span>
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
                            <div className="flex items-center justify-between mb-3.5">
                                <h3 className="text-sm font-bold text-gray-800 dark:text-zinc-100">Status Laporan</h3>
                                <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500">Status</span>
                            </div>
                            <div className="flex-1 grid grid-cols-[110px_1fr] items-center gap-3 min-h-0">
                                <PieChart segments={taskSegments} />
                                <div className="space-y-1.5 overflow-y-auto max-h-[140px] pr-1">
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
                <div className="lg:col-span-1 flex flex-col gap-4 lg:h-full lg:min-h-0">
                    {/* Calendar date picker */}
                    <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm shrink-0">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xs font-bold text-gray-700 dark:text-zinc-300">Pilih Tanggal</h3>
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-bold text-gray-700 dark:text-zinc-300">{MONTHS[selectedMonth]} {selectedYear}</span>
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
                            className={`mb-2 w-full text-[10px] font-bold rounded-lg py-1 transition cursor-pointer ${selectedDay ? 'bg-gray-200 dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 hover:bg-gray-300 dark:hover:bg-zinc-600' : 'bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300'}`}
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
                                    className={`py-1 font-bold rounded-lg transition disabled:text-transparent disabled:cursor-default ${day ? 'cursor-pointer text-gray-700 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800' : ''} ${day === selectedDay ? 'bg-gray-200 dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 ring-1 ring-gray-300 dark:ring-zinc-600' : ''}`}
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
                                <p className="text-xs text-gray-400 dark:text-zinc-500 py-6 text-center">Tidak ada laporan aktif pada filter ini.</p>
                            ) : activeRequests.map(t => (
                                <div key={t.id} className="p-3 bg-gray-50/80 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700/60 rounded-xl flex items-center justify-between gap-2 hover:shadow-xs transition">
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

function PieChart({ segments }) {
    const total = segments.reduce((sum, item) => sum + item.count, 0);
    let offset = 25;

    if (total === 0) {
        return (
            <div className="h-[108px] w-[108px] rounded-full border-[16px] border-gray-100 dark:border-zinc-800 flex items-center justify-center">
                <span className="text-[10px] font-bold text-gray-400 dark:text-zinc-500">0</span>
            </div>
        );
    }

    return (
        <div className="relative h-[108px] w-[108px]">
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