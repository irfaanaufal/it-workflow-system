export default function SidebarSection({ title, children }) {
    return (
        <div>
            <p className="text-[10px] font-extrabold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">{title}</p>
            {children}
        </div>
    );
}
