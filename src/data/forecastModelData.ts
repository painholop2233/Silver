import { PricePoint, calculatePearsonCorrelation } from './silverData';

export interface ForecastFactor {
  id: string;
  name: string;
  category: 'CURRENCY' | 'MACRO' | 'PHYSICAL' | 'SENTIMENT' | 'CROSS_ASSET' | 'TECHNICAL' | 'SEASONAL';
  weight: number; // percentage (0 - 100)
  currentValueText: string;
  rawScore: number; // -100 (extreme bear) to +100 (extreme bull)
  signal: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
  impactDescription: string;
  source: string;
  dataMetric: string;
}

export interface HorizonForecast {
  id: string;
  title: string;
  timeframe: string;
  durationLabel: string;
  horizonType: 'SHORT_TERM' | 'MEDIUM_LONG_TERM';
  baseExpectedPriceUsd: number;
  bullTargetUsd: number;
  bearTargetUsd: number;
  expectedChangePct: number;
  dxyContributionPct: number;
  confidencePct: number;
  bullProbabilityPct: number;
  bearProbabilityPct: number;
  supportLevelUsd: number;
  resistanceLevelUsd: number;
  bias: 'STRONG_BUY' | 'MODERATE_BUY' | 'NEUTRAL_RANGE' | 'MODERATE_SELL' | 'STRONG_SELL';
  keyCatalysts: string[];
  volatilityConeUsd: number;
}

export interface ForecastModelPreset {
  id: string;
  name: string;
  description: string;
  weights: Record<string, number>;
}

export interface RealDxySessionObservation {
  date: string;
  silverClose: number;
  dxyClose: number;
  silverPct: number;
  dxyPct: number;
}

export interface RealDxyImpactAnalysis {
  sampleSize: number;
  levelCorrelation: number;
  corr30d: number;
  returnCorrelation: number;
  beta: number;
  rSquared: number;
  dxyCurrent: number;
  dxyPrev: number;
  dxy1dPct: number;
  dxy30dPct: number;
  dxySma50: number;
  dxyVsSma50Pct: number;
  silver30dPct: number;
  silverImpliedByDxy30dPct: number;
  dxyRawScore: number;
  signal: 'BULLISH' | 'NEUTRAL' | 'BEARISH';
  regimeLabel: string;
  recentSessions: RealDxySessionObservation[];
}

export interface LiveDxyInput {
  price: number;
  prevClose?: number;
  changePct?: number;
  change30dPct?: number;
  sma50?: number;
  sma200?: number;
  high52w?: number;
  low52w?: number;
}

