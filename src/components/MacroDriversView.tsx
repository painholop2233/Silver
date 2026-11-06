import React, { useState } from 'react';
import {
  macroIndicators,
  cotHistoryData,
  MacroIndicator,
  CotDataPoint
} from '../data/silverData';
import { Landmark, ArrowUpRight, ArrowDownRight, Layers, PieChart, ShieldCheck, TrendingUp, Info } from 'lucide-react';
import { InfoButton } from './HelpModal';

export const MacroDriversView: React.FC = () => {
  const [selectedIndicator, setSelectedIndicator] = useState<string>('real_yield');
  const [cotView, setCotView] = useState<'net' | 'gross'>('net');

  const latestCot = cotHistoryData[cotHistoryData.length - 1];
  const netSpeculator = latestCot.managedMoneyLong - latestCot.managedMoneyShort;

  // Visualizing COT chart SVG
  const svgW = 750;
  const svgH = 220;
  const m = { top: 20, right: 30, bottom: 25, left: 50 };
  const plotW = svgW - m.left - m.right;
  const plotH = svgH - m.top - m.bottom;

  const minCot = -110000;
  const maxCot = 100000;

  const getX = (idx: number) => m.left + (idx / (cotHistoryData.length - 1)) * plotW;
  const getY = (val: number) => m.top + plotH - ((val - minCot) / (maxCot - minCot)) * plotH;

  const managedNetPath = cotHistoryData
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.managedMoneyLong - d.managedMoneyShort)}`)
    .join(' ');

  const commercialNetPath = cotHistoryData
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(d.commercialNet)}`)
    .join(' ');

  const getTopicId = (id: string) => {
    switch (id) {
      case 'real_yield': return 'real_yields';
      case 'gold_silver_ratio': return 'gold_silver_ratio';
      case 'dxy': return 'dxy_correlation';
      default: return 'real_yields';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Macro Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {macroIndicators.map((ind) => {
          const isSelected = selectedIndicator === ind.id;
          const diff = ind.currentValue - ind.previousValue;
          const isUp = diff >= 0;

          return (
            <div
              key={ind.id}
              onClick={() => setSelectedIndicator(ind.id)}
              className={`cursor-pointer p-4 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-slate-900 border-cyan-500/60 shadow-lg ring-1 ring-cyan-500/30'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-medium text-slate-300 flex items-center gap-1.5">
                  <span>{ind.name}</span>
                  <InfoButton topicId={getTopicId(ind.id)} />
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                  {ind.category}
                </span>
              </div>

              <div className="mt-2 flex items-baseline justify-between">
                <div className="text-2xl font-bold font-mono text-white tabular-nums">
                  {ind.currentValue} {ind.unit}
                </div>
                <div className={`text-xs font-mono font-semibold flex items-center ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isUp ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                  {isUp ? '+' : ''}{diff.toFixed(2)}
                </div>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Корреляция с серебром (3Y):</span>
                <span className={`font-mono font-bold ${ind.correlation3Y < 0 ? 'text-cyan-400' : 'text-amber-400'}`}>
                  {ind.correlation3Y > 0 ? '+' : ''}{ind.correlation3Y}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Macro Deep Dive Box */}
      {selectedIndicator && (
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl">
          {(() => {
            const ind = macroIndicators.find(x => x.id === selectedIndicator) || macroIndicators[0];
            return (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Info className="w-4 h-4 text-cyan-400" />
                    <span>Механизм влияния: {ind.name}</span>
                  </h3>
                  <span className="text-xs font-mono text-slate-400">Обновление: {ind.updateCadence}</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {ind.description}
                </p>
                <div className="text-xs text-slate-400 font-mono">
                  Тип воздействия: <strong className="text-cyan-300">{ind.impactOnSilver}</strong> · Коэффициент детерминации связи: <strong className="text-white">{(ind.correlation3Y ** 2 * 100).toFixed(0)}%</strong>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* CFTC Commitments of Traders (COT) Panel */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 lg:p-6 backdrop-blur">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white">
                Позиционирование участников торгов: CFTC Commitments of Traders (COT)
              </h2>
              <InfoButton topicId="cot_report" />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Баланс открытых длинных и коротких контрактов спекулянтов (Managed Money) и слитковых коммерческих банков (Commercials)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="inline-flex items-center gap-1.5 text-cyan-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span> Managed Money (Спекулянты)
              </span>
              <span className="inline-flex items-center gap-1.5 text-rose-400 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span> Commercials (Хеджеры)
              </span>
            </div>
          </div>
        </div>

        {/* Real-Time COT Metrics Strip */}
        <div className="my-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
            <div className="text-slate-400 font-sans">Net Спекулянты (Managed Money)</div>
            <div className="text-base font-bold text-cyan-400 mt-0.5 tabular-nums">
              +{netSpeculator.toLocaleString()} контр.
            </div>
            <div className="text-[10px] text-slate-500 font-sans">Длинных: {latestCot.managedMoneyLong.toLocaleString()}</div>
          </div>

          <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
            <div className="text-slate-400 font-sans">Net Хеджеры (Commercial)</div>
            <div className="text-base font-bold text-rose-400 mt-0.5 tabular-nums">
              {latestCot.commercialNet.toLocaleString()} контр.
            </div>
            <div className="text-[10px] text-slate-500 font-sans">Шорт слитковых банков</div>
          </div>

          <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
            <div className="text-slate-400 font-sans">Открытый интерес (OI)</div>
            <div className="text-base font-bold text-slate-200 mt-0.5 tabular-nums">
              {latestCot.openInterest.toLocaleString()} контр.
            </div>
            <div className="text-[10px] text-slate-500 font-sans">Общий объем позиций</div>
          </div>

          <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
            <div className="text-slate-400 font-sans">Интерпретация сигнала</div>
            <div className="text-sm font-bold text-amber-400 mt-0.5 font-sans">
              Умеренно бычий
            </div>
            <div className="text-[10px] text-slate-500 font-sans">Спекулянты не перегреты</div>
          </div>
        </div>

        {/* COT SVG Chart */}
        <div className="w-full overflow-hidden mt-3">
          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto overflow-visible">
            {/* Zero midline */}
            <line
              x1={m.left}
              y1={getY(0)}
              x2={m.left + plotW}
              y2={getY(0)}
              stroke="#64748b"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <text x={m.left - 8} y={getY(0) + 4} fill="#94a3b8" fontSize="10" fontFamily="JetBrains Mono" textAnchor="end">
              0
            </text>

            {/* +50k and -50k levels */}
            {[50000, -50000].map((lvl) => (
              <g key={lvl}>
                <line
                  x1={m.left}
                  y1={getY(lvl)}
                  x2={m.left + plotW}
                  y2={getY(lvl)}
                  stroke="#334155"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                  opacity="0.4"
                />
                <text x={m.left - 8} y={getY(lvl) + 4} fill="#64748b" fontSize="9" fontFamily="JetBrains Mono" textAnchor="end">
                  {lvl > 0 ? `+${lvl / 1000}k` : `${lvl / 1000}k`}
                </text>
              </g>
            ))}

            {/* Managed Money Net Path */}
            <path d={managedNetPath} fill="none" stroke="#22d3ee" strokeWidth="2.5" />

            {/* Commercial Net Path */}
            <path d={commercialNetPath} fill="none" stroke="#f43f5e" strokeWidth="2" strokeDasharray="3 2" />

            {/* Date labels */}
            <text x={m.left} y={svgH - 6} fill="#64748b" fontSize="10" fontFamily="JetBrains Mono">
              {cotHistoryData[0].date}
            </text>
            <text x={m.left + plotW} y={svgH - 6} fill="#64748b" fontSize="10" fontFamily="JetBrains Mono" textAnchor="end">
              {cotHistoryData[cotHistoryData.length - 1].date}
            </text>
          </svg>
        </div>

      </div>

      {/* Gold / Silver Ratio (GSR) Deep Dive */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 lg:p-6 backdrop-blur">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-sm font-semibold text-white">
            Соотношение Золото/Серебро (Gold/Silver Ratio — GSR)
          </h3>
          <InfoButton topicId="gold_silver_ratio" />
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Показывает, сколько тройских унций серебра требуется для покупки одной унции золота.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
            <div className="text-slate-400">Историческое среднее (50 лет)</div>
            <div className="text-xl font-bold font-mono text-slate-200 mt-1">~65 : 1</div>
            <p className="text-slate-400 text-[11px] mt-1">Долгосрочный центр гравитации котировок</p>
          </div>

          <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
            <div className="text-slate-400">Зона экстремальной недооценки серебра</div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">&gt; 80 : 1</div>
            <p className="text-slate-400 text-[11px] mt-1">Текущий уровень (~79.4x) на границе высокой привлекательности</p>
          </div>

          <div className="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
            <div className="text-slate-400">Природное соотношение в земной коре</div>
            <div className="text-xl font-bold font-mono text-cyan-400 mt-1">~17 : 1</div>
            <p className="text-slate-400 text-[11px] mt-1">Фактическое геологическое залегание серебра к золоту</p>
          </div>
        </div>
      </div>

    </div>
  );
};
