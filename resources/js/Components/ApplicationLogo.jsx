import { usePage } from '@inertiajs/react';

export default function ApplicationLogo(props) {
    const { asset_url } = usePage().props;

    return (
        <img
            src={`${asset_url}/images/logo.png`}
            alt="Logo"
            {...props}
        />
    );
}
