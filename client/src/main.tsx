import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles.css';

// Doctor OCR lives on its own path and is lazy-loaded so the chat bundle
// stays unchanged and neither page pays for the other's code.
const DoctorOcrPage = lazy(() => import('./doctor-ocr/DoctorOcrPage'));

const rootElement = document.getElementById('root');
if (rootElement === null) {
  throw new Error('Root element not found');
}

const isDoctorOcrRoute = window.location.pathname.replace(/\/+$/, '') === '/doctor-ocr';

createRoot(rootElement).render(
  <StrictMode>
    {isDoctorOcrRoute ? (
      <Suspense fallback={null}>
        <DoctorOcrPage />
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
);