// Compute real empirical correlation, OLS beta, R², and live signal between Silver and DXY
export function analyzeRealDxyImpact(
  prices: PricePoint[],
  liveDxy?: LiveDxyInput
): RealDxyImpactAnalysis {
  const valid = prices.filter((p) => p.close > 0 && p.dxy > 0);
  const tail = valid.slice(-180);

  if (tail.length < 10) {
    const dxyCurr = liveDxy?.price || 103.88;
    const dxyPrev = liveDxy?.prevClose || dxyCurr;
    return {
      sampleSize: tail.length,
      levelCorrelation: -0.78,
      corr30d: -0.72,
      returnCorrelation: -0.48,
      beta: -2.15,
      rSquared: 0.23,
      dxyCurrent: dxyCurr,
      dxyPrev,
      dxy1dPct: dxyPrev > 0 ? Number((((dxyCurr - dxyPrev) / dxyPrev) * 100).toFixed(2)) : 0,
      dxy30dPct: liveDxy?.change30dPct ?? 0,
      dxySma50: liveDxy?.sma50 ?? dxyCurr,
      dxyVsSma50Pct: 0,
      silver30dPct: 0,
      silverImpliedByDxy30dPct: 0,
      dxyRawScore: -20,
      signal: 'NEUTRAL',
      regimeLabel: 'Умеренная обратная связь',
      recentSessions: [],
    };
  }

  const silverCloses = tail.map((p) => p.close);
  const dxyCloses = tail.map((p) => p.dxy);

  const levelCorrelation = calculatePearsonCorrelation(silverCloses, dxyCloses);

  const slice30 = tail.slice(-Math.min(30, tail.length));
  const corr30d = calculatePearsonCorrelation(
    slice30.map((p) => p.close),
    slice30.map((p) => p.dxy)
  );

  // Daily returns regression: ΔSilver% = beta * ΔDXY% + alpha
  const pairs: { dx: number; dy: number }[] = [];
  const recentSessions: RealDxySessionObservation[] = [];

  for (let i = 1; i < tail.length; i++) {
    const prev = tail[i - 1];
    const curr = tail[i];
    if (prev.dxy <= 0 || prev.close <= 0) continue;
    const dx = ((curr.dxy - prev.dxy) / prev.dxy) * 100;
    const dy = ((curr.close - prev.close) / prev.close) * 100;
    // Skip duplicate identical DXY prints (weekend MOEX trading) in OLS regression so slope isn't distorted
    if (Math.abs(dx) > 0.0001) {
      pairs.push({ dx, dy });
    }
    if (i >= tail.length - 6) {
      recentSessions.push({
        date: curr.date,
        silverClose: Number(curr.close.toFixed(2)),
        dxyClose: Number(curr.dxy.toFixed(2)),
        silverPct: Number(dy.toFixed(2)),
        dxyPct: Number(dx.toFixed(2)),
      });
    }
  }

  let beta = -2.1;
  let returnCorrelation = -0.48;
  let rSquared = 0.23;

  if (pairs.length >= 8) {
    const n = pairs.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumX2 = 0;
    let sumY2 = 0;
    for (const p of pairs) {
      sumX += p.dx;
      sumY += p.dy;
      sumXY += p.dx * p.dy;
      sumX2 += p.dx * p.dx;
      sumY2 += p.dy * p.dy;
    }
    const denomX = n * sumX2 - sumX * sumX;
    if (denomX > 0) {
      beta = (n * sumXY - sumX * sumY) / denomX;
    }
    const denomR = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    if (denomR > 0) {
      returnCorrelation = (n * sumXY - sumX * sumY) / denomR;
      rSquared = returnCorrelation * returnCorrelation;
    }
  }

  const lastBar = tail[tail.length - 1];
  const prevBar = tail[tail.length - 2] || lastBar;
  const bar30 = tail[Math.max(0, tail.length - 22)];

  const dxyCurrent = liveDxy?.price ?? lastBar.dxy;
  const dxyPrev = liveDxy?.prevClose ?? prevBar.dxy;
  const dxy1dPct =
    liveDxy?.changePct !== undefined
      ? liveDxy.changePct
      : dxyPrev > 0
      ? Number((((dxyCurrent - dxyPrev) / dxyPrev) * 100).toFixed(2))
      : 0;

  const dxy30dPct =
    liveDxy?.change30dPct !== undefined
      ? liveDxy.change30dPct
      : bar30.dxy > 0
      ? Number((((dxyCurrent - bar30.dxy) / bar30.dxy) * 100).toFixed(2))
      : 0;

  const dxy50Slice = tail.slice(-50).map((p) => p.dxy);
  const dxySma50 =
    liveDxy?.sma50 ??
    Number((dxy50Slice.reduce((a, b) => a + b, 0) / Math.max(1, dxy50Slice.length)).toFixed(2));
  const dxyVsSma50Pct = dxySma50 > 0 ? Number((((dxyCurrent - dxySma50) / dxySma50) * 100).toFixed(2)) : 0;

  const silver30dPct =
    bar30.close > 0 ? Number((((lastBar.close - bar30.close) / bar30.close) * 100).toFixed(2)) : 0;
  const silverImpliedByDxy30dPct = Number((dxy30dPct * beta).toFixed(2));

  // Score calculation: negative beta means rising DXY pushes silver down (negative score)
  const effectiveDirection = beta <= 0 ? -1 : 1;
  const combinedDxyMomentum = dxy30dPct * 0.65 + dxyVsSma50Pct * 0.35;
  // ~ +3% DXY surge above SMA50 yields around -45 to -65 bearish score on silver
  const rawMag = combinedDxyMomentum * 14 * effectiveDirection;
  const dxyRawScore = Math.max(-95, Math.min(95, Math.round(rawMag)));

  let signal: 'BULLISH' | 'NEUTRAL' | 'BEARISH' = 'NEUTRAL';
  if (dxyRawScore >= 18) signal = 'BULLISH';
  else if (dxyRawScore <= -18) signal = 'BEARISH';

  const absR = Math.abs(levelCorrelation);
  let regimeLabel = 'Слабая связь / Декаплинг';
  if (absR >= 0.7) regimeLabel = 'Сильная обратная зависимость';
  else if (absR >= 0.45) regimeLabel = 'Умеренная обратная связь';

  return {
    sampleSize: tail.length,
    levelCorrelation: Number(levelCorrelation.toFixed(2)),
    corr30d: Number(corr30d.toFixed(2)),
    returnCorrelation: Number(returnCorrelation.toFixed(2)),
    beta: Number(beta.toFixed(2)),
    rSquared: Number(rSquared.toFixed(2)),
    dxyCurrent: Number(dxyCurrent.toFixed(2)),
    dxyPrev: Number(dxyPrev.toFixed(2)),
    dxy1dPct: Number(dxy1dPct.toFixed(2)),
    dxy30dPct: Number(dxy30dPct.toFixed(2)),
    dxySma50: Number(dxySma50.toFixed(2)),
    dxyVsSma50Pct,
    silver30dPct,
    silverImpliedByDxy30dPct,
    dxyRawScore,
    signal,
    regimeLabel,
    recentSessions: recentSessions.reverse(),
  };
}

