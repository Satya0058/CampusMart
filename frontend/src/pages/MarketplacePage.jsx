import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  X, 
  ShoppingBag, 
  Calendar, 
  Repeat, 
  Sparkles,
  BookOpen,
  Cpu,
  FlaskConical,
  PenTool,
  Armchair,
  Trophy,
  Headphones,
  Lamp,
  HelpCircle,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import ItemCard from '../components/ItemCard';

const CATEGORIES = [
  { id: "All", label: "All Items", icon: Sparkles },
  { id: "Books", label: "Books", icon: BookOpen },
  { id: "Calculators", label: "Calculators", icon: Cpu },
  { id: "Electronics", label: "Electronics", icon: Cpu },
  { id: "Lab Equipment", label: "Lab Gear", icon: FlaskConical },
  { id: "Stationery", label: "Stationery", icon: PenTool },
  { id: "Accessories", label: "Accessories", icon: Headphones },
  { id: "Hostel Essentials", label: "Hostel Essentials", icon: Lamp },
  { id: "Sports", label: "Sports", icon: Trophy },
  { id: "Furniture", label: "Furniture", icon: Armchair },
  { id: "Others", label: "Others", icon: HelpCircle },
];

export default function MarketplacePage({ initialQuery = "", initialMode = "", onSelectItem, onOpenPostRequest }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [query, setQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedMode, setSelectedMode] = useState(initialMode || "all"); // all, buy, rent, exchange
  const [selectedCondition, setSelectedCondition] = useState("All");
  const [maxPrice, setMaxPrice] = useState("");

  const fetchItems = async () => {
    try {
      setLoading(true);
      const params = {
        q: query || undefined,
        category: selectedCategory !== "All" ? selectedCategory : undefined,
        mode: selectedMode !== "all" ? selectedMode : undefined,
        condition: selectedCondition !== "All" ? selectedCondition : undefined,
        max_price: maxPrice ? parseFloat(maxPrice) : undefined,
        status_filter: "active"
      };

      const data = await api.getItems(params);
      // Ensure the seller does not see their own items when browsing as a buyer
      const buyerOnlyItems = user ? data.filter(it => it.seller_id !== user.id) : data;
      setItems(buyerOnlyItems);
    } catch (err) {
      console.error("Failed to load marketplace items", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [selectedCategory, selectedMode, selectedCondition, maxPrice]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchItems();
  };

  const handleResetFilters = () => {
    setQuery("");
    setSelectedCategory("All");
    setSelectedMode("all");
    setSelectedCondition("All");
    setMaxPrice("");
    fetchItems();
  };

  return (
    <div style={{ color: "var(--text-primary)" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "16px",
        marginBottom: "24px"
      }}>
        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "6px" }}>
            Campus Marketplace
          </h1>
          <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
            Browse verified student items available for purchase, rental, or peer exchange.
          </p>
        </div>

        {onOpenPostRequest && (
          <button
            onClick={onOpenPostRequest}
            className="btn-primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              borderRadius: "var(--radius-full)",
              fontSize: "0.85rem",
              fontWeight: 800
            }}
          >
            <Sparkles size={16} />
            <span>Request an Item</span>
          </button>
        )}
      </div>

      {/* Category Pills Slider */}
      <div style={{
        display: "flex",
        gap: "10px",
        overflowX: "auto",
        paddingBottom: "12px",
        marginBottom: "24px"
      }}>
        {CATEGORIES.map((cat) => {
          const IconComp = cat.icon;
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 16px",
                borderRadius: "var(--radius-full)",
                background: isSelected ? "var(--accent-primary)" : "var(--bg-surface-elevated)",
                color: isSelected ? "#070706" : "var(--text-secondary)",
                fontWeight: 700,
                fontSize: "0.82rem",
                border: `1px solid ${isSelected ? "var(--accent-primary)" : "var(--border-subtle)"}`,
                whiteSpace: "nowrap",
                transition: "all var(--transition-fast)"
              }}
            >
              <IconComp size={15} color={isSelected ? "#070706" : "var(--accent-primary)"} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search & Filter Controls Bar */}
      <div style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        padding: "16px 20px",
        marginBottom: "28px",
        display: "flex",
        flexWrap: "wrap",
        gap: "14px",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        {/* Search input */}
        <form onSubmit={handleSearchSubmit} style={{ flex: 1, minWidth: "260px", position: "relative" }}>
          <Search size={17} color="var(--text-muted)" style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            placeholder="Search keywords, author, edition..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ width: "100%", paddingLeft: "42px" }}
          />
        </form>

        {/* Mode Selector pills */}
        <div style={{ display: "flex", gap: "6px" }}>
          {["all", "buy", "rent", "exchange"].map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMode(m)}
              style={{
                padding: "7px 14px",
                borderRadius: "var(--radius-md)",
                fontSize: "0.78rem",
                fontWeight: 700,
                textTransform: "uppercase",
                background: selectedMode === m ? "var(--accent-primary-muted)" : "var(--bg-surface-elevated)",
                color: selectedMode === m ? "#B5D04D" : "var(--text-secondary)",
                border: `1px solid ${selectedMode === m ? "var(--accent-primary)" : "var(--border-subtle)"}`
              }}
            >
              {m === "all" ? "All Modes" : m}
            </button>
          ))}
        </div>

        {/* Condition & Max Price */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <select
            value={selectedCondition}
            onChange={(e) => setSelectedCondition(e.target.value)}
            style={{ width: "130px", padding: "8px 12px", fontSize: "0.82rem" }}
          >
            <option value="All">All Conditions</option>
            <option value="Brand New">Brand New</option>
            <option value="Like New">Like New</option>
            <option value="Good">Good</option>
            <option value="Fair">Fair</option>
          </select>

          <input
            type="number"
            placeholder="Max Price (₹)"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            style={{ width: "120px", padding: "8px 12px", fontSize: "0.82rem" }}
          />

          {(query || selectedCategory !== "All" || selectedMode !== "all" || selectedCondition !== "All" || maxPrice) && (
            <button
              className="btn-secondary"
              onClick={handleResetFilters}
              style={{ padding: "8px 12px", fontSize: "0.82rem" }}
              title="Reset all filters"
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Results grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "var(--text-muted)" }}>
          Loading campus listings...
        </div>
      ) : items.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "60px 20px",
          background: "var(--bg-surface)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-subtle)"
        }}>
          <ShoppingBag size={48} color="var(--text-muted)" style={{ margin: "0 auto 16px" }} />
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "8px" }}>No matching items found</h3>
          <p style={{ fontSize: "0.86rem", color: "var(--text-secondary)", marginBottom: "20px" }}>
            Try broadening your search keywords, or post an open student request so peers can offer it to you!
          </p>
          <button className="btn-secondary" onClick={handleResetFilters}>
            Clear Filters
          </button>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "20px"
        }}>
          {items.map((item) => (
            <ItemCard key={item.id} item={item} onClick={() => onSelectItem(item)} />
          ))}
        </div>
      )}
    </div>
  );
}

