import React from 'react';
import { CheckCheck, MessageSquare, Repeat, Calendar, ShoppingBag, Sparkles, X } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

export default function NotificationDropdown({ onClose, onNavigate }) {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();

  const getIcon = (type) => {
    switch (type) {
      case "exchange":
        return <Repeat size={16} color="#121311" />;
      case "rental":
        return <Calendar size={16} color="#2563eb" />;
      case "message":
        return <MessageSquare size={16} color="#9333ea" />;
      case "sale":
      case "buy_request":
        return <ShoppingBag size={16} color="#16a34a" />;
      case "request":
        return <Sparkles size={16} color="#d97706" />;
      default:
        return <Sparkles size={16} color="#121311" />;
    }
  };

  const handleItemClick = (notif) => {
    markAsRead(notif.id);
    if (notif.link) {
      const page = notif.link.replace("/", "");
      onNavigate(page);
    }
    onClose();
  };

  return (
    <div style={{
      position: "absolute",
      top: "100%",
      right: 0,
      marginTop: "10px",
      width: "360px",
      background: "#FFFFFF",
      border: "1px solid var(--border-light)",
      borderRadius: "var(--radius-lg)",
      boxShadow: "0 16px 40px rgba(0, 0, 0, 0.12)",
      zIndex: 250,
      overflow: "hidden",
      animation: "fadeIn 0.15s ease"
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 18px",
        borderBottom: "1px solid var(--border-light)",
        background: "#F7F8F4"
      }}>
        <span style={{ fontSize: "0.92rem", fontWeight: 800, color: "#121311" }}>Notifications</span>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button 
            onClick={markAllAsRead} 
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "4px", 
              fontSize: "0.74rem", 
              color: "#121311", 
              fontWeight: 700,
              background: "rgba(200, 234, 62, 0.3)",
              padding: "4px 8px",
              borderRadius: "var(--radius-full)",
              border: "none",
              cursor: "pointer"
            }}
          >
            <CheckCheck size={13} />
            <span>Mark all read</span>
          </button>
          <button onClick={onClose} style={{ color: "#8E928A", background: "none", border: "none", cursor: "pointer" }}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* List */}
      <div style={{ maxHeight: "380px", overflowY: "auto" }}>
        {notifications.length === 0 ? (
          <div style={{ padding: "34px 20px", textAlign: "center", color: "#8E928A", fontSize: "0.85rem" }}>
            No notifications yet. You're all caught up!
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleItemClick(n)}
              style={{
                display: "flex",
                gap: "12px",
                padding: "14px 18px",
                borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
                background: n.is_read ? "transparent" : "rgba(200, 234, 62, 0.09)",
                cursor: "pointer",
                transition: "background 0.15s"
              }}
            >
              <div style={{
                width: "34px",
                height: "34px",
                borderRadius: "10px",
                background: "#F4F5F0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0
              }}>
                {getIcon(n.type)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
                  <span style={{ fontSize: "0.84rem", fontWeight: n.is_read ? 600 : 800, color: "#121311" }}>
                    {n.title}
                  </span>
                  {!n.is_read && (
                    <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#C8EA3E", border: "1px solid #8FA81C", flexShrink: 0 }} />
                  )}
                </div>
                <div style={{ fontSize: "0.78rem", color: "#5A5E56", marginTop: "3px", lineHeight: "1.4" }}>
                  {n.message}
                </div>
                <div style={{ fontSize: "0.68rem", color: "#8E928A", marginTop: "4px" }}>
                  {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
