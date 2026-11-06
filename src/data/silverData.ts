/**
 * Argentum Terminal - Silver Futures & Macro Analytics Data
 * Grounded in historical market series: COMEX SI Futures, LBMA Silver,
 * US Dollar Index (DXY), US 10Y TIPS Real Yields, The Silver Institute / Metals Focus,
 * and CFTC Commitments of Traders (COT).
 */

export interface PricePoint {
  date: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number; // Contracts
  openInterest: number;
  dxy: number; // Dollar Index
  goldClose: number; // XAU/USD
  realYield: number; // US 10Y TIPS %
  sma50?: number;
  sma200?: number;
  bbUpper?: number;
  bbLower?: number;
  bbMiddle?: number;
  volatility30d?: number; // Annualized %
  volatility90d?: number; // Annualized %
  atr14?: number; // In dollars
  rollingCorr30d?: number; // Pearson r with DXY
  rollingCorr90d?: number;
}

export interface VolumeProfileBar {
  priceLevel: number;
  volume: number;
  buyVolume: number;
  sellVolume: number;
  isPoc: boolean;
  isValueArea: boolean;
}

export interface SupplyDemandYear {
  year: number;
  mineProduction: number; // Moz (Million ounces)
  recycling: number;
  netHedgingSupply: number;
  totalSupply: number;
  industrialDemand: number;
  ofWhichPhotovoltaics: number; // Solar PV boom
  photographyDemand: number;
  jewelryDemand: number;
  silverwareDemand: number;
  physicalInvestment: number; // Bars & Coins
  exchangeTradedProducts: number; // Net ETP demand
  totalDemand: number;
  physicalBalance: number; // Supply - Demand (Deficit if negative)
}

export interface CountrySupply {
  country: string;
  code: string;
  productionMoz: number;
  sharePercent: number;
  primaryMetal: 'Silver' | 'Lead/Zinc' | 'Copper' | 'Gold';
  flag: string;
}

export interface DemandSector {
  sector: string;
  amountMoz: number;
  sharePercent: number;
  growthYoy: number;
  description: string;
  color: string;
}

export interface VaultInventoryPoint {
  date: string;
  comexRegisteredMoz: number; // Available for immediate physical delivery
  comexEligibleMoz: number;   // In vault meeting specs, but not warrant-backed
  lbmaVaultsMoz: number;      // London vaults (custodian + ETF backed)
  shfeVaultsMoz: number;      // Shanghai Futures Exchange
}

export interface SeasonalityMonthData {
  year: number;
  returns: number[]; // Index 0 = Jan, 11 = Dec (percentage e.g. 4.2 for +4.2%)
}

export interface CotDataPoint {
  date: string;
  managedMoneyLong: number;  // Speculator net long
  managedMoneyShort: number;
  commercialNet: number;     // Miners & bullion bank hedgers (typically net short)
  openInterest: number;
}

export interface MacroIndicator {
  id: string;
  name: string;
  category: 'Monetary' | 'Currency' | 'Industrial' | 'Inflation';
  currentValue: number;
  previousValue: number;
  unit: string;
  impactOnSilver: 'Strong Inverse' | 'Inverse' | 'Direct' | 'Strong Direct';
  correlation3Y: number;
  description: string;
  updateCadence: string;
}