// 7 Fundamental & Quantitative Factor Blocks (DXY separated with explicit weight)
export const baselineForecastFactors: ForecastFactor[] = [
  {
    id: 'dollar_index_dxy',
    name: 'Индекс Доллара США (DXY — Валютный фактор)',
    category: 'CURRENCY',
    weight: 20,
    currentValueText: 'DXY: 103.88 (живые данные ICE: DX-Y.NYB)',
    rawScore: -42,
    signal: 'BEARISH',
    impactDescription:
      'Прямой вес глобального курса доллара США. Укрепление DXY удорожает серебро в национальных валютах и оказывает давление на цену согласно реальной регрессионной бете.',
    source: 'ICE Futures U.S. Dollar Index (DX-Y.NYB Live) & МНК-регрессия',
    dataMetric: 'DXY Live · Pearson r & Beta пересчитываются в реальном времени',
  },
  {
    id: 'real_yields',
    name: 'Реальные ставки США (US 10Y TIPS Real Yields)',
    category: 'MACRO',
    weight: 15,
    currentValueText: 'Реальная ставка TIPS 10Y: +1.82% (ожидание смягчения ФРС)',
    rawScore: 60,
    signal: 'BULLISH',
    impactDescription:
      'Снижение реальной доходности казначейских облигаций США уменьшает альтернативные издержки владения беспроцентным драгметаллом.',
    source: 'Federal Reserve Bank of St. Louis (FRED: DFII10)',
    dataMetric: 'US 10Y Real Yield: 1.82% (-18 б.п. за 3 мес)',
  },
  {
    id: 'physical_deficit_vaults',
    name: 'Физический баланс, Дефицит и Запасы (COMEX/LBMA/SGE)',
    category: 'PHYSICAL',
    weight: 25,
    currentValueText: 'Хронический дефицит -215.3 Moz, Запасы Registered COMEX ~38.4 Moz',
    rawScore: 85,
    signal: 'BULLISH',
    impactDescription:
      'Структурный дефицит 4-й год подряд из-за спроса фотовольтаики (TOPCon/HJT) и электромобилей. Шанхайская премия SGE держится около +$1.80/oz к Лондону.',
    source: 'The Silver Institute, Metals Focus, CME Group Registered Vaults',
    dataMetric: 'Дефицит: -215.3 Moz/год, COMEX Registered: 38.4 Moz',
  },
  {
    id: 'cot_positioning',
    name: 'Биржевое позиционирование фондов (CFTC COT Report)',
    category: 'SENTIMENT',
    weight: 15,
    currentValueText: 'Managed Money Net Long: 34,200 контрактов (умеренно бычий сентимент)',
    rawScore: 55,
    signal: 'BULLISH',
    impactDescription:
      'Спекулятивные фонды удерживают длинные позиции, но еще далеки от исторического перегрева (>80k контрактов), что оставляет пространство для притока капитала.',
    source: 'U.S. Commodity Futures Trading Commission (CFTC COT Form 40)',
    dataMetric: 'Managed Money Net Long: +34,210 контрактов (+8.4% к прошлому отчёту)',
  },
  {
    id: 'cross_asset_gsr',
    name: 'Межрыночные коэффициенты (Gold/Silver Ratio & Copper)',
    category: 'CROSS_ASSET',
    weight: 10,
    currentValueText: 'GSR: 81.5x (выше исторической нормы 65x–70x)',
    rawScore: 72,
    signal: 'BULLISH',
    impactDescription:
      'Коэффициент золото/серебро остается повышенным. Исторически нормализация GSR происходит за счет опережающего роста серебра (Beta 1.8–2.2x к золоту).',
    source: 'LBMA Gold & Silver Fixing, CME Cross-Rates',
    dataMetric: 'GSR > 80x (Потенциал сжатия к 70x)',
  },
  {
    id: 'technical_microstructure',
    name: 'Технический профиль, DOM стакан Т-Банка & Волатильность',
    category: 'TECHNICAL',
    weight: 10,
    currentValueText: 'Баланс ликвидности в стакане Т-Банка, индикаторы SMA 50/200 & Bollinger',
    rawScore: 52,
    signal: 'BULLISH',
    impactDescription:
      'Технический срез по реальным свечам выбранного фьючерса Т-Банка и распределению лимитных заявок Bid/Ask в стакане.',
    source: 'Т-Банк Инвестиции API + MOEX FORTS',
    dataMetric: 'Стакан DOM + Свечные индикаторы в реальном времени',
  },
  {
    id: 'seasonality_industrial',
    name: 'Сезонные паттерны и Промышленный спрос',
    category: 'SEASONAL',
    weight: 5,
    currentValueText: 'Благоприятное сезонное окно (Q4–Q1: исторический рост в 74% лет)',
    rawScore: 70,
    signal: 'BULLISH',
    impactDescription:
      'Период с ноября по февраль традиционно сопровождается пополнением запасов китайскими заводами и ребалансировкой фондов начала года.',
    source: 'Bloomberg Commodity Seasonality Index (20-Year Sample)',
    dataMetric: 'Средняя доходность периода Q4–Q1: +4.8%',
  },
];

