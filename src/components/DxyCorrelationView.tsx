import React, { useState, useMemo } from 'react';
import { PricePoint, calculatePearsonCorrelation } from '../data/silverData';
import { CurrencyUnit } from './Header';
import { GitCompare, TrendingDown, ArrowLeftRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { InfoButton } from './HelpModal';

interface DxyCorrelationViewProps {
  prices: PricePoint[];
  currencyUnit: CurrencyUnit;
}

export const DxyCorrelationView: React.FC<DxyCorrelationViewProps> = ({ prices }) => {
  const [windowDays, setWindowDays] = useState<number>(180);
  const [chartMode, setChartMode] = useState<'dual_axis' | 'normalized'>('dual_axis');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Filtered dataset
  const dataset = useMemo(() => prices.slice(-windowDays), [prices, windowDays]);
  const latest = dataset[dataset.length - 1];

  // Overall Pearson Correlation for current selected period
  const overallCorrelation = useMemo(() => {
    const silverCloses = dataset.map(p => p.close);
    const dxyCloses = dataset.map(p => p.dxy);
    return calculatePearsonCorrelation(silverCloses, dxyCloses);
  }, [dataset]);

  // Daily % changes for scatter plot
  const scatterPoints = useMemo(() => {
    const points: { date: string; dxyPct: number; silverPct: number }[] = [];
    for (let i = 1; i < dataset.length; i++) {
      const prev = dataset[i - 1];
      const curr = dataset[i];
      const dxyPct = ((curr.dxy - prev.dxy) / prev.dxy) * 100;
      const silverPct = ((curr.close - prev.close) / prev.close) * 100;
      points.push({
        date: curr.date,
        dxyPct: Number(dxyPct.toFixed(2)),
        silverPct: Number(silverPct.toFixed(2)),
      });
    }
    return points;
  }, [dataset]);

  // Linear Regression (y = mx + b) for Scatter Plot
  const regression = useMemo(() => {
    if (scatterPoints.length < 2) return { slope: -1.8, intercept: 0.05, r2: 0.45 };
    const n = scatterPoints.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;
    let sumY2 = 0;

    scatterPoints.forEach(p => {
      sumX += p.dxyPct;
      sumY += p.silverPct;
      sumXY += p.dxyPct * p.silverPct;
      sumX2 += p.dxyPct * p.dxyPct;
      sumY2 += p.silverPct * p.silverPct;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // R-squared
    const num = (n * sumXY - sumX * sumY);
    const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    const r = den !== 0 ? num / den : 0;
    const r2 = r * r;

    return {
      slope: Number(slope.toFixed(2)),
      intercept: Number(intercept.toFixed(2)),
      r2: Number(r2.toFixed(2)),
      r: Number(r.toFixed(2)),
    };
  }, [scatterPoints]);

  // Ranges for Dual-Axis Chart
  const silverMin = Math.min(...dataset.map(p => p.close)) * 0.96;
  const silverMax = Math.max(...dataset.map(p => p.close)) * 1.04;
  const dxyMin = Math.min(...dataset.map(p => p.dxy)) * 0.98;
  const dxyMax = Math.max(...dataset.map(p => p.dxy)) * 1.02;

  // Normalized (Base 100 at start of period)
  const silverBase = dataset[0]?.close || 1;
  const dxyBase = dataset[0]?.dxy || 1;

  const svgWidth = 800;
  const svgHeight = 280;
  const margin = { top: 20, right: 55, bottom: 25, left: 55 };
  const plotW = svgWidth - margin.left - margin.right;
  const plotH = svgHeight - margin.top - margin.bottom;

  const getX = (idx: number) => {
    return margin.left + (idx / (dataset.length - 1)) * plotW;
  };

  const getSilverY = (val: number) => {
    if (chartMode === 'normalized') {
      const normVal = (val / silverBase) * 100;
      // Normalized scale 80% to 140%
      return margin.top + plotH - ((normVal - 85) / (145 - 85)) * plotH;
    }
    return margin.top + plotH - ((val - silverMin) / (silverMax - silverMin)) * plotH;
  };

  const getDxyY = (val: number) => {
    if (chartMode === 'normalized') {
      const normVal = (val / dxyBase) * 100;
      return margin.top + plotH - ((normVal - 85) / (145 - 85)) * plotH;
    }
    return margin.top + plotH - ((val - dxyMin) / (dxyMax - dxyMin)) * plotH;
  };

  const silverPath = useMemo(() => {
    return dataset.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getSilverY(p.close)}`).join(' ');
  }, [dataset, chartMode, silverMin, silverMax]);

  const dxyPath = useMemo(() => {
    return dataset.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getDxyY(p.dxy)}`).join(' ');
  }, [dataset, chartMode, dxyMin, dxyMax]);

  // Rolling Correlation SVG Dimensions
  const corrHeight = 130;
  const getCorrY = (rVal: number) => {
    // rVal is from -1.0 to +1.0
    const clamped = Math.max(-1, Math.min(1, rVal));
    return 15 + ((1 - clamped) / 2) * (corrHeight - 30);
  };

  const rolling30Path = useMemo(() => {
    return dataset
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getCorrY(p.rollingCorr30d || -0.7)}`)
      .join(' ');
  }, [dataset]);

  const hoveredItem = hoverIndex !== null ? dataset[hoverIndex] : latest;

  return (
    <div className="space-y-6">
      
      {/* Top Correlation Indicator Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Overall Pearson r */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span>Коэффициент Пирсона (Pearson r)</span>
              <InfoButton topicId="dxy_correlation" />
            </span>
            <span className="font-mono text-[10px]">за {windowDays} дн.</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-cyan-400 tabular-nums">
              {overallCorrelation}
            </span>
          </div>
          <div className="mt-1 text-xs text-emerald-400 font-medium">
            Устойчивая обратная корреляция
          </div>
        </div>

        {/* Beta / Elasticity to DXY */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span>Коэффициент чувствительности (Бета к DXY)</span>
              <InfoButton topicId="dxy_beta" />
            </span>
            <span className="text-xs text-slate-400 font-mono">R² = {regression.r2}</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono text-amber-400 tabular-nums">
              {regression.slope}x
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            При снижении DXY на -1% серебро в среднем растет на <strong className="text-white">+{Math.abs(regression.slope).toFixed(1)}%</strong>
          </div>
        </div>

        {/* Current Regime */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span>Текущий рыночный режим</span>
              <InfoButton topicId="dxy_correlation" />
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          </div>
          <div className="mt-2 text-base font-bold text-white flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Монетарный драйвер + Дефицит</span>
          </div>
          <div className="mt-1 text-xs text-slate-400 leading-tight">
            Слабость доллара усиливает восходящий тренд, подогреваемый промышленным спросом фотовольтаики.
          </div>
        </div>

      </div>

      {/* Main Dual-Axis Interactive Chart */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 lg:p-6 backdrop-blur">
        
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
                <span>Сравнение динамики: Серебро (XAG) против Индекса Доллара (DXY)</span>
              </h2>
              <InfoButton topicId="dxy_correlation" />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Взаимосвязь между спотовой ценой серебра и глобальным курсом доллара США
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Chart Mode */}
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
              <button
                onClick={() => setChartMode('dual_axis')}
                className={`px-2.5 py-1 rounded transition-colors ${chartMode === 'dual_axis' ? 'bg-slate-800 text-cyan-300 font-semibold' : 'text-slate-400'}`}
              >
                Две оси ($ / pts)
              </button>
              <button
                onClick={() => setChartMode('normalized')}
                className={`px-2.5 py-1 rounded transition-colors ${chartMode === 'normalized' ? 'bg-slate-800 text-cyan-300 font-semibold' : 'text-slate-400'}`}
              >
                Нормализация (% Base 100)
              </button>
            </div>

            {/* Window selector */}
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
              {[90, 180, 365].map((d) => (
                <button
                  key={d}
                  onClick={() => setWindowDays(d)}
                  className={`px-2.5 py-1 rounded transition-colors ${windowDays === d ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'}`}
                >
                  {d} дн.
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Legend & Hover Readout */}
        <div className="py-2 px-3 my-2 bg-slate-950/70 rounded-lg border border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
              <span className="w-3 h-1 bg-cyan-400 rounded"></span> Серебро (SI / XAG):
              <span className="text-white">${hoveredItem?.close.toFixed(2)}</span>
            </span>
            <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <span className="w-3 h-1 bg-amber-400 rounded"></span> Индекс Доллара (DXY):
              <span className="text-white">{hoveredItem?.dxy.toFixed(2)}</span>
            </span>
          </div>

          <div className="text-slate-400 font-sans">
            Дата: <strong className="text-slate-200 font-mono">{hoveredItem?.date}</strong>
          </div>
        </div>

        {/* SVG Dual-Axis Chart */}
        <div className="w-full overflow-hidden mt-3">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto cursor-crosshair overflow-visible"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = (e.clientX - rect.left) / rect.width;
              const idx = Math.round(ratio * (dataset.length - 1));
              setHoverIndex(Math.max(0, Math.min(dataset.length - 1, idx)));
            }}
            onMouseLeave={() => setHoverIndex(null)}
          >
            {/* Left Axis: Silver Price levels */}
            {[silverMin, (silverMin + silverMax) / 2, silverMax].map((lvl, i) => (
              <g key={`lvl-ag-${i}`}>
                <line
                  x1={margin.left}
                  y1={getSilverY(lvl)}
                  x2={margin.left + plotW}
                  y2={getSilverY(lvl)}
                  stroke="#334155"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity="0.3"
                />
                <text
                  x={margin.left - 8}
                  y={getSilverY(lvl) + 4}
                  fill="#38bdf8"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                  textAnchor="end"
                >
                  ${lvl.toFixed(1)}
                </text>
              </g>
            ))}

            {/* Right Axis: DXY levels (if dual axis mode) */}
            {chartMode === 'dual_axis' && [dxyMin, (dxyMin + dxyMax) / 2, dxyMax].map((lvl, i) => (
              <text
                key={`lvl-dxy-${i}`}
                x={margin.left + plotW + 8}
                y={getDxyY(lvl) + 4}
                fill="#fbbf24"
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
                textAnchor="start"
              >
                {lvl.toFixed(1)}
              </text>
            ))}

            {/* Dual Paths */}
            <path d={dxyPath} fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray={chartMode === 'dual_axis' ? '4 2' : 'none'} opacity="0.9" />
            <path d={silverPath} fill="none" stroke="#38bdf8" strokeWidth="2.5" />

            {/* Hover marker */}
            {hoverIndex !== null && (
              <g>
                <line
                  x1={getX(hoverIndex)}
                  y1={margin.top}
                  x2={getX(hoverIndex)}
                  y2={svgHeight - margin.bottom}
                  stroke="#94a3b8"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <circle cx={getX(hoverIndex)} cy={getSilverY(dataset[hoverIndex].close)} r="4" fill="#38bdf8" />
                <circle cx={getX(hoverIndex)} cy={getDxyY(dataset[hoverIndex].dxy)} r="4" fill="#f59e0b" />
              </g>
            )}

            {/* Dates */}
            <text x={margin.left} y={svgHeight - 6} fill="#64748b" fontSize="10" fontFamily="JetBrains Mono, monospace">
              {dataset[0]?.date}
            </text>
            <text x={margin.left + plotW} y={svgHeight - 6} fill="#64748b" fontSize="10" fontFamily="JetBrains Mono, monospace" textAnchor="end">
              {dataset[dataset.length - 1]?.date}
            </text>
          </svg>
        </div>

        {/* 30D Rolling Correlation Sub-Panel */}
        <div className="mt-6 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <span>Скользящий коэффициент корреляции 30D (Rolling Pearson r)</span>
              <InfoButton topicId="rolling_correlation" />
            </span>
            <span className="text-xs font-mono text-cyan-400">
              Текущий: <strong>{latest?.rollingCorr30d}</strong>
            </span>
          </div>

          <div className="w-full bg-slate-950/80 rounded-lg p-2 border border-slate-800/80">
            <svg viewBox={`0 0 ${svgWidth} ${corrHeight}`} className="w-full h-auto overflow-visible">
              {/* Zero midline */}
              <line
                x1={margin.left}
                y1={getCorrY(0)}
                x2={margin.left + plotW}
                y2={getCorrY(0)}
                stroke="#64748b"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <text x={margin.left - 6} y={getCorrY(0) + 3} fill="#64748b" fontSize="9" fontFamily="JetBrains Mono, monospace" textAnchor="end">
                0.0
              </text>

              {/* -0.5 Line */}
              <line
                x1={margin.left}
                y1={getCorrY(-0.5)}
                x2={margin.left + plotW}
                y2={getCorrY(-0.5)}
                stroke="#334155"
                strokeWidth="1"
                opacity="0.5"
              />
              <text x={margin.left - 6} y={getCorrY(-0.5) + 3} fill="#38bdf8" fontSize="9" fontFamily="JetBrains Mono, monospace" textAnchor="end">
                -0.5
              </text>

              {/* Shaded negative zone (standard behavior) */}
              <rect
                x={margin.left}
                y={getCorrY(0)}
                width={plotW}
                height={getCorrY(-1) - getCorrY(0)}
                fill="rgba(56, 189, 248, 0.05)"
              />

              {/* Rolling path */}
              <path d={rolling30Path} fill="none" stroke="#06b6d4" strokeWidth="2" />
            </svg>
          </div>
        </div>

      </div>

      {/* Scatter Plot & Decoupling Regime Explanation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Scatter Plot: Daily % DXY vs Daily % Silver */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 lg:p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-semibold text-white">
                Диаграмма рассеяния: Изменение DXY vs Серебро (%)
              </h3>
              <InfoButton topicId="dxy_scatter" />
            </div>
            <span className="text-xs font-mono text-cyan-400">
              y = {regression.slope}x + {regression.intercept}
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Каждая точка представляет одну торговую сессию за выбранный период
          </p>

          {/* SVG Scatter Plot */}
          <div className="w-full bg-slate-950/60 rounded-lg p-2 border border-slate-800/80">
            <svg viewBox="0 0 400 240" className="w-full h-auto">
              {/* Axes lines (0,0 center) */}
              <line x1="20" y1="120" x2="380" y2="120" stroke="#475569" strokeWidth="1" />
              <line x1="200" y1="10" x2="200" y2="230" stroke="#475569" strokeWidth="1" />

              {/* Axis labels */}
              <text x="375" y="115" fill="#94a3b8" fontSize="9" textAnchor="end" fontFamily="JetBrains Mono">
                Δ DXY %
              </text>
              <text x="205" y="20" fill="#38bdf8" fontSize="9" fontFamily="JetBrains Mono">
                Δ Silver %
              </text>

              {/* Scatter Points */}
              {scatterPoints.map((pt, i) => {
                // X range: -1.5% to +1.5% mapped to 20..380
                const cx = 200 + (pt.dxyPct / 1.5) * 170;
                // Y range: -4% to +4% mapped to 230..10
                const cy = 120 - (pt.silverPct / 4.0) * 105;

                return (
                  <circle
                    key={i}
                    cx={Math.max(20, Math.min(380, cx))}
                    cy={Math.max(10, Math.min(230, cy))}
                    r="2.5"
                    fill="rgba(56, 189, 248, 0.45)"
                  />
                );
              })}

              {/* Regression line */}
              {/* x = -1.5 => y = slope * -1.5 */}
              {/* x = +1.5 => y = slope * 1.5 */}
              <line
                x1={200 + (-1.4 / 1.5) * 170}
                y1={120 - ((regression.slope * -1.4 + regression.intercept) / 4.0) * 105}
                x2={200 + (1.4 / 1.5) * 170}
                y2={120 - ((regression.slope * 1.4 + regression.intercept) / 4.0) * 105}
                stroke="#f59e0b"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>

        {/* Decoupling Dynamics Guide */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 lg:p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white">
            Когда и почему серебро отвязывается от доллара?
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800/80">
              <div className="font-semibold text-emerald-400 mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Промышленный структурный дефицит</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                В периоды взрывного спроса со стороны солнечной энергетики (TOPCon/HJT) и ограниченных складских запасов COMEX/LBMA, физические закупки взвинчивают цену серебра даже на фоне сильного доллара.
              </p>
            </div>

            <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800/80">
              <div className="font-semibold text-cyan-400 mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                <span>Синхронный Safe-Haven приток</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Во время геополитических кризисов и скачков инфляционных ожиданий инвесторы одновременно переводят капитал в казначейские облигации США (поддерживая DXY) и в физические драгметаллы.
              </p>
            </div>

            <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800/80">
              <div className="font-semibold text-amber-400 mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span>Индийский свадебный сезон и пошлины</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Снижение импортных пошлин Индией и пиковый спрос на праздник Дивали генерируют локальный физический дефицит, нивелирующий дневные колебания валютных рынков Forex.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
