import React from 'react';
import { 
  LayoutGrid, 
  Home, 
  ShoppingBag, 
  Repeat, 
  Calendar, 
  Sparkles, 
  Heart, 
  MessageSquare, 
  Activity,
  Package,
  PlusCircle,
  TrendingUp,
  BarChart3,
  Users,
  ShieldCheck,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import { useMarketplaceMode } from '../context/MarketplaceModeContext';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ currentPage, onNavigate, onOpenAddItem }) {
  const { mode, isBuyer, isSeller } = useMarketplaceMode();
  const { user } = useAuth();

  const buyerLinks = [
    { id: "marketplace", label: "Marketplace", icon: ShoppingBag },
    { id: "rentals", label: "Campus Rentals", icon: Calendar },
    { id: "messages", label: "Messages", icon: MessageSquare },
  ];

  const sellerLinks = [
    { id: "my-listings", label: "My Listings", icon: Package },
    { id: "add-item", label: "Add Listing", icon: PlusCircle, isAction: true },
    { id: "seller-sales", label: "Orders & Sales", icon: TrendingUp },
    { id: "seller-rentals", label: "Active Rentals", icon: Calendar },
    { id: "requests", label: "Peer Demands", icon: Users },
    { id: "messages", label: "Messages", icon: MessageSquare },
  ];

  const links = isBuyer ? buyerLinks : sellerLinks;

  return (
    <aside className="sidebar" style={{
      width: "230px",
      minWidth: "230px",
      background: "#161715",
      padding: "24px 16px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      userSelect: "none"
    }}>
      <div>
        {/* Logo: CampusMart Shopping Cart Icon */}
        <div 
          onClick={() => onNavigate(isBuyer ? "marketplace" : "my-listings")} 
          style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "10px", 
            cursor: "pointer", 
            marginBottom: "30px",
            paddingLeft: "4px" 
          }}
        >
          <img
            src={isSeller ? "/logo-seller.png" : "/logo-buyer.png"}
            alt="CampusMart"
            style={{
              width: "36px",
              height: "36px",
              objectFit: "contain",
              filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.3))"
            }}
          />
          <span style={{ fontSize: "1.25rem", fontWeight: 800, letterSpacing: "-0.03em", color: "#FEFEFE" }}>
            Campus<span style={{ color: isSeller ? "#0C87FD" : "#C8EA3E" }}>Mart</span>
          </span>
        </div>

        {/* Navigation List */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {links.map((link) => {
            const IconComponent = link.icon;
            const isActive = currentPage === link.id || 
              (isBuyer && (currentPage === "home" || currentPage === "marketplace") && link.id === "marketplace") ||
              (isSeller && (currentPage === "home" || currentPage === "seller-dashboard" || currentPage === "my-listings") && link.id === "my-listings");

            return (
              <button
                key={link.id}
                onClick={() => {
                  if (link.isAction) {
                    onOpenAddItem();
                  } else {
                    onNavigate(link.id);
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 16px",
                  borderRadius: "var(--radius-full)",
                  background: isActive ? "#FFFFFF" : "transparent",
                  color: isActive ? "#121311" : "#9A9C96",
                  fontWeight: isActive ? 800 : 500,
                  fontSize: "0.88rem",
                  boxShadow: isActive ? "0 4px 14px rgba(0,0,0,0.18)" : "none",
                  transition: "all 0.18s ease"
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = "#FEFEFE";
                    e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = "#9A9C96";
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <IconComponent size={18} strokeWidth={isActive ? 2.5 : 1.8} color={isActive ? "#121311" : "currentColor"} />
                  <span>{link.label}</span>
                </div>

                {/* Counter Badge */}
                {link.count !== undefined && link.count > 0 && (
                  <span style={{
                    fontSize: "0.72rem",
                    fontWeight: 800,
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    background: isSeller ? "#0C87FD" : "#C8EA3E",
                    color: isSeller ? "#FFFFFF" : "#121311",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: isSeller ? "0 2px 5px rgba(12, 135, 253, 0.3)" : "0 2px 5px rgba(0,0,0,0.15)"
                  }}>
                    {link.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Docked Footer Area at Bottom of Sidebar to the screen (Both Buyer & Seller) */}
      <div style={{
        paddingTop: "14px",
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        marginTop: "auto"
      }}>
        <button
          onClick={() => onNavigate("exchange")}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "11px 16px",
            borderRadius: "var(--radius-full)",
            background: currentPage === "exchange" ? "#FFFFFF" : "rgba(255, 255, 255, 0.05)",
            color: currentPage === "exchange" ? "#121311" : "#FEFEFE",
            fontWeight: currentPage === "exchange" ? 800 : 600,
            fontSize: "0.88rem",
            border: currentPage === "exchange" ? "none" : "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: currentPage === "exchange" ? "0 4px 14px rgba(0,0,0,0.25)" : "none",
            cursor: "pointer",
            transition: "all 0.18s ease"
          }}
          onMouseEnter={(e) => {
            if (currentPage !== "exchange") {
              e.currentTarget.style.color = "#FEFEFE";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
              e.currentTarget.style.borderColor = isSeller ? "rgba(12, 135, 253, 0.5)" : "rgba(200, 234, 62, 0.4)";
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage !== "exchange") {
              e.currentTarget.style.color = "#9A9C96";
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
              e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.1)";
            }
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Repeat
              size={18}
              strokeWidth={currentPage === "exchange" ? 2.5 : 1.8}
              color={currentPage === "exchange" ? "#121311" : isSeller ? "#0C87FD" : "#C8EA3E"}
            />
            <span>Exchange Center</span>
          </div>
        </button>
      </div>
    </aside>
  );
}
