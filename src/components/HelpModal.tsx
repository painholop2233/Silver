import React, { createContext, useContext, useState, useEffect } from 'react';
import { HelpCircle, X, ExternalLink, Calculator, Database, TrendingUp, Clock, BookOpen } from 'lucide-react';
import { helpTopics, HelpTopic } from '../data/helpContent';

// Context for global help modal management
interface HelpContextType {
  openHelp: (topicId: string) => void;
  closeHelp: () => void;
}

const HelpContext = createContext<HelpContextType>({
  openHelp: () => {},
  closeHelp: () => {},
});

export const useHelp = () => useContext(HelpContext);

export const HelpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null);

  const openHelp = (topicId: string) => {
    setActiveTopicId(topicId);
  };

  const closeHelp = () => {
    setActiveTopicId(null);
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeHelp();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeTopic = activeTopicId ? helpTopics[activeTopicId] : null;

  return (
    <HelpContext.Provider value={{ openHelp, closeHelp }}>
      {children}

      {/* Global Modal Backdrop */}
      {activeTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-800 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-mono text-cyan-400 font-medium">
                    {activeTopic.category}
                  </div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    {activeTopic.title}
                  </h3>
                </div>
              </div>

              <button
                onClick={closeHelp}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Закрыть справку (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Section 1: Data Source */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Источник данных (Data Source):</span>
              </div>
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-200 leading-relaxed">
                {activeTopic.source}
                {activeTopic.sourceUrlName && (
                  <div className="mt-1 text-[11px] text-cyan-400 font-mono flex items-center gap-1">
                    <span>Базовый регистр: {activeTopic.sourceUrlName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: Formula & Calculation Methodology */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Calculator className="w-4 h-4 text-amber-400" />
                <span>Методология и формула расчета (Calculation Methodology):</span>
              </div>
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-300 font-mono whitespace-pre-line leading-relaxed overflow-x-auto">
                {activeTopic.formulaOrMethod}
              </div>
            </div>

            {/* Section 3: Interpretation */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span>Практическое применение и интерпретация (Market Interpretation):</span>
              </div>
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                {activeTopic.interpretation}
              </div>
            </div>

            {/* Section 4: Frequency */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                <span>Периодичность обновления: <strong className="text-slate-200 font-medium">{activeTopic.updateFrequency}</strong></span>
              </div>

              <button
                onClick={closeHelp}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors text-xs"
              >
                Понятно
              </button>
            </div>

          </div>
        </div>
      )}
    </HelpContext.Provider>
  );
};

// Reusable Question Mark Button Component
interface InfoButtonProps {
  topicId: string;
  className?: string;
  title?: string;
}

export const InfoButton: React.FC<InfoButtonProps> = ({
  topicId,
  className = '',
  title = 'Справка: источник данных и методология расчета',
}) => {
  const { openHelp } = useHelp();

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        openHelp(topicId);
      }}
      className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 transition-all focus:outline-none focus:ring-1 focus:ring-cyan-400 ${className}`}
      title={title}
      aria-label={title}
    >
      <HelpCircle className="w-3.5 h-3.5" />
    </button>
  );
};
