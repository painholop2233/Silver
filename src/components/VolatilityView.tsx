import React, { useState, useMemo } from 'react';
import { PricePoint } from '../data/silverData';
import { CurrencyUnit } from './Header';
import { Activity, Gauge, TrendingUp, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';
import { InfoButton } from './HelpModal';

interface VolatilityViewProps {
  prices: PricePoint[];
  currencyUnit: CurrencyUnit;
}

export const VolatilityView: React.FC<VolatilityViewProps> = ({ prices, currencyUnit }) => {
  const [selectedWindow, setSelectedWindow] = useState<'30D' | '90D'>('30D');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // We look at the last 250 trading days
  const recentPrices = useMemo(() => prices.slice(-250), [prices]);
  const latest = recentPrices[recentPrices.length - 1];

  const currentHv30 = latest?.volatility30d || 31.4;
  const currentHv90 = latest?.volatility90d || 28.6;
  const currentAtr = latest?.atr14 || 0.85;
  const atrPercent = ((currentAtr / latest?.close) * 100).toFixed(2);

  // Volatility Regime computation
  const activeHv = selectedWindow === '30D' ? currentHv30 : currentHv90;
  
  const regime = useMemo(() => {
    if (activeHv < 20) {
      return {
        label: 'Низкая (Компрессия)',
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10 border-emerald-500/30',
        icon: ShieldCheck,
        description: 'Волатильность сжата ниже исторической нормы. Фаза накопления позиций; высокая вероятность взрывного импульсного пробоя.',
      };
    } else if (activeHv < 28) {
      return {
        label: 'Умеренная (Норма)',
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10 border-cyan-500/30',
        icon: Activity,
        description: 'Здоровый трендовый диапазон для драгметаллов. Институциональные участники планомерно ребалансируют позиции.',
      };
    } else if (activeHv < 38) {
      return {
        label: 'Повышенная (Турбулентность)',
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10 border-amber-500/30',
        icon: Zap,
        description: 'Рынок реагирует на монетарные сюрпризы ФРС или резкие изменения баланса физического предложения. Рекомендуется контроль стоп-лоссов.',
      };
    } else {
      return {
        label: 'Экстремальная (Шорт-сквиз / Стресс)',
        color: 'text-rose-400',
        bgColor: 'bg-rose-500/10 border-rose-500/30',
        icon: AlertTriangle,
        description: 'Аномальная амплитуда колебаний. Возможен острый дефицит поставок физического металла на биржах LBMA/COMEX.',
      };
    }
  }, [activeHv]);

  // Chart coordinate logic
  const svgWidth = 800;
  const svgHeight = 240;
  const margin = { top: 15, right: 45, bottom: 25, left: 10 };
  const plotW = svgWidth - margin.left - margin.right;
  const plotH = svgHeight - margin.top - margin.bottom;

  const minHv = 15;
  const maxHv = 50;

  const getX = (idx: number) => {
    return margin.left + (idx / (recentPrices.length - 1)) * plotW;
  };

  const getY = (val: number) => {
    const clamped = Math.max(minHv, Math.min(maxHv, val));
    return margin.top + plotH - ((clamped - minHv) / (maxHv - minHv)) * plotH;
  };

  const hv30Path = useMemo(() => {
    return recentPrices
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(p.volatility30d || 28)}`)
      .join(' ');
  }, [recentPrices]);

  const hv90Path = useMemo(() => {
    return recentPrices
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(p.volatility90d || 26)}`)
      .join(' ');
  }, [recentPrices]);

  // Hover item
  const hoveredPrice = hoveredIndex !== null ? recentPrices[hoveredIndex] : latest;

  // Volatility Distribution Bins (Histogram)
  const volDistribution = useMemo(() => {
    const bins = [
      { range: '< 20%', count: 0, label: 'Низкая' },
      { range: '20 - 25%', count: 0, label: 'Умеренная' },
      { range: '25 - 30%', count: 0, label: 'Нормальная' },
      { range: '30 - 35%', count: 0, label: 'Повышенная' },
      { range: '35 - 40%', count: 0, label: 'Высокая' },
      { range: '> 40%', count: 0, label: 'Экстремальная' },
    ];

    recentPrices.forEach(p => {
      const v = p.volatility30d || 25;
      if (v < 20) bins[0].count++;
      else if (v < 25) bins[1].count++;
      else if (v < 30) bins[2].count++;
      else if (v < 35) bins[3].count++;
      else if (v < 40) bins[4].count++;
      else bins[5].count++;
    });

    const maxCount = Math.max(...bins.map(b => b.count));
    return { bins, maxCount };
  }, [recentPrices]);

  return (
    <div className="space-y-6">
      
      {/* Top Volatility KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* HV 30D */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span>Ист. Волатильность (30D HV)</span>
              <InfoButton topicId="hv_30d" />
            </span>
            <span className="font-mono text-[10px]">Годовая %</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-cyan-400 tabular-nums">{currentHv30}%</span>
            <span className="text-xs text-slate-400">σ 1 мес.</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Дневное мат. ожидание: <span className="font-mono text-slate-200">±{(currentHv30 / 15.87).toFixed(2)}%</span>
          </div>
        </div>

        {/* HV 90D */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span>Квартальная Волатильность (90D)</span>
              <InfoButton topicId="hv_90d" />
            </span>
            <span className="font-mono text-[10px]">Годовая %</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-indigo-400 tabular-nums">{currentHv90}%</span>
            <span className="text-xs text-slate-400">σ 1 кв.</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Премия краткосрочной волатильности: <span className="font-mono text-emerald-400">+{(currentHv30 - currentHv90).toFixed(1)}%</span>
          </div>
        </div>

        {/* ATR 14 */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span>Average True Range (ATR 14)</span>
              <InfoButton topicId="atr_metric" />
            </span>
            <span className="font-mono text-[10px]">Размах дня</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-400 tabular-nums">${currentAtr.toFixed(2)}</span>
            <span className="text-xs font-mono text-slate-300">({atrPercent}%)</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Средняя абсолютная амплитуда дневной свечи
          </div>
        </div>

        {/* Regime Badge */}
        <div className={`rounded-xl p-4 border ${regime.bgColor}`}>
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1.5">
              <span>Режим волатильности</span>
              <InfoButton topicId="vol_regime" />
            </span>
            <regime.icon className={`w-4 h-4 ${regime.color}`} />
          </div>
          <div className={`mt-2 text-lg font-bold ${regime.color}`}>
            {regime.label}
          </div>
          <div className="mt-1 text-[11px] text-slate-300 leading-tight">
            {regime.description}
          </div>
        </div>

      </div>

      {/* Main Historical Volatility Curve */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 lg:p-6 backdrop-blur">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white">
                Динамика исторической волатильности фьючерса (HV)
              </h2>
              <InfoButton topicId="hv_30d" />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Annualized Realized Volatility: логарифмическая дисперсия доходностей за 30 и 90 торговых сессий
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-xs font-mono mr-2">
              <span className="inline-flex items-center gap-1 text-cyan-400">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> 30D HV
              </span>
              <span className="inline-flex items-center gap-1 text-indigo-400">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-400"></span> 90D HV
              </span>
            </div>

            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
              <button
                onClick={() => setSelectedWindow('30D')}
                className={`px-3 py-1 rounded transition-colors ${selectedWindow === '30D' ? 'bg-slate-800 text-cyan-300 font-bold' : 'text-slate-400'}`}
              >
                Окно 30D
              </button>
              <button
                onClick={() => setSelectedWindow('90D')}
                className={`px-3 py-1 rounded transition-colors ${selectedWindow === '90D' ? 'bg-slate-800 text-indigo-300 font-bold' : 'text-slate-400'}`}
              >
                Окно 90D
              </button>
            </div>
          </div>
        </div>

        {/* Readout bar */}
        {hoveredPrice && (
          <div className="py-2 px-3 my-2 bg-slate-950/70 rounded-lg border border-slate-800/80 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 font-sans">Дата: <strong className="text-white font-mono">{hoveredPrice.date}</strong></span>
            <div className="flex items-center gap-4">
              <span>30D HV: <strong className="text-cyan-400 tabular-nums">{hoveredPrice.volatility30d}%</strong></span>
              <span>90D HV: <strong className="text-indigo-400 tabular-nums">{hoveredPrice.volatility90d}%</strong></span>
              <span>ATR 14: <strong className="text-amber-400 tabular-nums">${hoveredPrice.atr14?.toFixed(2)}</strong></span>
            </div>
          </div>
        )}

        {/* SVG Volatility Chart */}
        <div className="w-full overflow-hidden mt-3">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto cursor-crosshair overflow-visible"
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = (e.clientX - rect.left) / rect.width;
              const idx = Math.round(ratio * (recentPrices.length - 1));
              setHoveredIndex(Math.max(0, Math.min(recentPrices.length - 1, idx)));
            }}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* Horizontal guideline levels (20%, 30%, 40%) */}
            {[20, 30, 40].map((level) => {
              const y = getY(level);
              return (
                <g key={level}>
                  <line
                    x1={margin.left}
                    y1={y}
                    x2={margin.left + plotW}
                    y2={y}
                    stroke="#334155"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    opacity="0.4"
                  />
                  <text
                    x={margin.left + plotW + 6}
                    y={y + 4}
                    fill="#94a3b8"
                    fontSize="10"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {level}%
                  </text>
                </g>
              );
            })}

            {/* Threshold bands: High volatility zone highlight (>35%) */}
            <rect
              x={margin.left}
              y={getY(maxHv)}
              width={plotW}
              height={getY(35) - getY(maxHv)}
              fill="rgba(244, 63, 94, 0.05)"
            />

            {/* Paths */}
            <path d={hv90Path} fill="none" stroke="#818cf8" strokeWidth="2" opacity="0.8" />
            <path d={hv30Path} fill="none" stroke="#22d3ee" strokeWidth="2.5" />

            {/* Hover marker */}
            {hoveredIndex !== null && (
              <g>
                <line
                  x1={getX(hoveredIndex)}
                  y1={margin.top}
                  x2={getX(hoveredIndex)}
                  y2={svgHeight - margin.bottom}
                  stroke="#94a3b8"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <circle
                  cx={getX(hoveredIndex)}
                  cy={getY(recentPrices[hoveredIndex].volatility30d || 28)}
                  r="4"
                  fill="#22d3ee"
                />
              </g>
            )}

            {/* Bottom dates */}
            <text x={margin.left} y={svgHeight - 6} fill="#64748b" fontSize="10" fontFamily="JetBrains Mono, monospace">
              {recentPrices[0].date}
            </text>
            <text x={margin.left + plotW} y={svgHeight - 6} fill="#64748b" fontSize="10" fontFamily="JetBrains Mono, monospace" textAnchor="end">
              {recentPrices[recentPrices.length - 1].date}
            </text>
          </svg>
        </div>

      </div>

      {/* Volatility Distribution & Comparative Regime Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Distribution Histogram */}
        <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800 rounded-xl p-4 lg:p-6">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-white">
              Гистограмма распределения 30-дневной волатильности
            </h3>
            <InfoButton topicId="vol_distribution" />
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Частота нахождения серебра в различных диапазонах годовой волатильности за последний год
          </p>

          <div className="space-y-3">
            {volDistribution.bins.map((bin, i) => {
              const pct = ((bin.count / recentPrices.length) * 100).toFixed(1);
              const barWidth = `${(bin.count / volDistribution.maxCount) * 100}%`;
              return (
                <div key={i} className="text-xs">
                  <div className="flex justify-between items-center mb-1 font-mono">
                    <span className="text-slate-300 font-sans">{bin.range} <span className="text-slate-500 font-normal">({bin.label})</span></span>
                    <span className="text-slate-400">{bin.count} дней · <strong className="text-white">{pct}%</strong></span>
                  </div>
                  <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        i === 0 ? 'bg-emerald-500' :
                        i === 1 ? 'bg-cyan-500' :
                        i === 2 ? 'bg-blue-500' :
                        i === 3 ? 'bg-amber-500' :
                        i === 4 ? 'bg-orange-500' : 'bg-rose-500'
                      }`}
                      style={{ width: barWidth }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Volatility Characteristics & Insights */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 lg:p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white mb-2">
              Особенности волатильности серебра
            </h3>
            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <div className="font-semibold text-cyan-400 mb-1">Бета к золоту (1.8x – 2.2x)</div>
                <p className="text-slate-400 leading-relaxed">
                  Серебро традиционно торгуется с удвоенной волатильностью относительно золота. Движение золота на +1% в среднем сопровождается импульсом серебра на +1.8–2.2%.
                </p>
              </div>

              <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                <div className="font-semibold text-amber-400 mb-1">Эффект низкой базы рынка</div>
                <p className="text-slate-400 leading-relaxed">
                  Годовой физический оборот серебра составляет ~$30 млрд против ~$200+ млрд у золота. Приток институционального капитала быстрее вызывает сжатие стакана котировок (Liquidity Crunch).
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            *Данные рассчитаны по дневным логарифмическим доходностям фьючерса COMEX SI в базисе 252 торговых дней.
          </div>
        </div>

      </div>

    </div>
  );
};
