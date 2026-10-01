import Swal from 'sweetalert2';

const SUCCESS_TOAST = {
    icon: 'success',
    timer: 1500,
    showConfirmButton: false,
    toast: true,
    position: 'top-end',
};

const ERROR_DEFAULTS = {
    icon: 'error',
    title: 'Gagal',
    confirmButtonColor: '#3085d6',
};

const CONFIRM_DEFAULTS = {
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText: 'Ya',
    cancelButtonText: 'Batal',
};

const WARNING_DEFAULTS = {
    icon: 'warning',
    confirmButtonColor: '#3085d6',
};

/**
 * Success toast — muncul 1.5 detik di pojok kanan atas.
 */
export function alertSuccess(title) {
    return Swal.fire({ ...SUCCESS_TOAST, title });
}

/**
 * Error modal — popup dengan tombol OK.
 */
export function alertError(text) {
    return Swal.fire({ ...ERROR_DEFAULTS, text });
}

/**
 * Confirm dialog — return true/false.
 * Support params tambahan: html, preConfirm, confirmButtonText, cancelButtonText, icon, dll.
 */
export async function alertConfirm(title, text, options = {}) {
    const result = await Swal.fire({ ...CONFIRM_DEFAULTS, title, text, ...options });
    return result.isConfirmed;
}

/**
 * Warning modal — popup dengan tombol OK.
 */
export function alertWarning(title, text, options = {}) {
    return Swal.fire({ ...WARNING_DEFAULTS, title, text, ...options });
}
