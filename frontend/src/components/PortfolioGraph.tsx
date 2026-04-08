import { useEffect, useMemo, useRef, useState } from 'react';

export interface PortfolioEntry {
  symbol: string;
  quantity: number;
  totalCost: number;
  totalPurchaseCost?: number;
}

type GraphType = 'allocation' | 'pnl' | 'comparison';

interface AllocationSegment {
  symbol: string;
  totalCost: number;
  percentage: number;
  color: string;
}

interface PnlBar {
  symbol: string;
  pnl: number;
}

type PnlMode = 'top' | 'worst' | 'all';

interface ComparisonBarGroup {
  symbol: string;
  purchasePrice: number;
  currentPrice: number;
}

interface HoveredSegment {
  symbol: string;
  value: number;
  percentage: number;
  index: number;
}

interface DonutSlice extends AllocationSegment {
  index: number;
  startAngle: number;
  endAngle: number;
}

interface DonutCenterContent {
  title: string;
  value: string;
  percentage?: string;
}

type HoveredGraphItem =
  | {
      graphType: 'pnl';
      symbol: string;
      pnl: number;
      index: number;
    }
  | {
      graphType: 'comparison';
      symbol: string;
      purchasePrice: number;
      currentPrice: number;
      difference: number;
      index: number;
    };

const SEGMENT_COLORS = ['#60A5FA', '#34D399', '#F59E0B', '#A78BFA', '#F87171', '#94A3B8'];

const CHART_SIZE = 220;
const CHART_CENTER = CHART_SIZE / 2;
const DONUT_OUTER_RADIUS = 90;
const DONUT_INNER_RADIUS = 64;
const DONUT_SEGMENT_GAP_DEGREES = 1.6;
const DONUT_ROTATION_TARGET_DEGREES = -74;
const DONUT_ENTRY_DURATION_MS = 520;
const DONUT_ENTRY_STAGGER_MS = 65;
const BAR_ENTRY_DURATION_MS = 420;
const BAR_ENTRY_STAGGER_MS = 50;
const GRAPH_MOUNT_DURATION_MS = 300;
const HOVER_TRANSITION_MS = 150;
const LEGEND_ENTRY_STAGGER_MS = 20;
const LEGEND_ENTRY_BASE_DELAY_MS = 80;
const ALLOCATION_CUMULATIVE_THRESHOLD = 0.75;
const ALLOCATION_MIN_OTHERS_RATIO = 0.03;

const PNL_SVG_HEIGHT = 340;
const PNL_MARGIN_TOP = 14;
const PNL_MARGIN_RIGHT = 20;
const PNL_MARGIN_BOTTOM = 62;
const PNL_MARGIN_LEFT = 20;
const PNL_SLOT_WIDTH = 68;
const PNL_BAR_WIDTH = 18;
const PNL_MIN_WIDTH = 520;

const POSITIVE_PNL_COLOR = '#34D399';
const NEGATIVE_PNL_COLOR = '#F87171';
const COMPARISON_SVG_HEIGHT = 340;
const COMPARISON_MARGIN_TOP = 14;
const COMPARISON_MARGIN_RIGHT = 20;
const COMPARISON_MARGIN_BOTTOM = 70;
const COMPARISON_MARGIN_LEFT = 20;
const COMPARISON_SLOT_WIDTH = 68;
const COMPARISON_BAR_WIDTH = 18;
const COMPARISON_BAR_GAP = 4;
const COMPARISON_MIN_WIDTH = 560;

const DENSE_CHART_ITEM_WIDTH = 48;
const DENSE_CHART_ITEM_GAP = 20;

const X_AXIS_LABEL_BOTTOM_OFFSET = 26;

const COMPARISON_PURCHASE_COLOR = '#94A3B8';

function formatNumber(value: number) {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function formatPercent(value: number) {
  return `${value.toFixed(value >= 10 ? 1 : 2)}%`;
}

function formatLabel(symbol: string) {
  const MAX = 6;
  return symbol.length > MAX ? `${symbol.slice(0, MAX)}…` : symbol;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - value, 3);
}

function normalizeAngleDegrees(value: number) {
  return ((((value + 180) % 360) + 360) % 360) - 180;
}

function brightenColor(hexColor: string, intensity = 0.16) {
  const normalized = hexColor.replace('#', '');
  if (normalized.length !== 6) {
    return hexColor;
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);

  if ([red, green, blue].some((channel) => Number.isNaN(channel))) {
    return hexColor;
  }

  const mixWithWhite = (channel: number) =>
    Math.max(0, Math.min(255, Math.round(channel + (255 - channel) * intensity)));

  const toHex = (channel: number) => channel.toString(16).padStart(2, '0');

  return `#${toHex(mixWithWhite(red))}${toHex(mixWithWhite(green))}${toHex(mixWithWhite(blue))}`;
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees * Math.PI) / 180;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function buildDonutSlicePath(
  centerX: number,
  centerY: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number
) {
  const outerStart = polarToCartesian(centerX, centerY, outerRadius, startAngle);
  const outerEnd = polarToCartesian(centerX, centerY, outerRadius, endAngle);
  const innerEnd = polarToCartesian(centerX, centerY, innerRadius, endAngle);
  const innerStart = polarToCartesian(centerX, centerY, innerRadius, startAngle);

  const angleDelta = ((endAngle - startAngle) % 360 + 360) % 360;
  const largeArcFlag = angleDelta > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ');
}