// Presets for Factor Weighting
export const forecastModelPresets: ForecastModelPreset[] = [
  {
    id: 'balanced',
    name: 'Институциональный Базовый',
    description: 'Сбалансированная модель: Индекс Доллара DXY (20%), Дефицит (25%), Реальные ставки (15%).',
    weights: {
      dollar_index_dxy: 20,
      real_yields: 15,
      physical_deficit_vaults: 25,
      cot_positioning: 15,
      cross_asset_gsr: 10,
      technical_microstructure: 10,
      seasonality_industrial: 5,
    },
  },
  {
    id: 'dxy_driven',
    name: 'Валютный фокус (DXY 35%)',
    description: 'Доминирующий вес Индекса Доллара США (35%) и реальных ставок ФРС (20%) для оценки давления USD.',
    weights: {
      dollar_index_dxy: 35,
      real_yields: 20,
      physical_deficit_vaults: 15,
      cot_positioning: 10,
      cross_asset_gsr: 10,
      technical_microstructure: 5,
      seasonality_industrial: 5,
    },
  },
  {
    id: 'macro_heavy',
    name: 'Макро и Ставки США',
    description: 'Равный высокий акцент на Индекс Доллара DXY (25%) и реальную доходность трежерис TIPS (25%).',
    weights: {
      dollar_index_dxy: 25,
      real_yields: 25,
      physical_deficit_vaults: 15,
      cot_positioning: 15,
      cross_asset_gsr: 10,
      technical_microstructure: 5,
      seasonality_industrial: 5,
    },
  },
  {
    id: 'physical_squeeze',
    name: 'Физический Дефицит',
    description: 'Максимальный фокус на истощении запасов COMEX/LBMA (45%) при сниженном весе доллара (10%).',
    weights: {
      dollar_index_dxy: 10,
      real_yields: 10,
      physical_deficit_vaults: 45,
      cot_positioning: 15,
      cross_asset_gsr: 10,
      technical_microstructure: 5,
      seasonality_industrial: 5,
    },
  },
  {
    id: 'trading_momentum',
    name: 'Трейдинг & Сентимент',
    description: 'Ориентация на позиционирование фондов COT (30%), стакан Т-Банка (15%) и краткосрочный DXY (15%).',
    weights: {
      dollar_index_dxy: 15,
      real_yields: 10,
      physical_deficit_vaults: 15,
      cot_positioning: 30,
      cross_asset_gsr: 10,
      technical_microstructure: 15,
      seasonality_industrial: 5,
    },
  },
];

