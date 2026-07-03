import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';
import axios from 'axios';
import AppLogo from '@/Components/AppLogo';

export default function Sidebar({ mobileOpen = false, onMobileClose, unreadCount = 0, onOpenNotifications }) {
    const user = usePage().props.auth.user;
    const [hovered, setHovered] = useState(false);
    const [appsMenuOpen, setAppsMenuOpen] = useState(
        route().current('applications.index') ||
        route().current('admin.applications.requests') ||
        route().current('admin.applications.index')
    );
    const [rolesMenuOpen, setRolesMenuOpen] = useState(
        route().current('admin.roles-permissions.index') ||
        route().current('admin.roles-permissions.briefing')
    );
    const expanded = hovered;
    const role = user.role_name;
    const isSuperAdmin = role === 'superadmin';
    const isAdmin = role === 'superadmin' || role === 'admin';

    const handleLogout = (e) => {
        e.preventDefault();
        axios.post(route('logout')).then(() => { window.location.href = '/'; });
    };

    const isDashboardActive = route().current('dashboard');
    const isInboxActive = route().current('admin.inbox');
    const isKanbanActive = route().current('admin.kanban');
    const isMyReqActive = route().current('my-requests');
    const isGlobalActive = route().current('global-monitor');
    const isHistoryActive = route().current('history');
    const isProfileActive = route().current('profile.edit');
    const isSystemsActive = route().current('admin.systems.index');
    const activeTabParam = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('tab') : '';
    const isRoleTabActive = route().current('admin.roles-permissions.index') && (!activeTabParam || activeTabParam === 'role-permissions');
    const isUserTabActive = route().current('admin.roles-permissions.index') && activeTabParam === 'user-roles';
    const isRolesActive = route().current('admin.roles-permissions.index') || route().current('admin.roles-permissions.briefing');
    const isApplicationsActive = route().current('applications.index') || route().current('admin.applications.requests') || route().current('admin.applications.index');

    const avatarUrl = user.avatar_url || null;
    const initials = user.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
    const firstName = user.name.split(' ')[0];

    const hasAccess = user.has_it_workflow_access === true;
    const navItems = [];

    if (hasAccess) {
        // Dashboard: admin view (superadmin & admin) | user view (user)
        navItems.push({ href: route('dashboard'), active: isDashboardActive, label: 'Dashboard', icon: <IconHome /> });

        // Superadmin & Admin: Inbox
        if (isAdmin) {
            navItems.push({ href: route('admin.inbox'), active: isInboxActive, label: 'Inbox', icon: <IconInbox /> });
        }

        // Superadmin & Admin: Kanban
        if (isAdmin) {
            navItems.push({ href: route('admin.kanban'), active: isKanbanActive, label: 'Kanban', icon: <IconKanban /> });
        }

        // User: My Requests
        if (!isAdmin) {
            navItems.push({ href: route('my-requests'), active: isMyReqActive, label: 'My Requests', icon: <IconInbox /> });
        }

        // User only: Global Monitor
        if (!isAdmin) {
            navItems.push({ href: route('global-monitor'), active: isGlobalActive, label: 'Global Monitor', icon: <IconKanban /> });
        }

        // Superadmin only: Kelola Sistem
        if (isSuperAdmin) {
            navItems.push({ href: route('admin.systems.index'), active: isSystemsActive, label: 'System', icon: <IconSystem /> });
        }

        // All roles: History
        navItems.push({ href: route('history'), active: isHistoryActive, label: 'History', icon: <IconHistory /> });

        if (navItems.length > 0) {
            navItems.push({ isDivider: true });
        }

        // Akses Aplikasi Dropdown
        const appsSubItems = [
            { href: route('applications.index'), active: route().current('applications.index'), label: 'Akses Saya' }
        ];

        if (isSuperAdmin || isAdmin) {
            appsSubItems.push({ href: route('admin.applications.requests'), active: route().current('admin.applications.requests'), label: 'Kelola Permintaan' });
        }

        if (isSuperAdmin || isAdmin) {
            appsSubItems.push({ href: route('admin.applications.index'), active: route().current('admin.applications.index'), label: 'Kelola Aplikasi' });
        }

        if (appsSubItems.length > 1) {
            navItems.push({
                id: 'apps',
                label: 'Hak Akses',
                icon: <IconApps />,
                isDropdown: true,
                active: isApplicationsActive,
                subItems: appsSubItems
            });
        } else {
            navItems.push({
                href: route('applications.index'),
                active: isApplicationsActive,
                label: 'Hak Akses',
                icon: <IconApps />
            });
        }

        // Superadmin only: Role User dropdown
        if (isSuperAdmin) {
            const roleSubItems = [
                { href: route('admin.roles-permissions.index'), active: route().current('admin.roles-permissions.index'), label: 'Sistem IT' },
                { href: route('admin.roles-permissions.briefing'), active: route().current('admin.roles-permissions.briefing'), label: 'Sistem Briefing/Meeting' },
            ];

            navItems.push({
                id: 'roles',
                label: 'Role User',
                icon: <IconLock />,
                isDropdown: true,
                active: isRolesActive,
                subItems: roleSubItems
            });
        }
    }

    const AvatarWidget = ({ showText }) => (
        <Link
            href={route('profile.edit')}
            className={`flex items-center h-11 rounded-2xl transition duration-150 cursor-pointer overflow-hidden
                ${expanded || showText ? 'gap-3 px-3' : 'justify-center px-0'}
                ${isProfileActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400'
                    : 'hover:bg-gray-100/70 dark:hover:bg-zinc-800/60'
                }`}
            title="Edit Profile"
        >
            <div className="w-8 h-8 shrink-0 rounded-full overflow-hidden border-2 border-gray-200 dark:border-zinc-700 bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                {avatarUrl
                    ? <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                    : <span className="text-[10px] font-black text-slate-600 dark:text-zinc-300 leading-none">{initials}</span>
                }
            </div>
            {(expanded || showText) && (
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-gray-800 dark:text-zinc-200 truncate leading-tight">{firstName}</p>
                    <p className="text-[10px] text-gray-400 dark:text-zinc-500 truncate leading-tight">{user.email}</p>
                </div>
            )}
        </Link>
    );

    const desktopSidebar = (
        <aside
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{ width: expanded ? '216px' : '68px' }}
            className="hidden md:flex h-[calc(100vh-2rem)] bg-white dark:bg-zinc-950 border border-gray-200/80 dark:border-zinc-800 rounded-[28px] flex-col py-4 flex-shrink-0 z-20 shadow-md transition-all duration-300 ease-in-out overflow-hidden"
        >
            <div className={`flex items-center mb-2 px-3 ${expanded ? '' : 'justify-center'}`}>
                <Link href="/" className="block">
                    <AppLogo collapsed={!expanded} />
                </Link>
            </div>

            <hr className="border-gray-100 dark:border-zinc-800 mx-3 mb-3" />

            <nav className="flex-1 flex flex-col gap-0.5 px-2 overflow-y-auto">
                {navItems.map((item, index) => {
                    if (item.isDivider) {
                        return <hr key={`div-${index}`} className="border-gray-100 dark:border-zinc-900 mx-2 my-2" />;
                    }
                    return item.isDropdown ? (
                        <DropdownNavItem
                            key={item.label}
                            item={item}
                            expanded={expanded}
                            isOpen={item.id === 'apps' ? appsMenuOpen : rolesMenuOpen}
                            setIsOpen={item.id === 'apps' ? setAppsMenuOpen : setRolesMenuOpen}
                        />
                    ) : (
                        <NavItem key={item.label} href={item.href} active={item.active} label={item.label} expanded={expanded}>
                            {item.icon}
                        </NavItem>
                    );
                })}
            </nav>

            <div className="flex flex-col gap-0.5 px-2 pt-2">
                <hr className="border-gray-100 dark:border-zinc-800 mx-1 mb-2" />

                <button
                    onClick={handleLogout}
                    className={`flex items-center h-11 rounded-2xl text-gray-400 dark:text-zinc-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition duration-150 cursor-pointer w-full overflow-hidden
                        ${expanded ? 'gap-3 px-3' : 'justify-center px-0'}`}
                    title="Log Out"
                >
                    <span className="shrink-0 w-[18px] flex justify-center"><IconLogout /></span>
                    {expanded && <span className="text-sm font-semibold whitespace-nowrap">Log out</span>}
                </button>

                <AvatarWidget showText={false} />
            </div>
        </aside>
    );

    const mobileSidebar = (
        <>
            {mobileOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
                    onClick={onMobileClose}
                />
            )}
            <aside className={`md:hidden fixed top-0 right-0 h-full w-64 bg-white dark:bg-zinc-950 border-l border-gray-200 dark:border-zinc-800 shadow-2xl z-40 flex flex-col transition-transform duration-300 ease-in-out ${mobileOpen ? 'translate-x-0' : 'translate-x-full'
                }`}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-zinc-800">
                    <AppLogo collapsed={false} />
                    <button onClick={onMobileClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition cursor-pointer p-1">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <nav className="flex-1 flex flex-col gap-0.5 px-3 pt-3 overflow-y-auto">
                    {navItems.map((item, index) => {
                        if (item.isDivider) {
                            return <hr key={`div-${index}`} className="border-gray-100 dark:border-zinc-800 mx-1 my-2" />;
                        }
                        return item.isDropdown ? (
                            <DropdownNavItem
                                key={item.label}
                                item={item}
                                expanded={true}
                                isOpen={item.id === 'apps' ? appsMenuOpen : rolesMenuOpen}
                                setIsOpen={item.id === 'apps' ? setAppsMenuOpen : setRolesMenuOpen}
                                onClick={onMobileClose}
                            />
                        ) : (
                            <NavItem key={item.label} href={item.href} active={item.active} label={item.label} expanded={true} onClick={onMobileClose}>
                                {item.icon}
                            </NavItem>
                        );
                    })}
                    <button
                        onClick={() => {
                            onMobileClose();
                            onOpenNotifications?.();
                        }}
                        className="flex items-center h-11 px-3 rounded-2xl transition duration-150 cursor-pointer w-full text-left gap-3 text-gray-400 dark:text-zinc-500 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 mt-1"
                    >
                        <span className="shrink-0 w-[18px] flex justify-center relative text-gray-400 dark:text-zinc-500">
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 h-2 w-2 bg-rose-500 rounded-full" />
                            )}
                        </span>
                        <span className="text-sm font-semibold flex-1">Notifikasi</span>
                        {unreadCount > 0 && (
                            <span className="bg-rose-500 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full shrink-0">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>
                </nav>

                <div className="flex flex-col gap-0.5 px-3 pt-2 pb-5 border-t border-gray-100 dark:border-zinc-800">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 h-11 px-3 rounded-2xl text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition cursor-pointer w-full"
                    >
                        <span className="shrink-0 w-[18px] flex justify-center"><IconLogout /></span>
                        <span className="text-sm font-semibold">Log out</span>
                    </button>
                    <AvatarWidget showText={true} />
                </div>
            </aside>
        </>
    );

    return (
        <>
            {desktopSidebar}
            {mobileSidebar}
        </>
    );
}

