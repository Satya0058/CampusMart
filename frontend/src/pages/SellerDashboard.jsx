import React, { useState, useEffect } from 'react';
import { 
  Package, 
  PlusCircle, 
  Pause, 
  Play, 
  CheckCircle, 
  Trash2, 
  Calendar, 
  Repeat, 
  ArrowUpRight,
  Sparkles,
  ShoppingBag,
  Clock,
  Filter
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import ItemImage from '../components/common/ItemImage';

export default function SellerDashboard({ onNavigate, onOpenAddItem, onOpenRespondRequest }) {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [myListings, setMyListings] = useState([]);
  const [incomingRentals, setIncomingRentals] = useState([]);
  const [incomingExchanges, setIncomingExchanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all"); // 'all' | 'active' | 'paused' | 'sold'

  const loadSellerData = async () => {
    try {
      setLoading(true);
      const [items, rentals, exchanges] = await Promise.all([
        api.getItems({ seller_id: user?.id, status_filter: "all" }),
        api.getMyRentals().catch(() => ({ lent: [] })),
        api.getMyExchanges().catch(() => ({ incoming: [] }))
      ]);

      setMyListings(items || []);
      setIncomingRentals(rentals?.lent || []);
      setIncomingExchanges(exchanges?.incoming || []);
    } catch (err) {
      console.error("Error loading seller listings", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadSellerData();
    }
  }, [user]);

  const handleTogglePause = async (item) => {
    const nextStatus = item.status === "active" ? "paused" : "active";
    try {
      await api.updateItemStatus(item.id, nextStatus);
      showToast(`Listing ${nextStatus === "paused" ? "paused" : "resumed"}`, "info");
      loadSellerData();
    } catch (e) {
      showToast("Failed to update listing status", "error");
    }
  };

  const handleMarkSold = async (item) => {
    try {
      await api.updateItemStatus(item.id, "sold");
      showToast(`'${item.title}' marked as Sold! 🎉`, "success");
      loadSellerData();
    } catch (e) {
      showToast("Failed to mark item as sold", "error");
    }
  };

  const handleDeleteListing = async (itemId) => {
    if (!window.confirm("Are you sure you want to permanently delete this listing?")) return;
    try {
      await api.deleteItem(itemId);
      showToast("Listing deleted successfully", "info");
      loadSellerData();
    } catch (e) {
      showToast("Failed to delete listing", "error");
    }
  };

  // Filter listings based on tab
  const filteredListings = myListings.filter(item => {
    if (filterStatus === "all") return true;
    return item.status === filterStatus;
  });

  const activeCount = myListings.filter(i => i.status === "active").length;
  const pausedCount = myListings.filter(i => i.status === "paused").length;
  const soldCount = myListings.filter(i => i.status === "sold").length;

  return (
    <div style={{ color: "var(--text-dark-primary)", maxWidth: "1200px", margin: "0 auto" }}>
      {/* 1. SELLER STUDIO HEADER */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "28px",
        flexWrap: "wrap",
        gap: "16px"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <h1 style={{
              fontSize: "2.2rem",
              fontWeight: 800,
              letterSpacing: "-0.03em"
            }}>
              My Campus Listings
            </h1>
            <span style={{
              fontSize: "0.75rem",
              fontWeight: 800,
              padding: "3px 10px",
              borderRadius: "9999px",
              background: "#0C87FD",
              color: "#FFFFFF"
            }}>
              Seller Mode
            </span>
          </div>
          <p style={{ fontSize: "0.9rem", color: "var(--text-dark-muted)", fontWeight: 500 }}>
            Manage your items, pause or resume availability, mark sold, and add new listings.
          </p>
        </div>

        <button 
          className="btn-primary" 
          onClick={onOpenAddItem}
          style={{ padding: "12px 24px", fontSize: "0.92rem" }}
        >
          <PlusCircle size={17} />
          <span>+ Add New Listing</span>
        </button>
      </div>

      {/* 2. REAL SUMMARY TILES */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: "16px",
        marginBottom: "28px"
      }}>
        <div style={{
          background: "#FFFFFF",
          padding: "20px",
          borderRadius: "20px",
          border: "1px solid var(--border-light)",
          boxShadow: "var(--shadow-subtle)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-dark-muted)" }}>Total Listings</span>
            <Package size={18} color="#121311" />
          </div>
          <div style={{ fontSize: "1.85rem", fontWeight: 800 }}>{myListings.length}</div>
          <span style={{ fontSize: "0.74rem", color: "var(--text-dark-muted)" }}>All-time inventory</span>
        </div>

        <div style={{
          background: "#FFFFFF",
          padding: "20px",
          borderRadius: "20px",
          border: "1px solid var(--border-light)",
          boxShadow: "var(--shadow-subtle)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-dark-muted)" }}>Active on Campus</span>
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#16A34A" }} />
          </div>
          <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#16A34A" }}>{activeCount}</div>
          <span style={{ fontSize: "0.74rem", color: "var(--text-dark-muted)" }}>Visible to student buyers</span>
        </div>

        <div style={{
          background: "#FFFFFF",
          padding: "20px",
          borderRadius: "20px",
          border: "1px solid var(--border-light)",
          boxShadow: "var(--shadow-subtle)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-dark-muted)" }}>Items Sold</span>
            <CheckCircle size={18} color="#2563EB" />
          </div>
          <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#2563EB" }}>{soldCount}</div>
          <span style={{ fontSize: "0.74rem", color: "var(--text-dark-muted)" }}>Successfully transacted</span>
        </div>

        <div style={{
          background: "#FFFFFF",
          padding: "20px",
          borderRadius: "20px",
          border: "1px solid var(--border-light)",
          boxShadow: "var(--shadow-subtle)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "var(--text-dark-muted)" }}>Rental Inquiries</span>
            <Calendar size={18} color="#9333EA" />
          </div>
          <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#9333EA" }}>{incomingRentals.length}</div>
          <span style={{ fontSize: "0.74rem", color: "var(--text-dark-muted)" }}>Borrow bookings</span>
        </div>
      </div>

      {/* 3. INVENTORY MANAGEMENT CARD */}
      <div style={{
        background: "#FFFFFF",
        borderRadius: "24px",
        padding: "26px",
        border: "1px solid var(--border-light)",
        boxShadow: "var(--shadow-subtle)",
        marginBottom: "32px"
      }}>
        {/* Table Filter Tabs */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--border-light)",
          paddingBottom: "16px",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "12px"
        }}>
          <div style={{ display: "flex", gap: "8px" }}>
            {[
              { id: "all", label: `All (${myListings.length})` },
              { id: "active", label: `Active (${activeCount})` },
              { id: "paused", label: `Paused (${pausedCount})` },
              { id: "sold", label: `Sold (${soldCount})` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterStatus(tab.id)}
                style={{
                  padding: "7px 16px",
                  borderRadius: "9999px",
                  fontSize: "0.84rem",
                  fontWeight: filterStatus === tab.id ? 800 : 600,
                  background: filterStatus === tab.id ? "#121311" : "#F4F5F0",
                  color: filterStatus === tab.id ? "#FEFEFE" : "var(--text-dark-secondary)",
                  transition: "all 0.15s ease"
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span style={{ fontSize: "0.8rem", color: "var(--text-dark-muted)" }}>
            Showing {filteredListings.length} {filteredListings.length === 1 ? "item" : "items"}
          </span>
        </div>

        {/* Listings List */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div style={{
              width: "28px",
              height: "28px",
              border: "3px solid rgba(0,0,0,0.1)",
              borderTopColor: "#121311",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
              margin: "0 auto 12px"
            }} />
            <p style={{ fontSize: "0.85rem", color: "var(--text-dark-muted)" }}>Loading your listings...</p>
          </div>
        ) : filteredListings.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px 20px" }}>
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "#F4F5F0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              color: "var(--text-dark-muted)"
            }}>
              <Package size={26} />
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "6px" }}>
              {filterStatus === "all" ? "No listings published yet" : `No ${filterStatus} items found`}
            </h3>
            <p style={{ fontSize: "0.84rem", color: "var(--text-dark-muted)", marginBottom: "18px" }}>
              {filterStatus === "all" 
                ? "Items you list as a seller will appear here and become visible to other student buyers."
                : `You don't have any items currently marked as ${filterStatus}.`}
            </p>
            <button className="btn-primary" onClick={onOpenAddItem} style={{ padding: "10px 22px" }}>
              + List Your First Item
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filteredListings.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "16px 20px",
                  borderRadius: "18px",
                  background: "#F9FAF7",
                  border: "1px solid rgba(0, 0, 0, 0.04)",
                  flexWrap: "wrap",
                  gap: "14px",
                  transition: "all 0.15s ease"
                }}
              >
                {/* Left: Thumbnail & Details */}
                <div style={{ display: "flex", alignItems: "center", gap: "16px", minWidth: "240px" }}>
                  <div style={{ width: "54px", height: "54px", borderRadius: "14px", overflow: "hidden", flexShrink: 0 }}>
                    <ItemImage
                      src={item.images?.[0]?.image_url}
                      alt={item.title}
                      showLabel={false}
                      iconSize={20}
                    />
                  </div>
                  <div>
                    <h4 style={{ fontSize: "0.96rem", fontWeight: 800, marginBottom: "4px" }}>{item.title}</h4>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "9999px",
                        background: item.status === "active" ? "rgba(22, 163, 74, 0.12)" : item.status === "paused" ? "rgba(234, 179, 8, 0.15)" : "rgba(100, 116, 139, 0.15)",
                        color: item.status === "active" ? "#16A34A" : item.status === "paused" ? "#CA8A04" : "#64748B"
                      }}>
                        {item.status.toUpperCase()}
                      </span>
                      <span style={{ fontSize: "0.78rem", color: "var(--text-dark-muted)" }}>
                        {item.category}
                      </span>
                      {item.condition && (
                        <span style={{ fontSize: "0.78rem", color: "var(--text-dark-muted)" }}>
                          • {item.condition}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Center: Pricing & Mode tags */}
                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                  {item.is_sell && item.selling_price && (
                    <div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-dark-muted)", fontWeight: 600 }}>Selling Price</div>
                      <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-dark-primary)" }}>₹{item.selling_price}</div>
                    </div>
                  )}
                  {item.is_rent && item.rental_price_per_day && (
                    <div>
                      <div style={{ fontSize: "0.72rem", color: "var(--text-dark-muted)", fontWeight: 600 }}>Daily Rental</div>
                      <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0284C7" }}>₹{item.rental_price_per_day}/day</div>
                    </div>
                  )}
                  {item.is_exchange && (
                    <span style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      padding: "4px 8px",
                      borderRadius: "6px",
                      background: "rgba(165, 148, 249, 0.18)",
                      color: "#7965E8"
                    }}>
                      🔄 Swap Enabled
                    </span>
                  )}
                </div>

                {/* Right: Actions */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {item.status !== "sold" && (
                    <button
                      className="btn-outline"
                      style={{ padding: "7px 14px", fontSize: "0.78rem" }}
                      onClick={() => handleTogglePause(item)}
                      title={item.status === "active" ? "Pause listing" : "Resume listing"}
                    >
                      {item.status === "active" ? <Pause size={13} /> : <Play size={13} />}
                      <span>{item.status === "active" ? "Pause" : "Resume"}</span>
                    </button>
                  )}

                  {item.status !== "sold" && (
                    <button
                      className="btn-primary"
                      style={{ padding: "7px 14px", fontSize: "0.78rem" }}
                      onClick={() => handleMarkSold(item)}
                    >
                      <CheckCircle size={13} />
                      <span>Mark Sold</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteListing(item.id)}
                    style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "50%",
                      background: "#FEE2E2",
                      color: "#EF4444",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                    title="Delete listing"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
