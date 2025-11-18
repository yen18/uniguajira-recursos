import React from 'react';
import * as Sentry from '@sentry/browser';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import './i18n';
import reportWebVitals from './reportWebVitals';
import { ThemeModeProvider } from './providers/ThemeModeProvider';
import { AppQueryClientProvider } from './providers/QueryClientProvider';
// Registrar Service Worker para soporte offline.
function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/service-worker.js').then(reg => {
        console.log('SW registrado', reg.scope);
      }).catch(err => console.warn('SW error', err));
    });
  }
}

// Inicializar Sentry si variable presente
if (process.env.REACT_APP_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.REACT_APP_SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: parseFloat(process.env.REACT_APP_SENTRY_TRACES_SAMPLE_RATE || '0.2'),
    tunnel: process.env.REACT_APP_SENTRY_TUNNEL || undefined
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppQueryClientProvider>
      <ThemeModeProvider>
        <App />
      </ThemeModeProvider>
    </AppQueryClientProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
registerSW();