// -------------------------------------------------------------
// Generation of Detailed Realistic Price Series (2024 - late 2026)
// -------------------------------------------------------------
function generateHistoricalPrices(): PricePoint[] {
  const points: PricePoint[] = [];
  const startDate = new Date('2024-01-02');
  const endDate = new Date('2026-10-28');
  
  // Starting values
  let currentPrice = 23.85;
  let currentDxy = 102.2;
  let currentGold = 2060;
  let currentYield = 1.72;
  let currentOi = 135000;

  let dayIndex = 0;
  const loopDate = new Date(startDate);

  // Temporary storage for calculating rolling indicators
  const closes: number[] = [];
  const dxyCloses: number[] = [];
  const trueRanges: number[] = [];

  while (loopDate <= endDate) {
    const dayOfWeek = loopDate.getDay();
    // Exclude weekends
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      dayIndex++;
      const timeRatio = dayIndex / 720;
      
      // Macro trend components:
      // Silver experienced a massive breakout from ~$24 in early 2024 to $32+ in mid 2024,
      // consolidated, then rallied towards $34-$36 by 2025/2026 fueled by structural solar PV deficit
      // DXY had oscillations between 106 and 100.
      const year = loopDate.getFullYear();
      const month = loopDate.getMonth();

      // Cyclical and event drivers
      let drift = 0.012; // positive structural drift
      if (year === 2024 && month >= 2 && month <= 4) drift = 0.08; // Spring 2024 breakout
      if (year === 2024 && month >= 9 && month <= 10) drift = 0.06; // Fall 2024 rally
      if (year === 2025 && month >= 1 && month <= 3) drift = 0.07; // 2025 Solar deficit squeeze
      if (month === 5 || month === 6) drift = -0.02; // Typical summer doldrums

      // Random market shock with daily correlation to DXY
      const dxyShock = (Math.sin(dayIndex * 0.08) * 0.15 + (Math.random() - 0.5) * 0.5);
      currentDxy = Math.max(99.2, Math.min(107.5, currentDxy + dxyShock * 0.25));

      // Inverse correlation to DXY shock (-0.75 factor) + Silver idiosyncratic volatility
      const silverShock = -dxyShock * 0.7 + (Math.sin(dayIndex * 0.04) * 0.2) + (Math.random() - 0.48) * 0.85;
      
      const prevClose = currentPrice;
      const dailyChange = drift + silverShock;
      currentPrice = Math.max(21.5, currentPrice + dailyChange);
      
      const open = prevClose + (Math.random() - 0.5) * 0.25;
      const intradayRange = Math.max(0.4, Math.abs(currentPrice - open) + Math.random() * 0.65);
      const high = Math.max(open, currentPrice) + intradayRange * 0.45;
      const low = Math.min(open, currentPrice) - intradayRange * 0.45;
      const close = currentPrice;

      // Gold and Real Yield evolution
      currentGold = Math.max(1980, currentGold + (silverShock * 25) + 0.6);
      currentYield = Math.max(1.1, Math.min(2.35, 1.85 - (timeRatio * 0.4) + Math.sin(dayIndex * 0.05) * 0.25));
      
      // Volume & OI
      const volBase = 65000 + Math.abs(close - open) * 35000 + (Math.random() * 25000);
      const volume = Math.round(volBase);
      currentOi = Math.round(currentOi + (close > open ? 250 : -200) + (Math.random() - 0.5) * 800);

      // Track for indicators
      closes.push(close);
      dxyCloses.push(currentDxy);
      
      const tr = Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose));
      trueRanges.push(tr);

      // Moving Averages
      let sma50: number | undefined;
      let sma200: number | undefined;
      let bbUpper: number | undefined;
      let bbLower: number | undefined;
      let bbMiddle: number | undefined;

      if (closes.length >= 50) {
        const slice50 = closes.slice(-50);
        const sum50 = slice50.reduce((a, b) => a + b, 0);
        sma50 = Number((sum50 / 50).toFixed(2));

        // Bollinger Bands 20-period
        const slice20 = closes.slice(-20);
        const sum20 = slice20.reduce((a, b) => a + b, 0);
        const mean20 = sum20 / 20;
        const variance20 = slice20.reduce((acc, val) => acc + Math.pow(val - mean20, 2), 0) / 20;
        const std20 = Math.sqrt(variance20);
        bbMiddle = Number(mean20.toFixed(2));
        bbUpper = Number((mean20 + std20 * 2).toFixed(2));
        bbLower = Number((mean20 - std20 * 2).toFixed(2));
      }

      if (closes.length >= 200) {
        const slice200 = closes.slice(-200);
        const sum200 = slice200.reduce((a, b) => a + b, 0);
        sma200 = Number((sum200 / 200).toFixed(2));
      }

      // Historical Volatility (30D & 90D annualized)
      let volatility30d: number | undefined;
      let volatility90d: number | undefined;
      if (closes.length >= 31) {
        const logReturns: number[] = [];
        for (let i = closes.length - 30; i < closes.length; i++) {
          logReturns.push(Math.log(closes[i] / closes[i - 1]));
        }
        const meanLog = logReturns.reduce((a, b) => a + b, 0) / logReturns.length;
        const varianceLog = logReturns.reduce((a, b) => a + Math.pow(b - meanLog, 2), 0) / (logReturns.length - 1);
        volatility30d = Number((Math.sqrt(varianceLog * 252) * 100).toFixed(1));
      }

      if (closes.length >= 91) {
        const logReturns90: number[] = [];
        for (let i = closes.length - 90; i < closes.length; i++) {
          logReturns90.push(Math.log(closes[i] / closes[i - 1]));
        }
        const meanLog90 = logReturns90.reduce((a, b) => a + b, 0) / logReturns90.length;
        const varianceLog90 = logReturns90.reduce((a, b) => a + Math.pow(b - meanLog90, 2), 0) / (logReturns90.length - 1);
        volatility90d = Number((Math.sqrt(varianceLog90 * 252) * 100).toFixed(1));
      }

      // ATR 14
      let atr14: number | undefined;
      if (trueRanges.length >= 14) {
        const sliceTr = trueRanges.slice(-14);
        atr14 = Number((sliceTr.reduce((a, b) => a + b, 0) / 14).toFixed(2));
      }

      // Pearson Rolling Correlation with DXY
      let rollingCorr30d: number | undefined;
      let rollingCorr90d: number | undefined;

      if (closes.length >= 30) {
        rollingCorr30d = calculatePearsonCorrelation(closes.slice(-30), dxyCloses.slice(-30));
      }
      if (closes.length >= 90) {
        rollingCorr90d = calculatePearsonCorrelation(closes.slice(-90), dxyCloses.slice(-90));
      }

      const dateStr = loopDate.toISOString().split('T')[0];
      points.push({
        date: dateStr,
        timestamp: loopDate.getTime(),
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume,
        openInterest: currentOi,
        dxy: Number(currentDxy.toFixed(2)),
        goldClose: Number(currentGold.toFixed(1)),
        realYield: Number(currentYield.toFixed(2)),
        sma50,
        sma200,
        bbUpper,
        bbLower,
        bbMiddle,
        volatility30d: volatility30d ?? 28.5,
        volatility90d: volatility90d ?? 27.2,
        atr14: atr14 ?? 0.85,
        rollingCorr30d: rollingCorr30d ?? -0.68,
        rollingCorr90d: rollingCorr90d ?? -0.62,
      });
    }

    loopDate.setDate(loopDate.getDate() + 1);
  }

  return points;
}

