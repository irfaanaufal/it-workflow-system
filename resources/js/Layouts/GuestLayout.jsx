import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-gray-100 dark:bg-[#0a0a0a] pt-6 sm:justify-center sm:pt-0">
            <div>
                <Link href="/">
                    <ApplicationLogo className="h-20 w-20 fill-current text-gray-500 dark:text-zinc-400" />
                </Link>
            </div>

            <div className="mt-6 w-full overflow-hidden bg-white dark:bg-zinc-900 dark:border dark:border-zinc-800 px-6 py-4 shadow-md sm:max-w-md sm:rounded-lg">
                {children}
            </div>
        </div>
    );
}
