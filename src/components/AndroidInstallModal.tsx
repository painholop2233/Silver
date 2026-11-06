import React, { useState } from 'react';
import { Smartphone, Download, CheckCircle, ExternalLink, X, Copy, QrCode } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface AndroidInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidInstallModal: React.FC<AndroidInstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isAndroid, canPromptDirectly, installApp } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'chrome' | 'samsung' | 'other'>('chrome');
  const [copied, setCopied] = useState(false);
  const [installStatus, setInstallStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(appUrl)}&bgcolor=090d16&color=38bdf8&margin=6`;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback
    }
  };

  const handleInstallClick = async () => {
    setInstallStatus('Запрос установки...');
    const result = await installApp();
    if (result === 'accepted') {
      setInstallStatus('✓ Приложение успешно установлено на Android!');
    } else if (result === 'dismissed') {
      setInstallStatus('Установка отклонена пользователем.');
    } else {
      setInstallStatus('Следуйте инструкции ниже для установки через меню браузера.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800/80 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Установка на Android</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  WebAPK / PWA
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Запуск в полноэкранном режиме без адресной строки
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm">
          {/* Main Action Banner */}
          {isInstalled ? (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <p className="font-semibold text-sm">Терминал уже установлен!</p>
                <p className="text-xs text-emerald-400/80">Приложение доступно на главном экране вашего устройства.</p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-900 border border-cyan-500/30 text-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-white text-sm">Быстрая установка WebAPK</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {canPromptDirectly 
                      ? 'Android готов к автоматической установке в 1 клик' 
                      : 'Нажмите кнопку или откройте в Chrome на телефоне'}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-300">
                  <Download className="w-4 h-4" />
                </div>
              </div>

              <button
                onClick={handleInstallClick}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Smartphone className="w-4 h-4" />
                <span>Установить приложение на Android</span>
              </button>

              {installStatus && (
                <div className="text-xs font-mono text-center text-cyan-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  {installStatus}
                </div>
              )}
            </div>
          )}

          {/* Quick Open on Mobile / QR Code Section */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                <QrCode className="w-4 h-4 text-cyan-400" />
                <span>Открыть на Android через QR-код</span>
              </div>
              <button
                onClick={handleCopyUrl}
                className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-cyan-300 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700 transition-colors"
              >
                <Copy className="w-3 h-3" />
                <span>{copied ? 'Скопировано!' : 'Копировать URL'}</span>
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="shrink-0 p-2 bg-slate-900 border border-slate-700 rounded-xl">
                <img
                  src={qrCodeUrl}
                  alt="QR Code for Argentum Terminal"
                  className="w-24 h-24 rounded-lg object-contain"
                  loading="lazy"
                />
              </div>
              <div className="text-xs text-slate-400 space-y-1.5 leading-relaxed">
                <p>
                  1. Наведите камеру телефона Android на QR-код.
                </p>
                <p>
                  2. Перейдите по ссылке в браузере Google Chrome.
                </p>
                <p>
                  3. Нажмите появившуюся плашку <strong className="text-white">«Установить Argentum»</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Step-by-Step Instructions by Browser */}
          <div className="space-y-2.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Пошаговая инструкция для браузеров:
            </div>

            {/* Browser Tabs */}
            <div className="flex p-1 bg-slate-950 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab('chrome')}
                className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
                  activeTab === 'chrome'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Google Chrome
              </button>
              <button
                onClick={() => setActiveTab('samsung')}
                className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
                  activeTab === 'samsung'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Samsung Internet
              </button>
              <button
                onClick={() => setActiveTab('other')}
                className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
                  activeTab === 'other'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Яндекс / Другие
              </button>
            </div>

            {/* Instruction content */}
            <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 text-xs text-slate-300 space-y-2.5">
              {activeTab === 'chrome' && (
                <ol className="space-y-2 list-decimal list-inside leading-relaxed text-slate-300">
                  <li>Откройте страницу терминала в <strong>Google Chrome</strong> на Android.</li>
                  <li>Нажмите на <strong>три точки (⋮)</strong> в верхнем правом углу экрана.</li>
                  <li>В открывшемся меню выберите <strong>«Установить приложение»</strong> (или <em>«Добавить на главный экран»</em>).</li>
                  <li>Подтвердите установку. Терминал появится в списке приложений и на рабочем столе как нативная программа.</li>
                </ol>
              )}

              {activeTab === 'samsung' && (
                <ol className="space-y-2 list-decimal list-inside leading-relaxed text-slate-300">
                  <li>Откройте терминал в <strong>Samsung Internet</strong>.</li>
                  <li>Нажмите на значок <strong>меню (☰)</strong> в нижней панели инструментов.</li>
                  <li>Выберите пункт <strong>«Добавить страницу в...»</strong>.</li>
                  <li>В появившемся диалоге нажмите <strong>«Экран приложений»</strong>.</li>
                </ol>
              )}

              {activeTab === 'other' && (
                <ol className="space-y-2 list-decimal list-inside leading-relaxed text-slate-300">
                  <li>Откройте терминал в вашем мобильном браузере.</li>
                  <li>Откройте меню браузера (обычно кнопка в правом верхнем или нижнем углу).</li>
                  <li>Найдите пункт <strong>«Добавить на рабочий стол»</strong> или <strong>«Установить на телефон»</strong>.</li>
                  <li>Созданный ярлык будет открывать терминал в изолированном окне без рамок браузера.</li>
                </ol>
              )}
            </div>
          </div>

          {/* Dedicated Files & Links */}
          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <a
              href="/install-android.html"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 underline font-medium"
            >
              <span>Открыть отдельную страницу установки</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <a
              href="/argentum-android-shortcut.html"
              download="Argentum-Terminal-Android.html"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Скачать ярлык запуска (.html)</span>
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
