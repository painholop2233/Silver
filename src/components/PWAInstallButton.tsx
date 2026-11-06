import React, { useState } from 'react';
import { Smartphone, Download, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { AndroidInstallModal } from './AndroidInstallModal';

export const PWAInstallButton: React.FC = () => {
  const { isInstalled, canPromptDirectly, isAndroid } = usePWAInstall();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        title="Установить Argentum Terminal на Android (PWA / WebAPK)"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all whitespace-nowrap ${
          isInstalled
            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
            : 'bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 hover:from-emerald-600/30 hover:to-cyan-600/30 text-emerald-300 hover:text-emerald-200 border-emerald-500/40 shadow-sm'
        }`}
      >
        <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
        <span className="font-medium">
          {isInstalled ? 'Установлено' : 'Установить на Android'}
        </span>
        {!isInstalled && (
          <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping ml-0.5" />
        )}
      </button>

      <AndroidInstallModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