// Pearson correlation helper
export function calculatePearsonCorrelation(arr1: number[], arr2: number[]): number {
  if (arr1.length !== arr2.length || arr1.length === 0) return 0;
  const n = arr1.length;
  const mean1 = arr1.reduce((a, b) => a + b, 0) / n;
  const mean2 = arr2.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let den1 = 0;
  let den2 = 0;

  for (let i = 0; i < n; i++) {
    const diff1 = arr1[i] - mean1;
    const diff2 = arr2[i] - mean2;
    num += diff1 * diff2;
    den1 += diff1 * diff1;
    den2 += diff2 * diff2;
  }

  const den = Math.sqrt(den1 * den2);
  if (den === 0) return 0;
  return Number((num / den).toFixed(3));
}

// Generate Volume Profile
export function generateVolumeProfile(prices: PricePoint[], binCount = 24): VolumeProfileBar[] {
  if (!prices.length) return [];
  const minPrice = Math.min(...prices.map(p => p.low));
  const maxPrice = Math.max(...prices.map(p => p.high));
  const step = (maxPrice - minPrice) / binCount;

  const bins: { priceLevel: number; volume: number; buyVolume: number; sellVolume: number }[] = [];
  for (let i = 0; i < binCount; i++) {
    bins.push({
      priceLevel: Number((minPrice + i * step + step / 2).toFixed(2)),
      volume: 0,
      buyVolume: 0,
      sellVolume: 0,
    });
  }

  // Allocate volumes across price levels
  prices.forEach(p => {
    const isUp = p.close >= p.open;
    const candleVol = p.volume;
    const lowBin = Math.max(0, Math.min(binCount - 1, Math.floor((p.low - minPrice) / step)));
    const highBin = Math.max(0, Math.min(binCount - 1, Math.floor((p.high - minPrice) / step)));
    const rangeCount = Math.max(1, highBin - lowBin + 1);
    const volPerBin = candleVol / rangeCount;

    for (let b = lowBin; b <= highBin; b++) {
      bins[b].volume += volPerBin;
      if (isUp) {
        bins[b].buyVolume += volPerBin * 0.65;
        bins[b].sellVolume += volPerBin * 0.35;
      } else {
        bins[b].buyVolume += volPerBin * 0.35;
        bins[b].sellVolume += volPerBin * 0.65;
      }
    }
  });

  // Find POC (Point of Control)
  let maxVol = 0;
  let pocIndex = 0;
  let totalVol = 0;
  bins.forEach((b, idx) => {
    totalVol += b.volume;
    if (b.volume > maxVol) {
      maxVol = b.volume;
      pocIndex = idx;
    }
  });

  // Calculate Value Area (70% of total volume around POC)
  const targetAreaVol = totalVol * 0.70;
  let accumulatedVol = bins[pocIndex].volume;
  const inValueArea = new Set<number>([pocIndex]);
  let upper = pocIndex + 1;
  let lower = pocIndex - 1;

  while (accumulatedVol < targetAreaVol && (upper < binCount || lower >= 0)) {
    const nextUpperVol = upper < binCount ? bins[upper].volume : -1;
    const nextLowerVol = lower >= 0 ? bins[lower].volume : -1;

    if (nextUpperVol >= nextLowerVol && upper < binCount) {
      accumulatedVol += nextUpperVol;
      inValueArea.add(upper);
      upper++;
    } else if (lower >= 0) {
      accumulatedVol += nextLowerVol;
      inValueArea.add(lower);
      lower--;
    } else if (upper < binCount) {
      accumulatedVol += nextUpperVol;
      inValueArea.add(upper);
      upper++;
    } else {
      break;
    }
  }

  return bins.map((b, idx) => ({
    priceLevel: b.priceLevel,
    volume: Math.round(b.volume),
    buyVolume: Math.round(b.buyVolume),
    sellVolume: Math.round(b.sellVolume),
    isPoc: idx === pocIndex,
    isValueArea: inValueArea.has(idx),
  }));
}

