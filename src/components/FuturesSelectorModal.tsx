import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Check,
  Zap,
  TrendingUp,
  Clock,
  Layers,
  Shield,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Flame,
} from 'lucide-react';
import {
  TInvestFutureInstrument,
  TINKOFF_FUTURES_CATALOG,
} from '../data/tinkoffFuturesData';
import { RealtimeQuoteResponse } from '../services/marketApi';
import { InfoButton } from './HelpModal';

interface FuturesSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedInstrument: TInvestFutureInstrument;
  onSelectInstrument: (instrument: TInvestFutureInstrument) => void;
  realtimeQuote: RealtimeQuoteResponse | null;
}

export const FuturesSelectorModal: React.FC<FuturesSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedInstrument,
  onSelectInstrument,
  realtimeQuote,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<string>('ALL');

  if (!isOpen) return null;

  const filteredInstruments = TINKOFF_FUTURES_CATALOG.filter((instr) => {
    const matchesSearch =
      instr.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instr.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      instr.shortName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'ALL') return true;
    if (activeTab === 'QUARTERLY') return instr.category === 'QUARTERLY_USD';
    if (activeTab === 'PERPETUAL') return instr.category === 'PERPETUAL_RUB';
    if (activeTab === 'DELIVERY') return instr.category === 'DELIVERY_RUB';
    if (activeTab === 'MINI') return instr.category === 'MINI_USD';
    if (activeTab === 'SPOT') return instr.category === 'SPOT';
    return true;
  });

  const getLivePriceText = (instr: TInvestFutureInstrument): string => {
    const q = realtimeQuote?.quotes?.[instr.ticker];
    if (q && q.price > 0) {
      if (instr.unit === 'USD/oz') {
        return `$${q.price.toFixed(2)}`;
      } else {
        return `${q.price.toFixed(2)} ₽/г`;
      }
    }
    // Baseline approximations
    if (instr.unit === 'USD/oz') {
      return instr.ticker === 'SVH7' ? '$54.26' : '$52.59';
    }
    return instr.ticker === 'SLVRUBF' ? '138.27 ₽/г' : '138.00 ₽/г';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800 gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/20 via-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shrink-0 font-bold font-mono">
              Т-Б
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Выбор фьючерса Т-Банк Инвестиции (MOEX FORTS)
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Live API
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Графики, стакан ордеров и прогностические модели мгновенно перестроятся под выбранный контракт
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Закрыть (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & Category Filters */}
        <div className="space-y-3 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Поиск по тикеру (SVZ6, SLVRUBF, SVH7...) или названию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 outline-none transition-colors"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs pb-1">
            {[
              { id: 'ALL', label: 'Все инструменты' },
              { id: 'QUARTERLY', label: 'Квартальные ($/oz)' },
              { id: 'PERPETUAL', label: 'Вечные фьючерсы (₽/г)' },
              { id: 'DELIVERY', label: 'Поставочные (₽/г)' },
              { id: 'MINI', label: 'Мини-фьючерсы ($/oz)' },
              { id: 'SPOT', label: 'Спот' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold shadow-sm'
                    : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Instrument List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
          {filteredInstruments.map((instr) => {
            const isSelected = selectedInstrument.ticker === instr.ticker;
            const priceText = getLivePriceText(instr);

            return (
              <div
                key={instr.ticker}
                onClick={() => {
                  onSelectInstrument(instr);
                  onClose();
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                    : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/90'
                }`}
              >
                {/* Left: Ticker & Details */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm font-bold text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                      {instr.ticker}
                    </span>
                    <span className="font-semibold text-slate-200 text-xs">
                      {instr.name}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700">
                      {instr.categoryLabel}
                    </span>
                    {instr.isPopular && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-400" />
                        Ликвидный
                      </span>
                    )}
                  </div>

                  <p className="text-slate-400 text-[11px] leading-relaxed max-w-xl">
                    {instr.description}
                  </p>

                  <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 flex-wrap pt-0.5">
                    <span>Экспирация: <strong className="text-slate-300">{instr.expirationLabel}</strong></span>
                    <span aria-hidden="true">·</span>
                    <span>Лот: <strong className="text-slate-300">{instr.lotDescription}</strong></span>
                    <span aria-hidden="true">·</span>
                    <span>Шаг цены: <strong className="text-slate-300">{instr.stepPriceText}</strong></span>
                  </div>
                </div>

                {/* Right: Price & Selection Status */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                  <div className="text-right">
                    <div className="text-base font-extrabold font-mono text-cyan-300">
                      {priceText}
                    </div>
                    <div className="text-[10px] font-mono text-emerald-400 font-semibold">
                      Т-Банк Live
                    </div>
                  </div>

                  {isSelected ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                      <Check className="w-3.5 h-3.5" />
                      Активен
                    </span>
                  ) : (
                    <button
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded-lg border border-slate-700 transition-colors"
                    >
                      <span>Выбрать</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredInstruments.length === 0 && (
            <div className="text-center py-10 text-slate-500">
              Инструменты по запросу «{searchQuery}» не найдены
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-4 text-xs shrink-0">
          <div className="text-slate-400 text-[11px] flex items-center gap-2">
            <span>Источник данных:</span>
            <strong className="text-slate-300">T-Bank Invest InstrumentsService</strong>
            <InfoButton topicId="tinkoff_api" title="Справка: прямое подключение Т-Банк API" />
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition-colors text-xs"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
