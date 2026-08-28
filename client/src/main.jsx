import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@contexts/AuthContext.jsx';
import App from '@/App.jsx';
import ErrorBoundary from '@/components/ErrorBoundary.jsx';
import { initGlobalErrorHandlers } from '@/lib/errorHandler.js';
import '@styles/index.css';

initGlobalErrorHandlers();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