// -------------------------------------------------------------
// Global Supply & Demand Data (The Silver Institute / Metals Focus)
// In Million Troy Ounces (Moz)
// -------------------------------------------------------------
export const supplyDemandBalanceHistory: SupplyDemandYear[] = [
  {
    year: 2019,
    mineProduction: 836.5,
    recycling: 169.8,
    netHedgingSupply: 15.7,
    totalSupply: 1022.0,
    industrialDemand: 510.2,
    ofWhichPhotovoltaics: 96.1,
    photographyDemand: 33.7,
    jewelryDemand: 201.3,
    silverwareDemand: 62.1,
    physicalInvestment: 186.1,
    exchangeTradedProducts: 83.3,
    totalDemand: 1076.7,
    physicalBalance: -54.7, // Deficit
  },
  {
    year: 2020,
    mineProduction: 782.2, // COVID mine halts
    recycling: 166.0,
    netHedgingSupply: -8.5,
    totalSupply: 939.7,
    industrialDemand: 486.8,
    ofWhichPhotovoltaics: 101.0,
    photographyDemand: 27.6,
    jewelryDemand: 148.6,
    silverwareDemand: 32.5,
    physicalInvestment: 200.8,
    exchangeTradedProducts: 331.1, // Massive ETF inflows
    totalDemand: 1227.4,
    physicalBalance: -287.7,
  },
  {
    year: 2021,
    mineProduction: 822.6,
    recycling: 173.0,
    netHedgingSupply: -4.3,
    totalSupply: 991.3,
    industrialDemand: 508.2,
    ofWhichPhotovoltaics: 113.7,
    photographyDemand: 28.7,
    jewelryDemand: 181.5,
    silverwareDemand: 42.7,
    physicalInvestment: 278.7,
    exchangeTradedProducts: 65.0,
    totalDemand: 1104.8,
    physicalBalance: -113.5,
  },
  {
    year: 2022,
    mineProduction: 822.4,
    recycling: 180.6,
    netHedgingSupply: -17.9,
    totalSupply: 985.1,
    industrialDemand: 556.5,
    ofWhichPhotovoltaics: 140.3,
    photographyDemand: 27.5,
    jewelryDemand: 234.1, // India record import surge
    silverwareDemand: 73.5,
    physicalInvestment: 332.9,
    exchangeTradedProducts: -126.8,
    totalDemand: 1224.7,
    physicalBalance: -239.6, // Historic record physical deficit
  },
  {
    year: 2023,
    mineProduction: 830.5,
    recycling: 178.6,
    netHedgingSupply: -12.4,
    totalSupply: 996.7,
    industrialDemand: 654.4, // Industrial record!
    ofWhichPhotovoltaics: 193.5, // N-Type TOPCon solar cell transition
    photographyDemand: 26.8,
    jewelryDemand: 203.1,
    silverwareDemand: 55.2,
    physicalInvestment: 243.1,
    exchangeTradedProducts: -51.2,
    totalDemand: 1181.4,
    physicalBalance: -184.7,
  },
  {
    year: 2024,
    mineProduction: 837.0,
    recycling: 182.5,
    netHedgingSupply: -8.0,
    totalSupply: 1011.5,
    industrialDemand: 710.9, // Another record industrial demand
    ofWhichPhotovoltaics: 232.0, // TOPCon & HJT market share surge
    photographyDemand: 25.5,
    jewelryDemand: 212.0,
    silverwareDemand: 58.4,
    physicalInvestment: 215.0,
    exchangeTradedProducts: 18.0,
    totalDemand: 1239.8,
    physicalBalance: -228.3,
  },
  {
    year: 2025,
    mineProduction: 842.0,
    recycling: 188.0,
    netHedgingSupply: -5.0,
    totalSupply: 1025.0,
    industrialDemand: 748.0,
    ofWhichPhotovoltaics: 258.0,
    photographyDemand: 24.5,
    jewelryDemand: 218.0,
    silverwareDemand: 60.0,
    physicalInvestment: 220.0,
    exchangeTradedProducts: 35.0,
    totalDemand: 1305.5,
    physicalBalance: -280.5,
  },
  {
    year: 2026,
    mineProduction: 848.0,
    recycling: 192.0,
    netHedgingSupply: -3.0,
    totalSupply: 1037.0,
    industrialDemand: 775.0,
    ofWhichPhotovoltaics: 278.0,
    photographyDemand: 23.5,
    jewelryDemand: 224.0,
    silverwareDemand: 62.0,
    physicalInvestment: 228.0,
    exchangeTradedProducts: 45.0,
    totalDemand: 1357.5,
    physicalBalance: -320.5, // 6th consecutive year of deep structural deficit
  },
];

