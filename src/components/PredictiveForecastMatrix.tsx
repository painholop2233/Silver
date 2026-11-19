import React, { useState, useMemo } from 'react';
import {
  Gauge,
  Clock,
  Calendar,
  Layers,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  SlidersHorizontal,
  Target,
  DollarSign,
  ArrowLeftRight,
  Activity,
} from 'lucide-react';
import {
  ForecastFactor,
  baselineForecastFactors,
  forecastModelPresets,
  calculateCompositeScore,
  generateHorizonForecasts,
  analyzeRealDxyImpact,
} from '../data/forecastModelData';
import { PricePoint } from '../data/silverData';
import { CurrencyUnit } from './Header';
import { InfoButton } from './HelpModal';
import { RealtimeQuoteResponse } from '../services/marketApi';
import { TInvestFutureInstrument } from '../data/tinkoffFuturesData';

interface PredictiveForecastMatrixProps {
  prices: PricePoint[];
  currentPriceUsd: number;
  volatility30d: number;
  currencyUnit: CurrencyUnit;
  realtimeQuote: RealtimeQuoteResponse | null;
  selectedInstrument: TInvestFutureInstrument;
}

export const PredictiveForecastMatrix: React.FC<PredictiveForecastMatrixProps> = ({
  prices,
  currentPriceUsd,
  volatility30d,
  currencyUnit,
  realtimeQuote,
  selectedInstrument,
}) => {
  const [factors, setFactors] = useState<ForecastFactor[]>(baselineForecastFactors);
  const [activePreset, setActivePreset] = useState<string>('balanced');
  const [activeView, setActiveView] = useState<'all' | 'short' | 'long' | 'factors'>('all');
  const [dxyExpectedShiftPct, setDxyExpectedShiftPct] = useState<number>(0);
  const [useLiveDxyTrend, setUseLiveDxyTrend] = useState<boolean>(true);

  // Conversion helper according to active CurrencyUnit
  const formatPrice = (usdOz: number): string => {
    switch (currencyUnit) {
      case 'USD_OZ':
        return `$${usdOz.toFixed(2)}`;
      case 'EUR_OZ':
        return `€${(usdOz * 0.925).toFixed(2)}`;
      case 'USD_KG':
        return `$${((usdOz / 31.1035) * 1000).toFixed(0)}`;
      case 'RUB_G':
        return `₽${((usdOz * 92.5) / 31.1035).toFixed(1)}`;
    }
  };

  const formatDisplayPrice = (val: number): string => {
    if (selectedInstrument.unit === 'RUB/g') {
      if (currencyUnit === 'RUB_G') return `${val.toFixed(2)} ₽/г`;
      if (currencyUnit === 'USD_OZ') return `$${((val * 31.1035) / 92.5).toFixed(2)}`;
      if (currencyUnit === 'EUR_OZ') return `€${(((val * 31.1035) / 92.5) * 0.925).toFixed(2)}`;
      if (currencyUnit === 'USD_KG') return `$${((val * 1000) / 92.5).toFixed(0)}`;
      return `${val.toFixed(2)} ₽/г`;
    }
    return formatPrice(val);
  };

  const formatConeSigma = (sigmaNative: number): string => {
    if (selectedInstrument.unit === 'RUB/g') {
      if (currencyUnit === 'RUB_G') return `±${sigmaNative.toFixed(2)} ₽/г`;
      if (currencyUnit === 'USD_OZ') return `±$${((sigmaNative * 31.1035) / 92.5).toFixed(2)}`;
      if (currencyUnit === 'EUR_OZ') return `±€${(((sigmaNative * 31.1035) / 92.5) * 0.925).toFixed(2)}`;
      if (currencyUnit === 'USD_KG') return `±$${((sigmaNative * 1000) / 92.5).toFixed(0)}`;
      return `±${sigmaNative.toFixed(2)} ₽/г`;
    }
    switch (currencyUnit) {
      case 'USD_OZ':
        return `±$${sigmaNative.toFixed(2)}`;
      case 'EUR_OZ':
        return `±€${(sigmaNative * 0.925).toFixed(2)}`;
      case 'USD_KG':
        return `±$${((sigmaNative / 31.1035) * 1000).toFixed(0)}`;
      case 'RUB_G':
        return `±₽${((sigmaNative * 92.5) / 31.1035).toFixed(1)}`;
    }
  };

  // Effective price of the selected instrument (in native points)
  const effectiveBasePrice = useMemo(() => {
    const livePrice = realtimeQuote?.quotes?.[selectedInstrument.ticker]?.price;
    if (livePrice && livePrice > 0) return livePrice;
    if (selectedInstrument.unit === 'RUB/g') return 138.27;
    return currentPriceUsd > 0 ? currentPriceUsd : 44.73;
  }, [realtimeQuote, selectedInstrument, currentPriceUsd]);

  // Real empirical analysis of how DXY affects the active silver contract's real prices
  const dxyAnalysis = useMemo(
    () => analyzeRealDxyImpact(prices, realtimeQuote?.dxyQuote),
    [prices, realtimeQuote?.dxyQuote]
  );

  // Active DXY % expectation driving elasticity overlay (either live 30D trend or manual slider)
  const effectiveDxyShiftPct = useLiveDxyTrend
    ? Number(Math.max(-5, Math.min(5, dxyAnalysis.dxy30dPct * 0.6)).toFixed(2))
    : dxyExpectedShiftPct;

  // Enrich factors dynamically with real DXY & GSR market metrics
  const effectiveFactors = useMemo(() => {
    const gsr = prices.length > 0 && currentPriceUsd > 0
      ? Number((prices[prices.length - 1].goldClose / currentPriceUsd).toFixed(1))
      : 81.5;

    return factors.map((f) => {
      if (f.id === 'dollar_index_dxy') {
        // Adjust DXY rawScore if user tests a custom DXY scenario shift
        const scenarioAdjust = useLiveDxyTrend
          ? 0
          : Math.round(-dxyExpectedShiftPct * 12 * (dxyAnalysis.beta <= 0 ? 1 : -1));
        const adjustedRawScore = Math.max(-95, Math.min(95, dxyAnalysis.dxyRawScore + scenarioAdjust));
        const signal: ForecastFactor['signal'] =
          adjustedRawScore >= 18 ? 'BULLISH' : adjustedRawScore <= -18 ? 'BEARISH' : 'NEUTRAL';

        return {
          ...f,
          rawScore: adjustedRawScore,
          signal,
          currentValueText: `DXY: ${dxyAnalysis.dxyCurrent.toFixed(2)} (30д: ${
            dxyAnalysis.dxy30dPct >= 0 ? '+' : ''
          }${dxyAnalysis.dxy30dPct}%, r = ${dxyAnalysis.levelCorrelation}, β = ${dxyAnalysis.beta}x)`,
          dataMetric: `Pearson r: ${dxyAnalysis.levelCorrelation} · Бета: ${dxyAnalysis.beta}x · R²: ${(
            dxyAnalysis.rSquared * 100
          ).toFixed(0)}%`,
        };
      }
      if (f.id === 'cross_asset_gsr' && selectedInstrument.unit === 'USD/oz' && gsr > 20 && gsr < 150) {
        return {
          ...f,
          currentValueText: `GSR: ${gsr}x (норма 65x–70x)`,
        };
      }
      return f;
    });
  }, [factors, dxyAnalysis, useLiveDxyTrend, dxyExpectedShiftPct, prices, currentPriceUsd, selectedInstrument.unit]);

  // Apply a preset
  const handleApplyPreset = (presetId: string) => {
    const preset = forecastModelPresets.find((p) => p.id === presetId);
    if (!preset) return;
    setActivePreset(presetId);
    setFactors((prev) =>
      prev.map((f) => ({
        ...f,
        weight: preset.weights[f.id] ?? f.weight,
      }))
    );
  };

  // Adjust individual factor weight
  const handleWeightChange = (factorId: string, newWeight: number) => {
    setActivePreset('custom');
    setFactors((prev) =>
      prev.map((f) => (f.id === factorId ? { ...f, weight: newWeight } : f))
    );
  };

  // Reset to default
  const handleReset = () => {
    handleApplyPreset('balanced');
    setUseLiveDxyTrend(true);
    setDxyExpectedShiftPct(0);
  };

  // Calculate composite score using dynamic effectiveFactors
  const composite = useMemo(() => calculateCompositeScore(effectiveFactors), [effectiveFactors]);

  const totalWeights = effectiveFactors.reduce((sum, f) => sum + f.weight, 0);
  const dxyFactor = effectiveFactors.find((f) => f.id === 'dollar_index_dxy');
  const dxyWeight = dxyFactor?.weight ?? 20;
  const dxyWeightSharePct = totalWeights > 0 ? Math.round((dxyWeight / totalWeights) * 100) : 0;

  // Generate short-term & long-term forecasts dynamically adapted to selected contract price + DXY weight
  const { shortTerm, mediumLongTerm } = useMemo(
    () =>
      generateHorizonForecasts(effectiveBasePrice, volatility30d, composite.score, {
        dxyWeightPct: dxyWeight,
        totalWeightsPct: totalWeights,
        beta: dxyAnalysis.beta,
        dxyExpectedShiftPct: effectiveDxyShiftPct,
      }),
    [effectiveBasePrice, volatility30d, composite.score, dxyWeight, totalWeights, dxyAnalysis.beta, effectiveDxyShiftPct]
  );

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Header Banner & Composite Score Gauge */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                <Gauge className="w-3.5 h-3.5" />
                Институциональный Моделинг
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Контракт: {selectedInstrument.ticker} ({formatDisplayPrice(effectiveBasePrice)})
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                Вес DXY: {dxyWeight}% ({dxyWeightSharePct}% модели)
              </span>
              <InfoButton topicId="predictive_composite_index" title="Справка: композитный индекс прогнозирования" />
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Прогностическая Модель и Горизонты Цены
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Многофакторный синтез с прямым весом Индекса Доллара США (DXY), реальной эконометрической корреляцией, физическим дефицитом COMEX/LBMA, отчетами CFTC COT и микроструктурой стакана Т-Банка.
            </p>
          </div>

          {/* Composite Score Gauge Card */}
          <div className="flex items-center gap-5 bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shrink-0 shadow-lg">
            <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-slate-800"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={251.2}
                  strokeDashoffset={251.2 - (251.2 * composite.score) / 100}
                  strokeLinecap="round"
                  className={
                    composite.score >= 70
                      ? 'text-emerald-400 transition-all duration-700'
                      : composite.score >= 50
                      ? 'text-cyan-400 transition-all duration-700'
                      : 'text-amber-400 transition-all duration-700'
                  }
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-extrabold font-mono text-white leading-none">
                  {composite.score}
                </span>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5">из 100</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                Фаза Рынка / Сентимент
              </div>
              <div className={`text-base font-bold leading-tight ${composite.color}`}>
                {composite.label}
              </div>
              <p className="text-xs text-slate-400 max-w-xs line-clamp-2">
                {composite.summary}
              </p>
            </div>
          </div>
        </div>

        {/* Model Presets Bar & View Switcher */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="text-slate-400 font-medium mr-1 flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              Пресеты модели:
            </span>
            {forecastModelPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleApplyPreset(preset.id)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  activePreset === preset.id
                    ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 font-semibold shadow-sm'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
                title={preset.description}
              >
                {preset.name}
              </button>
            ))}
            {activePreset === 'custom' && (
              <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                Пользовательские веса ({totalWeights}%)
              </span>
            )}
            <button
              onClick={handleReset}
              title="Сбросить веса и сценарий DXY к базовым"
              className="p-1.5 text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 rounded-lg border border-slate-700/60 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Sub-navigation */}
          <div className="flex items-center p-0.5 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setActiveView('all')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeView === 'all'
                  ? 'bg-slate-800 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Все горизонты
            </button>
            <button
              onClick={() => setActiveView('short')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeView === 'short'
                  ? 'bg-slate-800 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Краткосрочные (1H-1D)
            </button>
            <button
              onClick={() => setActiveView('long')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeView === 'long'
                  ? 'bg-slate-800 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Долгосрочные (1M-1Y)
            </button>
            <button
              onClick={() => setActiveView('factors')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeView === 'factors'
                  ? 'bg-slate-800 text-white font-medium shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Матрица весов
            </button>
          </div>
        </div>
      </div>

      {/* 1.5 REAL DOLLAR INDEX (DXY) IMPACT & WEIGHT ATTRIBUTION PANEL */}
      <div className="bg-slate-900/90 border border-amber-500/25 rounded-2xl p-5 shadow-lg space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white">
                  Реальное влияние Индекса Доллара (DXY) на цену {selectedInstrument.ticker} и Вес в Прогнозе
                </h3>
                <InfoButton topicId="dxy_correlation" title="Справка: реальная корреляция и вес DXY в модели" />
              </div>
              <p className="text-xs text-slate-400">
                Эконометрический расчет по {dxyAnalysis.sampleSize} реальным торговым сессиям ({selectedInstrument.ticker} vs ICE DX-Y.NYB Live)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-amber-300 font-bold">
              DXY Live: {dxyAnalysis.dxyCurrent.toFixed(2)}
            </span>
            <span
              className={`px-2 py-1 rounded-lg border font-semibold ${
                dxyAnalysis.dxy30dPct >= 0
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              }`}
            >
              30д: {dxyAnalysis.dxy30dPct >= 0 ? '+' : ''}
              {dxyAnalysis.dxy30dPct}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left 7 cols: Real Empirical Impact on Actual Silver Prices */}
          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                <div className="text-[10px] font-mono text-slate-400">Корреляция (Pearson r)</div>
                <div className="text-lg font-extrabold font-mono text-cyan-400 mt-1 tabular-nums">
                  {dxyAnalysis.levelCorrelation}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  30д скольз.: <span className="text-slate-200 font-mono">{dxyAnalysis.corr30d}</span>
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                <div className="text-[10px] font-mono text-slate-400">Эластичность (Бета β)</div>
                <div className="text-lg font-extrabold font-mono text-amber-400 mt-1 tabular-nums">
                  {dxyAnalysis.beta}x
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                  +1% DXY → <span className="text-white font-mono">{dxyAnalysis.beta > 0 ? '+' : ''}{dxyAnalysis.beta}%</span> Ag
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                <div className="text-[10px] font-mono text-slate-400">Сила связи (R²)</div>
                <div className="text-lg font-extrabold font-mono text-emerald-400 mt-1 tabular-nums">
                  {(dxyAnalysis.rSquared * 100).toFixed(0)}%
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {dxyAnalysis.regimeLabel}
                </div>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3">
                <div className="text-[10px] font-mono text-slate-400">Факт за 30 дней</div>
                <div
                  className={`text-lg font-extrabold font-mono mt-1 tabular-nums ${
                    dxyAnalysis.silver30dPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {dxyAnalysis.silver30dPct >= 0 ? '+' : ''}
                  {dxyAnalysis.silver30dPct}%
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  По DXY расчёт:{' '}
                  <span className="text-cyan-300 font-mono">
                    {dxyAnalysis.silverImpliedByDxy30dPct >= 0 ? '+' : ''}
                    {dxyAnalysis.silverImpliedByDxy30dPct}%
                  </span>
                </div>
              </div>
            </div>

            {/* Real Recent Sessions Comparison Table */}
            <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <ArrowLeftRight className="w-3.5 h-3.5 text-amber-400" />
                  Последние реальные сессии: движение DXY против {selectedInstrument.ticker}
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  DXY SMA 50: {dxyAnalysis.dxySma50} ({dxyAnalysis.dxyVsSma50Pct >= 0 ? '+' : ''}
                  {dxyAnalysis.dxyVsSma50Pct}%)
                </span>
              </div>

              {dxyAnalysis.recentSessions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] font-mono">
                    <thead>
                      <tr className="text-slate-400 border-b border-slate-800/80 text-left">
                        <th className="py-1.5 pr-2 font-normal">Дата</th>
                        <th className="py-1.5 px-2 font-normal">DXY</th>
                        <th className="py-1.5 px-2 font-normal">Δ DXY %</th>
                        <th className="py-1.5 px-2 font-normal">{selectedInstrument.ticker}</th>
                        <th className="py-1.5 pl-2 text-right font-normal">Δ Серебро %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dxyAnalysis.recentSessions.map((row) => {
                        const isInverse =
                          (row.dxyPct > 0.02 && row.silverPct < 0) ||
                          (row.dxyPct < -0.02 && row.silverPct > 0);
                        return (
                          <tr key={row.date} className="border-b border-slate-900/80 last:border-none">
                            <td className="py-1.5 pr-2 text-slate-300">{row.date}</td>
                            <td className="py-1.5 px-2 text-amber-300">{row.dxyClose.toFixed(2)}</td>
                            <td
                              className={`py-1.5 px-2 font-semibold ${
                                row.dxyPct > 0
                                  ? 'text-amber-400'
                                  : row.dxyPct < 0
                                  ? 'text-cyan-300'
                                  : 'text-slate-500'
                              }`}
                            >
                              {row.dxyPct > 0 ? '+' : ''}
                              {row.dxyPct}%
                            </td>
                            <td className="py-1.5 px-2 text-white font-semibold">
                              {formatDisplayPrice(row.silverClose)}
                            </td>
                            <td className="py-1.5 pl-2 text-right">
                              <span
                                className={`font-bold ${
                                  row.silverPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {row.silverPct >= 0 ? '+' : ''}
                                {row.silverPct}%
                              </span>
                              {isInverse && (
                                <span
                                  className="ml-1.5 text-[9px] px-1 py-0.2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                                  title="Классическая обратная реакция на доллар"
                                >
                                  инверс.
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-xs text-slate-400 py-3">Загрузка исторических сессий DXY и серебра...</div>
              )}
            </div>
          </div>

          {/* Right 5 cols: DXY Weight Slider + Forecast Contribution */}
          <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-amber-400" />
                  Вес Индекса Доллара (DXY) в прогнозе
                </span>
                <span className="text-sm font-extrabold font-mono text-amber-300">
                  {dxyWeight}% <span className="text-[11px] font-normal text-slate-400">({dxyWeightSharePct}% доли)</span>
                </span>
              </div>

              <div>
                <input
                  type="range"
                  min={0}
                  max={60}
                  step={5}
                  value={dxyWeight}
                  onChange={(e) => handleWeightChange('dollar_index_dxy', Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                  <span>0% (Игнорировать DXY)</span>
                  <span>20% (База)</span>
                  <span>60% (Максимум)</span>
                </div>
              </div>

              {/* DXY Momentum / Scenario Control */}
              <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Прогнозный импульс DXY (Δ%):</span>
                  <span
                    className={`font-mono font-bold ${
                      effectiveDxyShiftPct > 0
                        ? 'text-amber-400'
                        : effectiveDxyShiftPct < 0
                        ? 'text-emerald-400'
                        : 'text-slate-300'
                    }`}
                  >
                    {effectiveDxyShiftPct > 0 ? '+' : ''}
                    {effectiveDxyShiftPct.toFixed(2)}%
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 text-[11px] font-mono">
                  <button
                    onClick={() => setUseLiveDxyTrend(true)}
                    className={`px-2 py-1 rounded border transition-colors ${
                      useLiveDxyTrend
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-semibold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Авто (тренд DXY)
                  </button>
                  {[-3, 0, 3].map((val) => (
                    <button
                      key={val}
                      onClick={() => {
                        setUseLiveDxyTrend(false);
                        setDxyExpectedShiftPct(val);
                      }}
                      className={`px-2 py-1 rounded border transition-colors ${
                        !useLiveDxyTrend && dxyExpectedShiftPct === val
                          ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 font-semibold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {val > 0 ? `+${val}%` : `${val}%`}
                    </button>
                  ))}
                </div>

                {!useLiveDxyTrend && (
                  <input
                    type="range"
                    min={-6}
                    max={6}
                    step={0.5}
                    value={dxyExpectedShiftPct}
                    onChange={(e) => setDxyExpectedShiftPct(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                  />
                )}
              </div>
            </div>

            {/* Direct Attribution Summary across Horizons */}
            <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400 font-sans">Вклад DXY в общий индекс:</span>
                <span
                  className={`font-bold ${
                    composite.dxyScoreImpactPts >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {composite.dxyScoreImpactPts >= 0 ? '+' : ''}
                  {composite.dxyScoreImpactPts} б.
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                {['1m', '1q', '1y'].map((hid) => {
                  const h = mediumLongTerm.find((item) => item.id === hid);
                  if (!h) return null;
                  return (
                    <div key={hid} className="bg-slate-900/90 border border-slate-800 rounded-lg p-1.5">
                      <div className="text-[10px] text-slate-400">DXY → {hid.toUpperCase()}</div>
                      <div
                        className={`text-xs font-bold ${
                          h.dxyContributionPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {h.dxyContributionPct >= 0 ? '+' : ''}
                        {h.dxyContributionPct}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SECTION: SHORT-TERM INTRADAY FORECASTS (1H, 2H, 4H, 1D) */}
      {(activeView === 'all' || activeView === 'short') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Краткосрочные Прогнозы (1 Час, 2 Часа, 4 Часа, 1 День)
                  <InfoButton topicId="predictive_short_term_forecast" title="Справка: расчет интрадей-прогнозов" />
                </h3>
                <p className="text-xs text-slate-400">
                  Учитывают вес DXY ({dxyWeight}%), внутридневную микроструктуру стакана Т-Банка и волатильность ATR
                </p>
              </div>
            </div>

            {realtimeQuote?.orderBook && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Стакан Т-Банка подключен
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {shortTerm.map((horizon) => {
              const isUp = horizon.expectedChangePct >= 0;
              return (
                <div
                  key={horizon.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 flex flex-col justify-between transition-all shadow-md group relative overflow-hidden"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold font-mono text-cyan-300 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                          {horizon.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {horizon.durationLabel}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                          horizon.bias === 'STRONG_BUY' || horizon.bias === 'MODERATE_BUY'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : horizon.bias === 'NEUTRAL_RANGE'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {horizon.bias === 'STRONG_BUY'
                          ? 'BUY'
                          : horizon.bias === 'MODERATE_BUY'
                          ? 'BUY ON DIP'
                          : horizon.bias === 'NEUTRAL_RANGE'
                          ? 'RANGE'
                          : 'SELL'}
                      </span>
                    </div>

                    <div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Ожидаемая цена закрытия:
                      </div>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-xl font-extrabold font-mono text-white">
                          {formatDisplayPrice(horizon.baseExpectedPriceUsd)}
                        </span>
                        <span
                          className={`text-xs font-mono font-bold flex items-center ${
                            isUp ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isUp ? (
                            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                          ) : (
                            <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                          )}
                          {isUp ? '+' : ''}
                          {horizon.expectedChangePct}%
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 space-y-1.5 text-xs font-mono">
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>Поддержка S1:</span>
                        <span className="text-slate-300 font-semibold">{formatDisplayPrice(horizon.supportLevelUsd)}</span>
                      </div>
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>Сопротивление R1:</span>
                        <span className="text-slate-300 font-semibold">{formatDisplayPrice(horizon.resistanceLevelUsd)}</span>
                      </div>
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>Вклад DXY (вес {dxyWeight}%):</span>
                        <span
                          className={`font-semibold ${
                            horizon.dxyContributionPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {horizon.dxyContributionPct >= 0 ? '+' : ''}
                          {horizon.dxyContributionPct}%
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>Диапазон σ:</span>
                        <span className="text-cyan-400 font-semibold">{formatConeSigma(horizon.volatilityConeUsd)}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-emerald-400 font-semibold">
                          Рост: {horizon.bullProbabilityPct}%
                        </span>
                        <span className="text-rose-400 font-semibold">
                          Снижение: {horizon.bearProbabilityPct}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                        <div
                          className="bg-emerald-500 h-full transition-all"
                          style={{ width: `${horizon.bullProbabilityPct}%` }}
                        />
                        <div
                          className="bg-rose-500 h-full transition-all"
                          style={{ width: `${horizon.bearProbabilityPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 space-y-1 pt-1 border-t border-slate-800/60">
                      <div className="font-semibold text-slate-300 text-[10px] uppercase tracking-wider">
                        Ключевой фактор:
                      </div>
                      <p className="line-clamp-2 text-slate-400 leading-tight">
                        {horizon.keyCatalysts[0]}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. SECTION: MEDIUM & LONG-TERM FORECASTS (1M, 1Q, 6M, 1Y) */}
      {(activeView === 'all' || activeView === 'long') && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Среднесрочные и Долгосрочные Прогнозы (1 Месяц, Квартал, Полгода, 1 Год)
                  <InfoButton topicId="predictive_long_term_forecast" title="Справка: фундаментальный прогноз на 1M-1Y" />
                </h3>
                <p className="text-xs text-slate-400">
                  Базовый, оптимистичный и пессимистичный сценарии с поправкой на вес DXY ({dxyWeight}%) и реальную бету ({dxyAnalysis.beta}x)
                </p>
              </div>
            </div>

            <span className="text-xs font-mono text-slate-400 hidden sm:inline-block">
              Модель Монте-Карло + DXY Beta
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {mediumLongTerm.map((horizon) => {
              const isUp = horizon.expectedChangePct >= 0;
              return (
                <div
                  key={horizon.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 flex flex-col justify-between transition-all shadow-md group relative overflow-hidden"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold font-mono text-emerald-300 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                          {horizon.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {horizon.timeframe}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        Точность ~{horizon.confidencePct}%
                      </span>
                    </div>

                    <div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Базовый сценарий:
                      </div>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="text-2xl font-extrabold font-mono text-white">
                          {formatDisplayPrice(horizon.baseExpectedPriceUsd)}
                        </span>
                        <span
                          className={`text-xs font-mono font-bold flex items-center ${
                            isUp ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isUp ? (
                            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                          ) : (
                            <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                          )}
                          {isUp ? '+' : ''}
                          {horizon.expectedChangePct}%
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 space-y-1.5 text-xs font-mono">
                      <div className="flex justify-between items-center">
                        <span className="text-rose-400 flex items-center gap-1 text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                          Пессимистичный:
                        </span>
                        <span className="text-slate-200 font-semibold">{formatDisplayPrice(horizon.bearTargetUsd)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Оптимистичный:
                        </span>
                        <span className="text-slate-200 font-semibold">{formatDisplayPrice(horizon.bullTargetUsd)}</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-400 text-[11px] pt-1 border-t border-slate-800/60">
                        <span>Вклад DXY ({dxyWeight}%):</span>
                        <span
                          className={`font-semibold ${
                            horizon.dxyContributionPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {horizon.dxyContributionPct >= 0 ? '+' : ''}
                          {horizon.dxyContributionPct}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-slate-400 text-[11px]">
                        <span>Волатильный конус:</span>
                        <span className="text-cyan-400 font-semibold">{formatConeSigma(horizon.volatilityConeUsd)}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-emerald-400 font-semibold">
                          Бычий тренд: {horizon.bullProbabilityPct}%
                        </span>
                        <span className="text-rose-400 font-semibold">
                          Медвежий: {horizon.bearProbabilityPct}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                        <div
                          className="bg-emerald-500 h-full transition-all"
                          style={{ width: `${horizon.bullProbabilityPct}%` }}
                        />
                        <div
                          className="bg-rose-500 h-full transition-all"
                          style={{ width: `${horizon.bearProbabilityPct}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-400 space-y-1.5 pt-1.5 border-t border-slate-800/60">
                      <div className="font-semibold text-slate-300 text-[10px] uppercase tracking-wider flex items-center gap-1">
                        <Target className="w-3 h-3 text-cyan-400" />
                        Драйверы горизонта:
                      </div>
                      <ul className="space-y-1 text-slate-400 text-[10px] leading-tight">
                        {horizon.keyCatalysts.slice(0, 2).map((cat, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <span className="text-cyan-400 font-bold shrink-0">•</span>
                            <span>{cat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Visual Trajectory Bar */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
              <span>Сводная динамика целевых уровней от текущей цены ({formatDisplayPrice(effectiveBasePrice)}):</span>
              <span className="text-[11px] font-mono text-slate-400">
                Горизонт 1H → 1Y
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-xs">
              {[...shortTerm, ...mediumLongTerm].map((h) => {
                const diffPct = ((h.baseExpectedPriceUsd - effectiveBasePrice) / effectiveBasePrice) * 100;
                const isPositive = diffPct >= 0;
                return (
                  <div key={h.id} className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                    <div className="text-[10px] font-mono text-slate-400">{h.title}</div>
                    <div className="text-xs font-bold font-mono text-white mt-0.5">
                      {formatDisplayPrice(h.baseExpectedPriceUsd)}
                    </div>
                    <div className={`text-[10px] font-mono font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPositive ? '+' : ''}
                      {diffPct.toFixed(1)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. SECTION: FACTOR RADAR MATRIX & WEIGHTS ADJUSTMENT */}
      {(activeView === 'all' || activeView === 'factors') && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Матрица Прогностических Факторов и Настройка Весов (7 блоков)
                  <InfoButton topicId="predictive_factor_weights" title="Справка: 7 факторов и методика скоринга" />
                </h3>
                <p className="text-xs text-slate-400">
                  Индекс Доллара США (DXY) вынесен в отдельный блок с реальным расчетом корреляции и беты. Изменение весов мгновенно пересчитывает все 8 горизонтов.
                </p>
              </div>
            </div>

            <div className="text-xs font-mono text-slate-400 hidden sm:block">
              Сумма весов: <span className={totalWeights === 100 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>{totalWeights}%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {effectiveFactors.map((factor) => {
              const contribution = totalWeights > 0 ? (factor.rawScore * factor.weight) / totalWeights : 0;
              const isPositive = factor.rawScore >= 0;
              const isDxy = factor.id === 'dollar_index_dxy';

              return (
                <div
                  key={factor.id}
                  className={`bg-slate-900/90 rounded-xl p-4 flex flex-col justify-between space-y-3 transition-colors border ${
                    isDxy
                      ? 'border-amber-500/40 ring-1 ring-amber-500/15 hover:border-amber-400/60'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className={`text-[10px] font-mono uppercase tracking-wider ${isDxy ? 'text-amber-400' : 'text-cyan-400'}`}>
                          {factor.category}
                        </span>
                        <h4 className="text-sm font-bold text-white leading-tight">
                          {factor.name}
                        </h4>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border shrink-0 ${
                          factor.signal === 'BULLISH'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : factor.signal === 'NEUTRAL'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}
                      >
                        {factor.signal === 'BULLISH' ? 'БЫЧИЙ СИГНАЛ' : factor.signal === 'NEUTRAL' ? 'НЕЙТРАЛЬНО' : 'МЕДВЕЖИЙ'}
                      </span>
                    </div>

                    <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 text-xs">
                      <div className="text-[10px] font-mono text-slate-400">Текущие данные / Метрика:</div>
                      <div className="font-semibold text-slate-200 mt-0.5">{factor.currentValueText}</div>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {factor.impactDescription}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/70 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">Вес в модели:</span>
                      <span className={`font-bold ${isDxy ? 'text-amber-300' : 'text-cyan-300'}`}>{factor.weight}%</span>
                    </div>

                    <input
                      type="range"
                      min={0}
                      max={60}
                      step={5}
                      value={factor.weight}
                      onChange={(e) => handleWeightChange(factor.id, Number(e.target.value))}
                      className={`w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer ${
                        isDxy ? 'accent-amber-400' : 'accent-cyan-400'
                      }`}
                    />

                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                      <span>
                        Сырой скор:{' '}
                        <strong className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                          {isPositive ? '+' : ''}
                          {factor.rawScore}
                        </strong>
                      </span>
                      <span>
                        Вклад: <strong className="text-white">{contribution.toFixed(1)} б.</strong>
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono truncate" title={factor.source}>
                      Источник: {factor.source}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
