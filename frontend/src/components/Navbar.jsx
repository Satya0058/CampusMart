import React, { useState } from 'react';
import { 
  Search, 
  Bell, 
  ChevronDown, 
  ShoppingBag, 
  Store, 
  LogOut, 
  User as UserIcon,
  LogIn,
  UserPlus
} from 'lucide-react';
import { useMarketplaceMode } from '../context/MarketplaceModeContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import NotificationDropdown from './NotificationDropdown';

export default function Navbar({ onNavigate, currentPage, onOpenAddItem, onOpenPostRequest }) {
  const { mode, isBuyer, isSeller, setMode } = useMarketplaceMode();
  const { user, logout, openAuthModal } = useAuth();
  const { unreadCount, showToast } = useNotifications();

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSwitchConfirm, setShowSwitchConfirm] = useState(false);
  const [switchTargetMode, setSwitchTargetMode] = useState("buyer");

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate("marketplace", { query: searchQuery.trim() });
    }
  };

  const handleSignOut = () => {
    logout();
    setProfileDropdownOpen(false);
    showToast("Signed out successfully", "info");
    onNavigate("home");
  };

  return (
    <header style={{
      padding: "20px 30px 10px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "16px",
      flexWrap: "wrap",
      borderBottom: "1px solid rgba(0,0,0,0.03)"
    }}>
      {/* LEFT: User Profile Section OR Sign In / Register if logged out */}
      <div style={{ position: "relative" }}>
        {user ? (
          <div 
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              cursor: "pointer",
              userSelect: "none"
            }}
          >
            <img
              src={user.profile_image || `https://api.dicebear.com/7.x/initials/svg?seed=${user.full_name}&backgroundColor=c8ea3e&textColor=121311`}
              alt={user.full_name}
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid #FFFFFF",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
              }}
            />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-dark-primary)" }}>
                  {user.full_name}
                </span>
                <ChevronDown size={14} color="var(--text-dark-muted)" />
              </div>
              <div style={{ fontSize: "0.76rem", color: "var(--text-dark-muted)" }}>
                {user.email}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={() => openAuthModal("login")}
              className="btn-outline"
              style={{ padding: "8px 16px", fontSize: "0.82rem" }}
            >
              <LogIn size={15} />
              <span>Sign In</span>
            </button>
            <button
              onClick={() => openAuthModal("register")}
              className="btn-primary"
              style={{ padding: "8px 18px", fontSize: "0.82rem" }}
            >
              <UserPlus size={15} />
              <span>Register</span>
            </button>
          </div>
        )}

        {/* Profile Dropdown */}
        {profileDropdownOpen && user && (
          <div style={{
            position: "absolute",
            top: "100%",
            left: 0,
            marginTop: "10px",
            width: "240px",
            background: "#FFFFFF",
            border: "1px solid var(--border-light)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-card)",
            zIndex: 200,
            padding: "8px",
            animation: "fadeIn 0.15s"
          }}>
            <div style={{ padding: "8px 10px", borderBottom: "1px solid rgba(0,0,0,0.05)", marginBottom: "4px" }}>
              <div style={{ fontWeight: 800, fontSize: "0.88rem" }}>{user.full_name}</div>
              <div style={{ fontSize: "0.74rem", color: "var(--text-dark-muted)" }}>{user.department || "Student Member"}</div>
            </div>
            <div 
              onClick={() => { onNavigate("profile"); setProfileDropdownOpen(false); }}
              style={{ padding: "8px 10px", borderRadius: "8px", cursor: "pointer", fontSize: "0.84rem", display: "flex", alignItems: "center", gap: "8px", color: "var(--text-dark-primary)" }}
            >
              <UserIcon size={15} />
              <span>Student Profile</span>
            </div>
            <div 
              onClick={handleSignOut}
              style={{ padding: "8px 10px", borderRadius: "8px", cursor: "pointer", fontSize: "0.84rem", display: "flex", alignItems: "center", gap: "8px", color: "#ef4444", fontWeight: 700 }}
            >
              <LogOut size={15} />
              <span>Sign Out</span>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: Search Pill, Mode Toggle, Notification Bell, and Date Filter */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        {/* --- SIGNATURE DUAL-WORKSPACE MODE TOGGLE --- */}
        <div 
          role="radiogroup" 
          aria-label="Mode Switch"
          style={{
            display: "inline-flex",
            position: "relative",
            background: "#FFFFFF",
            padding: "3px",
            borderRadius: "var(--radius-full)",
            border: "1px solid rgba(0,0,0,0.06)",
            boxShadow: "0 2px 6px rgba(0,0,0,0.02)"
          }}
        >
          <div style={{
            position: "absolute",
            top: "3px",
            bottom: "3px",
            left: isBuyer ? "3px" : "calc(50%)",
            width: "calc(50% - 3px)",
            backgroundColor: "#171816",
            borderRadius: "var(--radius-full)",
            transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            pointerEvents: "none"
          }} />

          <button
            type="button"
            role="radio"
            aria-checked={isBuyer}
            onClick={() => {
              if (isSeller) {
                setSwitchTargetMode("buyer");
                setShowSwitchConfirm(true);
              }
            }}
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              borderRadius: "var(--radius-full)",
              fontSize: "0.78rem",
              fontWeight: 800,
              color: isBuyer ? "#C8EA3E" : "var(--text-dark-secondary)",
              transition: "color 0.2s",
              cursor: isSeller ? "pointer" : "default"
            }}
          >
            <ShoppingBag size={13} />
            <span>BUYER</span>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={isSeller}
            onClick={() => {
              if (isBuyer) {
                setSwitchTargetMode("seller");
                setShowSwitchConfirm(true);
              }
            }}
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              borderRadius: "var(--radius-full)",
              fontSize: "0.78rem",
              fontWeight: 800,
              color: isSeller ? "#0C87FD" : "var(--text-dark-secondary)",
              transition: "color 0.2s",
              cursor: isBuyer ? "pointer" : "default"
            }}
          >
            <Store size={13} />
            <span>SELLER</span>
          </button>
        </div>

        {/* Integrated Search & Notification Pill matching Dribbble reference shot */}
        <div style={{
          display: "flex",
          alignItems: "center",
          background: "#FFFFFF",
          borderRadius: "var(--radius-full)",
          padding: "4px 8px 4px 14px",
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
          width: "280px",
          gap: "8px"
        }}>
          <Search size={16} color="var(--text-dark-muted)" />
          <form onSubmit={handleSearchSubmit} style={{ flex: 1 }}>
            <input
              type="text"
              placeholder="Search items, books..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                background: "transparent",
                padding: "4px 0",
                fontSize: "0.85rem",
                width: "100%",
                boxShadow: "none"
              }}
            />
          </form>

          {/* Bell with counter badge inside search pill */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => {
                if (!user) {
                  openAuthModal("login");
                } else {
                  setNotifOpen(!notifOpen);
                }
              }}
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                background: "#F4F5F1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-dark-primary)",
                position: "relative"
              }}
              title="Notifications"
            >
              <Bell size={14} />
              {unreadCount > 0 && (
                <span style={{
                  position: "absolute",
                  top: "-2px",
                  right: "-2px",
                  background: isSeller ? "#0C87FD" : "#C8EA3E",
                  color: isSeller ? "#FFFFFF" : "#121311",
                  fontSize: "0.64rem",
                  fontWeight: 900,
                  width: "16px",
                  height: "16px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  {unreadCount}
                </span>
              )}
            </button>
            {notifOpen && <NotificationDropdown onClose={() => setNotifOpen(false)} onNavigate={onNavigate} />}
          </div>
        </div>
      </div>

      {/* Confirmation Modal when switching between Buyer and Seller */}
      {showSwitchConfirm && (
        <div 
          className="modal-overlay" 
          onClick={() => setShowSwitchConfirm(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999
          }}
        >
          <div 
            className="modal-card" 
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "440px",
              width: "90%",
              background: "#161715",
              color: "#FEFEFE",
              borderRadius: "24px",
              padding: "28px",
              border: "1px solid rgba(255, 255, 255, 0.09)",
              boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
              textAlign: "center"
            }}
          >
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: switchTargetMode === "seller" ? "rgba(12, 135, 253, 0.15)" : "rgba(200, 234, 62, 0.15)",
              color: switchTargetMode === "seller" ? "#0C87FD" : "#C8EA3E",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px"
            }}>
              {switchTargetMode === "buyer" ? <ShoppingBag size={28} /> : <Store size={28} />}
            </div>

            <h3 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: "8px" }}>
              {switchTargetMode === "buyer" ? "Switch to Buyer Mode?" : "Switch to Seller Mode?"}
            </h3>
            <p style={{ fontSize: "0.88rem", color: "#9A9C96", lineHeight: 1.5, marginBottom: "24px" }}>
              {switchTargetMode === "buyer"
                ? "You are currently in Seller Studio managing your items. Would you like to switch to the Buyer Marketplace?"
                : "You are currently browsing as a Buyer. Would you like to switch to your Seller Studio to manage your listings and sales?"}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setShowSwitchConfirm(false)}
                style={{
                  padding: "11px 16px",
                  borderRadius: "9999px",
                  background: "rgba(255, 255, 255, 0.08)",
                  color: "#FEFEFE",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  cursor: "pointer"
                }}
              >
                {switchTargetMode === "buyer" ? "Stay as Seller" : "Stay as Buyer"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSwitchConfirm(false);
                  if (switchTargetMode === "buyer") {
                    setMode("buyer");
                    onNavigate("marketplace");
                  } else {
                    setMode("seller");
                    onNavigate("my-listings");
                  }
                }}
                style={{
                  padding: "11px 16px",
                  borderRadius: "9999px",
                  background: switchTargetMode === "seller" ? "#0C87FD" : "#C8EA3E",
                  color: switchTargetMode === "seller" ? "#FFFFFF" : "#121311",
                  fontWeight: 800,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  border: "none"
                }}
              >
                Yes, Switch
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
