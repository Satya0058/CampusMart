import React from 'react';
import { Heart, Repeat, Calendar, ShoppingBag, ArrowUpRight, Star } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import ItemImage from './common/ItemImage';

export default function ItemCard({ item, onClick, onFavoriteChange }) {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const handleFavoriteClick = async (e) => {
    e.stopPropagation();
    try {
      const res = await api.toggleFavorite(item.id);
      showToast(res.is_favorited ? "Added to your favorites ❤️" : "Removed from favorites", "info");
      if (onFavoriteChange) onFavoriteChange(item.id, res.is_favorited);
    } catch (err) {
      showToast("Please sign in to save favorites", "error");
    }
  };

  const primaryImage = item.images && item.images.length > 0 ? item.images[0].image_url : null;

  return (
    <div
      onClick={onClick}
      style={{
        background: "#FFFFFF",
        border: "1px solid var(--border-light)",
        borderRadius: "var(--radius-lg)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        transition: "all 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
        position: "relative",
        boxShadow: "var(--shadow-subtle)"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-4px)";
        e.currentTarget.style.boxShadow = "var(--shadow-card)";
        e.currentTarget.style.borderColor = "rgba(0, 0, 0, 0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "var(--shadow-subtle)";
        e.currentTarget.style.borderColor = "var(--border-light)";
      }}
    >
      {/* Top Image Container */}
      <div style={{ position: "relative", width: "100%", height: "190px", overflow: "hidden", background: "#F2F3EE" }}>
        <ItemImage
          src={primaryImage}
          alt={item.title}
          iconSize={32}
        />

        {/* Favorite Heart Button */}
        <button
          onClick={handleFavoriteClick}
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            width: "34px",
            height: "34px",
            borderRadius: "50%",
            background: "#FFFFFF",
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: item.is_favorited ? "#f87171" : "#121311",
            transition: "all 0.15s"
          }}
          title="Save Item"
        >
          <Heart size={15} fill={item.is_favorited ? "#f87171" : "none"} strokeWidth={2.2} />
        </button>

        {/* Discount Badge */}
        {item.discount_percentage && item.discount_percentage > 0 && (
          <div style={{
            position: "absolute",
            top: "12px",
            left: "12px",
            background: "#171816",
            color: "#C8EA3E",
            fontSize: "0.72rem",
            fontWeight: 800,
            padding: "4px 9px",
            borderRadius: "var(--radius-full)",
            boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
          }}>
            {item.discount_percentage}% OFF
          </div>
        )}

        {/* Available Modes Pills Bar */}
        <div style={{
          position: "absolute",
          bottom: "10px",
          left: "10px",
          display: "flex",
          gap: "5px"
        }}>
          {item.is_sell && (
            <span style={{
              fontSize: "0.64rem",
              fontWeight: 800,
              padding: "2px 8px",
              borderRadius: "var(--radius-full)",
              background: "#FFFFFF",
              color: "#121311",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
            }}>
              BUY
            </span>
          )}
          {item.is_rent && (
            <span style={{
              fontSize: "0.64rem",
              fontWeight: 800,
              padding: "2px 8px",
              borderRadius: "var(--radius-full)",
              background: "#38BDF8",
              color: "#121311",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
            }}>
              RENT
            </span>
          )}
          {item.is_exchange && (
            <span style={{
              fontSize: "0.64rem",
              fontWeight: 800,
              padding: "2px 8px",
              borderRadius: "var(--radius-full)",
              background: "#A594F9",
              color: "#121311",
              boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
            }}>
              EXCHANGE
            </span>
          )}
        </div>
      </div>

      {/* Item Body Content */}
      <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
        <div>
          {/* Category & Condition */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
            <span style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "var(--text-dark-muted)", fontWeight: 700 }}>
              {item.category}
            </span>
            <span style={{ fontSize: "0.72rem", color: "var(--text-dark-muted)", fontWeight: 600 }}>
              {item.condition}
            </span>
          </div>

          {/* Title */}
          <h3 style={{
            fontSize: "0.95rem",
            fontWeight: 800,
            lineHeight: "1.35",
            marginBottom: "8px",
            color: "var(--text-dark-primary)",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden"
          }}>
            {item.title}
          </h3>
        </div>

        {/* Pricing & Seller Section */}
        <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid rgba(0,0,0,0.05)" }}>
          {/* Prices */}
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "6px" }}>
            {(item.selling_price != null || item.rental_price_per_day != null) ? (
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                <span style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-dark-primary)" }}>
                  ₹{item.selling_price != null ? item.selling_price : item.rental_price_per_day}
                </span>
                {item.original_price && (
                  <span style={{ fontSize: "0.78rem", color: "var(--text-dark-muted)", textDecoration: "line-through" }}>
                    ₹{item.original_price}
                  </span>
                )}
                {item.is_rent && !item.is_sell && (
                  <span style={{ fontSize: "0.72rem", color: "#38BDF8", fontWeight: 700 }}>/day</span>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{
                  fontSize: "0.78rem",
                  fontWeight: 800,
                  color: "#9333EA",
                  background: "#F3E8FF",
                  padding: "3px 9px",
                  borderRadius: "var(--radius-full)"
                }}>
                  Direct Exchange
                </span>
              </div>
            )}

            {item.savings_amount && (
              <span style={{ fontSize: "0.72rem", color: "#16A34A", fontWeight: 800 }}>
                Save ₹{item.savings_amount}
              </span>
            )}
          </div>

          {/* Seller Trust Info */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.74rem", color: "var(--text-dark-muted)" }}>
            <span style={{ fontWeight: 600, color: "var(--text-dark-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "140px" }}>
              {item.seller?.full_name}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "3px", color: "#121311", fontWeight: 700 }}>
              <Star size={12} fill="#C8EA3E" color="#121311" />
              <span>{item.seller?.rating || "5.0"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
