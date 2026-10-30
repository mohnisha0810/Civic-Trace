import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import { CivicDataProvider } from './context/CivicDataContext';
import { AppContent } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <CivicDataProvider>
        <AppContent />
      </CivicDataProvider>
    </AuthProvider>
  </React.StrictMode>
);
