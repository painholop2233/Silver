import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { PricePoint, VolumeProfileBar, generateVolumeProfile } from '../data/silverData';
import { CurrencyUnit } from './Header';
import { Layers, RefreshCw, Zap, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { InfoButton } from './HelpModal';
import { CandleInterval, fetchCandles, RealtimeQuoteResponse } from '../services/marketApi';

interface PriceChartProps {
  prices: PricePoint[];
  currencyUnit: CurrencyUnit;
  realtimeQuote?: RealtimeQuoteResponse | null;
  onRefreshLive?: () => void;
  isLoadingLive?: boolean;
}

export type TimeRange1D = '1M' | '3M' | '6M' | '1Y' | 'ALL';

export const PriceChart: React.FC<PriceChartProps> = ({
  prices: initialPrices,
  currencyUnit,
  realtimeQuote,
  onRefreshLive,
  isLoadingLive,
}) => {
  // Timeframe state: 5m, 15m, 1h, 4h, 1d
  const [selectedInterval, setSelectedInterval] = useState<CandleInterval>('1d');
  const [range1D, setRange1D] = useState<TimeRange1D>('1Y');
  const [chartType, setChartType] = useState<'candlestick' | 'area'>('candlestick');

  // Indicators toggles
  const [showSma50, setShowSma50] = useState(true);
  const [showSma200, setShowSma200] = useState(true);
  const [showBollinger, setShowBollinger] = useState(false);
  const [showVolumeProfile, setShowVolumeProfile] = useState(true);

  // Active candles series for the selected interval
  const [candles, setCandles] = useState<PricePoint[]>(initialPrices);
  const [isLoadingCandles, setIsLoadingCandles] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Currency multiplier
  const multiplier = useMemo(() => {
    switch (currencyUnit) {
      case 'USD_OZ': return 1;
      case 'EUR_OZ': return 0.925;
      case 'USD_KG': return 1000 / 31.1035;
      case 'RUB_G': return 92.5 / 31.1035;
    }
  }, [currencyUnit]);

  const unitPrefix = currencyUnit === 'USD_OZ' || currencyUnit === 'USD_KG' ? '$' : currencyUnit === 'EUR_OZ' ? '€' : '₽';
  const unitSuffix = currencyUnit === 'USD_OZ' ? ' $/oz' : currencyUnit === 'EUR_OZ' ? ' €/oz' : currencyUnit === 'USD_KG' ? ' $/kg' : ' ₽/g';

  // Load candles when interval changes
  const loadTimeframeCandles = useCallback(async (interval: CandleInterval) => {
    if (interval === '1d') {
      if (initialPrices && initialPrices.length > 0) {
        setCandles(initialPrices);
      }
      return;
    }

    setIsLoadingCandles(true);
    try {
      const data = await fetchCandles(interval);
      if (data && data.length > 0) {
        setCandles(data);
      }
    } catch (err) {
      console.warn(`Failed to load ${interval} candles:`, err);
    } finally {
      setIsLoadingCandles(false);
    }
  }, [initialPrices]);

  // Trigger load when selectedInterval changes
  useEffect(() => {
    loadTimeframeCandles(selectedInterval);
  }, [selectedInterval, loadTimeframeCandles]);

  // Keep daily candles synced if initialPrices update from parent
  useEffect(() => {
    if (selectedInterval === '1d' && initialPrices.length > 0) {
      setCandles(initialPrices);
    }
  }, [initialPrices, selectedInterval]);

  // Dynamically update the latest candle close with real-time quote
  useEffect(() => {
    const livePrice = realtimeQuote?.activeContract?.price;
    if (livePrice && livePrice > 0) {
      setCandles((prev) => {
        if (!prev.length) return prev;
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        const lastCandle = { ...updated[lastIdx] };

        // Update close, high, low of the current candle
        lastCandle.close = livePrice;
        if (livePrice > lastCandle.high) lastCandle.high = livePrice;
        if (livePrice < lastCandle.low) lastCandle.low = livePrice;

        updated[lastIdx] = lastCandle;
        return updated;
      });
    }
  }, [realtimeQuote]);

  // Filter candles based on timeframe
  const displayCandles = useMemo(() => {
    if (!candles.length) return [];
    if (selectedInterval !== '1d') {
      // For intraday intervals, take the most recent 60-120 candles for optimal visibility
      const sliceCount = selectedInterval === '5m' ? 80 : selectedInterval === '15m' ? 80 : selectedInterval === '1h' ? 90 : 80;
      return candles.slice(-sliceCount);
    }

    // For 1D interval, use the sub-range selector
    switch (range1D) {
      case '1M': return candles.slice(-22);
      case '3M': return candles.slice(-66);
      case '6M': return candles.slice(-130);
      case '1Y': return candles.slice(-252);
      case 'ALL': return candles;
    }
  }, [candles, selectedInterval, range1D]);

  // Compute Volume Profile for current view
  const currentVolumeProfile: VolumeProfileBar[] = useMemo(() => {
    return generateVolumeProfile(displayCandles, 24);
  }, [displayCandles]);

  // Find price min/max with indicator buffer
  const { minPrice, maxPrice, maxVol } = useMemo(() => {
    if (!displayCandles.length) return { minPrice: 0, maxPrice: 100, maxVol: 100000 };
    let min = Infinity;
    let max = -Infinity;
    let mVol = 0;

    displayCandles.forEach((p) => {
      const pLow = p.low * multiplier;
      const pHigh = p.high * multiplier;
      if (pLow < min) min = pLow;
      if (pHigh > max) max = pHigh;
      if (p.volume > mVol) mVol = p.volume;

      if (showBollinger && p.bbLower && p.bbUpper) {
        if (p.bbLower * multiplier < min) min = p.bbLower * multiplier;
        if (p.bbUpper * multiplier > max) max = p.bbUpper * multiplier;
      }
    });

    const padding = (max - min) * 0.08 || 1;
    return {
      minPrice: Math.max(0, min - padding),
      maxPrice: max + padding,
      maxVol: mVol * 1.25 || 1000,
    };
  }, [displayCandles, multiplier, showBollinger]);

  // Chart Dimensions
  const chartHeight = 370;
  const volumeHeight = 90;
  const totalSvgHeight = chartHeight + volumeHeight;
  const svgWidth = 860;
  const margin = { top: 25, right: showVolumeProfile ? 95 : 65, bottom: 25, left: 10 };
  const plotWidth = svgWidth - margin.left - margin.right;
  const plotHeight = chartHeight - margin.top;

  // Scale helpers
  const getX = (idx: number) => {
    if (displayCandles.length <= 1) return margin.left;
    return margin.left + (idx / (displayCandles.length - 1)) * plotWidth;
  };

  const getY = (val: number) => {
    const range = maxPrice - minPrice;
    if (range <= 0) return margin.top + plotHeight / 2;
    return margin.top + plotHeight - ((val - minPrice) / range) * plotHeight;
  };

  const getVolY = (vol: number) => {
    const scaled = (vol / maxVol) * (volumeHeight - 15);
    return totalSvgHeight - margin.bottom - scaled;
  };

  // Latest candle / Live price calculations
  const latestCandle = displayCandles[displayCandles.length - 1];
  const prevCandle = displayCandles[displayCandles.length - 2] || latestCandle;

  const liveRawPrice = realtimeQuote?.activeContract?.price || latestCandle?.close || 0;
  const livePriceConverted = liveRawPrice * multiplier;
  const livePriceDiff = latestCandle && prevCandle ? latestCandle.close - prevCandle.close : 0;
  const livePricePct = prevCandle && prevCandle.close > 0 ? (livePriceDiff / prevCandle.close) * 100 : 0;
  const isUp = livePriceDiff >= 0;

  // Last price Y coordinate on the SVG plot
  const lastPriceY = getY(livePriceConverted);
  const lastPriceX = getX(Math.max(0, displayCandles.length - 1));

  // Crosshair mouse handling
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const ratio = (clientX / rect.width) * svgWidth;
    const relX = ratio - margin.left;
    if (relX < 0) {
      setHoverIndex(0);
      return;
    }
    if (relX > plotWidth) {
      setHoverIndex(displayCandles.length - 1);
      return;
    }
    const rawIdx = Math.round((relX / plotWidth) * (displayCandles.length - 1));
    const clamped = Math.max(0, Math.min(displayCandles.length - 1, rawIdx));
    setHoverIndex(clamped);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  // Paths
  const linePath = useMemo(() => {
    if (!displayCandles.length) return '';
    return displayCandles
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(p.close * multiplier)}`)
      .join(' ');
  }, [displayCandles, multiplier, minPrice, maxPrice]);

  const areaPath = useMemo(() => {
    if (!displayCandles.length) return '';
    const bottomY = margin.top + plotHeight;
    const firstX = getX(0);
    const lastX = getX(displayCandles.length - 1);
    return `${linePath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [linePath, displayCandles]);

  const sma50Path = useMemo(() => {
    if (!showSma50) return '';
    const points: string[] = [];
    displayCandles.forEach((p, idx) => {
      if (p.sma50 !== undefined) {
        points.push(`${points.length === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(p.sma50 * multiplier)}`);
      }
    });
    return points.join(' ');
  }, [displayCandles, multiplier, showSma50, minPrice, maxPrice]);

  const sma200Path = useMemo(() => {
    if (!showSma200) return '';
    const points: string[] = [];
    displayCandles.forEach((p, idx) => {
      if (p.sma200 !== undefined) {
        points.push(`${points.length === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(p.sma200 * multiplier)}`);
      }
    });
    return points.join(' ');
  }, [displayCandles, multiplier, showSma200, minPrice, maxPrice]);

  const bbUpperPath = useMemo(() => {
    if (!showBollinger) return '';
    const points: string[] = [];
    displayCandles.forEach((p, idx) => {
      if (p.bbUpper !== undefined) {
        points.push(`${points.length === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(p.bbUpper * multiplier)}`);
      }
    });
    return points.join(' ');
  }, [displayCandles, multiplier, showBollinger, minPrice, maxPrice]);

  const bbLowerPath = useMemo(() => {
    if (!showBollinger) return '';
    const points: string[] = [];
    displayCandles.forEach((p, idx) => {
      if (p.bbLower !== undefined) {
        points.push(`${points.length === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(p.bbLower * multiplier)}`);
      }
    });
    return points.join(' ');
  }, [displayCandles, multiplier, showBollinger, minPrice, maxPrice]);

  const maxVpVol = useMemo(() => {
    return Math.max(1, ...currentVolumeProfile.map((b) => b.volume));
  }, [currentVolumeProfile]);

  // Price Ticks
  const priceTicks = useMemo(() => {
    const ticks: number[] = [];
    const count = 6;
    const step = (maxPrice - minPrice) / (count - 1);
    for (let i = 0; i < count; i++) {
      ticks.push(minPrice + i * step);
    }
    return ticks;
  }, [minPrice, maxPrice]);

  // Candle width based on count
  const candleBarWidth = Math.max(2, Math.min(14, (plotWidth / displayCandles.length) * 0.72));

  // Current active item (hovered or latest live)
  const activeItem = hoverIndex !== null && hoverIndex >= 0 && hoverIndex < displayCandles.length
    ? displayCandles[hoverIndex]
    : latestCandle;

  // Session stats for the current view
  const viewStats = useMemo(() => {
    if (!displayCandles.length) return { high: 0, low: 0, totalVolume: 0 };
    const highs = displayCandles.map((p) => p.high * multiplier);
    const lows = displayCandles.map((p) => p.low * multiplier);
    const totalVolume = displayCandles.reduce((a, b) => a + b.volume, 0);
    return {
      high: Math.max(...highs),
      low: Math.min(...lows),
      totalVolume,
    };
  }, [displayCandles, multiplier]);

  // Timeframe configuration
  const intervals: Array<{ id: CandleInterval; label: string; desc: string }> = [
    { id: '5m', label: '5 мин', desc: '5-минутные свечи' },
    { id: '15m', label: '15 мин', desc: '15-минутные свечи' },
    { id: '1h', label: '1 час', desc: 'Часовые свечи' },
    { id: '4h', label: '4 часа', desc: '4-часовые свечи' },
    { id: '1d', label: '1 день', desc: 'Дневные свечи MOEX' },
  ];

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 lg:p-6 backdrop-blur">
      {/* 1. TOP LIVE QUOTE & TICKER BANNER (Visual Highlight of Last Price) */}
      <div className="pb-4 mb-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Huge Live Price with Direction & Beacon */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-400" />
              <span className="absolute w-6 h-6 rounded-full bg-emerald-400/40 animate-ping" />
            </div>
            <div>
              <div className="flex items-baseline gap-3">
                <span className="text-3xl lg:text-4xl font-extrabold font-mono text-white tracking-tight tabular-nums drop-shadow-sm">
                  {unitPrefix}{livePriceConverted.toFixed(2)}
                </span>
                <span
                  className={`inline-flex items-center text-sm lg:text-base font-bold font-mono px-2 py-0.5 rounded-md tabular-nums ${
                    isUp ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30' : 'text-rose-400 bg-rose-500/10 border border-rose-500/30'
                  }`}
                >
                  {isUp ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
                  {isUp ? '+' : ''}{(livePriceDiff * multiplier).toFixed(2)} ({isUp ? '+' : ''}{livePricePct.toFixed(2)}%)
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 font-mono">
                <span className="text-cyan-300 font-semibold">ПОСЛЕДНЯЯ КОТИРОВКА (SVZ6)</span>
                <span aria-hidden="true">·</span>
                <span>Т-Банк Open API</span>
                {realtimeQuote?.timestamp && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-slate-500">
                      {new Date(realtimeQuote.timestamp).toLocaleTimeString('ru-RU')} MSK
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Quick Range & Spread Chips */}
        <div className="flex items-center flex-wrap gap-2 text-xs font-mono">
          {realtimeQuote?.orderBook && (
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="text-slate-400">Bid / Ask:</span>
              <span className="text-emerald-400 font-semibold">
                ${realtimeQuote.orderBook.bestBid?.toFixed(2) || '—'}
              </span>
              <span className="text-slate-600">/</span>
              <span className="text-rose-400 font-semibold">
                ${realtimeQuote.orderBook.bestAsk?.toFixed(2) || '—'}
              </span>
              {realtimeQuote.orderBook.spread !== null && (
                <span className="text-[11px] text-cyan-300 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                  Спред ${realtimeQuote.orderBook.spread.toFixed(2)}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400">Диапазон:</span>
            <span className="text-rose-400 font-semibold">L: {unitPrefix}{viewStats.low.toFixed(2)}</span>
            <span className="text-slate-600">—</span>
            <span className="text-emerald-400 font-semibold">H: {unitPrefix}{viewStats.high.toFixed(2)}</span>
          </div>

          {onRefreshLive && (
            <button
              onClick={onRefreshLive}
              disabled={isLoadingLive || isLoadingCandles}
              title="Запросить свежие котировки с сервера"
              className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLive || isLoadingCandles ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* 2. TIMEFRAME SELECTOR BAR (5m, 15m, 1h, 4h, 1d) & INDICATORS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 mb-3 border-b border-slate-800">
        {/* Left: Interval Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            {intervals.map((inv) => {
              const isActive = selectedInterval === inv.id;
              return (
                <button
                  key={inv.id}
                  onClick={() => setSelectedInterval(inv.id)}
                  title={inv.desc}
                  className={`px-3 py-1.5 rounded-md transition-all font-semibold whitespace-nowrap ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  {inv.label}
                </button>
              );
            })}
          </div>

          {/* Sub-ranges for 1D mode (1M, 3M, 6M, 1Y, ALL) */}
          {selectedInterval === '1d' && (
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800/80 text-xs font-mono">
              {(['1M', '3M', '6M', '1Y', 'ALL'] as TimeRange1D[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange1D(r)}
                  className={`px-2 py-1 rounded transition-colors ${
                    range1D === r ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          )}

          {isLoadingCandles && (
            <span className="text-xs text-cyan-400 animate-pulse font-mono flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" /> Загрузка свечей...
            </span>
          )}
        </div>

        {/* Right: Chart Type & Indicators */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Chart Type Toggle */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setChartType('candlestick')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                chartType === 'candlestick' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Свечи
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                chartType === 'area' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Линия
            </button>
          </div>

          {/* Indicators toggles */}
          <button
            onClick={() => setShowSma50(!showSma50)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-colors ${
              showSma50 ? 'bg-amber-500/10 border-amber-500/40 text-amber-300 font-semibold' : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            SMA 50
          </button>

          <button
            onClick={() => setShowSma200(!showSma200)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-colors ${
              showSma200 ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300 font-semibold' : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            SMA 200
          </button>

          <button
            onClick={() => setShowBollinger(!showBollinger)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-colors ${
              showBollinger ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 font-semibold' : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            Bollinger (20,2)
          </button>

          <button
            onClick={() => setShowVolumeProfile(!showVolumeProfile)}
            title="Горизонтальный профиль объемов (POC)"
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors ${
              showVolumeProfile ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 font-semibold' : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            POC
          </button>

          <div className="border-l border-slate-800 pl-1.5">
            <InfoButton topicId="price_chart" title="Справка по котировкам и таймфреймам" />
          </div>
        </div>
      </div>

      {/* 3. DYNAMIC CANDLE METRIC READOUT (Hover crosshair or Live candle) */}
      {activeItem && (
        <div className="py-2 px-3 my-2 bg-slate-950/80 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-x-5 gap-y-1 text-xs font-mono">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400 font-sans">
              {hoverIndex !== null ? 'Свеча:' : 'Текущая свеча (Live):'}
            </span>
            <span className="text-white font-bold">{activeItem.date}</span>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <span className="text-slate-400">O: </span>
              <span className="text-slate-200 tabular-nums">{unitPrefix}{(activeItem.open * multiplier).toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-400">H: </span>
              <span className="text-emerald-400 tabular-nums">{unitPrefix}{(activeItem.high * multiplier).toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-400">L: </span>
              <span className="text-rose-400 tabular-nums">{unitPrefix}{(activeItem.low * multiplier).toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-400">C: </span>
              <span className="text-cyan-300 font-bold tabular-nums">{unitPrefix}{(activeItem.close * multiplier).toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-400">Объем: </span>
              <span className="text-slate-300 tabular-nums">{activeItem.volume.toLocaleString()}</span>
            </div>
            {activeItem.sma50 && showSma50 && (
              <div className="text-amber-400 hidden sm:block">
                <span>SMA50: </span>
                <span className="tabular-nums">{unitPrefix}{(activeItem.sma50 * multiplier).toFixed(2)}</span>
              </div>
            )}
            {activeItem.sma200 && showSma200 && (
              <div className="text-indigo-400 hidden sm:block">
                <span>SMA200: </span>
                <span className="tabular-nums">{unitPrefix}{(activeItem.sma200 * multiplier).toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. MAIN SVG INTERACTIVE CHART WITH PROMINENT LAST PRICE LINE & BADGE */}
      <div ref={containerRef} className="relative w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${svgWidth} ${totalSvgHeight}`}
          className="w-full h-auto cursor-crosshair overflow-visible"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <linearGradient id="silverAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.32" />
              <stop offset="50%" stopColor="#0284c7" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
            </linearGradient>

            <linearGradient id="bbBandGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.02" />
            </linearGradient>

            {/* Glowing filter for live quote badge */}
            <filter id="glowLastPrice" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={isUp ? '#10b981' : '#f43f5e'} floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Background Grid Lines & Price Axis Labels */}
          {priceTicks.map((price, i) => {
            const y = getY(price);
            return (
              <g key={i}>
                <line
                  x1={margin.left}
                  y1={y}
                  x2={margin.left + plotWidth}
                  y2={y}
                  stroke="#334155"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity="0.3"
                />
                <text
                  x={margin.left + plotWidth + 6}
                  y={y + 4}
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                  textAnchor="start"
                >
                  {unitPrefix}{price.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* Volume Separator Line */}
          <line
            x1={margin.left}
            y1={chartHeight}
            x2={margin.left + plotWidth}
            y2={chartHeight}
            stroke="#334155"
            strokeWidth="1"
            opacity="0.6"
          />
          <text
            x={margin.left + 4}
            y={chartHeight + 14}
            fill="#64748b"
            fontSize="9"
            fontFamily="JetBrains Mono, monospace"
          >
            ОБЪЕМЫ (КОНТРАКТЫ SVZ6) · {selectedInterval.toUpperCase()}
          </text>

          {/* Bollinger Bands Fill & Lines */}
          {showBollinger && bbUpperPath && bbLowerPath && (
            <path
              d={`${bbUpperPath} L ${getX(displayCandles.length - 1)} ${getY((displayCandles[displayCandles.length - 1].bbLower || 0) * multiplier)} ${bbLowerPath.replace('M', 'L')} Z`}
              fill="url(#bbBandGrad)"
            />
          )}
          {showBollinger && bbUpperPath && (
            <path d={bbUpperPath} fill="none" stroke="#06b6d4" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
          )}
          {showBollinger && bbLowerPath && (
            <path d={bbLowerPath} fill="none" stroke="#06b6d4" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
          )}

          {/* Moving Averages: SMA 50 & SMA 200 */}
          {showSma200 && sma200Path && (
            <path d={sma200Path} fill="none" stroke="#818cf8" strokeWidth="1.5" opacity="0.85" />
          )}
          {showSma50 && sma50Path && (
            <path d={sma50Path} fill="none" stroke="#f59e0b" strokeWidth="1.5" opacity="0.9" />
          )}

          {/* Price Series: Candlesticks or Area Line */}
          {chartType === 'area' ? (
            <>
              <path d={areaPath} fill="url(#silverAreaGrad)" />
              <path d={linePath} fill="none" stroke="#38bdf8" strokeWidth="2" />
            </>
          ) : (
            // Candlesticks rendering
            displayCandles.map((p, idx) => {
              const x = getX(idx);
              const candleUp = p.close >= p.open;
              const yOpen = getY(p.open * multiplier);
              const yClose = getY(p.close * multiplier);
              const yHigh = getY(p.high * multiplier);
              const yLow = getY(p.low * multiplier);

              const candleTop = Math.min(yOpen, yClose);
              const candleHeight = Math.max(1.5, Math.abs(yClose - yOpen));
              const candleColor = candleUp ? '#34d399' : '#f87171';

              return (
                <g key={idx}>
                  {/* High/Low Wick */}
                  <line
                    x1={x}
                    y1={yHigh}
                    x2={x}
                    y2={yLow}
                    stroke={candleColor}
                    strokeWidth="1.2"
                    opacity="0.85"
                  />
                  {/* Candle Body */}
                  <rect
                    x={x - candleBarWidth / 2}
                    y={candleTop}
                    width={candleBarWidth}
                    height={candleHeight}
                    fill={candleColor}
                    rx="1"
                  />
                </g>
              );
            })
          )}

          {/* Volume Bars */}
          {displayCandles.map((p, idx) => {
            const x = getX(idx);
            const candleUp = p.close >= p.open;
            const barY = getVolY(p.volume);
            const barH = totalSvgHeight - margin.bottom - barY;
            const volColor = candleUp ? 'rgba(52, 211, 153, 0.45)' : 'rgba(248, 113, 113, 0.45)';

            return (
              <rect
                key={`vol-${idx}`}
                x={x - candleBarWidth / 2}
                y={barY}
                width={candleBarWidth}
                height={Math.max(1, barH)}
                fill={volColor}
              />
            );
          })}

          {/* Volume Profile Overlay (Right Axis) */}
          {showVolumeProfile && (
            <g className="volume-profile-overlay" transform={`translate(${margin.left + plotWidth}, 0)`}>
              {currentVolumeProfile.map((vpBar, i) => {
                const y = getY(vpBar.priceLevel * multiplier);
                const barHeight = Math.max(3, (plotHeight / currentVolumeProfile.length) * 0.85);
                const barWidth = (vpBar.volume / maxVpVol) * 80;

                const isPoc = vpBar.isPoc;
                const isVa = vpBar.isValueArea;

                return (
                  <g key={`vp-${i}`}>
                    <rect
                      x={0}
                      y={y - barHeight / 2}
                      width={barWidth}
                      height={barHeight}
                      fill={isPoc ? '#f59e0b' : isVa ? 'rgba(56, 189, 248, 0.35)' : 'rgba(100, 116, 139, 0.2)'}
                      rx="1"
                    />
                    {isPoc && (
                      <text
                        x={barWidth + 4}
                        y={y + 3}
                        fill="#f59e0b"
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        POC
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {/* ============================================================== */}
          {/* 5. VISIBLE LAST QUOTE: PROMINENT HORIZONTAL LINE & RIGHT AXIS BADGE */}
          {/* ============================================================== */}
          {lastPriceY >= margin.top && lastPriceY <= margin.top + plotHeight && (
            <g className="live-price-indicator" filter="url(#glowLastPrice)">
              {/* Full horizontal line across the chart */}
              <line
                x1={margin.left}
                y1={lastPriceY}
                x2={margin.left + plotWidth}
                y2={lastPriceY}
                stroke={isUp ? '#10b981' : '#f43f5e'}
                strokeWidth="1.5"
                strokeDasharray="4 3"
                opacity="0.9"
              />

              {/* Pulsing beacon on the last candle point */}
              <circle
                cx={lastPriceX}
                cy={lastPriceY}
                r="7"
                fill={isUp ? '#10b981' : '#f43f5e'}
                opacity="0.3"
                className="animate-ping"
              />
              <circle
                cx={lastPriceX}
                cy={lastPriceY}
                r="3.5"
                fill={isUp ? '#34d399' : '#fb7185'}
                stroke="#0f172a"
                strokeWidth="1.5"
              />

              {/* Arrow pointer toward axis badge */}
              <polygon
                points={`${margin.left + plotWidth - 4},${lastPriceY} ${margin.left + plotWidth + 1},${lastPriceY - 4} ${margin.left + plotWidth + 1},${lastPriceY + 4}`}
                fill={isUp ? '#10b981' : '#f43f5e'}
              />

              {/* Prominent High-Contrast Badge on Right Y-Axis */}
              <rect
                x={margin.left + plotWidth}
                y={lastPriceY - 11}
                width={showVolumeProfile ? 92 : 62}
                height={22}
                fill={isUp ? '#10b981' : '#f43f5e'}
                rx="4"
              />
              <text
                x={margin.left + plotWidth + (showVolumeProfile ? 46 : 31)}
                y={lastPriceY + 4}
                fill="#ffffff"
                fontSize="11"
                fontWeight="800"
                fontFamily="JetBrains Mono, monospace"
                textAnchor="middle"
              >
                {unitPrefix}{livePriceConverted.toFixed(2)}
              </text>
            </g>
          )}

          {/* Crosshair Overlay when Hovered */}
          {hoverIndex !== null && hoverIndex >= 0 && hoverIndex < displayCandles.length && (
            <g className="crosshair">
              {/* Vertical line */}
              <line
                x1={getX(hoverIndex)}
                y1={margin.top}
                x2={getX(hoverIndex)}
                y2={totalSvgHeight - margin.bottom}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.7"
              />
              {/* Horizontal line at hovered price */}
              <line
                x1={margin.left}
                y1={getY(displayCandles[hoverIndex].close * multiplier)}
                x2={margin.left + plotWidth}
                y2={getY(displayCandles[hoverIndex].close * multiplier)}
                stroke="#38bdf8"
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.7"
              />
              {/* Circle on hovered point */}
              <circle
                cx={getX(hoverIndex)}
                cy={getY(displayCandles[hoverIndex].close * multiplier)}
                r="4.5"
                fill="#38bdf8"
                stroke="#0f172a"
                strokeWidth="2"
              />
            </g>
          )}

          {/* Date Axis Markers at the Bottom */}
          {displayCandles.length > 0 && (
            <g className="date-axis">
              <text
                x={margin.left}
                y={totalSvgHeight - 6}
                fill="#64748b"
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
              >
                {displayCandles[0].date}
              </text>
              <text
                x={margin.left + plotWidth / 2}
                y={totalSvgHeight - 6}
                fill="#64748b"
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
                textAnchor="middle"
              >
                {displayCandles[Math.floor(displayCandles.length / 2)].date}
              </text>
              <text
                x={margin.left + plotWidth}
                y={totalSvgHeight - 6}
                fill="#64748b"
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
                textAnchor="end"
              >
                {displayCandles[displayCandles.length - 1].date}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* 6. BOTTOM INSTITUTIONAL STATS STRIP */}
      <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 text-xs">
        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span>Максимум периода</span>
            <InfoButton topicId="chart_stats_strip" />
          </div>
          <div className="text-sm font-bold font-mono text-emerald-400 mt-0.5 tabular-nums">
            {unitPrefix}{viewStats.high.toFixed(2)}
          </div>
        </div>

        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span>Минимум периода</span>
            <InfoButton topicId="chart_stats_strip" />
          </div>
          <div className="text-sm font-bold font-mono text-rose-400 mt-0.5 tabular-nums">
            {unitPrefix}{viewStats.low.toFixed(2)}
          </div>
        </div>

        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span>Истинный диапазон (ATR 14)</span>
            <InfoButton topicId="atr_metric" />
          </div>
          <div className="text-sm font-bold font-mono text-slate-200 mt-0.5 tabular-nums">
            {unitPrefix}{((activeItem.atr14 || 0.45) * multiplier).toFixed(2)}
          </div>
        </div>

        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span>Проторговано за период</span>
            <InfoButton topicId="chart_stats_strip" />
          </div>
          <div className="text-sm font-bold font-mono text-cyan-400 mt-0.5 tabular-nums">
            {viewStats.totalVolume.toLocaleString()} лотов
          </div>
        </div>

        <div className="col-span-2 sm:col-span-4 lg:col-span-1 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span>Point of Control (POC)</span>
            <InfoButton topicId="volume_profile" />
          </div>
          <div className="text-sm font-bold font-mono text-amber-400 mt-0.5 tabular-nums">
            {unitPrefix}{((currentVolumeProfile.find((b) => b.isPoc)?.priceLevel || 0) * multiplier).toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
};
