export interface ForecastFactor {
  id: string;
  name: string;
  category: 'MACRO' | 'PHYSICAL' | 'SENTIMENT' | 'CROSS_ASSET' | 'TECHNICAL' | 'SEASONAL';
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

// 6 Fundamental & Quantitative Factor Blocks
export const baselineForecastFactors: ForecastFactor[] = [
  {
    id: 'real_yields_dxy',
    name: 'Макроэкономика и Реальные ставки США (10Y TIPS & DXY)',
    category: 'MACRO',
    weight: 25,
    currentValueText: 'Реальная ставка TIPS 10Y: +1.82%, DXY: 104.2 (цикл смягчения ФРС)',
    rawScore: 65,
    signal: 'BULLISH',
    impactDescription: 'Ожидания снижения ставки ФРС в 2025–2026 гг. и снижение реальной доходности трежерис снижают альтернативные издержки владения беспроцентным драгметаллом.',
    source: 'Federal Reserve Bank of St. Louis (FRED: DFII10, DTWEXBGS)',
    dataMetric: 'US 10Y Real Yield: 1.82% (-18 б.п. за 3 мес)',
  },
  {
    id: 'physical_deficit_vaults',
    name: 'Физический баланс, Дефицит и Запасы (COMEX/LBMA/SGE)',
    category: 'PHYSICAL',
    weight: 25,
    currentValueText: 'Хронический дефицит -215.3 Moz, Запасы Registered COMEX на 10-летнем дне (~38 Moz)',
    rawScore: 85,
    signal: 'BULLISH',
    impactDescription: 'Структурный дефицит 4-й год подряд из-за взрывного роста фотовольтаики (TOPCon/HJT) и электромобилей. Шанхайская премия SGE держится в районе +$1.80/oz к Лондону.',
    source: 'The Silver Institute, Metals Focus, CME Group Registered Vaults',
    dataMetric: 'Дефицит: -215.3 Moz/год, COMEX Registered: 38.4 Moz',
  },
  {
    id: 'cot_positioning',
    name: 'Биржевое позиционирование фондов (CFTC COT Report)',
    category: 'SENTIMENT',
    weight: 20,
    currentValueText: 'Managed Money Net Long: 34,200 контрактов (умеренно бычий сентимент без экстремального перегрева)',
    rawScore: 55,
    signal: 'BULLISH',
    impactDescription: 'Спекулятивные фонды удерживают длинные позиции, но еще далеки от исторического перегрева (>80k контрактов), что оставляет значительный потенциал для притока нового капитала.',
    source: 'U.S. Commodity Futures Trading Commission (CFTC COT Form 40)',
    dataMetric: 'Managed Money Net Long: +34,210 контрактов (+8.4% к прошлому отчёту)',
  },
  {
    id: 'cross_asset_gsr',
    name: 'Межрыночные коэффициенты (Gold/Silver Ratio & Copper)',
    category: 'CROSS_ASSET',
    weight: 15,
    currentValueText: 'GSR: 84.5x (выше исторической нормы 65x–70x)',
    rawScore: 75,
    signal: 'BULLISH',
    impactDescription: 'Коэффициент золото/серебро находится на повышенных значениях. Исторически возврат GSR к среднему происходит за счет резкого опережающего роста серебра (Beta 1.8–2.2x к золоту).',
    source: 'LBMA Gold & Silver Fixing, CME Cross-Rates',
    dataMetric: 'GSR = 84.5x (Потенциал сжатия к 70x = +20.7% к серебру)',
  },
  {
    id: 'technical_microstructure',
    name: 'Технический профиль, DOM стакан Т-Банка & Волатильность',
    category: 'TECHNICAL',
    weight: 10,
    currentValueText: 'Цена выше SMA 50 и SMA 200, Bollinger Band Squeeze, перевес Bid в стакане Т-Банка 58%',
    rawScore: 60,
    signal: 'BULLISH',
    impactDescription: 'Классическая бычья конфигурация скользящих средних ("Золотой крест"). В биржевом стакане Т-Банка преобладают лимитные ордера на покупку на откатах.',
    source: 'Т-Банк Инвестиции API + MOEX FORTS SVZ6',
    dataMetric: 'SMA 50: $30.85, SMA 200: $29.10, Bid Depth: 58%',
  },
  {
    id: 'seasonality_industrial',
    name: 'Сезонные паттерны и Промышленный спрос',
    category: 'SEASONAL',
    weight: 5,
    currentValueText: 'Благоприятное сезонное окно (Q4–Q1: исторический рост в 74% лет)',
    rawScore: 70,
    signal: 'BULLISH',
    impactDescription: 'Период с ноября по февраль традиционно сопровождается пополнением запасов китайскими заводами перед Лунным Новым годом и инвестиционными притоками начала года.',
    source: 'Bloomberg Commodity Seasonality Index (20-Year Sample)',
    dataMetric: 'Средняя доходность периода Q4–Q1: +4.8%',
  },
];

// Presets for Factor Weighting
export const forecastModelPresets: ForecastModelPreset[] = [
  {
    id: 'balanced',
    name: 'Институциональный Базовый',
    description: 'Сбалансированное распределение с равным акцентом на макросреду (25%) и физический дефицит (25%).',
    weights: {
      real_yields_dxy: 25,
      physical_deficit_vaults: 25,
      cot_positioning: 20,
      cross_asset_gsr: 15,
      technical_microstructure: 10,
      seasonality_industrial: 5,
    },
  },
  {
    id: 'macro_heavy',
    name: 'Макро и Ставки США',
    description: 'Увеличенный вес реальных процентных ставок ФРС, доллара DXY и доходностей казначейских облигаций.',
    weights: {
      real_yields_dxy: 40,
      physical_deficit_vaults: 15,
      cot_positioning: 20,
      cross_asset_gsr: 15,
      technical_microstructure: 5,
      seasonality_industrial: 5,
    },
  },
  {
    id: 'physical_squeeze',
    name: 'Физический Дефицит и Складские Запасы',
    description: 'Максимальный фокус на истощении запасов COMEX/LBMA, взрыве спроса на солнечные панели и шанхайской премии.',
    weights: {
      real_yields_dxy: 15,
      physical_deficit_vaults: 45,
      cot_positioning: 15,
      cross_asset_gsr: 15,
      technical_microstructure: 5,
      seasonality_industrial: 5,
    },
  },
  {
    id: 'trading_momentum',
    name: 'Трейдинг & Биржевой Сентимент',
    description: 'Ориентация на краткосрочную динамику, отчеты COT спекулянтов, стакан Т-Банка и технические уровни.',
    weights: {
      real_yields_dxy: 15,
      physical_deficit_vaults: 15,
      cot_positioning: 35,
      cross_asset_gsr: 10,
      technical_microstructure: 20,
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
} {
  const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
  if (totalWeight === 0) return { score: 50, label: 'Нейтрально', regime: 'NEUTRAL', color: 'text-slate-300', summary: 'Недостаточно данных' };

  // Weighted raw score (-100 to +100) converted to (0 to 100)
  const weightedRaw = factors.reduce((sum, f) => sum + (f.rawScore * f.weight), 0) / totalWeight;
  const score = Math.round(50 + (weightedRaw / 2));
  const clampedScore = Math.max(0, Math.min(100, score));

  if (clampedScore >= 75) {
    return {
      score: clampedScore,
      label: 'Сильный бычий импульс (Strong Bullish)',
      regime: 'STRONG_BULL',
      color: 'text-emerald-400',
      summary: 'Сочетание структурного дефицита серебра, цикла снижения ставок ФРС и высокого GSR создает редкую конфигурацию для долгосрочного восходящего тренда.',
    };
  } else if (clampedScore >= 58) {
    return {
      score: clampedScore,
      label: 'Умеренно бычий тренд (Moderate Bullish)',
      regime: 'MODERATE_BULL',
      color: 'text-cyan-400',
      summary: 'Фундаментальные факторы на стороне покупателей. Рекомендуется накопление длинных позиций на локальных откатах к поддержкам.',
    };
  } else if (clampedScore >= 45) {
    return {
      score: clampedScore,
      label: 'Нейтральный баланс (Consolidation Range)',
      regime: 'NEUTRAL',
      color: 'text-amber-400',
      summary: 'Рынок находится в равновесии между давлением крепкого доллара и поддержкой промышленного спроса. Преобладает боковой диапазон.',
    };
  } else if (clampedScore >= 30) {
    return {
      score: clampedScore,
      label: 'Умеренно медвежья фаза (Moderate Bearish)',
      regime: 'MODERATE_BEAR',
      color: 'text-orange-400',
      summary: 'Давление высоких доходностей облигаций или отток из ETF сдерживают рост. Риск коррекции к нижним границам диапазона.',
    };
  } else {
    return {
      score: clampedScore,
      label: 'Экстремально медвежий тренд (High Risk / Bearish)',
      regime: 'EXTREME_BEAR',
      color: 'text-rose-400',
      summary: 'Резкое ужесточение монетарных условий, укрепление DXY и закрытие позиций фондами указывают на повышенную вероятность снижения цен.',
    };
  }
}

// Generate Forecasts for all required Horizons based on current live price, volatility, and score
export function generateHorizonForecasts(
  currentLivePriceUsd: number,
  volatility30d: number,
  compositeScore: number
): {
  shortTerm: HorizonForecast[];
  mediumLongTerm: HorizonForecast[];
} {
  const price = currentLivePriceUsd > 0 ? currentLivePriceUsd : 32.40;
  const volAnnualized = Math.max(0.18, (volatility30d || 26.5) / 100);
  
  // Normalized score shift: score 50 = neutral (0%), score 100 = strong bull, score 0 = strong bear
  const sentimentBias = (compositeScore - 50) / 50; // -1.0 to +1.0

  // 1. SHORT-TERM HORIZONS: 1H, 2H, 4H, 1D
  // Using intraday time fractions of trading year (252 days * 8 hours = 2016 trading hours)
  const shortTermConfigs = [
    {
      id: '1h',
      title: '1 Час (1H)',
      timeframe: '1 час',
      durationLabel: 'Интрадей микро-импульс',
      hours: 1,
      expectedDriftPct: 0.12 * sentimentBias,
      volHours: 1 / 2016,
      catalysts: [
        'Поток рыночных заявок в стакане Т-Банка (DOM imbalance)',
        'Динамика открытого интереса текущего часа',
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
      catalysts: [
        'Переход между утренней и основной сессией MOEX / открытие Европы',
        'Тестирование локального VWAP и уровней Pivot',
        'Реакция на выход краткосрочной макростатистики',
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
      catalysts: [
        'Пересечение торговых часов COMEX (Нью-Йорк) и MOEX',
        'Внутридневная фиксация прибыли крупными маркетмейкерами',
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
      catalysts: [
        'Расчетная цена клиринга вечерней сессии (Settlement Price)',
        'Публикация данных по инфляции или заявлениям ФРС США',
        'Суточный баланс притока/оттока по ETF SLV и PSLV',
      ],
    },
  ];

  const shortTerm: HorizonForecast[] = shortTermConfigs.map((cfg) => {
    // 1-sigma standard deviation for this timeframe
    const sigma = price * volAnnualized * Math.sqrt(cfg.volHours);
    const drift = price * (cfg.expectedDriftPct / 100);
    const base = Number((price + drift).toFixed(2));
    const bull = Number((base + sigma * 1.25).toFixed(2));
    const bear = Number((base - sigma * 1.25).toFixed(2));
    const support = Number((price - sigma * 0.95).toFixed(2));
    const resistance = Number((price + sigma * 0.95).toFixed(2));

    const expectedPct = Number((((base - price) / price) * 100).toFixed(2));
    const bullProb = Math.round(Math.min(88, Math.max(12, 50 + (sentimentBias * 22) + (cfg.expectedDriftPct * 8))));
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
      durationLabel: 'Ближайший месячный контракт',
      yearFraction: 1 / 12,
      expectedDriftPct: 2.8 * sentimentBias,
      catalysts: [
        'Ежемесячная экспирация опционов и фьючерсов на COMEX',
        'Очередное заседание FOMC ФРС по ставке и релиз CPI США',
        'Ежемесячный отчет по запасам серебра LBMA и Comex',
      ],
    },
    {
      id: '1q',
      title: 'Квартал (3M / 1Q)',
      timeframe: '90 дней',
      durationLabel: 'Квартальный инвестиционный цикл',
      yearFraction: 0.25,
      expectedDriftPct: 6.5 * sentimentBias,
      catalysts: [
        'Квартальные отчеты крупнейших добывающих компаний (Fresnillo, Pan American Silver)',
        'Данные по установке солнечных мощностей в Китае за квартал',
        'Ребалансировка товарных индексов Bloomberg Commodity (BCOM)',
      ],
    },
    {
      id: '6m',
      title: 'Полгода (6M)',
      timeframe: '180 дней',
      durationLabel: 'Среднесрочный структурный тренд',
      yearFraction: 0.50,
      expectedDriftPct: 12.0 * sentimentBias,
      catalysts: [
        'Накопительный эффект дефицита физического металла на складах',
        'Траектория снижения ставок ФРС и доходности US 10Y TIPS',
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
      catalysts: [
        'Годовой отчет World Silver Survey (фиксация 5-го года структурного дефицита)',
        'Массовый переход мировой солнечной индустрии на ячейки TOPCon/HJT',
        'Притоки пенсионных и суверенных фондов в драгоценные металлы как хедж девальвации',
      ],
    },
  ];

  const mediumLongTerm: HorizonForecast[] = mediumLongConfigs.map((cfg) => {
    const sigma = price * volAnnualized * Math.sqrt(cfg.yearFraction);
    const drift = price * (cfg.expectedDriftPct / 100);
    const base = Number((price + drift).toFixed(2));
    const bull = Number((base + sigma * 1.35).toFixed(2));
    const bear = Number((Math.max(18, base - sigma * 1.35)).toFixed(2));
    const support = Number((price - sigma * 0.90).toFixed(2));
    const resistance = Number((price + sigma * 0.90).toFixed(2));

    const expectedPct = Number((((base - price) / price) * 100).toFixed(1));
    const bullProb = Math.round(Math.min(92, Math.max(15, 50 + (sentimentBias * 28) + (cfg.expectedDriftPct * 0.6))));
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
      confidencePct: Math.round(85 - cfg.yearFraction * 15), // longer horizon has wider cone
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
