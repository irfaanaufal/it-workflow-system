import Icon from './Icon';
import { STATUS } from './constants';

export default function UatBanner({ ticket, currentKaryawanId, onOpenUat }) {
    if (ticket.status !== STATUS.TESTING || ticket.karyawan_id !== currentKaryawanId) {
        return null;
    }

    return (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-5 mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <Icon name="flask" className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <div>
                    <p className="text-xs font-bold text-indigo-900 dark:text-indigo-400">Konfirmasi Pengujian (UAT)</p>
                    <p className="text-[11px] text-indigo-950/60 dark:text-zinc-400">Laporan telah selesai. Periksa hasil dan berikan tanggapan.</p>
                </div>
            </div>
            <button
                onClick={onOpenUat}
                className="bg-[#0070f3] hover:bg-blue-600 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-sm transition cursor-pointer shrink-0"
            >
                Konfirmasi
            </button>
        </div>
    );
}
