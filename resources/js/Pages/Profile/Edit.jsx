import React, { useState, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import { Transition } from '@headlessui/react';
import axios from 'axios';

export default function Edit({ mustVerifyEmail, status }) {
    const { auth } = usePage().props;
    const user = auth.user;

    const [avatarPreview, setAvatarPreview] = useState(user.avatar_url || null);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [avatarSuccess, setAvatarSuccess] = useState(false);
    const [avatarError, setAvatarError] = useState('');
    const fileInputRef = useRef();

    /* Avatar Upload */
    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Preview instantly
        setAvatarPreview(URL.createObjectURL(file));
        setAvatarSuccess(false);
        setAvatarError('');
        setAvatarUploading(true);

        const form = new FormData();
        form.append('avatar', file);

        try {
            const res = await axios.post('/profile/avatar', form, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setAvatarPreview(res.data.avatar_url);
            setAvatarSuccess(true);
            router.reload({ only: ['auth'] });
            setTimeout(() => setAvatarSuccess(false), 3000);
        } catch (err) {
            setAvatarError(err.response?.data?.message || 'Gagal mengupload foto.');
            setAvatarPreview(user.avatar_url || null);
        } finally {
            setAvatarUploading(false);
            e.target.value = '';
        }
    };

    const initials = user.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();

    return (
        <AuthenticatedLayout title="Profil Saya">
            <Head title="Profile" />

            <div className="py-4 md:py-6 space-y-4 w-full max-w-full">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                    {/* Left Column */}
                    <div className="space-y-4">

                {/* â”€â”€ Avatar Card â”€â”€ */}
                <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200/80 dark:border-zinc-800 shadow-sm overflow-hidden">
                    {/* Profile header */}
                    <div className="h-20 bg-white dark:bg-zinc-950 border-b border-gray-200 dark:border-zinc-800 relative" />

                    <div className="px-5 md:px-7 pb-6">
                        {/* Avatar positioned over banner */}
                        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-10 mb-4">
                            <div className="relative group">
                                <div className="w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden border-4 border-white dark:border-zinc-950 shadow-sm bg-slate-100 dark:bg-zinc-900 flex items-center justify-center">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-2xl font-black text-slate-700 dark:text-zinc-200">{initials}</span>
                                    )}
                                    {avatarUploading && (
                                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                                            <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                {/* Upload overlay on hover */}
                                {!avatarUploading && (
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute inset-0 bg-black/0 hover:bg-black/40 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                                        title="Ganti Foto"
                                    >
                                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </button>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpg,image/jpeg,image/png,image/webp"
                                    onChange={handleAvatarChange}
                                    className="hidden"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={avatarUploading}
                                className="sm:mb-1 text-xs font-bold text-gray-700 dark:text-zinc-200 hover:text-gray-950 dark:hover:text-white bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800 border border-gray-200 dark:border-zinc-700 px-4 py-2 rounded-lg transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                {avatarUploading ? 'Mengupload...' : 'Ganti Foto'}
                            </button>
                        </div>

                        <div>
                            <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
                            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">{user.email}</p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${user.is_it
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50'
                                    : 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700'
                                    }`}>
                                    {user.is_it ? 'IT Staff' : 'Inputer'}
                                </span>
                                {user.divisi && (
                                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700 uppercase tracking-wide">
                                        {user.divisi}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Feedback messages */}
                        {avatarSuccess && (
                            <div className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                                Foto profil berhasil diperbarui.
                            </div>
                        )}
                        {avatarError && (
                            <p className="mt-3 text-xs text-rose-600 dark:text-rose-400 font-semibold">{avatarError}</p>
                        )}
                    </div>
                </div>

                {/* â”€â”€ Profile Info Card â”€â”€ */}
                <ProfileInfoForm user={user} />
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                        <PasswordForm />

                        <EmployeeDataCard user={user} />

                        <DeleteCard />
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}

/*Profile Info Form */
function ProfileInfoForm({ user }) {
    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: user.name,
        email: user.email,
    });

    return (
        <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200/80 dark:border-zinc-800 shadow-sm p-5 md:p-6">
            <div className="mb-5">
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white">Informasi Akun</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">Perbarui nama dan email akun Anda.</p>
            </div>

            <form onSubmit={e => { e.preventDefault(); patch(route('profile.update')); }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Nama Lengkap" error={errors.name}>
                        <input
                            type="text"
                            value={data.name}
                            onChange={e => setData('name', e.target.value)}
                            className="w-full text-sm border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
                            required
                        />
                    </Field>
                    <Field label="Email" error={errors.email}>
                        <input
                            type="email"
                            value={data.email}
                            onChange={e => setData('email', e.target.value)}
                            className="w-full text-sm border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition"
                            required
                        />
                    </Field>
                </div>

                <div className="flex items-center gap-4 pt-1">
                    <button
                        type="submit"
                        disabled={processing}
                        className="bg-gray-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-bold px-5 py-2.5 rounded-lg shadow-sm transition disabled:opacity-60 cursor-pointer flex items-center gap-2"
                    >
                        {processing ? 'Menyimpan...' : 'Simpan'}
                    </button>
                    <Transition show={recentlySuccessful} enter="transition ease-in-out" enterFrom="opacity-0" leave="transition ease-in-out" leaveTo="opacity-0">
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            Tersimpan.
                        </p>
                    </Transition>
                </div>
            </form>
        </div>
    );
}

/*Password Form*/
function PasswordForm() {
    const { data, setData, put, reset, errors, processing, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    return (
        <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200/80 dark:border-zinc-800 shadow-sm p-5 md:p-6">
            <div className="mb-5">
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white">Ubah Password</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">Gunakan password yang panjang dan unik.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Password Sekarang" error={errors.current_password}>
                        <input type="password" value={data.current_password} onChange={e => setData('current_password', e.target.value)} autoComplete="current-password"
                            className="w-full text-sm border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition" />
                    </Field>
                    <Field label="Password Baru" error={errors.password}>
                        <input type="password" value={data.password} onChange={e => setData('password', e.target.value)} autoComplete="new-password"
                            className="w-full text-sm border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition" />
                    </Field>
                    <Field label="Konfirmasi Password" error={errors.password_confirmation}>
                        <input type="password" value={data.password_confirmation} onChange={e => setData('password_confirmation', e.target.value)} autoComplete="new-password"
                            className="w-full text-sm border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white rounded-lg py-2.5 px-4 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition" />
                    </Field>
                </div>

                <div className="flex items-center gap-4 pt-1">
                    <button type="submit" disabled={processing}
                        className="bg-gray-900 hover:bg-black dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-950 text-xs font-bold px-5 py-2.5 rounded-lg shadow-sm transition disabled:opacity-60 cursor-pointer">
                        {processing ? 'Menyimpan...' : 'Perbarui Password'}
                    </button>
                    <Transition show={recentlySuccessful} enter="transition ease-in-out" enterFrom="opacity-0" leave="transition ease-in-out" leaveTo="opacity-0">
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                            Tersimpan.
                        </p>
                    </Transition>
                </div>
            </form>
        </div>
    );
}

/*Employee Data (Read-only)*/
function EmployeeDataCard({ user }) {
    const fields = [
        { label: 'FID / ID Karyawan', value: user.fid || '-' },
        { label: 'Role Akses', value: user.role_name || '-' },
        { label: 'Divisi', value: user.divisi || '-' },
        { label: 'Jabatan', value: user.karyawan?.jabatan || '-' },
        { label: 'Status Keaktifan', value: user.karyawan?.status || '-' },
    ];

    return (
        <div className="bg-white dark:bg-zinc-950 rounded-lg border border-gray-200/80 dark:border-zinc-800 shadow-sm p-5 md:p-6">
            <div className="mb-5">
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white">Data Kepegawaian</h3>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1">Dikelola oleh HR / IT Admin. Tidak dapat diubah sendiri.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {fields.map(f => (
                    <div key={f.label}>
                        <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-widest mb-1">{f.label}</p>
                        <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg px-3 py-2 capitalize">
                            {f.value}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

/*Delete Account */
function DeleteCard() {
    const [confirm, setConfirm] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleDelete = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await axios.delete(route('profile.destroy'), { data: { password } });
            window.location.href = '/';
        } catch (err) {
            setError(err.response?.data?.errors?.password?.[0] || 'Password salah.');
        } finally {
            setLoading(false);
        }
    };
}

/* â”€â”€â”€ Reusable Field wrapper â”€â”€â”€ */
function Field({ label, error, children }) {
    return (
        <div>
            <label className="block text-xs font-bold text-gray-600 dark:text-zinc-300 uppercase tracking-wide mb-1.5">{label}</label>
            {children}
            {error && <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-semibold">{error}</p>}
        </div>
    );
}
