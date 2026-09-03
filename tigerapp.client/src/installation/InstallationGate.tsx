import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { FiAlertTriangle, FiLoader } from 'react-icons/fi';
import apiClient from '@/api/apiClient';

export interface InstallationStatus {
  installed: boolean;
  databaseReachable: boolean | null;
  databaseProvider: string;
  message: string | null;
}

interface InstallationContextValue {
  status: InstallationStatus;
  refresh: () => Promise<void>;
}

const InstallationContext = createContext<InstallationContextValue | null>(null);

export const InstallationGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [status, setStatus] = useState<InstallationStatus | null>(null);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    const response = await apiClient.get<InstallationStatus>('/installation/status');
    setStatus(response.data);
    setError(false);
  }, []);

  useEffect(() => {
    let active = true;
    apiClient.get<InstallationStatus>('/installation/status')
      .then((response) => {
        if (active) setStatus(response.data);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => { active = false; };
  }, []);

  if (error) {
    return (
      <main className="install-state-page" dir="rtl">
        <div className="install-state-card" role="alert">
          <FiAlertTriangle aria-hidden="true" />
          <h1>ارتباط با سرویس نصب برقرار نشد</h1>
          <p>سرویس API و تنظیمات PostgreSQL را بررسی کنید و دوباره تلاش کنید.</p>
          <button type="button" onClick={() => window.location.reload()}>تلاش دوباره</button>
        </div>
      </main>
    );
  }

  if (!status) {
    return (
      <main className="install-state-page" aria-label="در حال بررسی وضعیت نصب">
        <div className="install-loading"><FiLoader aria-hidden="true" /><span>در حال بررسی نصب امن سیستم…</span></div>
      </main>
    );
  }

  if (!status.installed && location.pathname !== '/install')
    return <Navigate to="/install" replace />;
  if (status.installed && location.pathname === '/install')
    return <Navigate to="/login" replace />;

  return (
    <InstallationContext.Provider value={{ status, refresh }}>
      {children}
    </InstallationContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useInstallation = () => {
  const context = useContext(InstallationContext);
  if (!context) throw new Error('useInstallation must be used within InstallationGate');
  return context;
};
