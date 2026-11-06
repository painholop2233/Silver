import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Gauge,
  Sliders,
  Clock,
  Calendar,
  Layers,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  RefreshCw,
  Zap,
  ChevronRight,
  Target,
  BarChart3,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  SlidersHorizontal,
} from 'lucide-react';
import {
  ForecastFactor,
  baselineForecastFactors,
  forecastModelPresets,
  calculateCompositeScore,
  generateHorizonForecasts,
} from '../data/forecastModelData';
import { CurrencyUnit } from './Header';
import { InfoButton } from './HelpModal';
import { RealtimeQuoteResponse } from '../services/marketApi';
import { TInvestFutureInstrument } from '../data/tinkoffFuturesData';

interface PredictiveForecastMatrixProps {
  currentPriceUsd: number;
  volatility30d: number;
  currencyUnit: CurrencyUnit;
  realtimeQuote: RealtimeQuoteResponse | null;
  selectedInstrument: TInvestFutureInstrument;
}

export const PredictiveForecastMatrix: React.FC<PredictiveForecastMatrixProps> = ({
  currentPriceUsd,
  volatility30d,
  currencyUnit,
  realtimeQuote,
  selectedInstrument,
}) => {
  const [factors, setFactors] = useState<ForecastFactor[]>(baselineForecastFactors);
  const [activePreset, setActivePreset] = useState<string>('balanced');
  const [activeView, setActiveView] = useState<'all' | 'short' | 'long' | 'factors'>('all');

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

  const unitLabel =
    selectedInstrument.unit === 'RUB/g' && currencyUnit === 'RUB_G'
      ? '₽/г'
      : {
          USD_OZ: '$/oz',
          EUR_OZ: '€/oz',
          USD_KG: '$/kg',
          RUB_G: '₽/g',
        }[currencyUnit];

  // Effective price of the selected instrument (in native points)
  const effectiveBasePrice = useMemo(() => {
    const livePrice = realtimeQuote?.quotes?.[selectedInstrument.ticker]?.price;
    if (livePrice && livePrice > 0) return livePrice;
    if (selectedInstrument.unit === 'RUB/g') return 138.27;
    return currentPriceUsd > 0 ? currentPriceUsd : 52.59;
  }, [realtimeQuote, selectedInstrument, currentPriceUsd]);

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
  };

  // Calculate composite score
  const composite = useMemo(() => calculateCompositeScore(factors), [factors]);

  // Generate short-term & long-term forecasts dynamically adapted to selected contract price
  const { shortTerm, mediumLongTerm } = useMemo(
    () => generateHorizonForecasts(effectiveBasePrice, volatility30d, composite.score),
    [effectiveBasePrice, volatility30d, composite.score]
  );

  const totalWeights = factors.reduce((sum, f) => sum + f.weight, 0);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Header Banner & Composite Score Gauge */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        {/* Ambient background glow */}
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
              <InfoButton topicId="predictive_composite_index" title="Справка: композитный индекс прогнозирования" />
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Прогностическая Модель и Горизонты Цены
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Многофакторный синтез макроэкономики США, физического дефицита складов COMEX/LBMA, отчетов спекулянтов CFTC COT, межрыночного коэффициента GSR и микроструктуры стакана Т-Банка с расчетом вероятностей на 8 временных горизонтах.
            </p>
          </div>

          {/* Composite Score Gauge Card */}
          <div className="flex items-center gap-5 bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 sm:p-5 shrink-0 shadow-lg">
            {/* Visual Gauge Meter */}
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

            {/* Score Verdict & Regime */}
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
              title="Сбросить веса к институциональным базовым"
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
                  Основаны на внутридневной микроструктуре стакана Т-Банка, дисбалансе спроса/предложения и волатильности ATR
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

          {/* Grid of 4 Short-term Horizons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {shortTerm.map((horizon) => {
              const isUp = horizon.expectedChangePct >= 0;
              return (
                <div
                  key={horizon.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 flex flex-col justify-between transition-all shadow-md group relative overflow-hidden"
                >
                  <div className="space-y-3">
                    {/* Horizon Badge & Bias */}
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

                    {/* Target Price & Delta */}
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

                    {/* Expected Intraday Cone (Support / Resistance) */}
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
                        <span>Диапазон σ:</span>
                        <span className="text-cyan-400 font-semibold">±${horizon.volatilityConeUsd}</span>
                      </div>
                    </div>

                    {/* Probability Bar */}
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

                    {/* Key Short-term Catalysts */}
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
                  Расчет базового, оптимистичного и пессимистичного сценариев на основе макромодели, баланса дефицита и сезонных циклов
                </p>
              </div>
            </div>

            <span className="text-xs font-mono text-slate-400 hidden sm:inline-block">
              Модель Монте-Карло с поправкой на дефицит
            </span>
          </div>

          {/* Grid of 4 Medium/Long Horizons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {mediumLongTerm.map((horizon) => {
              const isUp = horizon.expectedChangePct >= 0;
              return (
                <div
                  key={horizon.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700/80 rounded-xl p-4 flex flex-col justify-between transition-all shadow-md group relative overflow-hidden"
                >
                  <div className="space-y-3">
                    {/* Horizon Header */}
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

                    {/* Base Target Price */}
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

                    {/* Scenario Target Bounds: Bear vs Bull */}
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
                        <span>Волатильный конус:</span>
                        <span className="text-cyan-400 font-semibold">±${horizon.volatilityConeUsd}</span>
                      </div>
                    </div>

                    {/* Probability Distribution */}
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

                    {/* Key Structural Drivers */}
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

          {/* Visual Trajectory Bar: Comparison across Horizons */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center justify-between">
              <span>Сводная динамика целевых уровней от текущей цены ({formatDisplayPrice(effectiveBasePrice)}):</span>
              <span className="text-[11px] font-mono text-slate-400">
                Горизонт 1H → 1Y
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-xs">
              {[...shortTerm, ...mediumLongTerm].map((h) => {
                const diffPct = (((h.baseExpectedPriceUsd - effectiveBasePrice) / effectiveBasePrice) * 100);
                const isPositive = diffPct >= 0;
                return (
                  <div key={h.id} className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
                    <div className="text-[10px] font-mono text-slate-400">{h.title}</div>
                    <div className="text-xs font-bold font-mono text-white mt-0.5">
                      {formatDisplayPrice(h.baseExpectedPriceUsd)}
                    </div>
                    <div className={`text-[10px] font-mono font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPositive ? '+' : ''}{diffPct.toFixed(1)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. SECTION: FACTOR RADAR MATRIX & WEIGHTS ADJUSTMENT (Points 1 & 2) */}
      {(activeView === 'all' || activeView === 'factors') && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Матрица Прогностических Факторов и Настройка Весов
                  <InfoButton topicId="predictive_factor_weights" title="Справка: 6 факторов и методика скоринга" />
                </h3>
                <p className="text-xs text-slate-400">
                  Интерактивная настройка чувствительности модели. Изменение весов мгновенно пересчитывает целевые уровни всех 8 горизонтов.
                </p>
              </div>
            </div>

            <div className="text-xs font-mono text-slate-400 hidden sm:block">
              Сумма весов: <span className={totalWeights === 100 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>{totalWeights}%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {factors.map((factor) => {
              const contribution = ((factor.rawScore * factor.weight) / totalWeights) || 0;
              const isPositive = factor.rawScore >= 0;

              return (
                <div
                  key={factor.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3 transition-colors hover:border-slate-700"
                >
                  <div className="space-y-2">
                    {/* Header: Name & Signal Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400">
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

                    {/* Current Value / Metric */}
                    <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 text-xs">
                      <div className="text-[10px] font-mono text-slate-400">Текущие данные / Метрика:</div>
                      <div className="font-semibold text-slate-200 mt-0.5">{factor.currentValueText}</div>
                    </div>

                    {/* Rationale */}
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {factor.impactDescription}
                    </p>
                  </div>

                  {/* Weight Slider & Contribution */}
                  <div className="pt-2 border-t border-slate-800/70 space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">Вес в модели:</span>
                      <span className="font-bold text-cyan-300">{factor.weight}%</span>
                    </div>

                    <input
                      type="range"
                      min={0}
                      max={60}
                      step={5}
                      value={factor.weight}
                      onChange={(e) => handleWeightChange(factor.id, Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                    />

                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                      <span>Сырой скор: <strong className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>{isPositive ? '+' : ''}{factor.rawScore}</strong></span>
                      <span>Вклад: <strong className="text-white">{contribution.toFixed(1)} б.</strong></span>
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
