// OrbitCluster - Video/GIF Background
export function DotRingMark({ isDark = true }) {
    const dots = [
        { cx: 14, cy: 4, o: 1 },
        { cx: 21.07, cy: 6.93, o: 0.85 },
        { cx: 24, cy: 14, o: 0.68 },
        { cx: 21.07, cy: 21.07, o: 0.52 },
        { cx: 14, cy: 24, o: 0.38 },
        { cx: 6.93, cy: 21.07, o: 0.26 },
        { cx: 4, cy: 14, o: 0.16 },
        { cx: 6.93, cy: 6.93, o: 0.08 },
    ];
    return (
        <svg width="30" height="30" viewBox="0 0 28 28" fill="none" aria-hidden="true">
            {dots.map((d, i) => (
                <circle key={i} cx={d.cx} cy={d.cy} r="1.7" fill={isDark ? '#fff' : '#1f2937'} opacity={d.o} />
            ))}
        </svg>
    );
}

export function OrbitCluster({ isDark = true }) {
    return (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-16">
            <style>{`
                @keyframes oc-float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-12px); }
                }
                @keyframes oc-glow {
                    0%, 100% { filter: drop-shadow(0 0 12px rgba(255,255,255,0.08)); }
                    50% { filter: drop-shadow(0 0 24px rgba(255,255,255,0.18)); }
                }
                @media (prefers-reduced-motion: reduce) {
                    .oc-anim { animation: none !important; filter: none !important; }
                }
            `}</style>
            <img
                src="/it-system/public/images/login.gif"
                alt=""
                className="oc-anim max-w-full max-h-full object-contain"
                style={{
                    animation: 'oc-float 6s ease-in-out infinite, oc-glow 4s ease-in-out infinite',
                }}
            />
        </div>
    );
}
