import React, { useState } from 'react';
import {
  supplyDemandBalanceHistory,
  countrySupplyData,
  demandBreakdownData,
  vaultInventorySeries,
  SupplyDemandYear
} from '../data/silverData';
import { Pickaxe, SunMedium, Landmark, Layers, TrendingDown, Info, ShieldAlert } from 'lucide-react';
import { InfoButton } from './HelpModal';

export const SupplyDemandView: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [activeTab, setActiveTab] = useState<'balance' | 'mining' | 'demand' | 'vaults'>('balance');

  const currentYearData = supplyDemandBalanceHistory.find(d => d.year === selectedYear) || supplyDemandBalanceHistory[supplyDemandBalanceHistory.length - 2];

  // Cumulative deficit over the past 5 years (2021-2025)
  const cumulativeDeficit = supplyDemandBalanceHistory
    .filter(d => d.year >= 2021 && d.year <= 2025)
    .reduce((acc, d) => acc + d.physicalBalance, 0);

  return (
    <div className="space-y-6">
      
      {/* Top Balance Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Physical Balance */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span>Физический баланс ({selectedYear})</span>
              <InfoButton topicId="physical_balance" />
            </span>
            <span className="font-mono text-rose-400 text-[10px]">ДЕФИЦИТ</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-rose-400 tabular-nums">
              {currentYearData.physicalBalance.toFixed(1)} Moz
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Мировой спрос превышает добычу и вторсырье
          </div>
        </div>

        {/* Photovoltaics Solar Surge */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span>Спрос солнечной энергетики (PV)</span>
              <InfoButton topicId="solar_pv_demand" />
            </span>
            <SunMedium className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-cyan-400 tabular-nums">
              {currentYearData.ofWhichPhotovoltaics} Moz
            </span>
            <span className="text-xs font-mono text-emerald-400">+11.2% YoY</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            ~25% от всей мировой добычи рудников
          </div>
        </div>

        {/* Mine Inelasticity */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span>Попутная добыча (By-Product)</span>
              <InfoButton topicId="mining_by_country" />
            </span>
            <Pickaxe className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-400 tabular-nums">
              72.4%
            </span>
            <span className="text-xs text-slate-400">неэластично</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Добывается попутно с медью, свинцом и цинком
          </div>
        </div>

        {/* 5-Year Cumulative Deficit */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span>Накопленный дефицит 2021-2025</span>
              <InfoButton topicId="physical_balance" />
            </span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white tabular-nums">
              {Math.abs(cumulativeDeficit).toFixed(0)} Moz
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Покрыт истощением запасов хранилищ LBMA/COMEX
          </div>
        </div>

      </div>

      {/* Sub-Tabs: Balance Sheet, Mining Countries, Demand Sectors, Vault Stocks */}
      <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs font-medium overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('balance')}
          className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
            activeTab === 'balance' ? 'bg-slate-800 text-cyan-300 font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Баланс спроса и предложения (2019–2026)
        </button>

        <button
          onClick={() => setActiveTab('mining')}
          className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
            activeTab === 'mining' ? 'bg-slate-800 text-cyan-300 font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Добыча по странам и неэластичность
        </button>

        <button
          onClick={() => setActiveTab('demand')}
          className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
            activeTab === 'demand' ? 'bg-slate-800 text-cyan-300 font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Структура спроса и бум Solar PV
        </button>

        <button
          onClick={() => setActiveTab('vaults')}
          className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
            activeTab === 'vaults' ? 'bg-slate-800 text-cyan-300 font-semibold shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Складские запасы (LBMA, COMEX, SHFE)
        </button>
      </div>

      {/* TAB 1: Global Balance Sheet */}
      {activeTab === 'balance' && (
        <div className="space-y-6">
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 lg:p-6 backdrop-blur">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-white">
                    Исторический баланс мирового рынка серебра (The Silver Institute / Metals Focus)
                  </h2>
                  <InfoButton topicId="physical_balance" />
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Единицы: Миллионы тройских унций (Moz). Красные значения — физический дефицит предложения.
                </p>
              </div>

              {/* Year Selector */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
                {supplyDemandBalanceHistory.map((d) => (
                  <button
                    key={d.year}
                    onClick={() => setSelectedYear(d.year)}
                    className={`px-2.5 py-1 rounded transition-colors ${
                      selectedYear === d.year ? 'bg-slate-800 text-cyan-300 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {d.year}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Balance Bar Chart */}
            <div className="my-6">
              <div className="text-xs font-semibold text-slate-300 mb-3">
                Сравнение: Совокупное предложение vs Спрос и Дефицит (Moz)
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                {supplyDemandBalanceHistory.map((d) => {
                  const isSelected = d.year === selectedYear;
                  return (
                    <div
                      key={d.year}
                      onClick={() => setSelectedYear(d.year)}
                      className={`cursor-pointer p-3 rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-slate-800/80 border-cyan-500/50 shadow-md'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-mono font-bold text-slate-300 mb-1">{d.year}</div>
                      
                      {/* Supply vs Demand height indicator */}
                      <div className="space-y-1 text-[11px] font-mono">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Предлож:</span>
                          <span className="text-slate-200">{d.totalSupply.toFixed(0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Спрос:</span>
                          <span className="text-cyan-300 font-semibold">{d.totalDemand.toFixed(0)}</span>
                        </div>
                        <div className="pt-1 border-t border-slate-800 flex justify-between font-bold text-rose-400">
                          <span>Баланс:</span>
                          <span>{d.physicalBalance.toFixed(0)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detailed Table for All Years */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 font-mono border-y border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Год</th>
                    <th className="py-2.5 px-3 text-right">Добыча рудников</th>
                    <th className="py-2.5 px-3 text-right">Вторичная переработка</th>
                    <th className="py-2.5 px-3 text-right text-slate-200 font-bold">ИТОГО Предложение</th>
                    <th className="py-2.5 px-3 text-right">Промышленный спрос</th>
                    <th className="py-2.5 px-3 text-right text-cyan-400">в т.ч. Solar PV</th>
                    <th className="py-2.5 px-3 text-right">Слитки и монеты</th>
                    <th className="py-2.5 px-3 text-right text-slate-200 font-bold">ИТОГО Спрос</th>
                    <th className="py-2.5 px-3 text-right text-rose-400 font-bold">Баланс (Дефицит)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {supplyDemandBalanceHistory.map((d) => (
                    <tr
                      key={d.year}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        d.year === selectedYear ? 'bg-cyan-500/5' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-bold text-white">{d.year}</td>
                      <td className="py-2.5 px-3 text-right text-slate-300 tabular-nums">{d.mineProduction}</td>
                      <td className="py-2.5 px-3 text-right text-slate-300 tabular-nums">{d.recycling}</td>
                      <td className="py-2.5 px-3 text-right text-slate-100 font-bold tabular-nums">{d.totalSupply}</td>
                      <td className="py-2.5 px-3 text-right text-slate-300 tabular-nums">{d.industrialDemand}</td>
                      <td className="py-2.5 px-3 text-right text-cyan-400 font-bold tabular-nums">{d.ofWhichPhotovoltaics}</td>
                      <td className="py-2.5 px-3 text-right text-slate-300 tabular-nums">{d.physicalInvestment}</td>
                      <td className="py-2.5 px-3 text-right text-slate-100 font-bold tabular-nums">{d.totalDemand}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-rose-400 tabular-nums">
                        {d.physicalBalance.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* TAB 2: Mining Supply by Country */}
      {activeTab === 'mining' && (
        <div className="space-y-6">
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 lg:p-6 backdrop-blur">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-base font-semibold text-white">
                Мировая добыча серебра по странам и фактор неэластичности
              </h2>
              <InfoButton topicId="mining_by_country" />
            </div>
            <p className="text-xs text-slate-400 mb-6">
              Общий объем добычи: ~842 Moz/год. Ключевая особенность: более 72% серебра извлекается как побочный продукт разработки других металлов.
            </p>

            {/* Inelasticity Explainer Banner */}
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200">
              <div className="flex items-center gap-2 font-bold mb-1">
                <Info className="w-4 h-4 text-amber-400" />
                <span>Фундаментальный парадокс предложения серебра</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Поскольку только 28% серебра поступает с первичных серебряных рудников (например, в Мексике и Перу), даже рост цены серебра до $40–50/oz не приводит к быстрому росту добычи. Горнодобывающие корпорации ориентируются на конъюнктуру рынков меди, свинца и цинка.
              </p>
            </div>

            {/* Country Production Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {countrySupplyData.map((c, i) => (
                <div key={i} className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{c.flag}</span>
                    <div>
                      <div className="text-xs font-bold text-white">{c.country}</div>
                      <div className="text-[11px] text-slate-400">
                        Тип месторождения: <span className="text-slate-200 font-mono">{c.primaryMetal}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className="text-sm font-bold text-cyan-400 tabular-nums">
                      {c.productionMoz.toFixed(1)} Moz
                    </div>
                    <div className="text-xs text-slate-400 tabular-nums">
                      {c.sharePercent}% рынка
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>
      )}

      {/* TAB 3: Demand Breakdown & Solar PV */}
      {activeTab === 'demand' && (
        <div className="space-y-6">
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 lg:p-6 backdrop-blur">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-base font-semibold text-white">
                Структура мирового потребления серебра и бум фотовольтаики
              </h2>
              <InfoButton topicId="solar_pv_demand" />
            </div>
            <p className="text-xs text-slate-400 mb-6">
              Общий мировой спрос: ~1,305 Moz. Промышленный сектор формирует абсолютное большинство спроса.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Solar Highlight Card */}
              <div className="lg:col-span-1 p-5 bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-950 border border-cyan-500/40 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                    <SunMedium className="w-4 h-4" />
                    <span>Фотовольтаика (Solar PV)</span>
                  </div>
                  <InfoButton topicId="solar_pv_demand" />
                </div>
                <div className="text-3xl font-bold font-mono text-white tabular-nums">258 Moz</div>
                <div className="text-xs text-emerald-400 mt-1 font-mono font-semibold">+11.2% годовой рост</div>
                
                <p className="text-xs text-slate-300 mt-4 leading-relaxed">
                  Переход мировых фабрик в Китае с технологии PERC на ячейки <strong>TOPCon</strong> (Tunnel Oxide Passivated Contact) и <strong>HJT</strong> (Heterojunction) увеличил удельный расход серебряной пасты с 10 мг/Вт до 14–22 мг/Вт.
                </p>

                <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
                  Серебро невозможно заменить медью без резкой потери КПД и ускоренной коррозии фотоэлементов.
                </div>
              </div>

              {/* Demand Sectors List */}
              <div className="lg:col-span-2 space-y-3">
                {demandBreakdownData.map((sec, i) => (
                  <div key={i} className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-white flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sec.color }}></span>
                        {sec.sector}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-200">
                        {sec.amountMoz} Moz <span className="text-slate-400 font-normal">({sec.sharePercent}%)</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{sec.description}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 4: Vault Inventories Drain */}
      {activeTab === 'vaults' && (
        <div className="space-y-6">
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 lg:p-6 backdrop-blur">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-base font-semibold text-white">
                Физические складские запасы: COMEX, LBMA (Лондон) и SHFE (Шанхай)
              </h2>
              <InfoButton topicId="vault_inventories" />
            </div>
            <p className="text-xs text-slate-400 mb-6">
              Динамика истощения зарегистрированных запасов серебра (Registered — доступных для поставки по биржевым фьючерсам).
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left font-mono">
                <thead className="bg-slate-950 text-slate-400 border-y border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Период</th>
                    <th className="py-2.5 px-3 text-right text-rose-400">COMEX Registered (Moz)</th>
                    <th className="py-2.5 px-3 text-right">COMEX Eligible (Moz)</th>
                    <th className="py-2.5 px-3 text-right text-cyan-400">LBMA Vaults (Moz)</th>
                    <th className="py-2.5 px-3 text-right text-amber-400">SHFE Шанхай (Moz)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {vaultInventorySeries.map((v, i) => (
                    <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2 px-3 text-slate-200 font-bold">{v.date}</td>
                      <td className="py-2 px-3 text-right text-rose-400 font-bold tabular-nums">
                        {v.comexRegisteredMoz}
                      </td>
                      <td className="py-2 px-3 text-right text-slate-300 tabular-nums">
                        {v.comexEligibleMoz}
                      </td>
                      <td className="py-2 px-3 text-right text-cyan-300 font-bold tabular-nums">
                        {v.lbmaVaultsMoz}
                      </td>
                      <td className="py-2 px-3 text-right text-amber-300 tabular-nums">
                        {v.shfeVaultsMoz}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-400">
              <strong className="text-slate-200">Registered vs Eligible:</strong> Registered — слитки, зарегистрированные для немедленного физического исполнения поставочного фьючерса. С 2021 года Registered запасы COMEX упали с 151 Moz до ~34.5 Moz (падение на 77%!), что создает постоянную премию физического металла над бумажным.
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
