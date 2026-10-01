/**
 * Helper untuk menentukan warna latar belakang dan border kartu berdasarkan Kategori Laporan.
 * Menggunakan warna pastel yang lembut (soft).
 */
export function getCategoryStyles(category) {
    switch (category?.toLowerCase()) {
        case 'new system':
            return 'bg-[#d5ebd5] text-[#14532d] border-[#bbf7d0] dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/50';
        case 'add feature':
            return 'bg-[#fbf1d5] text-[#78350f] border-[#fef08a] dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/50';
        case 'maintenance':
            return 'bg-[#d5e6fb] text-[#1e3a8a] border-[#bfdbfe] dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800/50';
        case 'fix bug':
            return 'bg-[#ffd5e5] text-[#881337] border-[#fecdd3] dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800/50';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700';
    }
}

/**
 * Helper untuk menentukan warna badge skala Urgensi.
 * Menggunakan warna solid dan kontras tinggi sesuai mockup.
 */
export function getUrgencyBadgeStyles(urgency) {
    switch (urgency?.toLowerCase()) {
        case 'blocker':
            return 'bg-[#dc2626] text-white font-bold text-[9px] px-2 py-0.5 rounded';
        case 'high':
            return 'bg-[#f43f5e] text-white font-bold text-[9px] px-2 py-0.5 rounded';
        case 'medium':
            return 'bg-[#d97706] text-white font-bold text-[9px] px-2 py-0.5 rounded';
        case 'low':
            return 'bg-[#15803d] text-white font-bold text-[9px] px-2 py-0.5 rounded';
        default:
            return 'bg-gray-500 text-white font-bold text-[9px] px-2 py-0.5 rounded';
    }
}

/**
 * Format tanggal deadline "YYYY-MM-DD" menjadi "DD/MM/YY".
 * Contoh: "2026-08-20" -> "20/08/26"
 */
export function formatDateShort(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-').map(Number);
    if (!y || !m || !d) return dateStr;
    const dd = String(d).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    const yy = String(y).slice(-2);
    return `${dd}/${mm}/${yy}`;
}

/**
 * Cek apakah deadline sudah lewat (overdue).
 * Tiket yang sudah approved tidak dianggap terlambat.
 */
export function isDeadlineOverdue(deadline, status) {
    if (!deadline || status === 'approved') return false;
    const [y, m, d] = deadline.split('-').map(Number);
    if (!y || !m || !d) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(y, m - 1, d) < today;
}

/**
 * Urutkan tiket berdasarkan urgensi: blocker > high > medium > low.
 */
export function sortByUrgency(tickets) {
    const urgencyOrder = { blocker: 0, high: 1, medium: 2, low: 3 };
    return [...tickets].sort((a, b) => {
        const urgencyA = urgencyOrder[a.urgensi_laporan] ?? 4;
        const urgencyB = urgencyOrder[b.urgensi_laporan] ?? 4;
        return urgencyA - urgencyB;
    });
}

/**
 * Tanggal hari ini dalam format "YYYY-MM-DD" (timezone lokal, bukan UTC).
 */
export function todayLocalDate() {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
}

/**
 * Helper untuk menentukan warna badge Target Penyelesaian.
 * Merah jika terlambat, abu jika masih dalam waktu.
 */
export function getDeadlineBadgeStyles(deadline, status) {
    if (!deadline) return '';
    return isDeadlineOverdue(deadline, status)
        ? 'bg-[#dc2626] text-white font-bold text-[9px] px-2 py-0.5 rounded'
        : 'bg-gray-600 text-white font-bold text-[9px] px-2 py-0.5 rounded';
}

/**
 * Status ticket — label Indonesia + warna dot.
 * Gunakan di badge, dropdown, kanban, dashboard, dll.
 */
export const STATUS_CONFIG = {
    inbox:       { label: 'Menunggu Antrian', color: 'bg-slate-500 text-white' },
    review:      { label: 'Sedang Review',    color: 'bg-amber-500 text-white' },
    to_do:       { label: 'Antrean Kerja',    color: 'bg-sky-500 text-white' },
    in_progress: { label: 'Dikerjakan',       color: 'bg-indigo-500 text-white' },
    testing:     { label: 'Pengujian',        color: 'bg-violet-500 text-white' },
    approved:    { label: 'Selesai',          color: 'bg-emerald-500 text-white' },
    rejected:    { label: 'Ditolak',          color: 'bg-rose-500 text-white' },
};
