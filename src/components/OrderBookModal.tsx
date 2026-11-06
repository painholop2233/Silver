import React from 'react';
import { X, Layers, Activity, ShieldCheck, ArrowRightLeft, Clock, Zap } from 'lucide-react';
import { RealtimeQuoteResponse } from '../services/marketApi';
import { InfoButton } from './HelpModal';

interface OrderBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteData: RealtimeQuoteResponse | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export const OrderBookModal: React.FC<OrderBookModalProps> = ({
  isOpen,
  onClose,
  quoteData,
  isLoading,
  onRefresh,
}) => {
  if (!isOpen) return null;

  const orderBook = quoteData?.orderBook;
  const bids = orderBook?.bids || [];
  const asks = orderBook?.asks || [];

  const maxBidQty = Math.max(1, ...bids.map((b) => b.quantity));
  const maxAskQty = Math.max(1, ...asks.map((a) => a.quantity));
  const maxQty = Math.max(maxBidQty, maxAskQty);

  const bestBid = orderBook?.bestBid ?? 0;
  const bestAsk = orderBook?.bestAsk ?? 0;
  const spread = orderBook?.spread ?? (bestBid && bestAsk ? Number((bestAsk - bestBid).toFixed(4)) : 0);

  const quotes = quoteData?.quotes || {};

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="orderbook-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="orderbook-modal-title" className="text-base font-bold text-white tracking-tight">
                  Биржевой стакан (DOM) и поток котировок Т-Банка
                </h3>
                <span className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  LIVE REST API
                </span>
                <InfoButton topicId="tinkoff_api" title="Справка по API Т-Инвестиций и стакану" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Инструмент: {orderBook?.instrument || 'SVZ6 (MOEX Silver)'} · Провайдер: Т-Банк Инвестиции
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Обновить данные стакана"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Zap className={`w-4 h-4 text-cyan-400 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400">Лучший Bid (Покупка)</span>
              <div className="text-base font-bold font-mono text-emerald-400 mt-1">
                ${bestBid.toFixed(2)}
              </div>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400">Лучший Ask (Продажа)</span>
              <div className="text-base font-bold font-mono text-rose-400 mt-1">
                ${bestAsk.toFixed(2)}
              </div>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400">Текущий спред</span>
              <div className="text-base font-bold font-mono text-cyan-300 mt-1">
                ${spread.toFixed(4)}
              </div>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-400">Последняя сделка</span>
              <div className="text-base font-bold font-mono text-white mt-1">
                ${(quoteData?.activeContract?.price || bestBid).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Depth of Market (DOM) Table */}
          <div className="bg-slate-950 rounded-xl border border-slate-800 p-4">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800/80 text-xs font-semibold text-slate-400">
              <div className="flex items-center gap-2">
                <span>Глубина рынка (10 уровней Asks / Bids)</span>
                <span className="text-[10px] font-normal text-slate-500 font-mono">
                  Обновлено: {quoteData?.timestamp ? new Date(quoteData.timestamp).toLocaleTimeString('ru-RU') : '—'}
                </span>
              </div>
              <div className="flex items-center gap-4 font-mono text-[11px]">
                <span className="text-rose-400">▲ Asks (Продавцы)</span>
                <span className="text-emerald-400">▼ Bids (Покупатели)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ASKS (Sells) */}
              <div>
                <div className="text-[11px] font-mono text-slate-500 mb-1 flex justify-between px-1">
                  <span>Цена Ask ($/oz)</span>
                  <span>Лотов</span>
                </div>
                <div className="space-y-1 font-mono text-xs">
                  {asks.length > 0 ? (
                    asks.map((a, idx) => {
                      const fillPercent = Math.min(100, Math.round((a.quantity / maxQty) * 100));
                      return (
                        <div
                          key={`ask-${idx}`}
                          className="relative flex items-center justify-between px-2.5 py-1 rounded bg-slate-900/60 overflow-hidden border border-slate-800/40"
                        >
                          <div
                            className="absolute right-0 top-0 bottom-0 bg-rose-500/20 rounded pointer-events-none transition-all duration-300"
                            style={{ width: `${fillPercent}%` }}
                          />
                          <span className="relative z-10 text-rose-400 font-semibold">
                            ${a.price.toFixed(2)}
                          </span>
                          <span className="relative z-10 text-slate-300">
                            {a.quantity}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-xs text-slate-500 py-4 text-center">Заявки Asks загружаются...</div>
                  )}
                </div>
              </div>

              {/* BIDS (Buys) */}
              <div>
                <div className="text-[11px] font-mono text-slate-500 mb-1 flex justify-between px-1">
                  <span>Цена Bid ($/oz)</span>
                  <span>Лотов</span>
                </div>
                <div className="space-y-1 font-mono text-xs">
                  {bids.length > 0 ? (
                    bids.map((b, idx) => {
                      const fillPercent = Math.min(100, Math.round((b.quantity / maxQty) * 100));
                      return (
                        <div
                          key={`bid-${idx}`}
                          className="relative flex items-center justify-between px-2.5 py-1 rounded bg-slate-900/60 overflow-hidden border border-slate-800/40"
                        >
                          <div
                            className="absolute right-0 top-0 bottom-0 bg-emerald-500/20 rounded pointer-events-none transition-all duration-300"
                            style={{ width: `${fillPercent}%` }}
                          />
                          <span className="relative z-10 text-emerald-400 font-semibold">
                            ${b.price.toFixed(2)}
                          </span>
                          <span className="relative z-10 text-slate-300">
                            {b.quantity}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-xs text-slate-500 py-4 text-center">Заявки Bids загружаются...</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Multi-instrument Quotes Strip */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Все инструменты серебра в потоке Т-Банка
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {Object.keys(quotes).map((ticker) => {
                const item = quotes[ticker];
                return (
                  <div key={ticker} className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="flex items-center justify-between text-slate-400 mb-1 font-mono text-[11px]">
                      <span className="font-bold text-white">{item.ticker}</span>
                      <span className="text-slate-500">{item.unit}</span>
                    </div>
                    <div className="text-base font-bold font-mono text-cyan-300">
                      {item.unit.includes('RUB') ? '₽' : '$'}{item.price.toFixed(2)}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 truncate">
                      {item.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Connection Verification Note */}
          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800 flex items-start gap-3 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold text-slate-200">
                Защищенное прямое соединение с T-Bank Open API
              </span>
              <p className="text-[11px] text-slate-400">
                Котировки и стакан ордеров поступают с реального шлюза{' '}
                <code className="text-slate-300 font-mono">invest-public-api.tbank.ru</code> по протоколу HTTPS.
                Авторизация выполнена с переданным токеном доступа.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/70 flex justify-between items-center text-xs text-slate-500">
          <span>Срочный рынок Московской биржи (FORTS)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors font-medium"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
