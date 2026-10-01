import React, { useState, useMemo, useRef, useEffect } from 'react';

/**
 * SimpleLineChart
 * Replicates the technical/financial line chart style:
 * - Left Y-axis with tick marks and active value badge
 * - Displays only active report dates on the X-axis for a clean, non-cluttered timeline
 * - Smooth soft curved lines between data points
 * - Prominent solid red node circles
 * - Automatically fits the parent card container
 * - Interactive hover tooltips
 */
export default function SimpleLineChart({
    data = [], // Array of objects [{ day: 3, value: 5, label: '3 Okt' }] OR array of numbers
    labels = [],
    monthName = '',
    year = '',
    yAxisLabel = 'Tiket',
    className = 'w-full h-full min-h-[220px]',
    onSelectDay = null,
    selectedDay = null,
}) {
    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 700, height: 240 });
    const [hoveredIndex, setHoveredIndex] = useState(null);

    // Measure exact container dimensions dynamically
    useEffect(() => {
        if (!containerRef.current) return;

        const updateSize = () => {
            if (containerRef.current) {
                const { clientWidth, clientHeight } = containerRef.current;
                if (clientWidth > 0) {
                    setDimensions({
                        width: clientWidth,
                        height: clientHeight > 0 ? clientHeight : 240,
                    });
                }
            }
        };

        updateSize();
        const observer = new ResizeObserver(updateSize);
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    // Normalize data points into [{ index, day, value, label }]
    const pointsData = useMemo(() => {
        if (!data || data.length === 0) return [];
        return data.map((item, idx) => {
            const val = typeof item === 'number' ? item : (item.value ?? item.Jumlah ?? item.count ?? 0);
            const dayNum = typeof item === 'object' && item.day ? item.day : idx + 1;
            const lbl = labels[idx] || (typeof item === 'object' && item.label ? item.label : `Tgl ${dayNum} ${monthName}`);
            return {
                index: idx,
                day: dayNum,
                value: Number(val) || 0,
                label: lbl,
            };
        });
    }, [data, labels, monthName]);

    // Plotting bounds - Left Y-axis layout
    const { width, height } = dimensions;
    const PAD_TOP = 20;
    const PAD_BOTTOM = 44;
    const PAD_LEFT = 56; // Room for left Y-axis ticks, numbers and badge
    const PAD_RIGHT = 24;

    const plotWidth = Math.max(10, width - PAD_LEFT - PAD_RIGHT);
    const plotHeight = Math.max(10, height - PAD_TOP - PAD_BOTTOM);
    const plotBottom = PAD_TOP + plotHeight;
    const plotLeft = PAD_LEFT;
    const plotRight = width - PAD_RIGHT;

    // Inset from left/right edges so first and last nodes have breathing room
    const INSET_X = 20;

    // Calculate Y-scale domain (Minimum ceiling of 8 so small counts 1-2 don't overstretch)
    const { yMin, yMax, yTicks } = useMemo(() => {
        const values = pointsData.map(p => p.value);
        const actualMax = values.length > 0 ? Math.max(...values, 0) : 0;
        
        // Minimum ceiling is at least 5 (or higher if data exceeds 5)
        const targetMax = Math.max(actualMax, 5);
        const minVal = 0;

        let step = 1;
        if (targetMax > 15) step = 2;
        if (targetMax > 30) step = 5;
        if (targetMax > 75) step = 10;
        if (targetMax > 200) step = 25;

        const maxTick = Math.ceil(targetMax / step) * step;
        const ticks = [];
        for (let t = minVal; t <= maxTick; t += step) {
            ticks.push(t);
        }

        return {
            yMin: minVal,
            yMax: maxTick,
            yTicks: ticks,
        };
    }, [pointsData]);

    const getYCoord = (val) => {
        if (yMax === yMin) return plotBottom;
        const ratio = (val - yMin) / (yMax - yMin);
        return plotBottom - ratio * plotHeight;
    };

    const getXCoord = (idx, total) => {
        if (total <= 1) return plotLeft + plotWidth / 2;
        const usableWidth = plotWidth - INSET_X * 2;
        return (plotLeft + INSET_X) + (idx / (total - 1)) * usableWidth;
    };

    // Calculate screen coordinates
    const renderedPoints = useMemo(() => {
        const total = pointsData.length;
        return pointsData.map((p, idx) => ({
            ...p,
            x: getXCoord(idx, total),
            y: getYCoord(p.value),
        }));
    }, [pointsData, yMin, yMax, plotLeft, plotWidth, plotBottom, plotHeight]);

    // Build smooth, soft curved path using Catmull-Rom spline
    const linePath = useMemo(() => {
        if (renderedPoints.length === 0) return '';
        if (renderedPoints.length === 1) return `M ${renderedPoints[0].x},${renderedPoints[0].y}`;
        if (renderedPoints.length === 2) return `M ${renderedPoints[0].x},${renderedPoints[0].y} L ${renderedPoints[1].x},${renderedPoints[1].y}`;

        const tension = 0.22;
        let path = `M ${renderedPoints[0].x.toFixed(1)},${renderedPoints[0].y.toFixed(1)}`;

        for (let i = 0; i < renderedPoints.length - 1; i++) {
            const p0 = renderedPoints[i > 0 ? i - 1 : i];
            const p1 = renderedPoints[i];
            const p2 = renderedPoints[i + 1];
            const p3 = renderedPoints[i + 2 < renderedPoints.length ? i + 2 : i + 1];

            const cp1x = p1.x + (p2.x - p0.x) * tension;
            let cp1y = p1.y + (p2.y - p0.y) * tension;

            const cp2x = p2.x - (p3.x - p1.x) * tension;
            let cp2y = p2.y - (p3.y - p1.y) * tension;

            if (p1.y >= plotBottom - 0.5 && p2.y >= plotBottom - 0.5) {
                cp1y = plotBottom;
                cp2y = plotBottom;
            }

            path += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
        }

        return path;
    }, [renderedPoints, plotBottom]);

    // Determine active value for badge (hovered point or selected day or last point)
    const activePoint = useMemo(() => {
        if (hoveredIndex !== null && renderedPoints[hoveredIndex]) {
            return renderedPoints[hoveredIndex];
        }
        if (selectedDay !== null) {
            const found = renderedPoints.find(p => p.day === selectedDay);
            if (found) return found;
        }
        return renderedPoints.length > 0 ? renderedPoints[renderedPoints.length - 1] : null;
    }, [hoveredIndex, selectedDay, renderedPoints]);

    const activeBadgeValue = activePoint ? activePoint.value : 0;
    const activeBadgeY = activePoint ? activePoint.y : plotBottom;

    return (
        <div ref={containerRef} className={`absolute inset-0 select-none ${className}`}>
            <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-full block overflow-visible"
            >
                {/* Background Subtle Grid Lines (Horizontal) */}
                <g className="opacity-20 dark:opacity-25 stroke-gray-300 dark:stroke-zinc-700">
                    {yTicks.map(t => {
                        const y = getYCoord(t);
                        return (
                            <line
                                key={`grid-${t}`}
                                x1={plotLeft}
                                y1={y}
                                x2={plotRight}
                                y2={y}
                                strokeDasharray="3,3"
                                strokeWidth="0.8"
                            />
                        );
                    })}
                </g>

                {/* X-Axis Baseline */}
                <line
                    x1={plotLeft}
                    y1={plotBottom}
                    x2={plotRight}
                    y2={plotBottom}
                    className="stroke-gray-700 dark:stroke-zinc-400"
                    strokeWidth="1.5"
                />

                {/* X-Axis Ticks and Date Labels (Only for active report dates) */}
                {renderedPoints.map((pt, idx) => {
                    const isSelected = selectedDay === pt.day;

                    return (
                        <g key={`x-tick-${pt.day}-${idx}`} className="cursor-pointer" onClick={() => onSelectDay && onSelectDay(pt.day)}>
                            {/* Tick mark on baseline */}
                            <line
                                x1={pt.x}
                                y1={plotBottom}
                                x2={pt.x}
                                y2={plotBottom - 6}
                                className={isSelected ? 'stroke-indigo-600 dark:stroke-indigo-400' : 'stroke-gray-600 dark:stroke-zinc-400'}
                                strokeWidth={1.5}
                            />
                            {/* Day Date Label */}
                            <text
                                x={pt.x}
                                y={plotBottom + 15}
                                textAnchor="middle"
                                className={`text-[10px] font-bold ${
                                    isSelected
                                        ? 'fill-indigo-600 dark:fill-indigo-400 font-extrabold'
                                        : 'fill-gray-700 dark:fill-zinc-300'
                                }`}
                            >
                                {pt.day}
                            </text>
                        </g>
                    );
                })}

                {/* Period Label at bottom center */}
                <text
                    x={(plotLeft + plotRight) / 2}
                    y={plotBottom + 32}
                    textAnchor="middle"
                    className="text-[10px] font-bold fill-gray-500 dark:fill-zinc-400 tracking-wider uppercase"
                >
                    {monthName ? `${monthName} ${year}` : year}
                </text>

                {/* Y-Axis Line (Left Side) */}
                <line
                    x1={plotLeft}
                    y1={PAD_TOP - 4}
                    x2={plotLeft}
                    y2={plotBottom}
                    className="stroke-gray-700 dark:stroke-zinc-400"
                    strokeWidth="1.5"
                />

                {/* Y-Axis Ticks & Numerical Labels (Left Side) */}
                {yTicks.map(t => {
                    const y = getYCoord(t);
                    return (
                        <g key={`y-tick-${t}`}>
                            <line
                                x1={plotLeft - 4}
                                y1={y}
                                x2={plotLeft}
                                y2={y}
                                className="stroke-gray-700 dark:stroke-zinc-400"
                                strokeWidth="1.2"
                            />
                            <text
                                x={plotLeft - 7}
                                y={y + 3}
                                textAnchor="end"
                                className="text-[9.5px] font-semibold fill-gray-600 dark:fill-zinc-400"
                            >
                                {t}
                            </text>
                        </g>
                    );
                })}

                {/* Active Highlight Line from Left Y-Axis to active point */}
                {activePoint && (
                    <line
                        x1={plotLeft}
                        y1={activePoint.y}
                        x2={activePoint.x}
                        y2={activePoint.y}
                        className="stroke-blue-600 dark:stroke-blue-400 opacity-60"
                        strokeDasharray="3,3"
                        strokeWidth="1.2"
                    />
                )}

                {/* Smooth Dark/Black Line */}
                {linePath && (
                    <path
                        d={linePath}
                        fill="none"
                        className="stroke-gray-900 dark:stroke-zinc-100"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                )}

                {/* Solid Red Node Circles */}
                {renderedPoints.map((pt, idx) => {
                    const isHovered = hoveredIndex === idx;
                    const isSelected = selectedDay === pt.day;

                    return (
                        <g
                            key={`node-${pt.day}-${idx}`}
                            className="cursor-pointer group"
                            onMouseEnter={() => setHoveredIndex(idx)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            onClick={() => onSelectDay && onSelectDay(pt.day)}
                        >
                            {/* Hover aura */}
                            {isHovered && (
                                <circle
                                    cx={pt.x}
                                    cy={pt.y}
                                    r="13"
                                    className="fill-red-500/25 dark:fill-red-400/30 animate-pulse"
                                />
                            )}

                            {/* Solid Red Marker */}
                            <circle
                                cx={pt.x}
                                cy={pt.y}
                                r={isHovered ? 7.5 : (isSelected ? 7 : 5.5)}
                                className="fill-red-600 dark:fill-red-500 transition-all duration-200"
                                stroke="#ffffff"
                                strokeWidth={isHovered || isSelected ? 2 : 1}
                            />
                        </g>
                    );
                })}

                {/* Left Axis Highlight Badge (Showing active value on the left Y-axis) */}
                {activePoint && (
                    <g className="transition-transform duration-150">
                        {/* Blue/Navy Tag Box on left */}
                        <rect
                            x={Math.max(2, plotLeft - 48)}
                            y={Math.max(PAD_TOP - 8, Math.min(plotBottom - 16, activeBadgeY - 8.5))}
                            width="44"
                            height="17"
                            rx="3"
                            className="fill-blue-700 dark:fill-blue-600 filter drop-shadow-xs"
                        />
                        {/* Tag Value Text */}
                        <text
                            x={Math.max(2, plotLeft - 48) + 22}
                            y={Math.max(PAD_TOP - 8, Math.min(plotBottom - 16, activeBadgeY - 8.5)) + 11.5}
                            textAnchor="middle"
                            className="text-[9.5px] font-black fill-white tracking-tight"
                        >
                            {activeBadgeValue} {yAxisLabel ? yAxisLabel.slice(0, 3) : ''}
                        </text>
                    </g>
                )}
            </svg>

            {/* Empty State when there are no reports in the selected period */}
            {pointsData.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-6">
                    <p className="text-xs font-semibold text-gray-400 dark:text-zinc-500">
                        Belum ada laporan pada periode ini
                    </p>
                </div>
            )}

            {/* Interactive Tooltip Card on Hover */}
            {hoveredIndex !== null && renderedPoints[hoveredIndex] && (
                <div
                    className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 px-2.5 py-1.5 bg-gray-900/95 dark:bg-zinc-800 text-white text-[11px] rounded-lg shadow-xl border border-gray-700/50 backdrop-blur-xs transition-all whitespace-nowrap"
                    style={{
                        left: `${renderedPoints[hoveredIndex].x}px`,
                        top: `${renderedPoints[hoveredIndex].y}px`,
                    }}
                >
                    <div className="font-semibold text-gray-300 text-[10px]">
                        {renderedPoints[hoveredIndex].label}
                    </div>
                    <div className="font-extrabold text-red-400 flex items-center gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
                        <span>{renderedPoints[hoveredIndex].value} {yAxisLabel}</span>
                    </div>
                </div>
            )}
        </div>
    );
}
