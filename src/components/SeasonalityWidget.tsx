import React, { useState } from 'react';
import {
  seasonalityMatrixData,
  seasonalityStats,
  monthNamesRu,
  monthNamesFullRu,
  MonthSeasonalStat
} from '../data/silverData';
import { Calendar, TrendingUp, Info, Award, AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { InfoButton } from './HelpModal';

export const SeasonalityWidget: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [filterType, setFilterType] = useState<'all' | 'recent5' | 'bullYears'>('all');

  const filteredMatrix = seasonalityMatrixData.filter(row => {
    if (filterType === 'recent5') return row.year >= 2021;
    if (filterType === 'bullYears') {
      // Years where total annual return was positive
      const total = row.returns.reduce((a, b) => a + b, 0);
      return total > 0;
    }
    return true;
  });

  const activeStat: MonthSeasonalStat = seasonalityStats[selectedMonth];

  // Helper for color coding heat map cell
  const getCellBg = (val: number, isUnfinished = false) => {
    if (isUnfinished) return 'bg-slate-900/40 text-slate-600 border border-slate-800/40';
    if (val === 0) return 'bg-slate-900/60 text-slate-400 border border-slate-800';

    if (val > 0) {
      if (val > 15) return 'bg-emerald-500/40 text-emerald-200 border border-emerald-500/50 font-bold';
      if (val > 8) return 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-semibold';
      if (val > 3) return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20';
      return 'bg-emerald-500/10 text-emerald-400/90 border border-emerald-500/15';
    } else {
      if (val < -15) return 'bg-rose-500/40 text-rose-200 border border-rose-500/50 font-bold';
      if (val < -8) return 'bg-rose-500/25 text-rose-300 border border-rose-500/30 font-semibold';
      if (val < -3) return 'bg-rose-500/15 text-rose-400 border border-rose-500/20';
      return 'bg-rose-500/10 text-rose-400/90 border border-rose-500/15';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Best vs Weakest Months */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Most Reliable Month */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span>Самый надежный месяц (Win Rate)</span>
              <InfoButton topicId="seasonality_matrix" />
            </span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">Сентябрь</span>
            <span className="text-xs font-mono text-slate-300">73.3% лет</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Ср. доходность: <strong className="text-emerald-400">+4.1%</strong> (Дивали / закупки)
          </div>
        </div>

        {/* Highest Average Return */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span>Наибольшая ср. доходность</span>
              <InfoButton topicId="seasonality_matrix" />
            </span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-cyan-400">Февраль</span>
            <span className="text-xs font-mono text-cyan-300">+3.8% ср.</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Традиционное продолжение январского импульса
          </div>
        </div>

        {/* Weakest Historical Month */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span>Исторически слабый месяц</span>
              <InfoButton topicId="seasonality_matrix" />
            </span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-rose-400">Июнь</span>
            <span className="text-xs font-mono text-rose-300">-1.8% ср.</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            "Летний штиль", спад физической активности
          </div>
        </div>

        {/* Current Month Seasonal Stance */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span>Текущий месяц: {activeStat.fullName}</span>
              <InfoButton topicId="seasonality_matrix" />
            </span>
            <Calendar className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono ${activeStat.avgReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {activeStat.avgReturn >= 0 ? '+' : ''}{activeStat.avgReturn}%
            </span>
            <span className="text-xs text-slate-400">винрейт {activeStat.winRate}%</span>
          </div>
          <div className="mt-1 text-xs text-slate-400 line-clamp-1">
            {activeStat.seasonalDriver}
          </div>
        </div>

      </div>

      {/* Main Heatmap Matrix Container */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 lg:p-6 backdrop-blur">
        
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>Тепловая карта сезонности (Monthly Return Matrix 2011–2026)</span>
              </h2>
              <InfoButton topicId="seasonality_matrix" />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Историческая процентная доходность фьючерса на серебро по каждому календарному месяцу
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1 rounded transition-colors ${filterType === 'all' ? 'bg-slate-800 text-cyan-300 font-bold' : 'text-slate-400'}`}
              >
                Все годы (15 лет)
              </button>
              <button
                onClick={() => setFilterType('recent5')}
                className={`px-3 py-1 rounded transition-colors ${filterType === 'recent5' ? 'bg-slate-800 text-cyan-300 font-bold' : 'text-slate-400'}`}
              >
                Последние 5 лет
              </button>
              <button
                onClick={() => setFilterType('bullYears')}
                className={`px-3 py-1 rounded transition-colors ${filterType === 'bullYears' ? 'bg-slate-800 text-cyan-300 font-bold' : 'text-slate-400'}`}
              >
                Только бычьи годы
              </button>
            </div>
          </div>
        </div>

        {/* Heatmap Table */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-xs text-center border-collapse">
            <thead>
              <tr className="border-b border-slate-800 font-mono text-slate-400">
                <th className="py-2 px-2 text-left w-16">Год</th>
                {monthNamesRu.map((m, idx) => (
                  <th
                    key={m}
                    onClick={() => setSelectedMonth(idx)}
                    className={`py-2 px-1.5 cursor-pointer transition-colors ${
                      selectedMonth === idx ? 'text-cyan-400 font-bold bg-slate-800/50 rounded-t' : 'hover:text-slate-200'
                    }`}
                  >
                    {m}
                  </th>
                ))}
                <th className="py-2 px-2 font-bold text-slate-300">Годовой итог</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {filteredMatrix.map((row) => {
                const is2026 = row.year === 2026;
                const annualSum = row.returns.reduce((a, b) => a + b, 0);

                return (
                  <tr key={row.year} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2 px-2 text-left font-bold text-slate-300">{row.year}</td>
                    
                    {row.returns.map((val, mIdx) => {
                      const isUnfinished = is2026 && mIdx > 9;
                      const isSelectedMonth = selectedMonth === mIdx;

                      return (
                        <td key={mIdx} className="p-0.5">
                          <button
                            onClick={() => setSelectedMonth(mIdx)}
                            className={`w-full py-1 px-1 rounded transition-all text-center ${getCellBg(val, isUnfinished)} ${
                              isSelectedMonth ? 'ring-1 ring-cyan-400' : ''
                            }`}
                          >
                            {isUnfinished ? '—' : `${val > 0 ? '+' : ''}${val.toFixed(1)}%`}
                          </button>
                        </td>
                      );
                    })}

                    <td className={`py-2 px-2 font-bold tabular-nums ${annualSum >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {annualSum >= 0 ? '+' : ''}{annualSum.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Statistical Bottom Row */}
            <tfoot className="border-t-2 border-slate-700 font-mono text-xs">
              <tr className="bg-slate-950/80 font-bold text-slate-200">
                <td className="py-2.5 px-2 text-left">Ср. %:</td>
                {seasonalityStats.map((st) => (
                  <td
                    key={st.monthIndex}
                    className={`py-2 px-1 tabular-nums ${st.avgReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
                  >
                    {st.avgReturn >= 0 ? '+' : ''}{st.avgReturn}%
                  </td>
                ))}
                <td className="py-2.5 px-2 text-cyan-400">+12.4%</td>
              </tr>
              <tr className="bg-slate-950/40 text-[11px] text-slate-400">
                <td className="py-1.5 px-2 text-left">Винрейт:</td>
                {seasonalityStats.map((st) => (
                  <td key={st.monthIndex} className="py-1.5 px-1 tabular-nums">
                    {st.winRate}%
                  </td>
                ))}
                <td>—</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Selected Month Focus Card */}
        <div className="mt-6 p-4 bg-slate-950/80 rounded-xl border border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">
                  Фокус: {activeStat.fullName} ({activeStat.monthName})
                </h3>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">
                  {activeStat.winRate}% прибыльных лет
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {activeStat.seasonalDriver}
              </p>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono shrink-0">
              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                <div className="text-[10px] text-slate-400 font-sans">Рекордный рост</div>
                <div className="text-emerald-400 font-bold">
                  +{activeStat.bestReturn.val}% <span className="text-slate-500 font-normal">({activeStat.bestReturn.year})</span>
                </div>
              </div>

              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                <div className="text-[10px] text-slate-400 font-sans">Худшая просадка</div>
                <div className="text-rose-400 font-bold">
                  {activeStat.worstReturn.val}% <span className="text-slate-500 font-normal">({activeStat.worstReturn.year})</span>
                </div>
              </div>

              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                <div className="text-[10px] text-slate-400 font-sans">Медиана</div>
                <div className="text-cyan-300 font-bold">
                  {activeStat.medianReturn >= 0 ? '+' : ''}{activeStat.medianReturn}%
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Seasonal Cycle Roadmap & Tactical Calendar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl">
          <div className="text-xs font-bold text-cyan-400 mb-1">Q1: Январь — Март</div>
          <div className="text-xs font-semibold text-white mb-2">Закупки & Ребалансировка</div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Фонды перераспределяют портфели в пользу сырьевых активов. Китайские заводы закупают металл перед праздниками.
          </p>
        </div>

        <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl">
          <div className="text-xs font-bold text-indigo-400 mb-1">Q2: Апрель — Июнь</div>
          <div className="text-xs font-semibold text-white mb-2">Весенний пик и затишье</div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Апрель часто показывает сильные всплески, сменяющиеся майско-июньской стагнацией на фоне снижения объемов.
          </p>
        </div>

        <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl">
          <div className="text-xs font-bold text-emerald-400 mb-1">Q3: Июль — Сентябрь</div>
          <div className="text-xs font-semibold text-white mb-2">Индийский сезон фестивалей</div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Сентябрь — самый результативный месяц. Индийские импортеры закупают сотни тонн серебра к главному празднику Дивали.
          </p>
        </div>

        <div className="p-4 bg-slate-900/70 border border-slate-800 rounded-xl">
          <div className="text-xs font-bold text-amber-400 mb-1">Q4: Октябрь — Декабрь</div>
          <div className="text-xs font-semibold text-white mb-2">Санта-Клаус & Налоги</div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            В ноябре возможна фиксация прибыли перед налоговым аудитом фондов, после чего наступает предновогоднее ралли.
          </p>
        </div>

      </div>

    </div>
  );
};
