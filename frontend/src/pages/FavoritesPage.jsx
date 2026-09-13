import React, { useState, useEffect } from 'react';
import { Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import ItemCard from '../components/ItemCard';

export default function FavoritesPage({ onSelectItem, onNavigate }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const items = await api.getFavorites();
      setFavorites(items);
    } catch (err) {
      console.error("Failed to load favorites", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const handleFavoriteChange = (itemId, isFav) => {
    if (!isFav) {
      setFavorites(prev => prev.filter(i => i.id !== itemId));
    }
  };

  return (
    <div style={{ color: "var(--text-primary)" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#f87171", fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase" }}>
          <Heart size={16} fill="#f87171" />
          <span>Saved Items</span>
        </div>
        <h1 style={{ fontSize: "2.1rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "6px" }}>
          My Favorites
        </h1>
        <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)" }}>
          Items you've bookmarked for later consideration.
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
          Loading saved favorites...
        </div>
      ) : favorites.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "60px 20px",
          background: "var(--bg-surface)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-subtle)"
        }}>
          <Heart size={48} color="var(--text-muted)" style={{ margin: "0 auto 16px" }} />
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "8px" }}>No saved items yet</h3>
          <p style={{ fontSize: "0.86rem", color: "var(--text-secondary)", marginBottom: "20px" }}>
            Click the heart icon on any item in the marketplace to save it here.
          </p>
          <button className="btn-primary" onClick={() => onNavigate("marketplace")}>
            <span>Browse Marketplace</span>
            <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "20px"
        }}>
          {favorites.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onClick={() => onSelectItem(item)}
              onFavoriteChange={handleFavoriteChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

