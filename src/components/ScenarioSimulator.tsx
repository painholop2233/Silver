import React, { useState, useMemo } from 'react';
import { Sliders, Sparkles, RefreshCw, Calculator, ArrowRight, ShieldCheck, TrendingUp, AlertTriangle } from 'lucide-react';
import { CurrencyUnit } from './Header';
import { InfoButton } from './HelpModal';

interface ScenarioSimulatorProps {
  currentPrice: number;
  currencyUnit: CurrencyUnit;
}

export const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({ currentPrice, currencyUnit }) => {
  // Input parameters
  const [dxyChangePct, setDxyChangePct] = useState<number>(-3.0); // % change in DXY
  const [solarGrowthPct, setSolarGrowthPct] = useState<number>(20.0); // % growth in Solar PV demand
  const [realYieldChangeBps, setRealYieldChangeBps] = useState<number>(-40); // bps change in 10Y Real Yield
  const [mineSupplyChangePct, setMineSupplyChangePct] = useState<number>(-2.0); // % supply disruption

  // Multiplier for display
  const multiplier = useMemo(() => {
    switch (currencyUnit) {
      case 'USD_OZ': return 1;
      case 'EUR_OZ': return 0.925;
      case 'USD_KG': return 1000 / 31.1035;
      case 'RUB_G': return (92.5) / 31.1035;
    }
  }, [currencyUnit]);

  const unitPrefix = currencyUnit === 'USD_OZ' || currencyUnit === 'USD_KG' ? '$' : currencyUnit === 'EUR_OZ' ? '€' : '₽';
  const unitSuffix = currencyUnit === 'USD_OZ' || currencyUnit === 'EUR_OZ' ? '/oz' : currencyUnit === 'USD_KG' ? '/kg' : '/g';

  // Quantitative sensitivity model:
  // Base parameters:
  // Current Price: ~$34.35
  // Current Deficit: ~320 Moz
  // DXY Elasticity: -1.75x (a 1% drop in DXY adds ~1.75% to Silver)
  // Solar PV Elasticity: Solar is ~258 Moz (~20% of demand). Every +10% solar growth adds ~25.8 Moz deficit, boosting price ~3.2%
  // Real Yield Elasticity: Every -25 bps drop in TIPS adds ~2.8% to Silver
  // Supply Disruption Elasticity: Every -1% in mine production (~8.4 Moz) adds ~1.8% to Silver price due to tight physical inventories
  const projection = useMemo(() => {
    const dxyImpact = -dxyChangePct * 1.75;
    const solarImpact = (solarGrowthPct / 10) * 3.2;
    const yieldImpact = (-realYieldChangeBps / 25) * 2.8;
    const supplyImpact = (-mineSupplyChangePct) * 1.8;

    const totalPctChange = dxyImpact + solarImpact + yieldImpact + supplyImpact;
    const targetPriceUsd = currentPrice * (1 + totalPctChange / 100);

    // Deficit calculation
    const baseDeficit = 320.5;
    const additionalSolarDemandMoz = (solarGrowthPct / 100) * 258.0;
    const mineDisruptionMoz = (-mineSupplyChangePct / 100) * 848.0;
    const projectedDeficitMoz = baseDeficit + additionalSolarDemandMoz + mineDisruptionMoz;

    // Projected GSR (Gold at 2700)
    const projectedGsr = 2720 / targetPriceUsd;

    return {
      dxyImpact,
      solarImpact,
      yieldImpact,
      supplyImpact,
      totalPctChange,
      targetPriceUsd,
      projectedDeficitMoz,
      projectedGsr,
    };
  }, [currentPrice, dxyChangePct, solarGrowthPct, realYieldChangeBps, mineSupplyChangePct]);

  // Presets
  const applyPreset = (preset: 'green_boom' | 'stagflation' | 'hawkish_fed' | 'mining_shock') => {
    switch (preset) {
      case 'green_boom':
        setDxyChangePct(-4.5);
        setSolarGrowthPct(30.0);
        setRealYieldChangeBps(-60);
        setMineSupplyChangePct(-1.0);
        break;
      case 'stagflation':
        setDxyChangePct(-6.0);
        setSolarGrowthPct(15.0);
        setRealYieldChangeBps(-90);
        setMineSupplyChangePct(-3.5);
        break;
      case 'hawkish_fed':
        setDxyChangePct(4.0);
        setSolarGrowthPct(8.0);
        setRealYieldChangeBps(45);
        setMineSupplyChangePct(1.5);
        break;
      case 'mining_shock':
        setDxyChangePct(-1.0);
        setSolarGrowthPct(22.0);
        setRealYieldChangeBps(-20);
        setMineSupplyChangePct(-7.0);
        break;
    }
  };

  const resetDefaults = () => {
    setDxyChangePct(0);
    setSolarGrowthPct(15);
    setRealYieldChangeBps(0);
    setMineSupplyChangePct(0);
  };

  return (
    <div className="space-y-6">
      
      {/* Introduction Card */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 lg:p-6 backdrop-blur">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Calculator className="w-4 h-4 text-cyan-400" />
                <span>Сценарный калькулятор чувствительности рынка серебра</span>
              </h2>
              <InfoButton topicId="scenario_engine" />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Моделирование влияния макроэкономических сдвигов, монетарной политики ФРС и физического баланса на целевую цену
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            <span className="text-slate-400 text-[11px]">Готовые сценарии:</span>
            <button
              onClick={() => applyPreset('green_boom')}
              className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-cyan-300 rounded border border-slate-800 font-medium transition-colors"
            >
              Зеленый бум + Мягкая ФРС
            </button>
            <button
              onClick={() => applyPreset('mining_shock')}
              className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-amber-300 rounded border border-slate-800 font-medium transition-colors"
            >
              Шок добычи в Мексике
            </button>
            <button
              onClick={() => applyPreset('hawkish_fed')}
              className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-rose-300 rounded border border-slate-800 font-medium transition-colors"
            >
              Сильный доллар (Ястребы)
            </button>
            <button
              onClick={resetDefaults}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
              title="Сброс к нейтральным значениям"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Simulator Grid: Controls Left, Outcome Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          
          {/* Controls Form (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Slider 1: DXY Change */}
            <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center text-xs mb-1 font-mono">
                <span className="font-sans font-medium text-slate-300 flex items-center gap-1.5">
                  <span>Изменение Индекса Доллара (DXY):</span>
                  <InfoButton topicId="dxy_correlation" />
                </span>
                <span className={`font-bold ${dxyChangePct < 0 ? 'text-emerald-400' : dxyChangePct > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
                  {dxyChangePct > 0 ? '+' : ''}{dxyChangePct.toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min="-10"
                max="10"
                step="0.5"
                value={dxyChangePct}
                onChange={(e) => setDxyChangePct(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>-10% (Ослабление USD)</span>
                <span>0%</span>
                <span>+10% (Ралли USD)</span>
              </div>
            </div>

            {/* Slider 2: Solar Growth */}
            <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center text-xs mb-1 font-mono">
                <span className="font-sans font-medium text-slate-300 flex items-center gap-1.5">
                  <span>Рост потребления фотовольтаикой (Solar PV):</span>
                  <InfoButton topicId="solar_pv_demand" />
                </span>
                <span className="font-bold text-cyan-400">+{solarGrowthPct.toFixed(0)}% YoY</span>
              </div>
              <input
                type="range"
                min="0"
                max="45"
                step="1"
                value={solarGrowthPct}
                onChange={(e) => setSolarGrowthPct(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>0% (Стагнация)</span>
                <span>+20% (Базовый сценарий)</span>
                <span>+45% (Взрывной бум TOPCon)</span>
              </div>
            </div>

            {/* Slider 3: Real Yields Change */}
            <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center text-xs mb-1 font-mono">
                <span className="font-sans font-medium text-slate-300 flex items-center gap-1.5">
                  <span>Сдвиг реальной доходности США (10Y TIPS):</span>
                  <InfoButton topicId="real_yields" />
                </span>
                <span className={`font-bold ${realYieldChangeBps < 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {realYieldChangeBps > 0 ? '+' : ''}{realYieldChangeBps} б.п.
                </span>
              </div>
              <input
                type="range"
                min="-150"
                max="100"
                step="5"
                value={realYieldChangeBps}
                onChange={(e) => setRealYieldChangeBps(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>-150 б.п. (Снижение ставок ФРС)</span>
                <span>0</span>
                <span>+100 б.п. (Ужесточение)</span>
              </div>
            </div>

            {/* Slider 4: Mine Supply Change */}
            <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center text-xs mb-1 font-mono">
                <span className="font-sans font-medium text-slate-300 flex items-center gap-1.5">
                  <span>Шок рудничного предложения:</span>
                  <InfoButton topicId="mining_by_country" />
                </span>
                <span className={`font-bold ${mineSupplyChangePct < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {mineSupplyChangePct > 0 ? '+' : ''}{mineSupplyChangePct.toFixed(1)}%
                </span>
              </div>
              <input
                type="range"
                min="-10"
                max="5"
                step="0.5"
                value={mineSupplyChangePct}
                onChange={(e) => setMineSupplyChangePct(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                <span>-10% (Забастовки/дефицит воды)</span>
                <span>0%</span>
                <span>+5% (Расширение рудников)</span>
              </div>
            </div>

          </div>

          {/* Projected Outcomes Box (5 cols) */}
          <div className="lg:col-span-5 p-5 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-xl flex flex-col justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Прогнозная целевая цена фьючерса
              </div>
              
              <div className="flex items-baseline gap-3">
                <div className="text-4xl font-extrabold font-mono text-cyan-400 tabular-nums">
                  {unitPrefix}{(projection.targetPriceUsd * multiplier).toFixed(2)}
                  <span className="text-base text-slate-400 font-normal">{unitSuffix}</span>
                </div>
                <div className={`text-base font-bold font-mono ${projection.totalPctChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {projection.totalPctChange >= 0 ? '+' : ''}{projection.totalPctChange.toFixed(1)}%
                </div>
              </div>

              {/* Attribution Breakdown */}
              <div className="mt-5 space-y-2 text-xs font-mono">
                <div className="text-slate-400 font-sans text-[11px] mb-1 font-semibold">
                  Вклад факторов в изменение цены:
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400 font-sans">Эффект курса DXY:</span>
                  <span className={projection.dxyImpact >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {projection.dxyImpact >= 0 ? '+' : ''}{projection.dxyImpact.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400 font-sans">Эффект Solar PV спроса:</span>
                  <span className="text-cyan-400">
                    +{projection.solarImpact.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400 font-sans">Эффект реальных ставок:</span>
                  <span className={projection.yieldImpact >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {projection.yieldImpact >= 0 ? '+' : ''}{projection.yieldImpact.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800/80">
                  <span className="text-slate-400 font-sans">Эффект перебоев добычи:</span>
                  <span className={projection.supplyImpact >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {projection.supplyImpact >= 0 ? '+' : ''}{projection.supplyImpact.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Resulting Market Health Metrics */}
            <div className="mt-6 pt-4 border-t border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Ожидаемый дефицит предложения:</span>
                <span className="font-bold text-rose-400 tabular-nums">
                  -{projection.projectedDeficitMoz.toFixed(1)} Moz
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Прогнозное соотношение GSR:</span>
                <span className="font-bold text-amber-400 tabular-nums">
                  {projection.projectedGsr.toFixed(1)}x
                </span>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