// Calculate Composite Forecast Index (0 to 100)
export function calculateCompositeScore(factors: ForecastFactor[]): {
  score: number;
  label: string;
  regime: 'EXTREME_BEAR' | 'MODERATE_BEAR' | 'NEUTRAL' | 'MODERATE_BULL' | 'STRONG_BULL';
  color: string;
  summary: string;
  dxyScoreImpactPts: number;
} {
  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  if (totalWeight === 0) {
    return {
      score: 50,
      label: 'Нейтрально',
      regime: 'NEUTRAL',
      color: 'text-slate-300',
      summary: 'Недостаточно данных (сумма весов 0%)',
      dxyScoreImpactPts: 0,
    };
  }

  // Weighted raw score (-100 to +100) converted to (0 to 100)
  const weightedRaw = factors.reduce((sum, f) => sum + f.rawScore * f.weight, 0) / totalWeight;
  const score = Math.round(50 + weightedRaw / 2);
  const clampedScore = Math.max(0, Math.min(100, score));

  const dxyFactor = factors.find((f) => f.id === 'dollar_index_dxy');
  const dxyScoreImpactPts = dxyFactor
    ? Number(((dxyFactor.rawScore * dxyFactor.weight) / (2 * totalWeight)).toFixed(1))
    : 0;

  if (clampedScore >= 75) {
    return {
      score: clampedScore,
      label: 'Сильный бычий импульс (Strong Bullish)',
      regime: 'STRONG_BULL',
      color: 'text-emerald-400',
      summary:
        'Сочетание структурного дефицита серебра, благоприятного макрофона и высокого GSR формирует устойчивый потенциал роста.',
      dxyScoreImpactPts,
    };
  } else if (clampedScore >= 58) {
    return {
      score: clampedScore,
      label: 'Умеренно бычий тренд (Moderate Bullish)',
      regime: 'MODERATE_BULL',
      color: 'text-cyan-400',
      summary:
        'Фундаментальный баланс в пользу покупателей, несмотря на локальную волатильность доллара США (DXY).',
      dxyScoreImpactPts,
    };
  } else if (clampedScore >= 45) {
    return {
      score: clampedScore,
      label: 'Нейтральный баланс (Consolidation Range)',
      regime: 'NEUTRAL',
      color: 'text-amber-400',
      summary:
        'Сильный индекс доллара DXY уравновешивает физический дефицит металла — вероятен боковой ценовой коридор.',
      dxyScoreImpactPts,
    };
  } else if (clampedScore >= 30) {
    return {
      score: clampedScore,
      label: 'Умеренно медвежья фаза (Moderate Bearish)',
      regime: 'MODERATE_BEAR',
      color: 'text-orange-400',
      summary:
        'Укрепление доллара DXY и высокие реальные ставки оказывают существенное давление на котировки серебра.',
      dxyScoreImpactPts,
    };
  } else {
    return {
      score: clampedScore,
      label: 'Экстремально медвежий тренд (High Risk / Bearish)',
      regime: 'EXTREME_BEAR',
      color: 'text-rose-400',
      summary:
        'Резкое ралли доллара DXY, ужесточение условий ФРС и сокращение лонгов фондами указывают на высокий риск снижения.',
      dxyScoreImpactPts,
    };
  }
}

