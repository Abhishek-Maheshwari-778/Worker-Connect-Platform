import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import App from './App';
// LabourBot is now mounted INSIDE each role layout — NOT globally here
// This prevents it showing on landing, login, register pages
import { AuthProvider }         from './context/AuthContext';
import { SocketProvider }       from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider }        from './context/ThemeContext';
import './styles/index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:           1000 * 60 * 2,
      retry:               1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SocketProvider>
            <ThemeProvider>
              <NotificationProvider>
                <App />
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      fontFamily:   'Outfit, sans-serif',
                      fontSize:     '14px',
                      borderRadius: '14px',
                      boxShadow:    '0 4px 16px rgba(0,0,0,0.10)',
                      maxWidth:     '340px',
                    },
                    success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
                    error:   { iconTheme: { primary: '#dc2626', secondary: '#fff' } },
                  }}
                />
              </NotificationProvider>
            </ThemeProvider>
          </SocketProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);