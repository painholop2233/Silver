import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Auto-register service worker for PWA offline caching & Android WebAPK installability
if ('serviceWorker' in navigator) {
  registerSW({
    immediate: true,
    onNeedRefresh() {
      console.log('New content available, ready to reload.');
    },
    onOfflineReady() {
      console.log('Argentum Terminal is cached and ready to work offline.');
    },
  });
}

createRoot(document.getElementById('root')!).render(<App />);
