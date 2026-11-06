export interface HelpTopic {
  id: string;
  title: string;
  category: string;
  source: string;
  sourceUrlName?: string;
  formulaOrMethod: string;
  interpretation: string;
  updateFrequency: string;
}

export const helpTopics: Record<string, HelpTopic> = {
  // 1. Price & Volume
  price_chart: {
    id: 'price_chart',
    title: 'Котировки фьючерса на серебро (COMEX SI / XAG)',
    category: 'Ценовой анализ',
    source: 'CME Group (Chicago Mercantile Exchange) / COMEX Division, подразделение металлов.',
    sourceUrlName: 'CME Group: Silver Futures (SI)',
    formulaOrMethod: `• Базовый контракт: 5 000 тройских унций (около 155.5 кг) чистого серебра пробы не менее .999.
• Шаг цены (тик): $0.005 за унцию ($25.00 за один контракт).
• Свечи: Open (цена первой сделки сессии), High (максимум), Low (минимум), Close (расчетная цена клиринга CME Settlement).
• Скользящие средние (SMA): SMA(n) = (P₁ + P₂ + ... + Pₙ) / n (для n=50 и n=200 торговых дней).
• Полосы Боллинджера: Средняя линия = SMA(20); Верхняя = SMA(20) + 2·σ; Нижняя = SMA(20) - 2·σ, где σ — стандартное отклонение цены закрытия за 20 сессий.`,
    interpretation: 'Анализ тренда, уровней динамической поддержки и сопротивления. Пересечение SMA 50 выше SMA 200 формирует классический бычий сигнал "Золотой крест" (Golden Cross).',
    updateFrequency: 'В реальном времени (сессии Comex: 18:00 - 17:00 следующего дня CT).',
  },

  volume_profile: {
    id: 'volume_profile',
    title: 'Горизонтальный профиль объемов (Volume Profile & POC)',
    category: 'Биржевая ликвидность',
    source: 'Тиковые данные исполненных ордеров COMEX (Time & Sales) с агрегацией по ценовым интервалам (Bins).',
    sourceUrlName: 'CME Market Depth & Liquidity Tool',
    formulaOrMethod: `• Горизонтальное распределение: диапазон High - Low разбивается на 24 дискретных ценовых уровня.
• Point of Control (POC): ценовой уровень с максимальным накопленным объемом проторгованных контрактов за выбранный период: POC = argmax(Volume_bin).
• Value Area (Зона стоимости 70%): диапазон цен вокруг POC, на который приходится ровно 70% всего проторгованного объема за период (рассчитывается по алгоритму симметричного расширения от POC).`,
    interpretation: 'POC выступает главным уровнем притяжения цены (справедливая стоимость). Выход цены за пределы Value Area High (VAH) или Value Area Low (VAL) часто приводит к сильному трендовому импульсу или возврату к среднему.',
    updateFrequency: 'По закрытию каждой биржевой сессии.',
  },

  chart_stats_strip: {
    id: 'chart_stats_strip',
    title: 'Ключевые биржевые метрики периода',
    category: 'Статистика торгов',
    source: 'CME Group Daily Bulletins & Clearing Reports.',
    sourceUrlName: 'CME Daily Bulletin for Silver',
    formulaOrMethod: `• 52-Week High / Low: абсолютные экстремумы цен исполнения за последние 252 торговые сессии.
• ATR 14: экспоненциальное или простое сглаживание True Range за 14 дней: TR = max(H - L, |H - C_prev|, |L - C_prev|).
• Открытый интерес (Open Interest): общее число действующих, не закрытых встречными сделками и не исполненных физической поставкой контрактов покупателей и продавцов на бирже.`,
    interpretation: 'Рост цены при одновременном росте Open Interest подтверждает приток свежего капитала в восходящий тренд. Рост цены при падении OI указывает лишь на закрытие коротких позиций (шорт-сквиз).',
    updateFrequency: 'Ежедневно по итогам клиринга (Clearing Cycle).',
  },

  // 2. Volatility
  hv_30d: {
    id: 'hv_30d',
    title: 'Историческая 30-дневная волатильность (30D HV)',
    category: 'Волатильность и риск',
    source: 'Временные ряды цен закрытия COMEX SI Futures (CME Settlement).',
    sourceUrlName: 'Cboe / CME Settlement Historical Prices',
    formulaOrMethod: `• Дневная логарифмическая доходность: r_i = ln(P_i / P_{i-1}).
• Дисперсия доходностей за N=30 торговых дней: s² = [1 / (N - 1)] · ∑(r_i - r̄)².
• Годовая историческая волатильность (Annualized Realized Volatility):
  HV₃₀ = s · √252 · 100%, где 252 — количество торговых сессий в году.`,
    interpretation: 'Показывает фактический разброс колебаний цены серебра в годовом выражении. Норма для серебра — 22-28%. Значения выше 35% свидетельствуют о высокой рыночной нестабильности.',
    updateFrequency: 'Рассчитывается ежедневно по итогам сессии.',
  },

  hv_90d: {
    id: 'hv_90d',
    title: 'Квартальная историческая волатильность (90D HV)',
    category: 'Волатильность и риск',
    source: 'Временные ряды CME Settlement за 90 торговых дней.',
    sourceUrlName: 'CME Clearing Data Services',
    formulaOrMethod: `• Рассчитывается аналогично 30D HV, но с окном выборки N = 90 дней:
  HV₉₀ = s₉₀ · √252 · 100%.
• Спред волатильности (Term Premium): ΔHV = HV₃₀ - HV₉₀.`,
    interpretation: 'Служит базовым уровнем среднесрочного шума. Если 30D HV существенно превышает 90D HV, рынок находится в фазе резкого расширения волатильности (Breakout / Panic).',
    updateFrequency: 'Ежедневно.',
  },

  atr_metric: {
    id: 'atr_metric',
    title: 'Индикатор истинного диапазона (Average True Range — ATR 14)',
    category: 'Волатильность и риск',
    source: 'Методика Дж. Уэллса Уайлдера (J. Welles Wilder Jr., "New Concepts in Technical Trading Systems").',
    sourceUrlName: 'Technical Analysis Indicators Standard',
    formulaOrMethod: `• True Range (Истинный диапазон) текущего дня:
  TR = max(High - Low, |High - Close_{prev}|, |Low - Close_{prev}|).
• ATR 14 = [ATR_{prev} · 13 + TR_{current}] / 14 (модифицированное экспоненциальное сглаживание Уайлдера).
• ATR в % = (ATR₁₄ / Close) · 100%.`,
    interpretation: 'Определяет средний ожидаемый ход цены в течение одной торговой сессии в абсолютных долларах ($) и процентах. Используется для выставления стоп-лоссов (например, 1.5–2.0 × ATR) и расчета размера торговой позиции.',
    updateFrequency: 'Ежедневно.',
  },

  vol_regime: {
    id: 'vol_regime',
    title: 'Детектор режимов волатильности (Volatility Regime)',
    category: 'Квантитативный анализ',
    source: 'Исторический перцентильный анализ 10-летнего распределения волатильности COMEX Silver.',
    sourceUrlName: 'Cboe VXSLV / Quantitative Volatility Models',
    formulaOrMethod: `Классификация на базе перцентилей распределения HV₃₀:
• Низкая (< 20%): нижний 15-й перцентиль (фаза компрессии волатильности перед импульсом).
• Умеренная / Норма (20% - 28%): 15-й — 60-й перцентили (стабильный трендовый рынок).
• Повышенная (28% - 38%): 60-й — 90-й перцентили (высокая амплитуда, институциональная активность).
• Экстремальная (> 38%): верхние 10% исторических наблюдений (шорт-сквиз, маржин-коллы, кризис ликвидности).`,
    interpretation: 'Помогает инвесторам и управляющим адаптировать кредитное плечо: в экстремальном режиме плечо снижается, в фазе компрессии ищутся точки входа на пробой.',
    updateFrequency: 'Ежедневно.',
  },

  vol_distribution: {
    id: 'vol_distribution',
    title: 'Гистограмма распределения волатильности',
    category: 'Статистика',
    source: 'Эмпирическое распределение логнормальных доходностей за последние 250 торговых сессий.',
    sourceUrlName: 'Empirical Density Estimation',
    formulaOrMethod: `• Подсчет частоты попадания дневного значения 30D HV в 6 бинов (<20%, 20-25%, 25-30%, 30-35%, 35-40%, >40%).
• Доля дней: P(bin) = (Количество сессий в бине / Общее число сессий) · 100%.`,
    interpretation: 'Показывает форму "хвостов" распределения риска (Fat Tails / Эксцесс) и помогает оценить вероятность аномальных скачков цены.',
    updateFrequency: 'Ежедневно.',
  },

  // 3. DXY Correlation
  dxy_correlation: {
    id: 'dxy_correlation',
    title: 'Корреляция с Индексом Доллара США (DXY)',
    category: 'Межрыночный анализ (Intermarket)',
    source: 'U.S. Dollar Index (ICE Exchange: DX) & COMEX Silver (CME).',
    sourceUrlName: 'Intercontinental Exchange (ICE) DXY Contract',
    formulaOrMethod: `• Коэффициент корреляции Пирсона (Pearson r):
  r = ∑[(Ag_i - Aḡ) · (Dxy_i - Dxȳ)] / √[ ∑(Ag_i - Aḡ)² · ∑(Dxy_i - Dxȳ)² ].
• Диапазон значений: от -1.0 (полная обратная связь) до +1.0 (синхронное движение).
• DXY рассчитывается как средневзвешенное геометрическое 6 валют:
  DXY = 50.14348112 · EUR^(-0.576) · JPY^(0.136) · GBP^(-0.119) · CAD^(0.091) · SEK^(0.042) · CHF^(0.036).`,
    interpretation: 'Серебро котируется в долларах за унцию. Рост курса доллара делает металл дороже для иностранных покупателей, снижая спрос. Историческая средняя корреляция серебра с DXY отрицательная: от -0.65 до -0.85.',
    updateFrequency: 'В реальном времени.',
  },

  dxy_beta: {
    id: 'dxy_beta',
    title: 'Коэффициент чувствительности (Бета к DXY) и R²',
    category: 'Эконометрическое моделирование',
    source: 'Линейный регрессионный анализ (МНК — метод наименьших квадратов).',
    sourceUrlName: 'Ordinary Least Squares (OLS) Regression',
    formulaOrMethod: `• Модель: ΔSilver% = β · ΔDXY% + α.
• Коэффициент наклона (Бета): β = Cov(ΔSilver, ΔDXY) / Var(ΔDXY).
• Коэффициент детерминации (R-squared): R² = r², показывает долю дисперсии доходности серебра, объясняемую колебаниями доллара.`,
    interpretation: 'Бета около -1.8x означает, что при падении доллара на 1% серебро в среднем дорожает на 1.8% (эффект рычага драгметаллов).',
    updateFrequency: 'Пересчитывается для выбранного временного окна (90, 180, 365 дней).',
  },

  dxy_scatter: {
    id: 'dxy_scatter',
    title: 'Диаграмма рассеяния: Изменение DXY vs Серебро (%)',
    category: 'Статистический анализ',
    source: 'Дневные процентные приращения фьючерса SI и индекса DXY.',
    sourceUrlName: 'Daily Returns Scatterplot',
    formulaOrMethod: `• Каждая точка (x, y) представляет один торговый день, где x = ΔDXY% = (DXY_t - DXY_{t-1}) / DXY_{t-1} · 100%, а y = ΔSilver% = (Silver_t - Silver_{t-1}) / Silver_{t-1} · 100%.
• Оранжевая линия — линия наилучшего соответствия (Best Fit Trendline).`,
    interpretation: 'Выявляет аномальные дни "декаплинга", когда точки лежат в правом верхнем квадранте (доллар растет и серебро растет — например, при геополитическом кризисе) или в левом нижнем.',
    updateFrequency: 'Ежедневно.',
  },

  rolling_correlation: {
    id: 'rolling_correlation',
    title: 'Скользящая корреляция 30D (Rolling Correlation)',
    category: 'Динамический межрыночный анализ',
    source: 'Окно последних 30 торговых сессий.',
    sourceUrlName: 'Rolling Window Correlation Algorithm',
    formulaOrMethod: `• Для каждого дня t рассчитывается корреляция Пирсона r_t по срезу данных от (t - 29) до t.
• Векторы: Silver_closes[t-29...t] и DXY_closes[t-29...t].`,
    interpretation: 'Позволяет в реальном времени видеть смену макроэкономических парадигм. В моменты приближения r к 0 или ухода в плюс серебро отвязывается от доллара и начинает двигаться за счет физического дефицита или инфляционных шоков.',
    updateFrequency: 'Ежедневно.',
  },

  // 4. Supply, Demand & Inventories
  physical_balance: {
    id: 'physical_balance',
    title: 'Мировой баланс спроса и предложения (Supply & Demand Balance)',
    category: 'Фундаментальный баланс сырья',
    source: 'The Silver Institute (Вашингтон) и независимое исследовательское агентство Metals Focus (Лондон) — ежегодный отчет "World Silver Survey".',
    sourceUrlName: 'The Silver Institute / Metals Focus World Silver Survey',
    formulaOrMethod: `• Совокупное предложение: Добыча рудников (Mine Production) + Вторичная переработка скрапа (Scrap Recycling) + Чистое дехеджирование производителей (Net Hedging Supply).
• Совокупный спрос: Промышленное использование (Industrial) + Фотовольтаика (Solar PV) + Ювелирные изделия (Jewelry) + Столовое серебро (Silverware) + Физические слитки и монеты (Physical Investment) + Чистый приток в биржевые фонды (ETP/ETF).
• Физический баланс: Balance = Total Supply - Total Demand.
• Отрицательное значение = Физический дефицит (Deficit).`,
    interpretation: 'Если баланс отрицательный (как с 2021 по 2026 гг., дефицит превышает 200–300 Moz в год), промышленность и инвесторы вынуждены забирать накопленный металл из физических хранилищ LBMA и COMEX.',
    updateFrequency: 'Официальная публикация отчета — апрель каждого года, с промежуточными квартальными обновлениями Metals Focus.',
  },

  solar_pv_demand: {
    id: 'solar_pv_demand',
    title: 'Потребление серебра в солнечной энергетике (Photovoltaics — PV)',
    category: 'Промышленный спрос',
    source: 'International Energy Agency (IEA), China Photovoltaic Industry Association (CPIA), The Silver Institute.',
    sourceUrlName: 'CPIA Solar Cell Silver Paste Report & IEA World Energy Outlook',
    formulaOrMethod: `• Спрос фотовольтаики (Moz) = Мировой ввод мощностей солнечных электростанций (GW) × Удельный расход серебра на 1 Вт мощности (мг/Вт) / 31.1035.
• Эволюция технологий:
  - Традиционные ячейки P-Type PERC: ~10 мг серебра на 1 Вт.
  - Новые ячейки N-Type TOPCon: ~13–16 мг серебра на 1 Вт (+30–50%).
  - Гетероструктурные ячейки HJT: ~20–24 мг серебра на 1 Вт (в 2 раза больше!).`,
    interpretation: 'Солнечная энергетика стала главным драйвером суперцикла в серебре, потребляя уже более 25% мировой добычи рудников. Высокая проводимость и устойчивость к окислению делают серебро незаменимым.',
    updateFrequency: 'Ежеквартально.',
  },

  mining_by_country: {
    id: 'mining_by_country',
    title: 'Мировая добыча серебра и фактор неэластичности (By-Product Mining)',
    category: 'Горнорудное производство',
    source: 'USGS (Геологическая служба США — Mineral Commodity Summaries), Camimex (Мексика), SNMPE (Перу), отчеты горнодобывающих корпораций (Fresnillo, KGHM, Southern Copper, Newmont).',
    sourceUrlName: 'USGS National Minerals Information Center: Silver',
    formulaOrMethod: `• 72.4% мирового серебра извлекается как попутный продукт (by-product) при обогащении полиметаллических руд:
  - 32% из свинцово-цинковых руд (Lead/Zinc).
  - 26% из медных порфировых рудников (Copper).
  - 15% из золоторудных месторождений (Gold).
  - И только ~27.6% поступает с первичных серебряных рудников (Primary Silver Mines).`,
    interpretation: 'Неэластичность предложения: даже если цена серебра взлетает на 100%, крупнейшие медные и цинковые рудники не станут ускорять добычу, если цены на медь и цинк не растут соответственно. Это делает дефицит серебра структурным и долгосрочным.',
    updateFrequency: 'Ежегодно / ежеквартально.',
  },

  vault_inventories: {
    id: 'vault_inventories',
    title: 'Складские запасы хранилищ: COMEX, LBMA (Лондон) и SHFE (Шанхай)',
    category: 'Физические запасы металла',
    source: 'Лондонская ассоциация участников рынка драгметаллов (LBMA Vault Data), CME Group COMEX Registered/Eligible Inventory Reports, Shanghai Futures Exchange (SHFE).',
    sourceUrlName: 'LBMA London Physical Vault Holdings & COMEX Delivery Warrants',
    formulaOrMethod: `• COMEX Registered (Варранты): слитки высокой чистоты, прошедшие официальный аффинаж и сертифицированные владельцами для немедленной поставки по исполняемым фьючерсам.
• COMEX Eligible: слитки в хранилищах COMEX, удовлетворяющие спецификации, но принадлежащие частным инвесторам или фондам и НЕ предназначенные для поставки на биржу.
• LBMA Vaults: физическое серебро в хранилищах лондонских слитковых банков (HSBC, JP Morgan, Brink's, Malca-Amit, ICBC Standard).`,
    interpretation: 'Падение запасов COMEX Registered с 150 Moz до ~34 Moz (на 77%) является критическим индикатором биржевого стресса. Когда Registered падает близко к объему открытого интереса поставочного месяца, возникает премия спота к фьючерсу (бэквордация) и риск физического шорт-сквиза.',
    updateFrequency: 'COMEX — ежедневно; LBMA — ежемесячно; SHFE — еженедельно.',
  },

  // 5. Seasonality
  seasonality_matrix: {
    id: 'seasonality_matrix',
    title: 'Тепловая карта сезонности (Monthly Return Matrix)',
    category: 'Календарный и квантовый анализ',
    source: '15-летняя историческая база данных клиринговых цен COMEX SI Futures (2011–2026).',
    sourceUrlName: 'Historical Monthly Settlement Database',
    formulaOrMethod: `• Доходность за месяц m года y:
  R_{y, m} = [(Close_{month_end} - Close_{month_start}) / Close_{month_start}] · 100%.
• Средняя доходность месяца: Avg_m = (1 / Y) · ∑ R_{y, m}.
• Медианная доходность: серединное значение ранжированного по возрастанию ряда доходностей за 15 лет (устраняет влияние аномальных выбросов).
• Винрейт (Win Rate %): (Количество лет с R_{y, m} > 0 / Общее число наблюдаемых лет) · 100%.`,
    interpretation: 'Сезонность объясняется фундаментальными бизнес-циклами: январской ребалансировкой инвестфондов, пиком импорта серебра Индией в сентябре–октябре перед праздником Дивали (свадебный сезон) и промышленными закупками заводов в конце года.',
    updateFrequency: 'Обновляется по закрытию каждого календарного месяца.',
  },

  // 6. Macro & COT
  real_yields: {
    id: 'real_yields',
    title: 'Реальная доходность 10-летних казначейских облигаций США (10Y TIPS)',
    category: 'Монетарный фактор №1',
    source: 'U.S. Department of the Treasury (Министерство финансов США) & Федеральный резервный банк Сент-Луиса (FRED).',
    sourceUrlName: 'FRED: 10-Year Treasury Inflation-Indexed Security (DFII10)',
    formulaOrMethod: `• Модель Фишера:
  Реальная ставка TIPS = Номинальная доходность казначейской облигации 10Y UST - Ожидаемая безубыточная инфляция (10-Year Breakeven Inflation Rate).
• Коэффициент корреляции с серебром за 3 года: r ≈ -0.82.`,
    interpretation: 'Серебро и золото не приносят процентов или дивидендов. Когда реальная доходность падает или уходит в отрицательную зону, альтернативные издержки владения металлом обнуляются, что исторически порождает самые масштабные бычьи рынки (1970-е, 2008-2011, 2020, 2024-2026).',
    updateFrequency: 'Ежедневно по рабочим дням в США.',
  },

  cot_report: {
    id: 'cot_report',
    title: 'Отчет CFTC Commitments of Traders (COT Report)',
    category: 'Позиционирование крупных игроков',
    source: 'Комиссия по торговле товарными фьючерсами США (U.S. Commodity Futures Trading Commission — CFTC).',
    sourceUrlName: 'U.S. CFTC Commitments of Traders (Disaggregated)',
    formulaOrMethod: `• Срез позиций фиксируется каждый вторник и публикуется в пятницу в 22:30 МСК.
• Managed Money (Хедж-фонды и CTA): спекулятивные трендовые фонды. Чистая позиция = Long - Short.
• Commercials (Слитковые банки и добывающие компании): производители, хеджирующие риски падения цены. Как правило, находятся в чистом шорте.
• Open Interest: общее число открытых контрактов всех участников.`,
    interpretation: 'Классический индикатор рыночного сентимента: когда чистый лонг спекулянтов достигает исторических максимумов (>85 000 контрактов), рынок перегрет и уязвим к коррекции. Когда спекулянты сокращают лонг до минимума или встают в шорт — рынок серебра формирует долгосрочное дно.',
    updateFrequency: 'Еженедельно по пятницам.',
  },

  gold_silver_ratio: {
    id: 'gold_silver_ratio',
    title: 'Соотношение Золото/Серебро (Gold/Silver Ratio — GSR)',
    category: 'Относительная стоимость (Relative Value)',
    source: 'Лондонский фиксинг LBMA Gold Price / LBMA Silver Price и спотовые котировки XAU/XAG.',
    sourceUrlName: 'LBMA Precious Metal Benchmarks',
    formulaOrMethod: `• GSR = Цена одной тройской унции золота ($/oz) / Цена одной тройской унции серебра ($/oz).
• Историческая статистика (за 50 лет):
  - Среднее значение: ~65 : 1.
  - Геологическое соотношение распространенности в земной коре: ~17 : 1.
  - Исторические максимумы: 125 : 1 (март 2020 г., COVID-паника).
  - Исторические минимумы: 16 : 1 (1980 г., братья Хант), 32 : 1 (апрель 2011 г.).`,
    interpretation: 'Когда GSR поднимается выше 80–85x, серебро исторически крайне дешево относительно золота. Крупные институциональные инвесторы в такие моменты открывают сделки парного трейдинга (Long Silver / Short Gold), ожидая нормализации соотношения.',
    updateFrequency: 'В реальном времени.',
  },

  // 7. Scenario Simulator
  scenario_engine: {
    id: 'scenario_engine',
    title: 'Математическая модель сценарного калькулятора',
    category: 'Квантитативное стресс-тестирование',
    source: 'Мультифакторная эконометрическая модель эластичности рынка драгоценных металлов.',
    sourceUrlName: 'Econometric Multi-Factor Sensitivity Matrix',
    formulaOrMethod: `• Общее прогнозное изменение:
  ΔPrice% = (Эффект DXY) + (Эффект Solar PV) + (Эффект TIPS) + (Эффект добычи).
• Коэффициенты эластичности модели:
  - DXY: -1.75x (снижение DXY на 1% дает +1.75% к цене).
  - Solar PV: +0.32x на каждые 1% прироста спроса ячеек TOPCon/HJT.
  - TIPS: +0.112% на каждый базисный пункт (-1 б.п.) снижения реальной ставки.
  - Шок добычи: +1.8x на каждый 1% снижения мирового рудничного предложения.
• Прогнозный дефицит: Deficit_proj = Base_Deficit + ΔDemand_{solar} + ΔSupply_{disruption}.`,
    interpretation: 'Позволяет управляющим портфелями оценивать стресс-сценарии (например, рецессия в США, остановка рудников в Перу или взрывной ввод солнечных электростанций в Китае) и заранее рассчитывать целевые уровни фиксации прибыли.',
    updateFrequency: 'Интерактивный расчет в реальном времени.',
  },

  // 8. Real-time T-Bank & MOEX Data
  tinkoff_api: {
    id: 'tinkoff_api',
    title: 'Реальное подключение: Т-Банк Инвестиции Open API (Live)',
    category: 'Реальные котировки и биржевой стакан',
    source: 'T-Bank Invest Public API (gRPC / REST Gateway: https://invest-public-api.tbank.ru/rest).',
    sourceUrlName: 'T-Bank Open API Documentation',
    formulaOrMethod: `• Авторизация: персональный биржевой Bearer-токен прямого доступа с read-only правами на котировки.
• Сервис котировок: MarketDataService/GetLastPrices (получение последней цены сделки в тиках и нано-долях).
• Биржевой стакан (DOM): MarketDataService/GetOrderBook (глубина 10 уровней с лимитными заявками Bids и Asks).
• Формула конвертации цены: Price = units + nano / 10⁹.
• Спред: Spread = Best_Ask - Best_Bid.
• Инструменты: фьючерс SVZ6 (срочный рынок MOEX, $/унция), спот LBMA XAG, спот SLVRUB_TOM (₽/грамм), вечный фьючерс SLVRUBF.`,
    interpretation: 'Обеспечивает институциональную точность котирования, отражая реальную текущую цену сделок и плотность ликвидности в биржевом стакане в миллисекундном диапазоне.',
    updateFrequency: 'Автоматический опрос каждые 10–15 секунд с возможностью мгновенного ручного обновления.',
  },

  moex_history: {
    id: 'moex_history',
    title: 'Исторические данные: Московская Биржа (MOEX ISS API)',
    category: 'История торгов и индикаторы',
    source: 'Информационно-статистический сервер Московской Биржи (MOEX ISS): iss.moex.com/iss/engines/futures/markets/forts.',
    sourceUrlName: 'MOEX Informational & Statistical Server (ISS)',
    formulaOrMethod: `• Рынок: Срочный рынок FORTS (секция RFUD — расчетные фьючерсы на драгметаллы).
• Склейка контрактов: непрерывный ряд формируется из официальных дневных свечей последовательных контрактов SVZ4 (2024), SVZ5 (2025) и актуального SVZ6 (2026), объединяя более 720 торговых сессий.
• Поля данных: Open, High, Low, Close (цена в USD за тройскую унцию), Volume (число проторгованных контрактов), Value (объем в рублях).
• Расчет индикаторов:
  - 30-дневная волатильность: HV 30D = std(ln(C_t / C_{t-1})) · √252 · 100%.
  - 90-дневная волатильность: HV 90D = std(ln(C_t / C_{t-1})) · √252 · 100%.
  - SMA 50 и SMA 200: простые скользящие средние цен закрытия.
  - Bollinger Bands: SMA 20 ± 2·σ.`,
    interpretation: 'Позволяет анализировать фактическую динамику цен российского срочного рынка FORTS, объемы контрактов и структуру волатильности без синтетических аппроксимаций.',
    updateFrequency: 'Архив обновляется ежедневно по завершении вечернего клиринга MOEX (19:00 MSK).',
  },

  // 9. Predictive Forecast Model Topics
  predictive_composite_index: {
    id: 'predictive_composite_index',
    title: 'Композитный прогностический индекс (0–100)',
    category: 'Прогностическое моделирование',
    source: 'Мультифакторный синтез макроданных США (FRED), отчетов CFTC COT, баланса складов COMEX/LBMA и стакана Т-Банка.',
    sourceUrlName: 'Institutional Multi-Factor Synthesis Engine',
    formulaOrMethod: `• Взвешенный нормализованный скор:
  Score = 50 + (Σ (RawScoreᵢ · Weightᵢ) / (2 · Σ Weightᵢ)).
• Диапазоны фаз рынка:
  - 75–100: Сильный бычий импульс (Strong Bullish).
  - 58–74: Умеренно бычий тренд (Moderate Bullish).
  - 45–57: Нейтральная консолидация (Consolidation Range).
  - 30–44: Умеренно медвежья фаза (Moderate Bearish).
  - 0–29: Высокий риск / Медвежий тренд (High Risk Bearish).`,
    interpretation: 'Отражает текущий баланс фундаментальных сил на мировом рынке серебра. При значениях выше 65–70 вероятность среднесрочного роста цен превышает 70%.',
    updateFrequency: 'Динамически в реальном времени при изменении котировок или весов.',
  },

  predictive_factor_weights: {
    id: 'predictive_factor_weights',
    title: 'Матрица фундаментальных факторов и весов',
    category: 'Прогностическое моделирование',
    source: 'The Silver Institute, St. Louis FRED, CFTC COT, CME Group, LBMA, Т-Банк Инвестиции.',
    sourceUrlName: 'Quantitative Factor Matrix & Weighting',
    formulaOrMethod: `• 6 ключевых блоков:
  1. Реальные ставки TIPS 10Y и индекс DXY (вес 25%).
  2. Физический дефицит, запасы COMEX/LBMA и премия SGE (вес 25%).
  3. Отчеты CFTC COT спекулянтов Managed Money (вес 20%).
  4. Межрыночный коэффициент Gold/Silver Ratio (GSR) (вес 15%).
  5. Технический профиль SMA 50/200, волатильность и стакан DOM Т-Банка (вес 10%).
  6. Сезонные циклы спроса Q4–Q1 и солнечной индустрии (вес 5%).`,
    interpretation: 'Позволяет инвестору калибровать модель под свой профиль — от институционального макро-аналитика до краткосрочного трейдера на срочном рынке.',
    updateFrequency: 'Интерактивная калибровка весов в интерфейсе.',
  },

  predictive_short_term_forecast: {
    id: 'predictive_short_term_forecast',
    title: 'Краткосрочные прогнозы (1H, 2H, 4H, 1D)',
    category: 'Внутридневной трейдинг',
    source: 'Микроструктура стакана Т-Банка (DOM depth), внутридневной ATR и динамика спота XAG/USD.',
    sourceUrlName: 'Intraday Drift & Volatility Cone Model',
    formulaOrMethod: `• Волатильный конус горизонта:
  σ_t = Price · HV_{30D} · √(Hours / 2016).
• Дрифт цены:
  BaseTarget = Price · (1 + Drift% · SentimentBias).
• Уровни поддержки и сопротивления:
  S1 = Price - 0.95 · σ_t, R1 = Price + 0.95 · σ_t.
• Вероятность направления рассчитывается через функцию нормального распределения с учетом перекоса заявок в стакане Т-Банка.`,
    interpretation: 'Служит ориентиром для внутридневных позиций, выставления стоп-лоссов и тейк-профитов на фьючерсе SVZ6.',
    updateFrequency: 'Обновляется каждые 12 секунд вместе с тиками Т-Банка.',
  },

  predictive_long_term_forecast: {
    id: 'predictive_long_term_forecast',
    title: 'Среднесрочные и долгосрочные прогнозы (1M, 1Q, 6M, 1Y)',
    category: 'Фундаментальный анализ',
    source: 'Эконометрическая модель Монте-Карло с поправкой на дефицит физического металла и цикл ФРС.',
    sourceUrlName: 'Macro Econometric Horizon Projections',
    formulaOrMethod: `• Волатильный конус:
  σ_T = Price · HV_{30D} · √(Years).
• Сценарии:
  - Базовый: Price · (1 + MacroDrift% · (CompositeScore - 50) / 50).
  - Оптимистичный (Bull Target): BaseTarget + 1.35 · σ_T.
  - Пессимистичный (Bear Target): max(18.0, BaseTarget - 1.35 · σ_T).
• Вероятности сценариев калибруются по историческим распределениям аналогичных макро-режимов.`,
    interpretation: 'Определяет стратегические целевые ориентиры на горизонте квартала и года для портфельного аллоцирования капитала в физическое серебро и фьючерсы.',
    updateFrequency: 'Ежедневно по итогам закрытия сессии.',
  },
};