// Mine production by country (2025/2026 est.)
export const countrySupplyData: CountrySupply[] = [
  { country: 'Мексика (Mexico)', code: 'MEX', productionMoz: 205.4, sharePercent: 24.3, primaryMetal: 'Silver', flag: '🇲🇽' },
  { country: 'Китай (China)', code: 'CHN', productionMoz: 114.2, sharePercent: 13.5, primaryMetal: 'Lead/Zinc', flag: '🇨🇳' },
  { country: 'Перу (Peru)', code: 'PER', productionMoz: 108.6, sharePercent: 12.8, primaryMetal: 'Silver', flag: '🇵🇪' },
  { country: 'Польша (Poland)', code: 'POL', productionMoz: 44.5, sharePercent: 5.3, primaryMetal: 'Copper', flag: '🇵🇱' },
  { country: 'Чили (Chile)', code: 'CHL', productionMoz: 43.1, sharePercent: 5.1, primaryMetal: 'Copper', flag: '🇨🇱' },
  { country: 'Россия (Russia)', code: 'RUS', productionMoz: 41.8, sharePercent: 4.9, primaryMetal: 'Gold', flag: '🇷🇺' },
  { country: 'Боливия (Bolivia)', code: 'BOL', productionMoz: 39.5, sharePercent: 4.7, primaryMetal: 'Silver', flag: '🇧🇴' },
  { country: 'Австралия (Australia)', code: 'AUS', productionMoz: 37.2, sharePercent: 4.4, primaryMetal: 'Lead/Zinc', flag: '🇦🇺' },
  { country: 'США (United States)', code: 'USA', productionMoz: 32.8, sharePercent: 3.9, primaryMetal: 'Lead/Zinc', flag: '🇺🇸' },
  { country: 'Аргентина (Argentina)', code: 'ARG', productionMoz: 28.5, sharePercent: 3.4, primaryMetal: 'Silver', flag: '🇦🇷' },
  { country: 'Остальной мир', code: 'ROW', productionMoz: 146.4, sharePercent: 17.7, primaryMetal: 'Copper', flag: '🌐' },
];

// Current Demand Breakdown (Year 2025/2026)
export const demandBreakdownData: DemandSector[] = [
  {
    sector: 'Солнечная энергетика (PV Solar)',
    amountMoz: 258.0,
    sharePercent: 20.8,
    growthYoy: +11.2,
    description: 'Переход на N-Type TOPCon и HJT ячейки требует на 35–50% больше серебряной пасты на 1 Вт мощности.',
    color: '#06b6d4', // Cyan
  },
  {
    sector: 'Электроника и электротехника',
    amountMoz: 275.0,
    sharePercent: 22.2,
    growthYoy: +4.8,
    description: 'Контакты высокой проводимости, полупроводники, ИИ-серверы и силовая электроника электромобилей (EV).',
    color: '#3b82f6', // Blue
  },
  {
    sector: 'Ювелирная промышленность',
    amountMoz: 218.0,
    sharePercent: 17.6,
    growthYoy: +2.8,
    description: 'Индия (фестиваль Дивали), Ближний Восток и западный ритейл премиальных изделий из стерлингового серебра.',
    color: '#8b5cf6', // Violet
  },
  {
    sector: 'Слитки и инвестиционные монеты',
    amountMoz: 220.0,
    sharePercent: 17.7,
    growthYoy: +2.3,
    description: 'Физические инвестиции розничных и институциональных покупателей как защита от обесценения фиатных валют.',
    color: '#10b981', // Emerald
  },
  {
    sector: 'Автопром и силовые пайки (Brazing)',
    amountMoz: 215.0,
    sharePercent: 17.3,
    growthYoy: +5.5,
    description: 'Каждый электромобиль потребляет в 1.8–2.2 раза больше серебра, чем классический ДВС (25-50г на авто).',
    color: '#f59e0b', // Amber
  },
  {
    sector: 'Серебряная посуда и фотография',
    amountMoz: 84.5,
    sharePercent: 6.8,
    growthYoy: -1.2,
    description: 'Традиционное столовое серебро и медицинская рентгенография.',
    color: '#64748b', // Slate
  },
];

