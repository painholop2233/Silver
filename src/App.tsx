import React, { useState, useEffect, useCallback } from 'react';
import { silverPrices, PricePoint } from './data/silverData';
import { Header, CurrencyUnit } from './components/Header';
import { PriceChart } from './components/PriceChart';
import { VolatilityView } from './components/VolatilityView';
import { DxyCorrelationView } from './components/DxyCorrelationView';
import { SupplyDemandView } from './components/SupplyDemandView';
import { SeasonalityWidget } from './components/SeasonalityWidget';
import { MacroDriversView } from './components/MacroDriversView';
import { ScenarioSimulator } from './components/ScenarioSimulator';
import { PredictiveForecastMatrix } from './components/PredictiveForecastMatrix';
import { ExportModal } from './components/ExportModal';
import { OrderBookModal } from './components/OrderBookModal';
import { HelpProvider, InfoButton } from './components/HelpModal';
import {
  fetchLiveQuote,
  fetchMoexHistory,
  RealtimeQuoteResponse,
} from './services/marketApi';

export default function App() {
  const [currencyUnit, setCurrencyUnit] = useState<CurrencyUnit>('USD_OZ');
  const [activeTab, setActiveTab] = useState<string>('price_volatility');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isOrderBookOpen, setIsOrderBookOpen] = useState(false);

  // Market data states
  const [prices, setPrices] = useState<PricePoint[]>(silverPrices);
  const [realtimeQuote, setRealtimeQuote] = useState<RealtimeQuoteResponse | null>(null);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  const [moexCandlesCount, setMoexCandlesCount] = useState(0);

  // Load MOEX History on mount
  useEffect(() => {
    let isMounted = true;
    async function loadMoexData() {
      try {
        const moexPoints = await fetchMoexHistory();
        if (isMounted && moexPoints.length > 0) {
          setPrices(moexPoints);
          setMoexCandlesCount(moexPoints.length);
        }
      } catch (err) {
        console.warn('Using baseline series as MOEX history loads:', err);
      }
    }

    loadMoexData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch live quote from T-Bank API
  const refreshQuote = useCallback(async () => {
    setIsLoadingLive(true);
    try {
      const quote = await fetchLiveQuote();
      if (quote && quote.success) {
        setRealtimeQuote(quote);
        setIsLiveConnected(true);

        // Update latest candle with live price if available
        const livePrice = quote.activeContract?.price;
        if (livePrice && livePrice > 0) {
          setPrices((prev) => {
            if (!prev.length) return prev;
            const updated = [...prev];
            const last = { ...updated[updated.length - 1] };
            last.close = livePrice;
            if (livePrice > last.high) last.high = livePrice;
            if (livePrice < last.low) last.low = livePrice;
            updated[updated.length - 1] = last;
            return updated;
          });
        }
      }
    } catch (err) {
      console.warn('Real-time quote poll failed:', err);
    } finally {
      setIsLoadingLive(false);
    }
  }, []);

  // Poll live quote every 12 seconds
  useEffect(() => {
    refreshQuote();
    const interval = setInterval(refreshQuote, 12000);
    return () => clearInterval(interval);
  }, [refreshQuote]);

  const currentPrice = prices[prices.length - 1] || silverPrices[silverPrices.length - 1];
  const previousPrice = prices[prices.length - 2] || silverPrices[silverPrices.length - 2];

  return (
    <HelpProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
        {/* Institutional Top Bar Header */}
        <Header
          currentPrice={currentPrice}
          previousPrice={previousPrice}
          currencyUnit={currencyUnit}
          onCurrencyUnitChange={setCurrencyUnit}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onOpenExport={() => setIsExportOpen(true)}
          realtimeQuote={realtimeQuote}
          isLiveConnected={isLiveConnected}
          isLoadingLive={isLoadingLive}
          onOpenOrderBook={() => setIsOrderBookOpen(true)}
          onRefreshLive={refreshQuote}
          moexCandlesCount={moexCandlesCount}
        />

        {/* Main Viewport Container */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* TAB 1: Price and Volatility */}
          {activeTab === 'price_volatility' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Price and Volume Chart */}
              <PriceChart
                prices={prices}
                currencyUnit={currencyUnit}
                realtimeQuote={realtimeQuote}
                onRefreshLive={refreshQuote}
                isLoadingLive={isLoadingLive}
              />

              {/* Volatility Deep Dive Section */}
              <VolatilityView prices={prices} currencyUnit={currencyUnit} />
            </div>
          )}

          {/* TAB: Predictive Forecast Matrix (1H, 2H, 4H, 1D, 1M, 1Q, 6M, 1Y) */}
          {activeTab === 'predictive_matrix' && (
            <div className="space-y-6 animate-fadeIn">
              <PredictiveForecastMatrix
                currentPriceUsd={currentPrice.close}
                volatility30d={currentPrice.volatility30d || 26.5}
                currencyUnit={currencyUnit}
                realtimeQuote={realtimeQuote}
              />
            </div>
          )}

          {/* TAB 2: DXY Correlation */}
          {activeTab === 'dxy_correlation' && (
            <div className="space-y-6 animate-fadeIn">
              <DxyCorrelationView prices={prices} currencyUnit={currencyUnit} />
            </div>
          )}

          {/* TAB 3: Global Supply, Demand & Inventories */}
          {activeTab === 'supply_demand' && (
            <div className="space-y-6 animate-fadeIn">
              <SupplyDemandView />
            </div>
          )}

          {/* TAB 4: Seasonality Cycles & Monthly Heatmap */}
          {activeTab === 'seasonality' && (
            <div className="space-y-6 animate-fadeIn">
              <SeasonalityWidget />
            </div>
          )}

          {/* TAB 5: Macroeconomics & CFTC COT */}
          {activeTab === 'macro_cot' && (
            <div className="space-y-6 animate-fadeIn">
              <MacroDriversView />
            </div>
          )}

          {/* TAB 6: Interactive Scenario Sensitivity Simulator */}
          {activeTab === 'simulator' && (
            <div className="space-y-6 animate-fadeIn">
              <ScenarioSimulator
                currentPrice={currentPrice.close}
                currencyUnit={currencyUnit}
              />
            </div>
          )}
        </main>

        {/* Real-time OrderBook DOM Modal */}
        <OrderBookModal
          isOpen={isOrderBookOpen}
          onClose={() => setIsOrderBookOpen(false)}
          quoteData={realtimeQuote}
          isLoading={isLoadingLive}
          onRefresh={refreshQuote}
        />

        {/* Export Modal */}
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          prices={prices}
        />

        {/* Institutional Footer */}
        <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-6 text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-400">Argentum Terminal</span>
              <span aria-hidden="true">·</span>
              <span>Фьючерс на серебро MOEX (SVZ6) & COMEX (SI)</span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Т-Банк API & MOEX ISS Active
              </span>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
              <span className="text-slate-300 font-medium">Источники:</span>
              <span className="inline-flex items-center gap-1 text-cyan-300">
                Т-Банк Инвестиции (Live API)
                <InfoButton topicId="tinkoff_api" title="Справка по API Т-Банка" />
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 text-cyan-300">
                Московская Биржа (FORTS ISS)
                <InfoButton topicId="moex_history" title="Справка по MOEX ISS" />
              </span>
              <span aria-hidden="true">·</span>
              <span>The Silver Institute</span>
              <span aria-hidden="true">·</span>
              <span>U.S. CFTC (COT)</span>
            </div>
          </div>
        </footer>
      </div>
    </HelpProvider>
  );
}