function NavItem({ href, active, label, expanded, children, onClick }) {
    return (
        <Link
            href={href}
            onClick={onClick}
            title={label}
            className={`flex items-center h-11 rounded-2xl transition duration-150 overflow-hidden
                ${expanded ? 'gap-3 px-3' : 'justify-center px-0'}
                ${active
                    ? 'bg-gray-100 dark:bg-zinc-900 text-gray-900 dark:text-white font-semibold shadow-sm'
                    : 'text-gray-400 dark:text-zinc-550 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100/70 dark:hover:bg-zinc-800/60'
                }`}
        >
            <span className="shrink-0 w-[18px] flex justify-center">{children}</span>
            {expanded && <span className="text-sm font-semibold whitespace-nowrap">{label}</span>}
        </Link>
    );
}

function DropdownNavItem({ item, expanded, isOpen, setIsOpen, onClick }) {
    return (
        <div className="flex flex-col gap-0.5">
            <button
                onClick={() => setIsOpen(!isOpen)}
                title={item.label}
                className={`flex items-center h-11 rounded-2xl transition duration-150 cursor-pointer w-full text-left
                    ${expanded ? 'gap-3 px-3' : 'justify-center px-0'}
                    ${item.active
                        ? 'bg-gray-50 dark:bg-zinc-900/50 text-gray-900 dark:text-white font-semibold'
                        : 'text-gray-400 dark:text-zinc-550 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100/70 dark:hover:bg-zinc-800/60'
                    }`}
            >
                <span className="shrink-0 w-[18px] flex justify-center">{item.icon}</span>
                {expanded && (
                    <span className="text-sm font-semibold flex-1 whitespace-nowrap">{item.label}</span>
                )}
                {expanded && (
                    <svg
                        className={`h-4 w-4 transform transition-transform duration-250 ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                )}
            </button>

            {expanded && isOpen && (
                <div className="pl-8 flex flex-col gap-0.5 mt-0.5">
                    {item.subItems.map((sub, index) => (
                        <Link
                            key={index}
                            href={sub.href}
                            onClick={onClick}
                            className={`flex items-center h-9 px-3 rounded-xl text-xs font-semibold transition duration-150
                                ${sub.active
                                    ? 'bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400'
                                    : 'text-gray-500 dark:text-zinc-400 hover:text-gray-800 dark:hover:text-zinc-200 hover:bg-gray-50 dark:hover:bg-zinc-900/40'
                                }`}
                        >
                            {sub.label}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

/* Icons */
function IconHome() {
    return <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293zM13 7.207V13.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V7.207l5-5z" /></svg>;
}
function IconInbox() {
    return <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path d="M4.98 1a.5.5 0 0 0-.39.188L1.54 5H6a.5.5 0 0 1 .5.5 1.5 1.5 0 0 0 3 0A.5.5 0 0 1 10 5h4.46l-3.05-3.812A.5.5 0 0 0 11.02 1zm9.954 5H10.45a2.5 2.5 0 0 1-4.9 0H1.066l.32 2.562A.5.5 0 0 0 1.884 9h12.234a.5.5 0 0 0 .496-.438zM3.809.563A1.5 1.5 0 0 1 4.981 0h6.038a1.5 1.5 0 0 1 1.172.563l3.7 4.625a.5.5 0 0 1 .105.374l-.39 3.124A1.5 1.5 0 0 1 14.117 10H1.883A1.5 1.5 0 0 1 .394 8.686l-.39-3.124a.5.5 0 0 1 .106-.374zM.125 11.17A.5.5 0 0 1 .5 11H6a.5.5 0 0 1 .5.5 1.5 1.5 0 0 0 3 0 .5.5 0 0 1 .5-.5h5.5a.5.5 0 0 1 .496.562l-.39 3.124A1.5 1.5 0 0 1 14.117 16H1.883a1.5 1.5 0 0 1-1.489-1.314l-.39-3.124a.5.5 0 0 1 .121-.393zm.941.83.32 2.562a.5.5 0 0 0 .497.438h12.234a.5.5 0 0 0 .496-.438l.32-2.562H10.45a2.5 2.5 0 0 1-4.9 0z" /></svg>;
}
function IconKanban() {
    return <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path d="M13.5 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1zm-11-1a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z" /><path d="M6.5 3a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1zm-4 0a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1zm8 0a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1z" /></svg>;
}
function IconHistory() {
    return <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path d="M8.515 1.019A7 7 0 0 0 8 1V0a8 8 0 0 1 .589.022zm2.004.45a7 7 0 0 0-.985-.299l.219-.976q.576.129 1.126.342zm1.37.71a7 7 0 0 0-.439-.27l.493-.87a8 8 0 0 1 .979.654l-.615.789a7 7 0 0 0-.418-.302zm1.834 1.79a7 7 0 0 0-.653-.796l.724-.69q.406.429.747.91zm.744 1.352a7 7 0 0 0-.214-.468l.893-.45a8 8 0 0 1 .45 1.088l-.95.313a7 7 0 0 0-.179-.483m.53 2.507a7 7 0 0 0-.1-1.025l.985-.17q.1.58.116 1.17zm-.131 1.538q.05-.254.081-.51l.993.123a8 8 0 0 1-.23 1.155l-.964-.267q.069-.247.12-.501m-.952 2.379q.276-.436.486-.908l.914.405q-.24.54-.555 1.038zm-.964 1.205q.183-.183.35-.378l.758.653a8 8 0 0 1-.401.432z" /><path d="M8 1a7 7 0 1 0 4.95 11.95l.707.707A8.001 8.001 0 1 1 8 0z" /><path d="M7.5 3a.5.5 0 0 1 .5.5v5.21l3.248 1.856a.5.5 0 0 1-.496.868l-3.5-2A.5.5 0 0 1 7 9V3.5a.5.5 0 0 1 .5-.5" /></svg>;
}
function IconSystem() {
    return <svg width="18" height="18" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={4} strokeLinejoin="round" >
        <path d="M18 6H8a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2Zm0 22H8a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V30a2 2 0 0 0-2-2Zm17-8a7 7 0 1 0 0-14a7 7 0 0 0 0 14Zm5 8H30a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V30a2 2 0 0 0-2-2Z" />
    </svg>
}
function IconLogout() {
    return <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path d="M8.5 10c-.276 0-.5-.448-.5-1s.224-1 .5-1 .5.448.5 1-.224 1-.5 1" /><path d="M10.828.122A.5.5 0 0 1 11 .5V1h.5A1.5 1.5 0 0 1 13 2.5V15h1.5a.5.5 0 0 1 0 1h-13a.5.5 0 0 1 0-1H3V1.5a.5.5 0 0 1 .43-.495l7-1a.5.5 0 0 1 .398.117M11.5 2H11v13h1V2.5a.5.5 0 0 0-.5-.5M4 1.934V15h6V1.077z" /></svg>;
}
function IconApps() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" className="bi bi-window-stack" viewBox="0 0 16 16">
            <path d="M4.5 6a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1M6 6a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1m2-.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0" />
            <path d="M12 1a2 2 0 0 1 2 2 2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2 2 2 0 0 1-2-2V3a2 2 0 0 1 2-2zM2 12V5a2 2 0 0 1 2-2h9a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1m1-4v5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8zm12-1V5a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v2z" />
        </svg>
    );
}
function IconLock() {
    return (
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
    );
}