export interface DxyForecastOverlay {
  dxyWeightPct: number;
  totalWeightsPct: number;
  beta: number;
  dxyExpectedShiftPct: number; // Scenario / trend % move in DXY (e.g. +2.0% or -2.5%)
}

// Generate Forecasts for all required Horizons incorporating explicit DXY weight and real beta sensitivity
export function generateHorizonForecasts(
  currentLivePriceUsd: number,
  volatility30d: number,
  compositeScore: number,
  dxyOverlay?: DxyForecastOverlay
): {
  shortTerm: HorizonForecast[];
  mediumLongTerm: HorizonForecast[];
} {
  const price = currentLivePriceUsd > 0 ? currentLivePriceUsd : 44.73;
  const volAnnualized = Math.max(0.18, (volatility30d || 26.5) / 100);

  // Normalized score shift: score 50 = neutral (0%), score 100 = strong bull, score 0 = strong bear
  const sentimentBias = (compositeScore - 50) / 50; // -1.0 to +1.0

  // Direct DXY elasticity overlay scaled by user-chosen DXY weight in model
  const dxyWeightShare =
    dxyOverlay && dxyOverlay.totalWeightsPct > 0
      ? dxyOverlay.dxyWeightPct / dxyOverlay.totalWeightsPct
      : 0.2;
  const boundedBeta = dxyOverlay ? Math.max(-4.5, Math.min(4.5, dxyOverlay.beta)) : -2.1;
  const dxyExpectedShiftPct = dxyOverlay?.dxyExpectedShiftPct ?? 0;

  // 1. SHORT-TERM HORIZONS: 1H, 2H, 4H, 1D
  const shortTermConfigs = [
    {
      id: '1h',
      title: '1 Час (1H)',
      timeframe: '1 час',
      durationLabel: 'Интрадей микро-импульс',
      hours: 1,
      expectedDriftPct: 0.12 * sentimentBias,
      volHours: 1 / 2016,
      dxyHorizonScale: 0.04,
      catalysts: [
        'Поток рыночных заявок в стакане Т-Банка (DOM imbalance)',
        'Внутричасовые импульсы фьючерса DXY и EUR/USD',
        'Ближайшая минутная ликвидность на MOEX',
      ],
    },
    {
      id: '2h',
      title: '2 Часа (2H)',
      timeframe: '2 часа',
      durationLabel: 'Ближайшая торговая сессия',
      hours: 2,
      expectedDriftPct: 0.22 * sentimentBias,
      volHours: 2 / 2016,
      dxyHorizonScale: 0.07,
      catalysts: [
        'Реакция котировок на сдвиг Индекса Доллара DXY (DX-Y.NYB)',
        'Тестирование локального VWAP и уровней Pivot',
        'Открытие смежных валютных и сырьевых сессий',
      ],
    },
    {
      id: '4h',
      title: '4 Часа (4H)',
      timeframe: '4 часа',
      durationLabel: 'Полусессионный срез',
      hours: 4,
      expectedDriftPct: 0.40 * sentimentBias,
      volHours: 4 / 2016,
      dxyHorizonScale: 0.12,
      catalysts: [
        'Пересечение торговых часов COMEX (Нью-Йорк) и MOEX',
        'Отработка корреляции ΔSilver / ΔDXY в американскую сессию',
        'Движение кросс-курса USDRUB и спота XAG/USD',
      ],
    },
    {
      id: '1d',
      title: '1 День (1D)',
      timeframe: '1 день (сессия)',
      durationLabel: 'Итог торговой сессии',
      hours: 8,
      expectedDriftPct: 0.75 * sentimentBias,
      volHours: 1 / 252,
      dxyHorizonScale: 0.22,
      catalysts: [
        'Суточная эластичность серебра к закрытию Индекса Доллара DXY',
        'Расчетная цена клиринга вечерней сессии (Settlement Price)',
        'Суточный баланс притока/оттока по ETF SLV и PSLV',
      ],
    },
  ];

  const shortTerm: HorizonForecast[] = shortTermConfigs.map((cfg) => {
    const sigma = price * volAnnualized * Math.sqrt(cfg.volHours);
    const dxyDirectPct = dxyExpectedShiftPct * boundedBeta * dxyWeightShare * cfg.dxyHorizonScale;
    const totalDriftPct = cfg.expectedDriftPct + dxyDirectPct;
    const drift = price * (totalDriftPct / 100);
    const base = Number((price + drift).toFixed(2));
    const bull = Number((base + sigma * 1.25).toFixed(2));
    const bear = Number((Math.max(0.1, base - sigma * 1.25)).toFixed(2));
    const support = Number((price - sigma * 0.95).toFixed(2));
    const resistance = Number((price + sigma * 0.95).toFixed(2));

    const expectedPct = Number((((base - price) / price) * 100).toFixed(2));
    const dxyContributionPct = Number(dxyDirectPct.toFixed(2));
    const bullProb = Math.round(
      Math.min(88, Math.max(12, 50 + sentimentBias * 20 + totalDriftPct * 8))
    );
    const bearProb = 100 - bullProb;

    let bias: HorizonForecast['bias'] = 'NEUTRAL_RANGE';
    if (bullProb >= 65) bias = 'STRONG_BUY';
    else if (bullProb >= 55) bias = 'MODERATE_BUY';
    else if (bullProb <= 35) bias = 'STRONG_SELL';
    else if (bullProb <= 45) bias = 'MODERATE_SELL';

    return {
      id: cfg.id,
      title: cfg.title,
      timeframe: cfg.timeframe,
      durationLabel: cfg.durationLabel,
      horizonType: 'SHORT_TERM',
      baseExpectedPriceUsd: base,
      bullTargetUsd: bull,
      bearTargetUsd: bear,
      expectedChangePct: expectedPct,
      dxyContributionPct,
      confidencePct: 78,
      bullProbabilityPct: bullProb,
      bearProbabilityPct: bearProb,
      supportLevelUsd: support,
      resistanceLevelUsd: resistance,
      bias,
      keyCatalysts: cfg.catalysts,
      volatilityConeUsd: Number(sigma.toFixed(2)),
    };
  });

  // 2. MEDIUM & LONG-TERM HORIZONS: 1M, 1Q, 6M, 1Y
  const mediumLongConfigs = [
    {
      id: '1m',
      title: 'Месяц (1M)',
      timeframe: '30 дней',
      durationLabel: 'Ближайший месячный цикл',
      yearFraction: 1 / 12,
      expectedDriftPct: 2.8 * sentimentBias,
      dxyHorizonScale: 0.45,
      catalysts: [
        'Месячный импульс Индекса Доллара DXY и риторика FOMC ФРС',
        'Ежемесячная экспирация опционов и фьючерсов на COMEX',
        'Отчет по запасам серебра LBMA и COMEX Registered',
      ],
    },
    {
      id: '1q',
      title: 'Квартал (3M / 1Q)',
      timeframe: '90 дней',
      durationLabel: 'Квартальный инвестиционный цикл',
      yearFraction: 0.25,
      expectedDriftPct: 6.5 * sentimentBias,
      dxyHorizonScale: 0.72,
      catalysts: [
        'Квартальная траектория доллара США (DXY) с учетом веса в модели',
        'Данные по установке солнечных мощностей и промышленному спросу',
        'Ребалансировка товарных индексов Bloomberg Commodity (BCOM)',
      ],
    },
    {
      id: '6m',
      title: 'Полгода (6M)',
      timeframe: '180 дней',
      durationLabel: 'Среднесрочный структурный тренд',
      yearFraction: 0.5,
      expectedDriftPct: 12.0 * sentimentBias,
      dxyHorizonScale: 0.9,
      catalysts: [
        'Среднесрочный цикл DXY и реальной доходности US 10Y TIPS',
        'Накопительный эффект дефицита физического металла на складах',
        'Сжатие коэффициента Gold/Silver Ratio (GSR) к исторической норме 70x',
      ],
    },
    {
      id: '1y',
      title: 'Год (1Y / 12M)',
      timeframe: '365 дней',
      durationLabel: 'Долгосрочный фундаментальный прогноз',
      yearFraction: 1.0,
      expectedDriftPct: 22.5 * sentimentBias,
      dxyHorizonScale: 1.1,
      catalysts: [
        'Глобальный валютный цикл доллара США (DXY) и ставки ФРС',
        'Годовой отчет World Silver Survey (фиксация структурного дефицита)',
        'Массовый переход солнечной индустрии на ячейки TOPCon/HJT',
      ],
    },
  ];

  const mediumLongTerm: HorizonForecast[] = mediumLongConfigs.map((cfg) => {
    const sigma = price * volAnnualized * Math.sqrt(cfg.yearFraction);
    const dxyDirectPct = dxyExpectedShiftPct * boundedBeta * dxyWeightShare * cfg.dxyHorizonScale;
    const totalDriftPct = cfg.expectedDriftPct + dxyDirectPct;
    const drift = price * (totalDriftPct / 100);
    const base = Number((price + drift).toFixed(2));
    const bull = Number((base + sigma * 1.35).toFixed(2));
    const bear = Number(Math.max(price * 0.45, base - sigma * 1.35).toFixed(2));
    const support = Number((price - sigma * 0.9).toFixed(2));
    const resistance = Number((price + sigma * 0.9).toFixed(2));

    const expectedPct = Number((((base - price) / price) * 100).toFixed(1));
    const dxyContributionPct = Number(dxyDirectPct.toFixed(1));
    const bullProb = Math.round(
      Math.min(92, Math.max(15, 50 + sentimentBias * 24 + totalDriftPct * 0.6))
    );
    const bearProb = 100 - bullProb;

    let bias: HorizonForecast['bias'] = 'NEUTRAL_RANGE';
    if (bullProb >= 65) bias = 'STRONG_BUY';
    else if (bullProb >= 55) bias = 'MODERATE_BUY';
    else if (bullProb <= 35) bias = 'STRONG_SELL';
    else if (bullProb <= 45) bias = 'MODERATE_SELL';

    return {
      id: cfg.id,
      title: cfg.title,
      timeframe: cfg.timeframe,
      durationLabel: cfg.durationLabel,
      horizonType: 'MEDIUM_LONG_TERM',
      baseExpectedPriceUsd: base,
      bullTargetUsd: bull,
      bearTargetUsd: bear,
      expectedChangePct: expectedPct,
      dxyContributionPct,
      confidencePct: Math.round(85 - cfg.yearFraction * 15),
      bullProbabilityPct: bullProb,
      bearProbabilityPct: bearProb,
      supportLevelUsd: support,
      resistanceLevelUsd: resistance,
      bias,
      keyCatalysts: cfg.catalysts,
      volatilityConeUsd: Number(sigma.toFixed(2)),
    };
  });

  return { shortTerm, mediumLongTerm };
}