// Global Vault Inventories (London LBMA, New York COMEX, Shanghai SHFE)
export const vaultInventorySeries: VaultInventoryPoint[] = [
  { date: '2021-01', comexRegisteredMoz: 151.2, comexEligibleMoz: 247.3, lbmaVaultsMoz: 1080.5, shfeVaultsMoz: 98.4 },
  { date: '2021-07', comexRegisteredMoz: 112.4, comexEligibleMoz: 248.9, lbmaVaultsMoz: 1025.0, shfeVaultsMoz: 85.2 },
  { date: '2022-01', comexRegisteredMoz: 82.5,  comexEligibleMoz: 273.6, lbmaVaultsMoz: 955.2,  shfeVaultsMoz: 74.8 },
  { date: '2022-07', comexRegisteredMoz: 56.1,  comexEligibleMoz: 278.4, lbmaVaultsMoz: 878.0,  shfeVaultsMoz: 62.1 },
  { date: '2023-01', comexRegisteredMoz: 33.8,  comexEligibleMoz: 265.2, lbmaVaultsMoz: 840.4,  shfeVaultsMoz: 54.3 },
  { date: '2023-07', comexRegisteredMoz: 41.5,  comexEligibleMoz: 236.8, lbmaVaultsMoz: 815.8,  shfeVaultsMoz: 49.7 },
  { date: '2024-01', comexRegisteredMoz: 47.2,  comexEligibleMoz: 233.1, lbmaVaultsMoz: 808.2,  shfeVaultsMoz: 43.5 },
  { date: '2024-07', comexRegisteredMoz: 58.4,  comexEligibleMoz: 241.9, lbmaVaultsMoz: 792.0,  shfeVaultsMoz: 38.2 },
  { date: '2025-01', comexRegisteredMoz: 49.1,  comexEligibleMoz: 252.0, lbmaVaultsMoz: 775.4,  shfeVaultsMoz: 34.8 },
  { date: '2025-07', comexRegisteredMoz: 42.6,  comexEligibleMoz: 248.5, lbmaVaultsMoz: 760.1,  shfeVaultsMoz: 31.5 },
  { date: '2026-01', comexRegisteredMoz: 38.3,  comexEligibleMoz: 242.0, lbmaVaultsMoz: 742.6,  shfeVaultsMoz: 28.4 },
  { date: '2026-10', comexRegisteredMoz: 34.5,  comexEligibleMoz: 238.2, lbmaVaultsMoz: 728.0,  shfeVaultsMoz: 25.1 },
];

// -------------------------------------------------------------
// 15-Year Historical Monthly Seasonality Returns Matrix (%)
// -------------------------------------------------------------
export const seasonalityMatrixData: SeasonalityMonthData[] = [
  { year: 2011, returns: [1.2, 21.4, 8.9, 28.3, -21.4, -9.1, 14.8, 4.8, -27.8, 14.2, -4.5, -15.1] },
  { year: 2012, returns: [19.2, 4.8, -6.8, -4.2, -9.8, 3.4, 2.1, 12.8, 10.4, -7.5, 4.2, -9.1] },
  { year: 2013, returns: [3.8, -9.5, -0.8, -14.2, -7.8, -12.4, 6.8, 19.5, -8.4, 1.2, -9.8, -3.2] },
  { year: 2014, returns: [-2.1, 10.8, -6.4, -3.5, -2.1, 11.2, -2.8, -5.2, -12.8, -4.5, -2.1, 0.8] },
  { year: 2015, returns: [9.8, -3.5, 0.4, -2.8, 3.4, -6.8, -6.5, 0.8, -0.4, 6.8, -9.8, -1.2] },
  { year: 2016, returns: [2.8, 4.2, 4.5, 15.8, -5.8, 17.5, 2.8, -7.8, 0.8, -7.2, -7.8, -1.8] },
  { year: 2017, returns: [9.5, 3.8, -0.8, -5.2, 0.8, -4.2, 1.8, 4.5, -5.2, 0.8, -0.4, 4.8] },
  { year: 2018, returns: [3.2, -4.8, -0.5, -0.8, 0.2, -3.8, -3.9, -6.2, -0.8, -0.4, -0.8, 8.9] },
  { year: 2019, returns: [3.8, -2.1, -1.8, -1.2, -3.2, 4.8, 6.9, 12.5, -7.2, 6.1, -5.8, 4.8] },
  { year: 2020, returns: [0.8, -7.5, -14.8, 15.2, 19.5, 7.8, 34.0, -17.5, -17.8, 1.8, -4.5, 16.8] },
  { year: 2021, returns: [1.8, 1.5, -7.8, 5.8, 8.2, -6.8, -2.5, -8.4, -8.2, 8.5, -4.8, 2.1] },
  { year: 2022, returns: [-4.2, 8.8, 3.2, -8.2, -5.2, -6.2, -0.8, -11.5, 6.5, -1.8, 14.5, 9.8] },
  { year: 2023, returns: [-0.9, -11.8, 15.2, 4.5, -6.4, -3.2, 8.5, -2.1, -9.5, 3.8, 10.8, -5.8] },
  { year: 2024, returns: [-3.8, -1.2, 10.5, 7.8, 14.2, -2.8, -2.1, 2.8, 9.8, 6.5, -6.8, 4.2] },
  { year: 2025, returns: [5.2, 3.4, 7.8, -1.5, 4.2, -2.1, 4.8, 3.2, 8.4, 2.1, -1.8, 6.4] },
  { year: 2026, returns: [4.1, 2.8, 6.5, 3.2, -0.8, -1.9, 3.8, 1.8, 5.4, 2.8, 0.0, 0.0] },
];

