import React, { useState } from 'react';
import { 
  Heart, 
  Share2, 
  ShieldCheck, 
  ShoppingBag, 
  Calendar, 
  Repeat, 
  MessageSquare, 
  ExternalLink, 
  Star, 
  CheckCircle2, 
  ArrowLeft,
  AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

import ItemImage from '../components/common/ItemImage';

export default function ItemDetailsPage({ 
  item, 
  onBack, 
  onOpenBuyModal, 
  onOpenRentalModal, 
  onOpenExchangeModal, 
  onOpenMessageModal 
}) {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [isFavorited, setIsFavorited] = useState(item.is_favorited || false);

  const rawImages = item.images && item.images.length > 0 
    ? item.images.map(img => img.image_url).filter(Boolean)
    : [];

  const handleToggleFavorite = async () => {
    try {
      const res = await api.toggleFavorite(item.id);
      setIsFavorited(res.is_favorited);
      showToast(res.is_favorited ? "Saved to your favorites ❤️" : "Removed from favorites", "info");
    } catch (e) {
      showToast("Please login to save favorites", "error");
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast("Listing link copied to clipboard! 📋", "info");
    }
  };

  const isMyOwnItem = user?.id === item.seller_id;

  return (
    <div style={{ color: "var(--text-primary)" }}>
      {/* Back Button */}
      <button
        onClick={onBack}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          color: "var(--text-secondary)",
          fontSize: "0.85rem",
          fontWeight: 600,
          marginBottom: "20px"
        }}
      >
        <ArrowLeft size={16} />
        <span>Back to listings</span>
      </button>

      {/* Main Two-Column Layout */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
        gap: "36px",
        alignItems: "start"
      }}>
        {/* LEFT: Image Gallery */}
        <div>
          {/* Main Large Image */}
          <div style={{
            width: "100%",
            height: "400px",
            borderRadius: "var(--radius-xl)",
            overflow: "hidden",
            background: "#F2F3EE",
            border: "1px solid var(--border-light)",
            position: "relative",
            marginBottom: "14px"
          }}>
            <ItemImage
              src={rawImages[selectedImageIdx]}
              alt={item.title}
              iconSize={48}
            />

            {item.discount_percentage && (
              <div style={{
                position: "absolute",
                top: "16px",
                left: "16px",
                background: "rgba(248, 113, 113, 0.95)",
                color: "#070706",
                fontWeight: 800,
                fontSize: "0.82rem",
                padding: "4px 10px",
                borderRadius: "var(--radius-sm)"
              }}>
                {item.discount_percentage}% OFF
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {rawImages.length > 1 && (
            <div style={{ display: "flex", gap: "12px", overflowX: "auto" }}>
              {rawImages.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedImageIdx(idx)}
                  style={{
                    width: "72px",
                    height: "72px",
                    borderRadius: "var(--radius-md)",
                    overflow: "hidden",
                    cursor: "pointer",
                    border: `2px solid ${selectedImageIdx === idx ? "#C8EA3E" : "transparent"}`
                  }}
                >
                  <ItemImage src={img} alt="Thumbnail" showLabel={false} iconSize={20} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Details, Pricing, Actions, Seller Trust */}
        <div>
          {/* Category & Status */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.8rem", color: "#B5D04D", fontWeight: 700, textTransform: "uppercase" }}>
              {item.category} • {item.condition}
            </span>
            <span style={{
              fontSize: "0.74rem",
              padding: "3px 10px",
              borderRadius: "var(--radius-full)",
              background: "rgba(52, 211, 153, 0.12)",
              color: "#34d399",
              fontWeight: 700
            }}>
              {item.availability}
            </span>
          </div>

          {/* Title */}
          <h1 style={{ fontSize: "1.85rem", fontWeight: 800, lineHeight: "1.25", marginBottom: "14px" }}>
            {item.title}
          </h1>

          {/* Price & Savings */}
          <div style={{
            display: "flex",
            alignItems: "baseline",
            gap: "14px",
            padding: "16px 20px",
            background: "var(--bg-surface)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border-subtle)",
            marginBottom: "20px"
          }}>
            {(item.selling_price != null || item.rental_price_per_day != null) ? (
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                <span style={{ fontSize: "1.8rem", fontWeight: 800, color: "#FEFEFE" }}>
                  ₹{item.selling_price != null ? item.selling_price : item.rental_price_per_day}
                </span>
                {item.original_price && (
                  <span style={{ fontSize: "1.05rem", color: "var(--text-muted)", textDecoration: "line-through" }}>
                    ₹{item.original_price}
                  </span>
                )}
                {item.is_rent && !item.is_sell && (
                  <span style={{ fontSize: "0.85rem", color: "#60a5fa", fontWeight: 700 }}>/day rental</span>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{
                  fontSize: "1rem",
                  fontWeight: 800,
                  color: "#c084fc",
                  background: "rgba(192, 132, 252, 0.15)",
                  padding: "6px 14px",
                  borderRadius: "var(--radius-md)",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <Repeat size={18} />
                  Peer Exchange Listing
                </span>
                <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  (Direct item barter • No monetary price)
                </span>
              </div>
            )}

            {item.savings_amount && (
              <span style={{
                fontSize: "0.82rem",
                fontWeight: 700,
                color: "#34d399",
                background: "rgba(52, 211, 153, 0.15)",
                padding: "3px 8px",
                borderRadius: "var(--radius-sm)"
              }}>
                You Save ₹{item.savings_amount}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px" }}>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {item.is_sell && (
                <button
                  className="btn-primary"
                  style={{ flex: 1, minWidth: "160px", padding: "12px 20px" }}
                  onClick={onOpenBuyModal}
                  disabled={isMyOwnItem}
                >
                  <ShoppingBag size={18} />
                  <span>Buy Item</span>
                </button>
              )}

              {item.is_rent && (
                <button
                  className="btn-secondary"
                  style={{ flex: 1, minWidth: "160px", padding: "12px 20px", color: "#60a5fa", borderColor: "rgba(96, 165, 250, 0.3)" }}
                  onClick={onOpenRentalModal}
                  disabled={isMyOwnItem}
                >
                  <Calendar size={18} />
                  <span>Rent Item</span>
                </button>
              )}

              {item.is_exchange && (
                <button
                  className="btn-secondary"
                  style={{ flex: 1, minWidth: "160px", padding: "12px 20px", color: "#c084fc", borderColor: "rgba(192, 132, 252, 0.3)" }}
                  onClick={onOpenExchangeModal}
                  disabled={isMyOwnItem}
                >
                  <Repeat size={18} />
                  <span>Propose Exchange</span>
                </button>
              )}
            </div>

            {/* Secondary actions: Chat, Favorite, Share */}
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                className="btn-secondary"
                style={{ flex: 1 }}
                onClick={onOpenMessageModal}
                disabled={isMyOwnItem}
              >
                <MessageSquare size={16} />
                <span>Message Seller</span>
              </button>

              <button
                className="btn-secondary"
                onClick={handleToggleFavorite}
                style={{ padding: "10px 14px" }}
                title="Save Item"
              >
                <Heart size={16} fill={isFavorited ? "#f87171" : "none"} color={isFavorited ? "#f87171" : "currentColor"} />
              </button>

              <button
                className="btn-secondary"
                onClick={handleShare}
                style={{ padding: "10px 14px" }}
                title="Share Listing"
              >
                <Share2 size={16} />
              </button>
            </div>
          </div>

          {/* Description */}
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "8px" }}>Item Description</h3>
            <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: "1.6", whiteSpace: "pre-line" }}>
              {item.description}
            </p>
          </div>

          {/* Exchange Preference (if exchangeable) */}
          {item.is_exchange && item.exchange_preference && (
            <div style={{
              padding: "14px 18px",
              background: "rgba(192, 132, 252, 0.08)",
              border: "1px solid rgba(192, 132, 252, 0.25)",
              borderRadius: "var(--radius-md)",
              marginBottom: "24px"
            }}>
              <div style={{ fontSize: "0.75rem", color: "#c084fc", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>
                Owner's Exchange Wishlist
              </div>
              <div style={{ fontSize: "0.88rem", color: "var(--text-primary)" }}>
                {item.exchange_preference}
              </div>
            </div>
          )}

          {/* Product URL */}
          {item.product_url && (
            <div style={{ marginBottom: "24px" }}>
              <a
                href={item.product_url}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.82rem",
                  color: "#B5D04D",
                  textDecoration: "none"
                }}
              >
                <span>View official manufacturer / bookstore reference</span>
                <ExternalLink size={13} />
              </a>
            </div>
          )}

          {/* Seller Trust Profile Card */}
          <div style={{
            padding: "20px",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)"
          }}>
            <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700, marginBottom: "12px" }}>
              Seller Information
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <img
                src={item.seller?.profile_image || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"}
                alt={item.seller?.full_name}
                style={{ width: "52px", height: "52px", borderRadius: "50%", objectFit: "cover" }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h4 style={{ fontSize: "1rem", fontWeight: 700 }}>{item.seller?.full_name}</h4>
                  <span className="badge badge-verified" style={{ fontSize: "0.62rem" }}>
                    Verified Student
                  </span>
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  {item.seller?.department} • {item.seller?.year ? item.seller.year.replace(/\s*\(.*?\)/g, "").trim() : ""}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "0.76rem", color: "var(--text-secondary)", marginTop: "6px" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: "3px", color: "#B5D04D" }}>
                    <Star size={13} fill="#B5D04D" />
                    <strong>{item.seller?.rating || "4.9"}</strong> ({item.seller?.review_count || 12} reviews)
                  </span>
                  <span>•</span>
                  <span>{item.seller?.transactions_count || 18} campus trades</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

