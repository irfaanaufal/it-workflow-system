import { useState, useRef } from 'react';

/**
 * A "pull-cord" style theme switcher — a small dangling cord/chain
 * fixed to the top of the viewport. Pulling it toggles dark/light mode.
 * Props: theme ('dark' | 'light'), toggleTheme (function)
 */
export default function LightPullThemeSwitcher({ theme, toggleTheme }) {
    const [isPulled, setIsPulled] = useState(false);
    const timeoutRef = useRef(null);

    const handlePull = () => {
        setIsPulled(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(() => {
            toggleTheme();
            setTimeout(() => setIsPulled(false), 150);
        }, 200);
    };

    const isDark = theme === 'dark';

    return (
        <button
            type="button"
            onClick={handlePull}
            className="group flex flex-col items-center outline-none focus:outline-none select-none"
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
            {/* The cord / chain line */}
            <div
                className="transition-all duration-300 ease-in-out"
                style={{
                    width: '2px',
                    height: isPulled ? '52px' : '36px',
                    background: isDark
                        ? 'linear-gradient(to bottom, rgba(161,161,170,0.3), rgba(161,161,170,0.6))'
                        : 'linear-gradient(to bottom, rgba(161,161,170,0.4), rgba(113,113,122,0.7))',
                }}
            />

            {/* The pull knob */}
            <div
                className={`
                    relative flex items-center justify-center
                    w-7 h-7 rounded-full
                    transition-all duration-300 ease-in-out
                    shadow-md group-hover:shadow-lg
                    group-hover:scale-110
                    ${isPulled ? 'scale-95' : ''}
                    ${isDark
                        ? 'bg-zinc-800 border border-zinc-700 group-hover:border-zinc-600'
                        : 'bg-white border border-zinc-300 group-hover:border-zinc-400'
                    }
                `}
            >
                {/* Sun icon (light mode) */}
                <svg
                    className={`absolute w-3.5 h-3.5 transition-all duration-300 ${
                        isDark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <circle cx="12" cy="12" r="4" className="text-amber-500" fill="currentColor" stroke="none" />
                    <path
                        className="text-amber-500"
                        strokeLinecap="round"
                        d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.07-7.07-1.41 1.41M8.34 15.66l-1.41 1.41m12.14 0-1.41-1.41M8.34 8.34 6.93 6.93"
                    />
                </svg>

                {/* Moon icon (dark mode) */}
                <svg
                    className={`absolute w-3.5 h-3.5 transition-all duration-300 ${
                        isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                >
                    <path
                        className="text-blue-300"
                        fill="currentColor"
                        stroke="none"
                        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                    />
                </svg>
            </div>
        </button>
    );
}