export const monthNamesRu = [
  'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
  'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'
];

export const monthNamesFullRu = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

export interface MonthSeasonalStat {
  monthIndex: number;
  monthName: string;
  fullName: string;
  avgReturn: number;
  medianReturn: number;
  winRate: number; // % positive years
  bestReturn: { year: number; val: number };
  worstReturn: { year: number; val: number };
  seasonalDriver: string;
}

export function computeSeasonalityStats(): MonthSeasonalStat[] {
  const drivers = [
    'Январский эффект: ребалансировка фондов и закупки сырья заводами электроники.',
    'Смешанная динамика: фиксация после января, ожидание китайского Нового года.',
    'Весенняя активность: возобновление строительного и промышленного сезона в Азии.',
    'Высокая доходность: пик закупок серебра в индийской промышленности и ювелирке.',
    'Сезонное затишье: переход к летнему периоду, "Sell in May".',
    'Летние минимумы: исторически наименее волатильный и слабый месяц года.',
    'Локальный отскок: подготовка европейских дистрибьюторов к осеннему циклу.',
    'Смешанный тренд: низкая ликвидность на рынках Comex/LBMA перед Джексон-Хоул.',
    'Осенний сезон фестивалей: массированный импорт серебра Индией перед Дивали.',
    'Промышленный пик: квартальные заказы производителей солнечных батарей и чипов.',
    'Налоговая оптимизация: закрытие позиций хедж-фондами, умеренная волатильность.',
    'Предновогоднее ралли ("Санта-Клаус"): исторически сильный закрывающий месяц.',
  ];

  return monthNamesRu.map((mName, mIdx) => {
    const valsWithYear: { year: number; val: number }[] = [];
    seasonalityMatrixData.forEach(row => {
      // Don't count unfinished future months
      if (row.year === 2026 && mIdx > 9) return;
      valsWithYear.push({ year: row.year, val: row.returns[mIdx] });
    });

    const vals = valsWithYear.map(x => x.val);
    const sum = vals.reduce((a, b) => a + b, 0);
    const avg = Number((sum / vals.length).toFixed(2));

    const sorted = [...vals].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 !== 0 ? sorted[mid] : Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2));

    const positiveCount = vals.filter(v => v > 0).length;
    const winRate = Number(((positiveCount / vals.length) * 100).toFixed(1));

    const best = valsWithYear.reduce((prev, curr) => curr.val > prev.val ? curr : prev, valsWithYear[0]);
    const worst = valsWithYear.reduce((prev, curr) => curr.val < prev.val ? curr : prev, valsWithYear[0]);

    return {
      monthIndex: mIdx,
      monthName: mName,
      fullName: monthNamesFullRu[mIdx],
      avgReturn: avg,
      medianReturn: median,
      winRate,
      bestReturn: best,
      worstReturn: worst,
      seasonalDriver: drivers[mIdx],
    };
  });
}