export default function PortfolioGraph({ portfolio }: { portfolio: PortfolioEntry[] }) {
  const [graphType, setGraphType] = useState<GraphType>('allocation');
  const [pnlMode, setPnlMode] = useState<PnlMode>('top');
  const [hoveredSegment, setHoveredSegment] = useState<HoveredSegment | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<HoveredGraphItem | null>(null);
  const [donutAnimationElapsedMs, setDonutAnimationElapsedMs] = useState(0);
  const [barAnimationElapsedMs, setBarAnimationElapsedMs] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const sectionRef = useRef<HTMLElement | null>(null);

  const graphTypeOptions: Array<{ value: GraphType; label: string }> = [
    { value: 'allocation', label: 'Allocation' },
    { value: 'pnl', label: 'P&L' },
    { value: 'comparison', label: 'Comparison' },
  ];

  const totalPortfolioValue = useMemo(
    () =>
      portfolio.reduce((sum, entry) => {
        const value = Number(entry.totalCost);
        return Number.isFinite(value) ? sum + value : sum;
      }, 0),
    [portfolio]
  );

  const allocationSegments = useMemo<AllocationSegment[]>(() => {
    if (totalPortfolioValue <= 0) {
      return [];
    }

    const normalized = portfolio
      .map((entry) => ({
        symbol: entry.symbol?.trim() || 'Unknown',
        totalCost: Number(entry.totalCost),
      }))
      .filter((entry) => Number.isFinite(entry.totalCost) && entry.totalCost > 0)
      .sort((a, b) => b.totalCost - a.totalCost);

    if (normalized.length === 0) {
      return [];
    }

    const dominantRows: Array<{ symbol: string; totalCost: number }> = [];
    let cumulativeRatio = 0;

    for (const entry of normalized) {
      const nextRatio = entry.totalCost / totalPortfolioValue;

      // Keep selection strict by not allowing cumulative ratio to cross the threshold,
      // while still ensuring at least one dominant slice is present.
      if (
        dominantRows.length > 0 &&
        cumulativeRatio + nextRatio > ALLOCATION_CUMULATIVE_THRESHOLD
      ) {
        break;
      }

      dominantRows.push(entry);
      cumulativeRatio += nextRatio;
    }

    const remaining = normalized.slice(dominantRows.length);
    const othersTotal = remaining.reduce((sum, entry) => sum + entry.totalCost, 0);

    const includeOthers =
      othersTotal > 0 && (othersTotal / totalPortfolioValue) > ALLOCATION_MIN_OTHERS_RATIO;

    const rows = includeOthers
      ? [...dominantRows, { symbol: 'Others', totalCost: othersTotal }]
      : dominantRows;

    return rows.map((row, index) => ({
      symbol: row.symbol,
      totalCost: row.totalCost,
      percentage: (row.totalCost / totalPortfolioValue) * 100,
      color: SEGMENT_COLORS[index % SEGMENT_COLORS.length],
    }));
  }, [portfolio, totalPortfolioValue]);

  const pnlBars = useMemo<PnlBar[]>(() => {
    return portfolio
      .map((entry) => {
        const symbol = entry.symbol?.trim() || 'Unknown';
        const currentValue = Number(entry.totalCost);
        const purchaseValue = Number(entry.totalPurchaseCost);

        if (!Number.isFinite(currentValue) || !Number.isFinite(purchaseValue)) {
          return null;
        }

        const pnl = currentValue - purchaseValue;

        return {
          symbol,
          pnl,
        };
      })
      .filter((bar): bar is PnlBar => Boolean(bar));
  }, [portfolio]);

  const filteredPnlBars = useMemo<PnlBar[]>(() => {
    if (pnlMode === 'top') {
      return [...pnlBars].sort((a, b) => b.pnl - a.pnl).slice(0, 8);
    }

    if (pnlMode === 'worst') {
      return [...pnlBars].sort((a, b) => a.pnl - b.pnl).slice(0, 8);
    }

    return pnlBars;
  }, [pnlBars, pnlMode]);

  const comparisonBars = useMemo<ComparisonBarGroup[]>(() => {
    return portfolio
      .map((entry) => {
        const symbol = entry.symbol?.trim() || 'Unknown';
        const quantity = Number(entry.quantity);
        const totalCost = Number(entry.totalCost);
        const totalPurchaseCost = Number(entry.totalPurchaseCost);

        if (
          !Number.isFinite(quantity) ||
          quantity <= 0 ||
          !Number.isFinite(totalCost) ||
          !Number.isFinite(totalPurchaseCost)
        ) {
          return null;
        }

        const currentPrice = totalCost / quantity;
        const purchasePrice = totalPurchaseCost / quantity;

        if (!Number.isFinite(currentPrice) || !Number.isFinite(purchasePrice)) {
          return null;
        }

        return {
          symbol,
          currentPrice,
          purchasePrice,
        };
      })
      .filter((row): row is ComparisonBarGroup => Boolean(row));
  }, [portfolio]);

  const donutSlices = useMemo<DonutSlice[]>(() => {
    if (allocationSegments.length === 0) {
      return [];
    }

    const rawSpans = allocationSegments.map((segment) => (segment.percentage / 100) * 360);
    const minRawSpan = Math.min(...rawSpans);
    const effectiveGapDegrees = Math.min(DONUT_SEGMENT_GAP_DEGREES, Math.max(0, minRawSpan * 0.35));

    let currentAngle = -90;

    return allocationSegments.map((segment, index) => {
      const rawSpan = rawSpans[index];
      const startAngle = currentAngle + effectiveGapDegrees / 2;
      const endAngle = startAngle + Math.max(rawSpan - effectiveGapDegrees, 0.2);
      currentAngle += rawSpan;

      return {
        ...segment,
        index,
        startAngle,
        endAngle,
      };
    });
  }, [allocationSegments]);

  const selectedSegmentData = useMemo<HoveredSegment | null>(() => {
    if (!selectedSegment) {
      return null;
    }

    const index = allocationSegments.findIndex((segment) => segment.symbol === selectedSegment);

    if (index < 0) {
      return null;
    }

    const segment = allocationSegments[index];
    return {
      symbol: segment.symbol,
      percentage: segment.percentage,
      value: segment.totalCost,
      index,
    };
  }, [allocationSegments, selectedSegment]);

  const activeSegment = selectedSegmentData ?? hoveredSegment;

  const activeDonutSlice = useMemo<DonutSlice | null>(() => {
    if (!activeSegment) {
      return null;
    }

    return donutSlices.find((slice) => slice.index === activeSegment.index) ?? null;
  }, [activeSegment, donutSlices]);

  const donutRotationDegrees = useMemo(() => {
    if (!activeDonutSlice) {
      return 0;
    }

    const midAngle = (activeDonutSlice.startAngle + activeDonutSlice.endAngle) / 2;
    return normalizeAngleDegrees(DONUT_ROTATION_TARGET_DEGREES - midAngle);
  }, [activeDonutSlice]);

  const targetCenterContent = useMemo<DonutCenterContent>(() => {
    if (!activeSegment) {
      return {
        title: 'Portfolio',
        value: `₹${formatNumber(totalPortfolioValue)}`,
      };
    }

    return {
      title: activeSegment.symbol,
      value: `₹${formatNumber(activeSegment.value)}`,
      percentage: formatPercent(activeSegment.percentage),
    };
  }, [activeSegment, totalPortfolioValue]);

  const activeCenterKey = activeSegment?.symbol || 'portfolio';

  const handleGraphTypeSelect = (nextType: GraphType) => {
    setGraphType(nextType);
    setHoveredItem(null);
    setHoveredSegment(null);
    setSelectedSegment(null);
  };

  useEffect(() => {
    if (graphType !== 'allocation' || donutSlices.length === 0) {
      setDonutAnimationElapsedMs(0);
      return;
    }

    const totalAnimationDuration =
      DONUT_ENTRY_DURATION_MS + Math.max(0, donutSlices.length - 1) * DONUT_ENTRY_STAGGER_MS;
    const animationStart = performance.now();
    let rafId = 0;
    let isCancelled = false;

    const tick = (timestamp: number) => {
      if (isCancelled) {
        return;
      }

      const elapsed = timestamp - animationStart;
      const nextElapsed = Math.min(elapsed, totalAnimationDuration);
      setDonutAnimationElapsedMs(nextElapsed);

      if (nextElapsed < totalAnimationDuration) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    setDonutAnimationElapsedMs(0);
    rafId = window.requestAnimationFrame(tick);

    return () => {
      isCancelled = true;
      window.cancelAnimationFrame(rafId);
    };
  }, [donutSlices, graphType]);

  useEffect(() => {
    if (graphType !== 'pnl' && graphType !== 'comparison') {
      setBarAnimationElapsedMs(0);
      return;
    }

    const barCount = graphType === 'pnl' ? filteredPnlBars.length : comparisonBars.length;
    if (barCount === 0) {
      setBarAnimationElapsedMs(0);
      return;
    }

    const totalAnimationDuration =
      BAR_ENTRY_DURATION_MS + Math.max(0, barCount - 1) * BAR_ENTRY_STAGGER_MS;
    const animationStart = performance.now();
    let rafId = 0;
    let isCancelled = false;

    const tick = (timestamp: number) => {
      if (isCancelled) {
        return;
      }

      const elapsed = timestamp - animationStart;
      const nextElapsed = Math.min(elapsed, totalAnimationDuration);
      setBarAnimationElapsedMs(nextElapsed);

      if (nextElapsed < totalAnimationDuration) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    setBarAnimationElapsedMs(0);
    rafId = window.requestAnimationFrame(tick);

    return () => {
      isCancelled = true;
      window.cancelAnimationFrame(rafId);
    };
  }, [comparisonBars.length, filteredPnlBars.length, graphType, pnlMode]);

  useEffect(() => {
    if (!selectedSegment) {
      return;
    }

    const exists = allocationSegments.some((segment) => segment.symbol === selectedSegment);
    if (!exists) {
      setSelectedSegment(null);
    }
  }, [allocationSegments, selectedSegment]);

  const updateTooltipPosition = (event: React.MouseEvent<SVGElement | SVGRectElement | SVGCircleElement>) => {
    if (!sectionRef.current) {
      return;
    }

    const bounds = sectionRef.current.getBoundingClientRect();
    // Keep tooltip visually anchored above the hovered bar without changing content logic.
    const nextX = event.clientX - bounds.left + 10;
    const nextY = event.clientY - bounds.top - 56;

    setTooltipPosition({
      x: Math.min(Math.max(nextX, 8), Math.max(8, bounds.width - 186)),
      y: Math.min(Math.max(nextY, 8), Math.max(8, bounds.height - 84)),
    });
  };

  return (
    <section ref={sectionRef} className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <style>{`
        @keyframes graph-content-in {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0px);
          }
        }

        @keyframes legend-row-in {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0px);
          }
        }

        @keyframes donut-center-content-in {
          from {
            opacity: 0;
            transform: scale(0.97);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes graph-tooltip-in {
          from {
            opacity: 0;
            transform: translateY(6px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0px) scale(1);
          }
        }
      `}</style>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h3 className="text-base font-semibold text-white">Portfolio Graph</h3>

        <div className="flex w-full max-w-md items-center gap-2 bg-white/5 border border-white/10 rounded-full p-1">
          {graphTypeOptions.map((option) => {
            const isActive = option.value === graphType;

            return (
              <button
                key={option.value}
                type="button"
                className={`flex-1 text-center px-4 py-1.5 rounded-full text-sm transition-all duration-200 ease-out ${
                  isActive
                    ? 'bg-gradient-to-r from-violet-500 to-blue-500 text-white shadow-md shadow-[0_0_12px_rgba(139,92,246,0.35)] scale-[1.02]'
                    : 'text-neutral-300 hover:bg-white/10 scale-100'
                }`}
                onClick={() => handleGraphTypeSelect(option.value)}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div
        key={graphType}
        style={{
          animation: `graph-content-in ${GRAPH_MOUNT_DURATION_MS}ms ease-out forwards`,
        }}
      >
      {graphType === 'comparison' ? (
        comparisonBars.length === 0 ? (
          <div className="min-h-[260px] flex items-center justify-center rounded-xl border border-white/10 bg-black/20 text-neutral-300">
            Add entries with purchase price to view comparison.
          </div>
        ) : (
          (() => {
            const plotHeight = COMPARISON_SVG_HEIGHT - COMPARISON_MARGIN_TOP - COMPARISON_MARGIN_BOTTOM;
            const itemCount = comparisonBars.length;
            const chartWidth = Math.max(
              COMPARISON_MIN_WIDTH,
              COMPARISON_MARGIN_LEFT +
                COMPARISON_MARGIN_RIGHT +
                itemCount * (DENSE_CHART_ITEM_WIDTH + DENSE_CHART_ITEM_GAP)
            );

            const maxPrice = Math.max(
              ...comparisonBars.flatMap((row) => [row.currentPrice, row.purchasePrice]),
              1
            );

            const gridLines = Array.from({ length: 5 }, (_, index) => {
              const ratio = index / 4;
              return COMPARISON_MARGIN_TOP + ratio * plotHeight;
            });

            const comparisonAnimationProgressFor = (index: number) =>
              easeOutCubic(
                clamp01((barAnimationElapsedMs - index * BAR_ENTRY_STAGGER_MS) / BAR_ENTRY_DURATION_MS)
              );

            return (
              <div className="space-y-4">
                <div
                  className="overflow-x-auto pb-2 py-6"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(148, 163, 184, 0.35) transparent',
                  }}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <div className="min-h-[340px] flex items-center justify-center" style={{ minWidth: chartWidth }}>
                    <svg
                      width={chartWidth}
                      height={COMPARISON_SVG_HEIGHT}
                      viewBox={`0 0 ${chartWidth} ${COMPARISON_SVG_HEIGHT}`}
                      aria-label="Portfolio price comparison grouped bar chart"
                      className="block"
                    >
                    <defs>
                      <linearGradient id="comparison-purchase-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(148,163,184,0.84)" />
                        <stop offset="100%" stopColor="rgba(148,163,184,0.5)" />
                      </linearGradient>
                      <linearGradient id="comparison-current-positive-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(52,211,153,0.94)" />
                        <stop offset="100%" stopColor="rgba(52,211,153,0.5)" />
                      </linearGradient>
                      <linearGradient id="comparison-current-negative-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(248,113,113,0.94)" />
                        <stop offset="100%" stopColor="rgba(248,113,113,0.5)" />
                      </linearGradient>
                      <linearGradient id="comparison-current-neutral-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(148,163,184,0.6)" />
                        <stop offset="100%" stopColor="rgba(148,163,184,0.28)" />
                      </linearGradient>
                      <linearGradient id="comparison-bar-top-highlight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.045)" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                      </linearGradient>
                      <filter id="bar-soft-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="1.1" />
                      </filter>
                    </defs>

                    {gridLines.map((y, index) => (
                      <line
                        key={`comparison-grid-${index}`}
                        x1={COMPARISON_MARGIN_LEFT - 4}
                        y1={y}
                        x2={chartWidth - COMPARISON_MARGIN_RIGHT + 4}
                        y2={y}
                        stroke="rgba(255,255,255,0.07)"
                        strokeWidth="1"
                      />
                    ))}

                    <line
                      x1={COMPARISON_MARGIN_LEFT - 4}
                      y1={COMPARISON_MARGIN_TOP + plotHeight}
                      x2={chartWidth - COMPARISON_MARGIN_RIGHT + 4}
                      y2={COMPARISON_MARGIN_TOP + plotHeight}
                      stroke="rgba(148,163,184,0.44)"
                      strokeWidth="1.9"
                    />

                    {comparisonBars.map((bar, index) => {
                      const groupStart = COMPARISON_MARGIN_LEFT + index * COMPARISON_SLOT_WIDTH;
                      const purchaseHeight = (bar.purchasePrice / maxPrice) * (plotHeight - 22);
                      const currentHeight = (bar.currentPrice / maxPrice) * (plotHeight - 22);
                      const animationProgress = comparisonAnimationProgressFor(index);
                      const animatedPurchaseHeight = Math.max(purchaseHeight * animationProgress, 2);
                      const animatedCurrentHeight = Math.max(currentHeight * animationProgress, 2);

                      const purchaseX =
                        groupStart +
                        (COMPARISON_SLOT_WIDTH - (COMPARISON_BAR_WIDTH * 2 + COMPARISON_BAR_GAP)) / 2;
                      const currentX = purchaseX + COMPARISON_BAR_WIDTH + COMPARISON_BAR_GAP;
                      const purchaseY = COMPARISON_MARGIN_TOP + plotHeight - animatedPurchaseHeight;
                      const currentY = COMPARISON_MARGIN_TOP + plotHeight - animatedCurrentHeight;

                      const currentFill =
                        bar.currentPrice > bar.purchasePrice
                          ? 'url(#comparison-current-positive-fill)'
                          : bar.currentPrice < bar.purchasePrice
                            ? 'url(#comparison-current-negative-fill)'
                            : 'url(#comparison-current-neutral-fill)';

                      const isHovered = hoveredItem?.graphType === 'comparison' && hoveredItem.index === index;
                      const hasComparisonHover = hoveredItem?.graphType === 'comparison';
                      const purchaseOpacity = hasComparisonHover ? (isHovered ? 1 : 0.55) : 0.86;
                      const currentOpacity = hasComparisonHover ? (isHovered ? 1 : 0.55) : 0.9;

                      return (
                        <g key={`${bar.symbol}-${index}`}>
                          <line
                            x1={purchaseX - 1}
                            y1={COMPARISON_MARGIN_TOP + plotHeight}
                            x2={currentX + COMPARISON_BAR_WIDTH + 1}
                            y2={COMPARISON_MARGIN_TOP + plotHeight}
                            stroke="rgba(148,163,184,0.24)"
                            strokeWidth="1.1"
                            pointerEvents="none"
                          />

                          <rect
                            x={purchaseX}
                            y={purchaseY}
                            width={COMPARISON_BAR_WIDTH}
                            height={animatedPurchaseHeight}
                            fill="url(#comparison-purchase-fill)"
                            rx={6}
                            opacity={purchaseOpacity}
                            className="transition-all ease-out"
                            style={{
                              transitionDuration: `${HOVER_TRANSITION_MS}ms`,
                              filter: isHovered
                                ? 'contrast(1.08) saturate(1.04) drop-shadow(0 0 3px rgba(148, 163, 184, 0.12))'
                                : 'none',
                            }}
                            onMouseMove={(event) => {
                              updateTooltipPosition(event);
                              setHoveredItem({
                                graphType: 'comparison',
                                symbol: bar.symbol,
                                purchasePrice: bar.purchasePrice,
                                currentPrice: bar.currentPrice,
                                difference: bar.currentPrice - bar.purchasePrice,
                                index,
                              });
                            }}
                            onMouseLeave={() => setHoveredItem(null)}
                          />

                          <rect
                            x={currentX}
                            y={currentY}
                            width={COMPARISON_BAR_WIDTH}
                            height={animatedCurrentHeight}
                            fill={currentFill}
                            rx={6}
                            opacity={currentOpacity}
                            className="transition-all ease-out"
                            style={{
                              transitionDuration: `${HOVER_TRANSITION_MS}ms`,
                              filter:
                                isHovered && bar.currentPrice > bar.purchasePrice
                                  ? 'contrast(1.08) saturate(1.05) drop-shadow(0 0 3px rgba(52, 211, 153, 0.14))'
                                  : isHovered && bar.currentPrice < bar.purchasePrice
                                    ? 'contrast(1.08) saturate(1.05) drop-shadow(0 0 3px rgba(248, 113, 113, 0.14))'
                                    : isHovered
                                      ? 'contrast(1.08) saturate(1.04) drop-shadow(0 0 3px rgba(148, 163, 184, 0.12))'
                                      : 'none',
                            }}
                            onMouseMove={(event) => {
                              updateTooltipPosition(event);
                              setHoveredItem({
                                graphType: 'comparison',
                                symbol: bar.symbol,
                                purchasePrice: bar.purchasePrice,
                                currentPrice: bar.currentPrice,
                                difference: bar.currentPrice - bar.purchasePrice,
                                index,
                              });
                            }}
                            onMouseLeave={() => setHoveredItem(null)}
                          />

                          <rect
                            x={purchaseX + 1}
                            y={purchaseY + 1}
                            width={Math.max(COMPARISON_BAR_WIDTH - 2, 1)}
                            height={Math.max(Math.min(animatedPurchaseHeight * 0.35, 14), 0)}
                            fill="url(#comparison-bar-top-highlight)"
                            rx={4}
                            opacity={0.54}
                            pointerEvents="none"
                          />

                          <rect
                            x={currentX + 1}
                            y={currentY + 1}
                            width={Math.max(COMPARISON_BAR_WIDTH - 2, 1)}
                            height={Math.max(Math.min(animatedCurrentHeight * 0.35, 14), 0)}
                            fill="url(#comparison-bar-top-highlight)"
                            rx={4}
                            opacity={0.52}
                            pointerEvents="none"
                          />

                          <ellipse
                            cx={purchaseX + COMPARISON_BAR_WIDTH / 2}
                            cy={purchaseY + animatedPurchaseHeight - 1}
                            rx={Math.max(COMPARISON_BAR_WIDTH * 0.45, 4)}
                            ry={2.3}
                            fill="rgba(148,163,184,0.14)"
                            opacity={isHovered ? 0.24 : 0.16}
                            filter="url(#bar-soft-glow)"
                            pointerEvents="none"
                          />

                          <ellipse
                            cx={currentX + COMPARISON_BAR_WIDTH / 2}
                            cy={currentY + animatedCurrentHeight - 1}
                            rx={Math.max(COMPARISON_BAR_WIDTH * 0.45, 4)}
                            ry={2.3}
                            fill={
                              bar.currentPrice > bar.purchasePrice
                                ? 'rgba(16,185,129,0.16)'
                                : bar.currentPrice < bar.purchasePrice
                                  ? 'rgba(239,68,68,0.16)'
                                  : 'rgba(148,163,184,0.14)'
                            }
                            opacity={isHovered ? 0.24 : 0.16}
                            filter="url(#bar-soft-glow)"
                            pointerEvents="none"
                          />

                          <g>
                            <title>{bar.symbol}</title>
                            <text
                              x={groupStart + COMPARISON_SLOT_WIDTH / 2}
                              y={COMPARISON_SVG_HEIGHT - X_AXIS_LABEL_BOTTOM_OFFSET + 4}
                              textAnchor="middle"
                              className="fill-neutral-300/70 text-[11px]"
                            >
                              {formatLabel(bar.symbol)}
                            </text>
                          </g>
                        </g>
                      );
                    })}
                    </svg>
                  </div>
                </div>

                <div className="flex items-center gap-5 text-xs text-neutral-300">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COMPARISON_PURCHASE_COLOR }} />
                    Purchase
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: POSITIVE_PNL_COLOR }} />
                    Current (Above Purchase)
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: NEGATIVE_PNL_COLOR }} />
                    Current (Below Purchase)
                  </div>
                </div>
              </div>
            );
          })()
        )
      ) : graphType === 'pnl' ? (
        filteredPnlBars.length === 0 ? (
          <div className="min-h-[260px] flex items-center justify-center rounded-xl border border-white/10 bg-black/20 text-neutral-300">
            Add portfolio entries to view P&amp;L.
          </div>
        ) : (
          (() => {
            const plotHeight = PNL_SVG_HEIGHT - PNL_MARGIN_TOP - PNL_MARGIN_BOTTOM;
            const zeroY = PNL_MARGIN_TOP + plotHeight / 2;
            const maxBarHeight = plotHeight / 2 - 20;
            const maxAbsPnl = Math.max(...filteredPnlBars.map((bar) => Math.abs(bar.pnl)), 1);
            const itemCount = filteredPnlBars.length;
            const chartWidth = Math.max(
              PNL_MIN_WIDTH,
              PNL_MARGIN_LEFT + PNL_MARGIN_RIGHT + itemCount * (DENSE_CHART_ITEM_WIDTH + DENSE_CHART_ITEM_GAP)
            );
            const shouldUseHorizontalScroll = pnlMode === 'all';

            const gridLines = Array.from({ length: 5 }, (_, index) => {
              const ratio = index / 4;
              return PNL_MARGIN_TOP + ratio * plotHeight;
            });

            const pnlAnimationProgressFor = (index: number) =>
              easeOutCubic(
                clamp01((barAnimationElapsedMs - index * BAR_ENTRY_STAGGER_MS) / BAR_ENTRY_DURATION_MS)
              );

            return (
              <div className="space-y-4">
                <div
                  className={`${shouldUseHorizontalScroll ? 'overflow-x-auto pb-2' : 'overflow-visible'} py-6`}
                  style={
                    shouldUseHorizontalScroll
                      ? {
                          scrollbarWidth: 'thin',
                          scrollbarColor: 'rgba(148, 163, 184, 0.35) transparent',
                        }
                      : undefined
                  }
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <div
                    className="min-h-[340px] flex items-center justify-center"
                    style={shouldUseHorizontalScroll ? { minWidth: chartWidth } : undefined}
                  >
                    <svg
                      width={chartWidth}
                      height={PNL_SVG_HEIGHT}
                      viewBox={`0 0 ${chartWidth} ${PNL_SVG_HEIGHT}`}
                      aria-label="Portfolio profit and loss bar chart"
                      className="block"
                    >
                    <defs>
                      <linearGradient id="pnl-positive-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(52,211,153,0.94)" />
                        <stop offset="100%" stopColor="rgba(52,211,153,0.5)" />
                      </linearGradient>
                      <linearGradient id="pnl-negative-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(248,113,113,0.94)" />
                        <stop offset="100%" stopColor="rgba(248,113,113,0.5)" />
                      </linearGradient>
                      <linearGradient id="pnl-bar-top-highlight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(255,255,255,0.045)" />
                        <stop offset="100%" stopColor="rgba(255,255,255,0)" />
                      </linearGradient>
                      <linearGradient id="pnl-neutral-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(148,163,184,0.6)" />
                        <stop offset="100%" stopColor="rgba(148,163,184,0.3)" />
                      </linearGradient>
                      <filter id="pnl-bar-soft-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="1.1" />
                      </filter>
                    </defs>

                    {gridLines.map((y, index) => (
                      <line
                        key={`pnl-grid-${index}`}
                        x1={PNL_MARGIN_LEFT - 4}
                        y1={y}
                        x2={chartWidth - PNL_MARGIN_RIGHT + 4}
                        y2={y}
                        stroke="rgba(255,255,255,0.07)"
                        strokeWidth="1"
                      />
                    ))}

                    <line
                      x1={PNL_MARGIN_LEFT - 4}
                      y1={zeroY}
                      x2={chartWidth - PNL_MARGIN_RIGHT + 4}
                      y2={zeroY}
                      stroke="rgba(148,163,184,0.44)"
                      strokeWidth="1.9"
                    />

                    {filteredPnlBars.map((bar, index) => {
                      const x = PNL_MARGIN_LEFT + index * PNL_SLOT_WIDTH + (PNL_SLOT_WIDTH - PNL_BAR_WIDTH) / 2;
                      const height = (Math.abs(bar.pnl) / maxAbsPnl) * maxBarHeight;
                      const animationProgress = pnlAnimationProgressFor(index);
                      const animatedHeight = Math.max(height * animationProgress, 2);
                      const y = bar.pnl >= 0 ? zeroY - animatedHeight : zeroY;
                      const isHovered = hoveredItem?.graphType === 'pnl' && hoveredItem.index === index;
                      const hasPnlHover = hoveredItem?.graphType === 'pnl';
                      const barOpacity = hasPnlHover ? (isHovered ? 1 : 0.55) : 0.88;
                      const fill =
                        bar.pnl > 0
                          ? 'url(#pnl-positive-fill)'
                          : bar.pnl < 0
                            ? 'url(#pnl-negative-fill)'
                            : 'url(#pnl-neutral-fill)';

                      return (
                        <g key={`${bar.symbol}-${index}`}>
                          <rect
                            x={x}
                            y={y}
                            width={PNL_BAR_WIDTH}
                            height={animatedHeight}
                            fill={fill}
                            rx={6}
                            opacity={barOpacity}
                            className="transition-all ease-out"
                            style={{
                              transitionDuration: `${HOVER_TRANSITION_MS}ms`,
                              filter: (() => {
                                if (!isHovered) {
                                  return 'none';
                                }

                                if (bar.pnl > 0) {
                                  return 'contrast(1.08) saturate(1.05) drop-shadow(0 0 3px rgba(52, 211, 153, 0.14))';
                                }

                                if (bar.pnl < 0) {
                                  return 'contrast(1.08) saturate(1.05) drop-shadow(0 0 3px rgba(248, 113, 113, 0.14))';
                                }

                                return 'contrast(1.08) saturate(1.04) drop-shadow(0 0 3px rgba(148, 163, 184, 0.12))';
                              })(),
                            }}
                            onMouseMove={(event) => {
                              updateTooltipPosition(event);
                              setHoveredItem({
                                graphType: 'pnl',
                                symbol: bar.symbol,
                                pnl: bar.pnl,
                                index,
                              });
                            }}
                            onMouseLeave={() => setHoveredItem(null)}
                          />

                          <rect
                            x={x + 1}
                            y={y + 1}
                            width={Math.max(PNL_BAR_WIDTH - 2, 1)}
                            height={Math.max(Math.min(animatedHeight * 0.35, 14), 0)}
                            fill="url(#pnl-bar-top-highlight)"
                            rx={4}
                            opacity={0.52}
                            pointerEvents="none"
                          />

                          <ellipse
                            cx={x + PNL_BAR_WIDTH / 2}
                            cy={y + animatedHeight - 1}
                            rx={Math.max(PNL_BAR_WIDTH * 0.45, 4)}
                            ry={2.3}
                            fill={
                              bar.pnl > 0
                                ? 'rgba(16,185,129,0.16)'
                                : bar.pnl < 0
                                  ? 'rgba(239,68,68,0.16)'
                                  : 'rgba(148,163,184,0.14)'
                            }
                            opacity={isHovered ? 0.24 : 0.16}
                            filter="url(#pnl-bar-soft-glow)"
                            pointerEvents="none"
                          />

                          <g>
                            <title>{bar.symbol}</title>
                            <text
                              x={x + PNL_BAR_WIDTH / 2}
                              y={PNL_SVG_HEIGHT - X_AXIS_LABEL_BOTTOM_OFFSET + 4}
                              textAnchor="middle"
                              className="fill-neutral-300/70 text-[11px]"
                            >
                              {formatLabel(bar.symbol)}
                            </text>
                          </g>
                        </g>
                      );
                    })}
                    </svg>
                  </div>
                </div>

                <div className="flex justify-center gap-3 mt-4">
                  {([
                    { value: 'top', label: 'Top' },
                    { value: 'worst', label: 'Worst' },
                    { value: 'all', label: 'All' },
                  ] as Array<{ value: PnlMode; label: string }>).map((option) => {
                    const isActive = pnlMode === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={`px-3 py-1 rounded-full text-sm transition-all duration-150 ${
                          isActive
                            ? 'bg-white/10 text-white scale-[1.03]'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                        onClick={() => {
                          setPnlMode(option.value);
                          setHoveredItem(null);
                        }}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()
        )
      ) : allocationSegments.length === 0 ? (
        <div className="min-h-[260px] flex items-center justify-center rounded-xl border border-white/10 bg-black/20 text-neutral-300">
          Add portfolio entries to view allocation.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 items-center">
          <div className="mx-auto">
            <svg
              viewBox={`0 0 ${CHART_SIZE} ${CHART_SIZE}`}
              width={CHART_SIZE}
              height={CHART_SIZE}
              aria-label="Portfolio allocation donut chart"
              onMouseLeave={() => setHoveredSegment(null)}
              onClick={() => setSelectedSegment(null)}
            >
              <defs>
                <filter id="donut-hover-depth" x="-22%" y="-22%" width="144%" height="144%" colorInterpolationFilters="sRGB">
                  <feDropShadow dx="0" dy="0.6" stdDeviation="1.2" floodColor="#93c5fd" floodOpacity="0.16" />
                  <feDropShadow dx="0" dy="0" stdDeviation="2.2" floodColor="#bfdbfe" floodOpacity="0.08" />
                  <feGaussianBlur in="SourceAlpha" stdDeviation="1.1" result="innerBlur" />
                  <feOffset in="innerBlur" dx="0" dy="0.9" result="innerOffset" />
                  <feComposite in="innerOffset" in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="innerCut" />
                  <feFlood floodColor="#020617" floodOpacity="0.2" result="innerColor" />
                  <feComposite in="innerColor" in2="innerCut" operator="in" result="innerShadow" />
                  <feComposite in="innerShadow" in2="SourceGraphic" operator="over" />
                </filter>
              </defs>

              {(() => {
                const activeIndex = activeSegment?.index ?? null;

                const renderSliceVisualPath = (slice: DonutSlice) => {
                  const progressStartDelay = slice.index * DONUT_ENTRY_STAGGER_MS;
                  const rawProgress =
                    (donutAnimationElapsedMs - progressStartDelay) / DONUT_ENTRY_DURATION_MS;
                  const easedProgress = easeOutCubic(clamp01(rawProgress));

                  if (easedProgress <= 0) {
                    return null;
                  }

                  const animatedEndAngle =
                    slice.startAngle + (slice.endAngle - slice.startAngle) * easedProgress;
                  const safeEndAngle =
                    animatedEndAngle - slice.startAngle < 0.08
                      ? slice.startAngle + 0.08
                      : animatedEndAngle;
                  const animatedPath = buildDonutSlicePath(
                    CHART_CENTER,
                    CHART_CENTER,
                    DONUT_OUTER_RADIUS,
                    DONUT_INNER_RADIUS,
                    slice.startAngle,
                    safeEndAngle
                  );

                  const isActive = activeIndex === slice.index;
                  const midAngle = (slice.startAngle + safeEndAngle) / 2;
                  const hoverOffsetX = Math.cos((midAngle * Math.PI) / 180) * 6;
                  const hoverOffsetY = Math.sin((midAngle * Math.PI) / 180) * 6;

                  return (
                    <path
                      key={`${slice.symbol}-${slice.index}`}
                      d={animatedPath}
                      fill={isActive ? brightenColor(slice.color, 0.12) : slice.color}
                      opacity={activeSegment ? (isActive ? 1 : 0.18) : 0.94}
                      className="transition-[opacity,filter,fill,transform] ease-out"
                      style={{
                        transitionDuration: `${HOVER_TRANSITION_MS}ms`,
                        filter: isActive
                          ? 'url(#donut-hover-depth)'
                          : 'none',
                        transform: isActive
                          ? `translate(${hoverOffsetX}px, ${hoverOffsetY}px)`
                          : 'translate(0px, 0px)',
                      }}
                    />
                  );
                };

                const renderSliceInteractionPath = (slice: DonutSlice) => {
                  const interactionPath = buildDonutSlicePath(
                    CHART_CENTER,
                    CHART_CENTER,
                    DONUT_OUTER_RADIUS,
                    DONUT_INNER_RADIUS,
                    slice.startAngle,
                    slice.endAngle
                  );

                  return (
                    <path
                      key={`interaction-${slice.symbol}-${slice.index}`}
                      d={interactionPath}
                      fill="transparent"
                      style={{ cursor: 'pointer' }}
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedSegment((previous) =>
                          previous === slice.symbol ? null : slice.symbol
                        );
                      }}
                      onMouseEnter={() => {
                        setHoveredSegment({
                          symbol: slice.symbol,
                          percentage: slice.percentage,
                          value: slice.totalCost,
                          index: slice.index,
                        });
                      }}
                      onMouseMove={() => {
                        setHoveredSegment((previous) => {
                          if (previous?.index === slice.index) {
                            return previous;
                          }

                          return {
                            symbol: slice.symbol,
                            percentage: slice.percentage,
                            value: slice.totalCost,
                            index: slice.index,
                          };
                        });
                      }}
                    />
                  );
                };

                return (
                  <>
                    <g
                      style={{
                        transformOrigin: `${CHART_CENTER}px ${CHART_CENTER}px`,
                        transform: `rotate(${donutRotationDegrees}deg)`,
                        transition: 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1)',
                        willChange: 'transform',
                      }}
                    >
                      {donutSlices.map((slice) => renderSliceVisualPath(slice))}

                      <circle
                        cx={CHART_CENTER}
                        cy={CHART_CENTER}
                        r={DONUT_INNER_RADIUS}
                        fill="rgba(15, 23, 42, 0.9)"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="1"
                      />
                    </g>

                    <g>{donutSlices.map((slice) => renderSliceInteractionPath(slice))}</g>
                  </>
                );
              })()}

              <g
                key={activeCenterKey}
                className="transition"
              >
                <text
                  x={CHART_CENTER}
                  y={CHART_CENTER - 14}
                  textAnchor="middle"
                  className="fill-neutral-300 text-[10px] uppercase tracking-[0.15em]"
                >
                  {targetCenterContent.title}
                </text>
                <text
                  x={CHART_CENTER}
                  y={CHART_CENTER + 8}
                  textAnchor="middle"
                  className="fill-white text-[14px] font-semibold"
                  style={{
                    transformOrigin: `${CHART_CENTER}px ${CHART_CENTER + 8}px`,
                    animation: 'donut-center-content-in 200ms ease-out forwards',
                  }}
                >
                  {targetCenterContent.value}
                </text>
                {targetCenterContent.percentage && (
                  <text
                    x={CHART_CENTER}
                    y={CHART_CENTER + 26}
                    textAnchor="middle"
                    className="fill-neutral-300 text-[10px]"
                    style={{
                      transformOrigin: `${CHART_CENTER}px ${CHART_CENTER + 26}px`,
                      animation: 'donut-center-content-in 200ms ease-out forwards',
                    }}
                  >
                    {targetCenterContent.percentage}
                  </text>
                )}
              </g>
            </svg>
          </div>

          <div className="relative">
            <div
              className="max-h-[320px] overflow-y-auto pr-1 scroll-smooth space-y-3"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(148, 163, 184, 0.35) transparent',
              }}
            >
              {allocationSegments.map((segment, index) => {
                const isActive = selectedSegment === segment.symbol || hoveredSegment?.symbol === segment.symbol;

                return (
                  <div
                    key={`${segment.symbol}-${segment.color}`}
                    className={`flex items-center justify-between rounded-xl border px-4 py-3 cursor-pointer transition-all ease-out hover:scale-[1.01] ${
                      isActive
                        ? 'bg-white/5 border-white/10'
                        : 'bg-black/20 border-white/10 hover:bg-white/[0.04]'
                    }`}
                    style={{
                      transitionDuration: `${HOVER_TRANSITION_MS}ms`,
                      animation: 'legend-row-in 240ms ease-out forwards',
                      animationDelay: `${LEGEND_ENTRY_BASE_DELAY_MS + index * LEGEND_ENTRY_STAGGER_MS}ms`,
                      opacity: 0,
                    }}
                    onClick={() => {
                      setSelectedSegment((previous) =>
                        previous === segment.symbol ? null : segment.symbol
                      );
                    }}
                    onMouseEnter={() => {
                      setHoveredSegment((previous) => {
                        if (previous?.symbol === segment.symbol) {
                          return previous;
                        }

                        const index = allocationSegments.findIndex((row) => row.symbol === segment.symbol);
                        return {
                          symbol: segment.symbol,
                          percentage: segment.percentage,
                          value: segment.totalCost,
                          index: index >= 0 ? index : 0,
                        };
                      });
                    }}
                    onMouseLeave={() => {
                      if (!selectedSegment) {
                        setHoveredSegment(null);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <span
                        className={`rounded-full shrink-0 transition-all ease-out ${isActive ? 'h-3.5 w-3.5' : 'h-3 w-3'}`}
                        style={{
                          transitionDuration: `${HOVER_TRANSITION_MS}ms`,
                          backgroundColor: segment.color,
                        }}
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-white truncate">{segment.symbol}</div>
                        <div className="mt-1 h-[3px] w-full rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all ease-out"
                            style={{
                              transitionDuration: `${HOVER_TRANSITION_MS}ms`,
                              width: `${Math.max(0, Math.min(100, segment.percentage))}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-white font-medium">{formatPercent(segment.percentage)}</div>
                      <div className="text-xs text-neutral-400">{formatNumber(segment.totalCost)}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pointer-events-none absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-slate-950/80 to-transparent rounded-t-xl" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-slate-950/80 to-transparent rounded-b-xl" />
          </div>
        </div>
      )}
      </div>

      {hoveredItem && graphType !== 'allocation' && (
        <div
          className="pointer-events-none absolute z-20 bg-black/80 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            boxShadow: '0 10px 24px rgba(2, 6, 23, 0.32), 0 2px 8px rgba(2, 6, 23, 0.24)',
            animation: 'graph-tooltip-in 180ms ease-out',
            transformOrigin: 'top left',
          }}
        >
          {hoveredItem.graphType === 'pnl' ? (
            <>
              <div className="font-medium text-white">{hoveredItem.symbol}</div>
              <div className={hoveredItem.pnl > 0 ? 'text-emerald-300' : hoveredItem.pnl < 0 ? 'text-rose-300' : 'text-neutral-300'}>
                {`${hoveredItem.pnl >= 0 ? '+' : ''}${formatNumber(hoveredItem.pnl)}`}
              </div>
            </>
          ) : (
            <>
              <div className="font-medium text-white">{hoveredItem.symbol}</div>
              <div className="text-neutral-300">{`Purchase: ₹${formatNumber(hoveredItem.purchasePrice)}`}</div>
              <div className="text-neutral-300">{`Current: ₹${formatNumber(hoveredItem.currentPrice)}`}</div>
              <div
                className={
                  hoveredItem.difference > 0
                    ? 'text-emerald-300'
                    : hoveredItem.difference < 0
                      ? 'text-rose-300'
                      : 'text-neutral-300'
                }
              >
                {`Diff: ${hoveredItem.difference >= 0 ? '+' : ''}${formatNumber(hoveredItem.difference)}`}
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}