import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const user = usePage().props.auth.user;

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
        });

    const submit = (e) => {
        e.preventDefault();

        patch(route('profile.update'));
    };

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">
                    Profile Information
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                    Update your account's profile information and email address.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <InputLabel htmlFor="name" value="Name" />

                    <TextInput
                        id="name"
                        className="mt-1 block w-full"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
                    />

                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div>
                    <InputLabel htmlFor="email" value="Email" />

                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1 block w-full"
                        value={data.email}
                        onChange={(e) => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                    />

                    <InputError className="mt-2" message={errors.email} />
                </div>

                {/* Data Kepegawaian (Read-only) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="col-span-1 md:col-span-2">
                        <h3 className="text-sm font-semibold text-gray-700">Data Kepegawaian (Read-Only)</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Data kepegawaian Anda dikelola oleh HR / IT Admin.</p>
                    </div>

                    <div>
                        <InputLabel htmlFor="username" value="ID Karyawan (FID)" />
                        <TextInput
                            id="username"
                            className="mt-1 block w-full bg-gray-100 text-gray-500 cursor-not-allowed"
                            value={user.username || '-'}
                            disabled
                            readOnly
                        />
                    </div>

                    <div>
                        <InputLabel htmlFor="role" value="Role Akses" />
                        <TextInput
                            id="role"
                            className="mt-1 block w-full bg-gray-100 text-gray-500 cursor-not-allowed capitalize"
                            value={user.role_name || '-'}
                            disabled
                            readOnly
                        />
                    </div>

                    <div>
                        <InputLabel htmlFor="divisi" value="Divisi" />
                        <TextInput
                            id="divisi"
                            className="mt-1 block w-full bg-gray-100 text-gray-500 cursor-not-allowed"
                            value={user.divisi || '-'}
                            disabled
                            readOnly
                        />
                    </div>

                    <div>
                        <InputLabel htmlFor="jabatan" value="Jabatan" />
                        <TextInput
                            id="jabatan"
                            className="mt-1 block w-full bg-gray-100 text-gray-500 cursor-not-allowed"
                            value={user.karyawan?.jabatan || '-'}
                            disabled
                            readOnly
                        />
                    </div>

                    <div className="col-span-1 md:col-span-2">
                        <InputLabel htmlFor="status_karyawan" value="Status Keaktifan Karyawan" />
                        <TextInput
                            id="status_karyawan"
                            className="mt-1 block w-full bg-gray-100 text-gray-500 cursor-not-allowed"
                            value={user.karyawan?.status || '-'}
                            disabled
                            readOnly
                        />
                    </div>
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="mt-2 text-sm text-gray-800">
                            Your email address is unverified.
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                Click here to re-send the verification email.
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-sm font-medium text-green-600">
                                A new verification link has been sent to your
                                email address.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>Save</PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600">
                            Saved.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