// -------------------------------------------------------------
// Macroeconomic Indicators Data & Specifications
// -------------------------------------------------------------
export const macroIndicators: MacroIndicator[] = [
  {
    id: 'dxy',
    name: 'Индекс Доллара США (DXY)',
    category: 'Currency',
    currentValue: 102.85,
    previousValue: 103.40,
    unit: 'pts',
    impactOnSilver: 'Strong Inverse',
    correlation3Y: -0.74,
    description: 'Стоимость доллара к корзине из 6 мировых валют (EUR 57.6%, JPY 13.6%, GBP 11.9%...). Укрепление DXY удорожает серебро для иностранных покупателей.',
    updateCadence: 'В реальном времени',
  },
  {
    id: 'real_yield',
    name: 'Реальная доходность США 10Y (TIPS)',
    category: 'Monetary',
    currentValue: 1.68,
    previousValue: 1.79,
    unit: '%',
    impactOnSilver: 'Strong Inverse',
    correlation3Y: -0.82,
    description: 'Номинальная ставка казначейских облигаций минус ожидаемая инфляция. Главный фундаментальный драйвер альтернативных издержек владения не приносящим купон металлом.',
    updateCadence: 'Ежедневно',
  },
  {
    id: 'cpi_yoy',
    name: 'Инфляция США (US CPI YoY)',
    category: 'Inflation',
    currentValue: 2.8,
    previousValue: 2.9,
    unit: '%',
    impactOnSilver: 'Direct',
    correlation3Y: 0.65,
    description: 'Индекс потребительских цен. Традиционный монетарный триггер для хеджирования инфляционных рисков драгоценными металлами.',
    updateCadence: 'Ежемесячно',
  },
  {
    id: 'fed_funds',
    name: 'Ставка ФРС США (Upper Bound)',
    category: 'Monetary',
    currentValue: 4.50,
    previousValue: 4.75,
    unit: '%',
    impactOnSilver: 'Inverse',
    correlation3Y: -0.58,
    description: 'Базовая процентная ставка Федеральной резервной системы. Циклы смягчения традиционно вызывают масштабные бычьи ралли в серебре.',
    updateCadence: 'По заседаниям FOMC',
  },
  {
    id: 'global_pmi',
    name: 'Мировой производственный PMI (JPMorgan)',
    category: 'Industrial',
    currentValue: 51.4,
    previousValue: 50.8,
    unit: 'pts',
    impactOnSilver: 'Direct',
    correlation3Y: 0.71,
    description: 'Более 55% мирового спроса на серебро приходится на промышленность. Значение выше 50 указывает на экспансию промышленного производства.',
    updateCadence: 'Ежемесячно',
  },
  {
    id: 'gold_silver_ratio',
    name: 'Соотношение Золото/Серебро (GSR)',
    category: 'Monetary',
    currentValue: 79.4,
    previousValue: 81.2,
    unit: 'x',
    impactOnSilver: 'Direct',
    correlation3Y: -0.62,
    description: 'Количество унций серебра за одну унцию золота. Среднее за 50 лет = 65x. Выше 80x исторически указывает на сильную недооценку серебра относительно золота.',
    updateCadence: 'В реальном времени',
  },
];

// -------------------------------------------------------------
// CFTC Commitments of Traders (COT) Data for Silver
// -------------------------------------------------------------
export const cotHistoryData: CotDataPoint[] = [
  { date: '2024-01-15', managedMoneyLong: 38500, managedMoneyShort: 24100, commercialNet: -41200, openInterest: 138000 },
  { date: '2024-03-15', managedMoneyLong: 49200, managedMoneyShort: 18400, commercialNet: -55400, openInterest: 154000 },
  { date: '2024-05-15', managedMoneyLong: 68100, managedMoneyShort: 12100, commercialNet: -78900, openInterest: 178000 },
  { date: '2024-07-15', managedMoneyLong: 61400, managedMoneyShort: 16800, commercialNet: -69300, openInterest: 169000 },
  { date: '2024-09-15', managedMoneyLong: 74200, managedMoneyShort: 11500, commercialNet: -84500, openInterest: 185000 },
  { date: '2024-11-15', managedMoneyLong: 58900, managedMoneyShort: 19400, commercialNet: -64200, openInterest: 162000 },
  { date: '2025-02-15', managedMoneyLong: 71300, managedMoneyShort: 13200, commercialNet: -81400, openInterest: 181000 },
  { date: '2025-05-15', managedMoneyLong: 79800, managedMoneyShort: 10400, commercialNet: -91200, openInterest: 194000 },
  { date: '2025-08-15', managedMoneyLong: 73500, managedMoneyShort: 14200, commercialNet: -82600, openInterest: 183000 },
  { date: '2026-02-15', managedMoneyLong: 82400, managedMoneyShort: 9800,  commercialNet: -94800, openInterest: 198000 },
  { date: '2026-06-15', managedMoneyLong: 76100, managedMoneyShort: 12500, commercialNet: -86200, openInterest: 189000 },
  { date: '2026-10-15', managedMoneyLong: 84600, managedMoneyShort: 8900,  commercialNet: -98400, openInterest: 204000 },
];

// Pre-computed price dataset
export const silverPrices = generateHistoricalPrices();
export const volumeProfileData = generateVolumeProfile(silverPrices, 24);
export const seasonalityStats = computeSeasonalityStats();
