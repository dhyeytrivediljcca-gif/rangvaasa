import React, { useState, useEffect, useCallback } from 'react';
import { AdminLogin } from './AdminLogin';
import { AdminDashboard } from './AdminDashboard';
import './AdminPortal.css';

interface AdminPortalProps {
  onExit: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onExit }) => {
  // We keep the auth token in memory or session state (never storing passwords)
  const [authToken, setAuthToken] = useState<string | null>(() => {
    return sessionStorage.getItem('rangvaasa_admin_token');
  });
  const [verifyingSession, setVerifyingSession] = useState<boolean>(true);

  // Validate session on mount
  useEffect(() => {
    const verifyToken = async () => {
      const stored = sessionStorage.getItem('rangvaasa_admin_token');
      if (!stored) {
        setAuthToken(null);
        setVerifyingSession(false);
        return;
      }

      try {
        const res = await fetch('/api/admin/session', {
          headers: {
            Authorization: `Bearer ${stored}`,
          },
        });

        if (res.ok) {
          setAuthToken(stored);
        } else {
          sessionStorage.removeItem('rangvaasa_admin_token');
          setAuthToken(null);
        }
      } catch (err) {
        sessionStorage.removeItem('rangvaasa_admin_token');
        setAuthToken(null);
      } finally {
        setVerifyingSession(false);
      }
    };

    verifyToken();
  }, []);

  const handleLoginSuccess = (token: string) => {
    setAuthToken(token);
    sessionStorage.setItem('rangvaasa_admin_token', token);
  };

  const handleLogout = useCallback(async () => {
    if (authToken) {
      try {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
      } catch (err) {
        // Ignore logout errors
      }
    }
    sessionStorage.removeItem('rangvaasa_admin_token');
    setAuthToken(null);
  }, [authToken]);

  if (verifyingSession) {
    return (
      <div className="admin-portal-splash">
        <div className="admin-spin admin-portal-splash-spinner" />
        <p>Verifying secure admin authorization...</p>
      </div>
    );
  }

  if (authToken) {
    return (
      <AdminDashboard
        token={authToken}
        onLogout={handleLogout}
        onExit={onExit}
      />
    );
  }

  return <AdminLogin onSuccess={handleLoginSuccess} onExit={onExit} />;
};
