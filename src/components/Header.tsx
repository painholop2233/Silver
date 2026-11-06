import React, { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, Download, SlidersHorizontal, RefreshCw, Layers, ShieldCheck, Zap, ChevronDown } from 'lucide-react';
import { PricePoint } from '../data/silverData';
import { InfoButton } from './HelpModal';
import { RealtimeQuoteResponse } from '../services/marketApi';
import { PWAInstallButton } from './PWAInstallButton';
import { TInvestFutureInstrument } from '../data/tinkoffFuturesData';
import { FuturesSelectorModal } from './FuturesSelectorModal';

export type CurrencyUnit = 'USD_OZ' | 'EUR_OZ' | 'USD_KG' | 'RUB_G';

interface HeaderProps {
  currentPrice: PricePoint;
  previousPrice: PricePoint;
  currencyUnit: CurrencyUnit;
  onCurrencyUnitChange: (unit: CurrencyUnit) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenExport: () => void;
  realtimeQuote: RealtimeQuoteResponse | null;
  isLiveConnected: boolean;
  isLoadingLive: boolean;
  onOpenOrderBook: () => void;
  onRefreshLive: () => void;
  moexCandlesCount: number;
  selectedInstrument: TInvestFutureInstrument;
  onSelectInstrument: (instrument: TInvestFutureInstrument) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPrice,
  previousPrice,
  currencyUnit,
  onCurrencyUnitChange,
  activeTab,
  onTabChange,
  onOpenExport,
  realtimeQuote,
  isLiveConnected,
  isLoadingLive,
  onOpenOrderBook,
  onRefreshLive,
  moexCandlesCount,
  selectedInstrument,
  onSelectInstrument,
}) => {
  const [isFuturesModalOpen, setIsFuturesModalOpen] = useState(false);

  // Convert price based on selected unit
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

  const unitLabel = {
    USD_OZ: '$/oz',
    EUR_OZ: '€/oz',
    USD_KG: '$/kg',
    RUB_G: '₽/g',
  }[currencyUnit];

  const priceDiff = currentPrice.close - previousPrice.close;
  const pricePercent = previousPrice.close > 0 ? (priceDiff / previousPrice.close) * 100 : 0;
  const isUp = priceDiff >= 0;

  const gsr = (currentPrice.goldClose / (currentPrice.close || 1)).toFixed(1);
  const dxyDiff = currentPrice.dxy - previousPrice.dxy;
  const isDxyUp = dxyDiff >= 0;

  const navTabs = [
    { id: 'price_volatility', label: 'Котировки и Волатильность' },
    { id: 'predictive_matrix', label: 'Прогностическая Модель' },
    { id: 'dxy_correlation', label: 'Корреляция с DXY' },
    { id: 'supply_demand', label: 'Добыча, Спрос и Запасы' },
    { id: 'seasonality', label: 'Сезонные Циклы' },
    { id: 'macro_cot', label: 'Макроэкономика и COT' },
    { id: 'simulator', label: 'Сценарный Калькулятор' },
  ];

  const displayPriceText =
    selectedInstrument.unit === 'RUB/g'
      ? `${currentPrice.close.toFixed(2)} ₽/г`
      : formatPrice(currentPrice.close);

  return (
    <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-40">
      {/* Top zone: Brand, Ticker Ribbon, Unit Selector & Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Brand Wordmark & Contract Badge */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-200 via-slate-400 to-slate-700 flex items-center justify-center font-bold text-slate-950 font-mono shadow-md text-sm border border-slate-300">
              Ag
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
                  Argentum Terminal
                </h1>

                {/* Pop-up Futures Selector Trigger Button */}
                <button
                  onClick={() => setIsFuturesModalOpen(true)}
                  title="Выбрать другой фьючерс Т-Банк Инвестиций (SVZ6, SLVRUBF, SVH7, S2Z6...)"
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-cyan-950/50 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 font-mono text-xs font-semibold shadow-sm transition-all group cursor-pointer"
                >
                  <span className="text-slate-400 font-normal">Фьючерс:</span>
                  <span className="text-white font-bold">{selectedInstrument.ticker}</span>
                  <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-1 py-0.2 rounded border border-cyan-500/20">
                    {selectedInstrument.unit}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-y-0.5 transition-transform" />
                </button>

                <InfoButton topicId="tinkoff_api" title="Справка: список и параметры фьючерсов Т-Банк Инвестиции" />

                <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Т-Банк API: LIVE
                </span>
              </div>
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span className="text-slate-300 font-medium truncate max-w-xs">{selectedInstrument.name}</span>
                <span aria-hidden="true">·</span>
                <span>{selectedInstrument.expirationLabel}</span>
              </div>
            </div>
          </div>

          {/* Quick Real-Time Metrics Strip */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            {/* Realtime Live Quote from T-Bank API */}
            <div className="flex items-baseline gap-2 bg-slate-900/90 px-2.5 py-1.5 rounded-lg border border-slate-800 shadow-sm">
              <span className="text-slate-400 font-mono">{selectedInstrument.ticker}:</span>
              <span className="text-sm font-bold font-mono text-cyan-300 tabular-nums">
                {displayPriceText}
              </span>
              <span className={`inline-flex items-center font-mono font-semibold tabular-nums ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isUp ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                {isUp ? '+' : ''}{pricePercent.toFixed(2)}%
              </span>
              <InfoButton topicId="price_chart" />
            </div>

            {/* OrderBook DOM Trigger */}
            <button
              onClick={onOpenOrderBook}
              title="Открыть биржевой стакан ордеров (DOM) Т-Банка"
              className="inline-flex items-center gap-1.5 bg-slate-900/80 hover:bg-slate-800 text-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 transition-colors"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono text-xs">Стакан DOM</span>
              {realtimeQuote?.orderBook?.spread !== null && realtimeQuote?.orderBook?.spread !== undefined && (
                <span className="text-[10px] font-mono text-slate-400 border-l border-slate-700 pl-1.5">
                  Спред: ${realtimeQuote.orderBook.spread.toFixed(2)}
                </span>
              )}
            </button>

            {/* Quick Predictive Forecast Model Trigger */}
            <button
              onClick={() => onTabChange('predictive_matrix')}
              title="Открыть Прогностическую Модель (горизонты 1H, 2H, 4H, 1D, 1M, 1Q, 6M, 1Y)"
              className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors ${
                activeTab === 'predictive_matrix'
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 font-semibold'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-mono text-xs">Прогноз 74/100</span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">BULL</span>
            </button>

            {/* Quick Refresh Button */}
            <button
              onClick={onRefreshLive}
              disabled={isLoadingLive}
              title="Запросить свежие котировки с API Т-Банка"
              className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLive ? 'animate-spin text-cyan-400' : ''}`} />
            </button>

            {/* Gold/Silver Ratio */}
            <div className="hidden sm:flex items-baseline gap-1.5 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
              <span className="text-slate-400">GSR:</span>
              <span className="font-mono font-bold text-slate-200 tabular-nums">{gsr}x</span>
              <InfoButton topicId="gold_silver_ratio" />
            </div>

            {/* DXY Index */}
            <div className="hidden md:flex items-baseline gap-1.5 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
              <span className="text-slate-400">DXY:</span>
              <span className="font-mono font-bold text-slate-200 tabular-nums">{currentPrice.dxy}</span>
              <span className={`font-mono text-[11px] tabular-nums ${isDxyUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isDxyUp ? '+' : ''}{dxyDiff.toFixed(2)}
              </span>
              <InfoButton topicId="dxy_correlation" />
            </div>

            {/* 30D Volatility */}
            <div className="hidden lg:flex items-baseline gap-1.5 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
              <span className="text-slate-400">HV 30D:</span>
              <span className="font-mono font-bold text-amber-400 tabular-nums">
                {currentPrice.volatility30d}%
              </span>
              <InfoButton topicId="hv_30d" />
            </div>

            {/* Structural Deficit */}
            <div className="hidden xl:flex items-baseline gap-1.5 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
              <span className="text-slate-400">Дефицит:</span>
              <span className="font-mono font-bold text-cyan-400 tabular-nums">-320.5 Moz</span>
              <InfoButton topicId="physical_balance" />
            </div>
          </div>

          {/* Controls: Unit Switcher & Export */}
          <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
            {/* Currency Unit Switcher */}
            <div className="flex items-center p-0.5 bg-slate-900 rounded-lg border border-slate-800 text-xs font-medium">
              {(['USD_OZ', 'EUR_OZ', 'USD_KG', 'RUB_G'] as CurrencyUnit[]).map((unit) => (
                <button
                  key={unit}
                  onClick={() => onCurrencyUnitChange(unit)}
                  className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                    currencyUnit === unit
                      ? 'bg-slate-700/80 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {unit === 'USD_OZ' ? '$/oz' : unit === 'EUR_OZ' ? '€/oz' : unit === 'USD_KG' ? '$/kg' : '₽/g'}
                </button>
              ))}
            </div>

            {/* PWA / Android Install Button */}
            <PWAInstallButton />

            {/* Export Button */}
            <button
              onClick={onOpenExport}
              title="Экспорт исторических данных и сводок"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/90 hover:bg-slate-700 hover:text-white rounded-lg border border-slate-700 transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Экспорт</span>
            </button>
          </div>

        </div>

        {/* Tab Navigation Navigation Zone */}
        <div className="mt-3 pt-2 border-t border-slate-800/60 overflow-x-auto no-scrollbar">
          <nav className="flex space-x-2">
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

      </div>

      {/* Pop-up Modal for Selecting T-Investments Futures */}
      <FuturesSelectorModal
        isOpen={isFuturesModalOpen}
        onClose={() => setIsFuturesModalOpen(false)}
        selectedInstrument={selectedInstrument}
        onSelectInstrument={onSelectInstrument}
        realtimeQuote={realtimeQuote}
      />
    </header>
  );
};
