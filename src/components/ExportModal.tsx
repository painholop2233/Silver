import React, { useState } from 'react';
import { X, Download, Copy, Check, FileSpreadsheet, FileJson } from 'lucide-react';
import { PricePoint, supplyDemandBalanceHistory, seasonalityStats } from '../data/silverData';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  prices: PricePoint[];
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, prices }) => {
  const [copied, setCopied] = useState(false);
  const [exportType, setExportType] = useState<'prices' | 'balance' | 'seasonality'>('prices');
  const [format, setFormat] = useState<'csv' | 'json'>('csv');

  if (!isOpen) return null;

  const generateData = (): string => {
    if (exportType === 'prices') {
      if (format === 'json') {
        return JSON.stringify(prices.slice(-60), null, 2);
      } else {
        const headers = ['Date', 'Open', 'High', 'Low', 'Close', 'Volume', 'OpenInterest', 'DXY', 'GoldClose', 'RealYield', 'HV30D', 'ATR14'];
        const rows = prices.slice(-60).map(p => [
          p.date,
          p.open,
          p.high,
          p.low,
          p.close,
          p.volume,
          p.openInterest,
          p.dxy,
          p.goldClose,
          p.realYield,
          p.volatility30d || '',
          p.atr14 || ''
        ].join(','));
        return [headers.join(','), ...rows].join('\n');
      }
    } else if (exportType === 'balance') {
      if (format === 'json') {
        return JSON.stringify(supplyDemandBalanceHistory, null, 2);
      } else {
        const headers = ['Year', 'MineProduction', 'Recycling', 'TotalSupply', 'IndustrialDemand', 'SolarPV', 'Jewelry', 'PhysicalInvestment', 'TotalDemand', 'PhysicalBalance'];
        const rows = supplyDemandBalanceHistory.map(b => [
          b.year,
          b.mineProduction,
          b.recycling,
          b.totalSupply,
          b.industrialDemand,
          b.ofWhichPhotovoltaics,
          b.jewelryDemand,
          b.physicalInvestment,
          b.totalDemand,
          b.physicalBalance
        ].join(','));
        return [headers.join(','), ...rows].join('\n');
      }
    } else {
      if (format === 'json') {
        return JSON.stringify(seasonalityStats, null, 2);
      } else {
        const headers = ['Month', 'AvgReturnPct', 'MedianReturnPct', 'WinRatePct'];
        const rows = seasonalityStats.map(s => [
          s.fullName,
          s.avgReturn,
          s.medianReturn,
          s.winRate
        ].join(','));
        return [headers.join(','), ...rows].join('\n');
      }
    }
  };

  const dataString = generateData();

  const handleCopy = () => {
    navigator.clipboard.writeText(dataString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([dataString], { type: format === 'json' ? 'application/json' : 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `silver_${exportType}_${new Date().toISOString().split('T')[0]}.${format}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Экспорт аналитических данных</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div>
            <label className="text-slate-400 font-sans block mb-1">Набор данных:</label>
            <div className="flex gap-2">
              <button
                onClick={() => setExportType('prices')}
                className={`px-3 py-1.5 rounded-lg border transition-colors ${exportType === 'prices' ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 font-bold' : 'border-slate-800 text-slate-400'}`}
              >
                Котировки SI
              </button>
              <button
                onClick={() => setExportType('balance')}
                className={`px-3 py-1.5 rounded-lg border transition-colors ${exportType === 'balance' ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 font-bold' : 'border-slate-800 text-slate-400'}`}
              >
                Баланс рынка
              </button>
              <button
                onClick={() => setExportType('seasonality')}
                className={`px-3 py-1.5 rounded-lg border transition-colors ${exportType === 'seasonality' ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 font-bold' : 'border-slate-800 text-slate-400'}`}
              >
                Сезонность
              </button>
            </div>
          </div>

          <div>
            <label className="text-slate-400 font-sans block mb-1">Формат файла:</label>
            <div className="flex gap-2">
              <button
                onClick={() => setFormat('csv')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-colors ${format === 'csv' ? 'bg-slate-800 border-slate-700 text-white font-bold' : 'border-slate-800 text-slate-400'}`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                <span>CSV</span>
              </button>
              <button
                onClick={() => setFormat('json')}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border transition-colors ${format === 'json' ? 'bg-slate-800 border-slate-700 text-white font-bold' : 'border-slate-800 text-slate-400'}`}
              >
                <FileJson className="w-3.5 h-3.5 text-amber-400" />
                <span>JSON</span>
              </button>
            </div>
          </div>
        </div>

        {/* Data Preview */}
        <div className="relative">
          <textarea
            readOnly
            value={dataString}
            rows={8}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-300 resize-none focus:outline-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-400">
            Готово к импорту в Excel, Python Pandas или TradingView
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Скопировано!' : 'Копировать'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Скачать файл</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
