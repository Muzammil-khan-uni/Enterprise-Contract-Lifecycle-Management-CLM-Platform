import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { store } from './app/store';
import { queryClient } from './shared/lib/queryClient';
import { ThemeProvider } from './shared/hooks/useTheme';
import { ToastProvider } from './shared/hooks/useToast';
import { ConfirmProvider } from './shared/hooks/useConfirm';
import App from './app/App';
import { ErrorBoundary } from './shared/components/ErrorBoundary';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <ToastProvider>
        <ConfirmProvider>
          <Provider store={store}>
            <QueryClientProvider client={queryClient}>
              <BrowserRouter>
                <ErrorBoundary>
                  <App />
                </ErrorBoundary>
              </BrowserRouter>
            </QueryClientProvider>
          </Provider>
        </ConfirmProvider>
      </ToastProvider>
    </ThemeProvider>
  </React.StrictMode>
);
