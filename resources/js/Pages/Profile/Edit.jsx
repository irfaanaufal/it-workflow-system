import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import { Transition } from '@headlessui/react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useRef, useState } from 'react';
import axios from 'axios';
import { Camera, Loader2 } from 'lucide-react';

const INPUT_CLASS =
    'w-full rounded-md border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-neutral-900 placeholder-neutral-300 outline-none transition-all focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-[#2d2d2d] dark:text-neutral-50 dark:placeholder-neutral-500 dark:focus:border-white dark:focus:ring-white';

const READONLY_CLASS =
    'w-full rounded-md border border-neutral-200 bg-white px-3.5 py-2.5 text-sm font-semibold capitalize text-neutral-800 outline-none dark:border-neutral-700 dark:bg-[#2d2d2d] dark:text-neutral-200';

const BTN_DARK =
    'rounded-lg bg-neutral-900 text-xs font-bold text-white shadow-sm transition-all hover:bg-neutral-800 active:scale-[0.98] disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100';

const MAX_PHOTO_BYTES = 3000 * 1024;
const ALLOWED_PHOTO_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
];

function Card({ title, action, children, className = '' }) {
    return (
        <div
            className={`flex flex-col rounded-lg border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-[#1e1e1e] ${className}`}
        >
            <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold tracking-tight text-gray-900 dark:text-white">
                    {title}
                </h3>
                {action}
            </div>
            {children}
        </div>
    );
}

function Field({ label, htmlFor, error, children }) {
    return (
        <div>
            <label
                htmlFor={htmlFor}
                className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-400"
            >
                {label}
            </label>
            {children}
            <InputError
                className="mt-1.5 text-[10px] font-bold text-red-500"
                message={error}
            />
        </div>
    );
}

