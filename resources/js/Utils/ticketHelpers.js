/**
 * Helper untuk menentukan warna latar belakang dan border kartu berdasarkan Kategori Laporan.
 * Menggunakan warna pastel yang lembut (soft).
 */
export function getCategoryStyles(category) {
    switch (category?.toLowerCase()) {
        case 'new system':
            return 'bg-[#d5ebd5] text-[#14532d] border-[#bbf7d0]';
        case 'add feature':
            return 'bg-[#fbf1d5] text-[#78350f] border-[#fef08a]';
        case 'maintenance':
            return 'bg-[#d5e6fb] text-[#1e3a8a] border-[#bfdbfe]';
        case 'fix bug':
            return 'bg-[#ffd5e5] text-[#881337] border-[#fecdd3]';
        default:
            return 'bg-gray-100 text-gray-800 border-gray-200';
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
