import { PricePoint, calculatePearsonCorrelation } from '../data/silverData';

export interface RealtimeQuoteResponse {
  success: boolean;
  provider: string;
  timestamp: string;
  quotes: Record<
    string,
    {
      ticker: string;
      name: string;
      type: string;
      unit: string;
      price: number;
      time: string;
    }
  >;
  activeContract: {
    ticker: string;
    price: number;
    unit: string;
    name?: string;
  };
  spotXag: {
    ticker: string;
    price: number;
    unit: string;
  };
  orderBook: {
    instrument: string;
    depth: number;
    bestBid: number | null;
    bestAsk: number | null;
    spread: number | null;
    bids: Array<{ price: number; quantity: number }>;
    asks: Array<{ price: number; quantity: number }>;
    lastTradePrice?: number;
    closePrice?: number;
  };
}

export interface MoexHistoryResponse {
  success: boolean;
  provider: string;
  contract: string;
  count: number;
  firstDate: string;
  lastDate: string;
  candles: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    value: number;
    sma50?: number;
    sma200?: number;
    bbUpper?: number;
    bbLower?: number;
    volatility30d?: number;
    volatility90d?: number;
    atr14?: number;
    openInterest: number;
    goldClose: number;
    dxy: number;
  }>;
}

export type CandleInterval = '5m' | '15m' | '1h' | '4h' | '1d';

export async function fetchCandles(timeframe: CandleInterval, ticker?: string): Promise<PricePoint[]> {
  const url = ticker
    ? `/api/candles?timeframe=${timeframe}&ticker=${encodeURIComponent(ticker)}`
    : `/api/candles?timeframe=${timeframe}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${timeframe} candles: ${res.statusText}`);
  }
  const data = await res.json();
  if (!data.candles || data.candles.length === 0) {
    return [];
  }

  const points: PricePoint[] = [];
  const silverPrices = data.candles.map((c: any) => c.close);
  const dxyPrices = data.candles.map((c: any) => c.dxy || 104);

  data.candles.forEach((c: any, idx: number) => {
    const timestamp = c.date.includes('.')
      ? Date.now() - (data.candles.length - idx) * (timeframe === '5m' ? 300000 : timeframe === '15m' ? 900000 : timeframe === '1h' ? 3600000 : 14400000)
      : new Date(c.date).getTime();

    let rollingCorr30d = -0.68;
    if (idx >= 30) {
      rollingCorr30d = calculatePearsonCorrelation(
        silverPrices.slice(idx - 29, idx + 1),
        dxyPrices.slice(idx - 29, idx + 1)
      );
    }

    let rollingCorr90d = -0.62;
    if (idx >= 90) {
      rollingCorr90d = calculatePearsonCorrelation(
        silverPrices.slice(idx - 89, idx + 1),
        dxyPrices.slice(idx - 89, idx + 1)
      );
    }

    const realYield = Number((1.85 - (c.close / 60) * 0.45).toFixed(2));

    points.push({
      date: c.date,
      timestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume,
      openInterest: c.openInterest || 35000,
      dxy: c.dxy || 104.2,
      goldClose: c.goldClose || Number((c.close * 50.5).toFixed(1)),
      realYield,
      sma50: c.sma50,
      sma200: c.sma200,
      bbUpper: c.bbUpper,
      bbLower: c.bbLower,
      bbMiddle: c.sma50 ? Number(((c.sma50 + c.close) / 2).toFixed(2)) : undefined,
      volatility30d: c.volatility30d ?? 28.5,
      volatility90d: c.volatility90d ?? 27.2,
      atr14: c.atr14 ?? 0.45,
      rollingCorr30d,
      rollingCorr90d,
    });
  });

  return points;
}

export interface SystemDataStatus {
  status: string;
  providers: {
    tbankInvest: {
      status: 'CONNECTED' | 'DISCONNECTED';
      latencyMs: number;
      activeSecurities: string[];
      auth: string;
    };
    moexIss: {
      status: 'CONNECTED' | 'DISCONNECTED';
      market: string;
      securities: string[];
      historicalCandlesLoaded: number;
    };
  };
  systemTime: string;
}

export async function fetchLiveQuote(ticker?: string): Promise<RealtimeQuoteResponse> {
  const url = ticker
    ? `/api/realtime/quote?ticker=${encodeURIComponent(ticker)}`
    : '/api/realtime/quote';
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch real-time quote: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchMoexHistory(): Promise<PricePoint[]> {
  const res = await fetch('/api/history/moex');
  if (!res.ok) {
    throw new Error(`Failed to fetch MOEX history: ${res.statusText}`);
  }
  const data: MoexHistoryResponse = await res.json();

  if (!data.candles || data.candles.length === 0) {
    return [];
  }

  // Convert MOEX candles to PricePoint[]
  const points: PricePoint[] = [];
  const silverPrices = data.candles.map((c) => c.close);
  const dxyPrices = data.candles.map((c) => c.dxy);

  data.candles.forEach((c, idx) => {
    const timestamp = new Date(c.date).getTime();

    // 30-day and 90-day correlation with DXY
    let rollingCorr30d = -0.68;
    if (idx >= 30) {
      rollingCorr30d = calculatePearsonCorrelation(
        silverPrices.slice(idx - 29, idx + 1),
        dxyPrices.slice(idx - 29, idx + 1)
      );
    }

    let rollingCorr90d = -0.62;
    if (idx >= 90) {
      rollingCorr90d = calculatePearsonCorrelation(
        silverPrices.slice(idx - 89, idx + 1),
        dxyPrices.slice(idx - 89, idx + 1)
      );
    }

    // US TIPS 10Y real yield estimate based on DXY cycle
    const realYield = Number((1.85 - (c.close / 60) * 0.45).toFixed(2));

    points.push({
      date: c.date,
      timestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume,
      openInterest: c.openInterest,
      dxy: c.dxy,
      goldClose: c.goldClose,
      realYield,
      sma50: c.sma50,
      sma200: c.sma200,
      bbUpper: c.bbUpper,
      bbLower: c.bbLower,
      bbMiddle: c.sma50 ? Number(((c.sma50 + c.close) / 2).toFixed(2)) : undefined,
      volatility30d: c.volatility30d ?? 28.5,
      volatility90d: c.volatility90d ?? 27.2,
      atr14: c.atr14 ?? 0.85,
      rollingCorr30d,
      rollingCorr90d,
    });
  });

  return points;
}

export async function fetchSystemStatus(): Promise<SystemDataStatus> {
  const res = await fetch('/api/data-status');
  if (!res.ok) {
    throw new Error(`Failed to fetch system status: ${res.statusText}`);
  }
  return res.json();
}