export default function Edit({ stats }) {
    const { auth } = usePage().props;
    const user = auth.user;

    const [photoPreview, setPhotoPreview] = useState(
        user.avatar_url || null,
    );
    const [photoProcessing, setPhotoProcessing] = useState(false);
    const [photoError, setPhotoError] = useState(null);
    const [photoSuccess, setPhotoSuccess] = useState(false);
    const [progress, setProgress] = useState(null);
    const photoInput = useRef();

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
        });

    const submitInfo = (e) => {
        e.preventDefault();
        patch(route('profile.update'), { preserveScroll: true });
    };

    const selectNewPhoto = () => {
        if (photoProcessing) return;
        photoInput.current?.click();
    };

    const handlePhotoChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > MAX_PHOTO_BYTES) {
            setPhotoError('Ukuran file melebihi 3MB (maksimal 3.000 KB).');
            if (photoInput.current) photoInput.current.value = '';
            return;
        }

        if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
            setPhotoError('Format file harus JPEG, PNG, JPG, WEBP, atau GIF.');
            if (photoInput.current) photoInput.current.value = '';
            return;
        }

        setPhotoError(null);
        setPhotoProcessing(true);
        setProgress(null);

        const reader = new FileReader();
        reader.onload = (event) => setPhotoPreview(event.target.result);
        reader.readAsDataURL(file);

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const res = await axios.post(route('profile.avatar'), formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (event) => {
                    if (
                        event &&
                        Number.isFinite(event.loaded) &&
                        Number.isFinite(event.total) &&
                        event.total > 0
                    ) {
                        setProgress(
                            Math.min(
                                100,
                                Math.round((event.loaded / event.total) * 100),
                            ),
                        );
                    } else {
                        setProgress(-1);
                    }
                },
            });

            if (!res.data?.avatar_url) {
                throw new Error('invalid-response');
            }

            setPhotoPreview(res.data.avatar_url);
            setPhotoSuccess(true);
            setTimeout(() => setPhotoSuccess(false), 3000);
            router.reload({ only: ['auth'] });
        } catch (err) {
            setPhotoError(
                err.message === 'invalid-response'
                    ? 'Gagal memperbarui foto.'
                    : err.response?.data?.errors?.avatar?.[0] ||
                          err.response?.data?.message ||
                          'Gagal memperbarui foto.',
            );
            setPhotoPreview(user.avatar_url || null);
        } finally {
            if (photoInput.current) photoInput.current.value = '';
            setPhotoProcessing(false);
            setProgress(null);
        }
    };

    const initials = user.name
        ?.split(' ')
        .slice(0, 2)
        .map((word) => word[0])
        .join('')
        .toUpperCase();

    const statusBadge = user.karyawan?.status;
    const employeeFields = [
        { label: 'FID / ID Karyawan', value: user.fid || '-' },
        { label: 'Role Akses', value: user.role_name || '-' },
        { label: 'Divisi', value: user.divisi || '-' },
        { label: 'Jabatan', value: user.karyawan?.jabatan || '-' },
    ];
    const statItems = [
        { label: 'Total Laporan', value: stats?.total ?? 0 },
        { label: 'Sedang Diproses', value: stats?.proses ?? 0 },
        { label: 'Selesai', value: stats?.selesai ?? 0 },
        { label: 'Ditolak', value: stats?.ditolak ?? 0 },
    ];

    return (
        <AuthenticatedLayout
            title="Pengaturan Profil"
            subtitle="Perbarui informasi akun dan keamanan"
        >
            <Head title="Pengaturan Profil" />

            <div className="w-full max-w-full">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {/* 1 · Foto Profil */}
                    <div className="flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-[#1e1e1e] lg:col-start-1 lg:row-start-1">
                        <div className="h-14 border-b border-neutral-200 dark:border-neutral-800" />

                        <div className="flex flex-1 flex-col px-5 pb-5">
                            <input
                                ref={photoInput}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                className="hidden"
                                onChange={handlePhotoChange}
                            />

                            <div className="-mt-10 flex flex-1 items-stretch gap-5">
                                <div className="group relative aspect-square h-24 shrink-0 lg:h-auto">
                                    <div className="relative h-full w-full overflow-hidden rounded-lg border border-neutral-300 bg-white shadow-sm dark:border-neutral-600 dark:bg-neutral-800">
                                        {photoPreview ? (
                                            <img
                                                src={photoPreview}
                                                alt={user.name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <span className="flex h-full w-full items-center justify-center text-2xl font-black text-neutral-700 dark:text-neutral-200 lg:text-5xl">
                                                {initials}
                                            </span>
                                        )}

                                        {photoProcessing && (
                                            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50">
                                                <Loader2 className="h-6 w-6 animate-spin text-white" />
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={selectNewPhoto}
                                        title="Ganti Foto"
                                        className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-lg bg-black/0 opacity-0 transition hover:bg-black/40 hover:opacity-100 group-focus-within:opacity-100"
                                    >
                                        <Camera className="h-6 w-6 text-white" />
                                    </button>
                                </div>

                                <div className="flex min-w-0 flex-1 flex-col pt-1">
                                    <div className="flex items-center justify-between gap-3">
                                        <h2 className="truncate text-lg font-bold tracking-tight text-gray-900 dark:text-white md:text-xl">
                                            {user.name}
                                        </h2>

                                        <span className="inline-block shrink-0 rounded-md bg-rose-400 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                                            {user.role_name ||
                                                (user.is_it
                                                    ? 'IT Staff'
                                                    : 'Inputer')}
                                        </span>
                                    </div>
                                    <p className="mt-4 truncate text-sm text-gray-500 dark:text-neutral-400">
                                        {user.email}
                                    </p>

                                    <p className="mt-2 text-[10px] leading-relaxed text-neutral-400 dark:text-neutral-500">
                                        Format JPEG, PNG, JPG, WEBP, atau GIF
                                        (Maks. 3MB).
                                    </p>
                                </div>
                            </div>

                            {progress !== null && (
                                <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                                    {progress === -1 ? (
                                        <div className="animate-indeterminate h-full w-1/4 rounded-full bg-neutral-900 dark:bg-white" />
                                    ) : (
                                        <div
                                            className="h-full rounded-full bg-neutral-900 transition-[width] duration-200 dark:bg-white"
                                            style={{ width: `${progress}%` }}
                                        />
                                    )}
                                </div>
                            )}

                            {photoSuccess && (
                                <p className="mt-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                    Foto profil berhasil diperbarui.
                                </p>
                            )}
                            <InputError
                                className="mt-2 text-[10px] font-bold text-red-500"
                                message={photoError}
                            />
                        </div>
                    </div>

                    {/* 2 · Informasi Akun */}
                    <Card
                        title="Informasi Akun"
                        className="lg:col-start-2 lg:row-start-1"
                    >
                        <form
                            onSubmit={submitInfo}
                            className="flex flex-1 flex-col gap-4"
                        >
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <Field
                                    label="Nama Lengkap"
                                    htmlFor="name"
                                    error={errors.name}
                                >
                                    <input
                                        id="name"
                                        type="text"
                                        className={INPUT_CLASS}
                                        value={data.name}
                                        onChange={(e) =>
                                            setData('name', e.target.value)
                                        }
                                        required
                                        autoComplete="name"
                                    />
                                </Field>

                                <Field
                                    label="Alamat Email"
                                    htmlFor="email"
                                    error={errors.email}
                                >
                                    <input
                                        id="email"
                                        type="email"
                                        className={INPUT_CLASS}
                                        value={data.email}
                                        onChange={(e) =>
                                            setData('email', e.target.value)
                                        }
                                        required
                                        autoComplete="username"
                                    />
                                </Field>
                            </div>

                            <div className="mt-auto flex items-center justify-end gap-4 pt-1">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className={`${BTN_DARK} px-5 py-2.5`}
                                >
                                    {processing ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        'Simpan'
                                    )}
                                </button>

                                <Transition
                                    show={recentlySuccessful}
                                    enter="transition ease-in-out"
                                    enterFrom="opacity-0"
                                    leave="transition ease-in-out"
                                    leaveTo="opacity-0"
                                >
                                    <p className="text-xs font-semibold text-neutral-400 dark:text-neutral-400">
                                        Tersimpan.
                                    </p>
                                </Transition>
                            </div>
                        </form>
                    </Card>

                    {/* 3 · Data Kepegawaian */}
                    <Card
                        title="Data Kepegawaian"
                        className="lg:col-start-1 lg:row-start-2"
                        action={
                            statusBadge ? (
                                <span
                                    className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                                        statusBadge === 'Active'
                                            ? 'bg-emerald-500 text-white'
                                            : 'bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300'
                                    }`}
                                >
                                    {statusBadge}
                                </span>
                            ) : null
                        }
                    >
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {employeeFields.map((field, index) => (
                                <Field
                                    key={field.label}
                                    label={field.label}
                                    htmlFor={`emp-${index}`}
                                >
                                    <input
                                        id={`emp-${index}`}
                                        readOnly
                                        value={field.value}
                                        tabIndex={-1}
                                        className={READONLY_CLASS}
                                    />
                                </Field>
                            ))}
                        </div>
                    </Card>

                    {/* 4 · Ubah Password */}
                    <PasswordCard className="lg:col-start-1 lg:row-start-3" />

                    {/* 5 · Statistik */}
                    <Card
                        title="Statistik"
                        className="lg:col-start-2 lg:row-span-2 lg:row-start-2"
                    >
                        <div className="flex flex-1 flex-col gap-3">
                            {statItems.map((item) => (
                                <div
                                    key={item.label}
                                    className="flex flex-1 items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50 px-4 py-3.5 dark:border-neutral-700 dark:bg-[#2a2a2a]"
                                >
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-400">
                                        {item.label}
                                    </span>
                                    <span className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
                                        {item.value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function PasswordCard({ className = '' }) {
    const passwordInput = useRef();
    const currentPasswordInput = useRef();

    const {
        data,
        setData,
        put,
        reset,
        errors,
        processing,
        recentlySuccessful,
    } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword = (e) => {
        e.preventDefault();

        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (formErrors) => {
                if (formErrors.password) {
                    reset('password', 'password_confirmation');
                    passwordInput.current?.focus();
                }

                if (formErrors.current_password) {
                    reset('current_password');
                    currentPasswordInput.current?.focus();
                }
            },
        });
    };

    return (
        <Card title="Ubah Password" className={className}>
            <form
                onSubmit={updatePassword}
                className="flex flex-1 flex-col gap-4"
            >
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field
                        label="Password Sekarang"
                        htmlFor="current_password"
                        error={errors.current_password}
                    >
                        <input
                            id="current_password"
                            ref={currentPasswordInput}
                            value={data.current_password}
                            onChange={(e) =>
                                setData('current_password', e.target.value)
                            }
                            type="password"
                            className={INPUT_CLASS}
                            autoComplete="current-password"
                        />
                    </Field>

                    <Field
                        label="Password Baru"
                        htmlFor="password"
                        error={errors.password}
                    >
                        <input
                            id="password"
                            ref={passwordInput}
                            value={data.password}
                            onChange={(e) =>
                                setData('password', e.target.value)
                            }
                            type="password"
                            className={INPUT_CLASS}
                            autoComplete="new-password"
                        />
                    </Field>

                    <div className="md:col-span-2">
                        <Field
                            label="Konfirmasi Password"
                            htmlFor="password_confirmation"
                            error={errors.password_confirmation}
                        >
                            <input
                                id="password_confirmation"
                                value={data.password_confirmation}
                                onChange={(e) =>
                                    setData(
                                        'password_confirmation',
                                        e.target.value,
                                    )
                                }
                                type="password"
                                className={INPUT_CLASS}
                                autoComplete="new-password"
                            />
                        </Field>
                    </div>
                </div>

                <div className="mt-auto flex items-center gap-4 pt-1">
                    <button
                        type="submit"
                        disabled={processing}
                        className={`${BTN_DARK} px-5 py-2.5`}
                    >
                        {processing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            'Perbarui Password'
                        )}
                    </button>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-xs font-semibold text-neutral-400 dark:text-neutral-400">
                            Tersimpan.
                        </p>
                    </Transition>
                </div>
            </form>
        </Card>
    );
}
