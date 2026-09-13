import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toast, setToast] = useState(null); // { message, type: 'success'|'info'|'warning'|'error' }

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.getNotifications();
      setNotifications(data);
      const unread = data.filter(n => !n.is_read).length;
      setUnreadCount(unread);
    } catch (e) {
      // Ignore background notification fetch errors
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 12000); // 12-sec refresh
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const markAsRead = async (id) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      showToast("All notifications marked as read", "info");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        toast,
        showToast,
        markAsRead,
        markAllAsRead,
        refreshNotifications: fetchNotifications
      }}
    >
      {children}
      {toast && (
        <div style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          background: "#12140e",
          border: "1px solid #B5D04D",
          color: "#FEFEFE",
          padding: "14px 20px",
          borderRadius: "12px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.8), 0 0 20px rgba(181, 208, 77, 0.2)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          zIndex: 9999,
          fontSize: "0.92rem",
          fontWeight: 600,
          animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
        }}>
          <span style={{
            display: "inline-block",
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: toast.type === "error" ? "#f87171" : "#B5D04D"
          }} />
          {toast.message}
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return context;
};

