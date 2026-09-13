import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Package, 
  ShieldCheck, 
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import RentalModal from '../components/modals/RentalModal';
import ItemImage from '../components/common/ItemImage';

export default function RentalCenterPage({ onNavigate }) {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [rentalCatalog, setRentalCatalog] = useState([]);
  const [borrowedRentals, setBorrowedRentals] = useState([]);
  const [activeTab, setActiveTab] = useState("catalog"); // 'catalog' | 'borrowed'
  const [selectedRentalItem, setSelectedRentalItem] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadRentalData = async () => {
    try {
      setLoading(true);
      const [items, myRentals] = await Promise.all([
        api.getItems({ mode: "rent", status_filter: "active" }),
        api.getMyRentals().catch(() => ({ borrowed: [] }))
      ]);

      setRentalCatalog(items || []);
      setBorrowedRentals(myRentals?.borrowed || []);
    } catch (err) {
      console.error("Failed to load campus rentals", err);
      showToast("Unable to load rental equipment", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadRentalData();
    }
  }, [user]);

  const handleUpdateStatus = async (rentalId, status) => {
    try {
      await api.updateRentalStatus(rentalId, status);
      showToast(`Rental marked as ${status}!`, "success");
      loadRentalData();
    } catch (err) {
      showToast(err.message || "Failed to update rental status", "error");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "requested":
        return <span style={{ fontSize: "0.74rem", fontWeight: 800, padding: "3px 10px", borderRadius: "var(--radius-full)", background: "rgba(245, 158, 11, 0.2)", color: "#B45309" }}>Request Pending</span>;
      case "approved":
        return <span style={{ fontSize: "0.74rem", fontWeight: 800, padding: "3px 10px", borderRadius: "var(--radius-full)", background: "rgba(200, 234, 62, 0.3)", color: "#566F0B" }}>Approved - Ready for Pickup</span>;
      case "reserved":
        return <span style={{ fontSize: "0.74rem", fontWeight: 800, padding: "3px 10px", borderRadius: "var(--radius-full)", background: "rgba(96, 165, 250, 0.2)", color: "#2563EB" }}>Reserved</span>;
      case "rented":
        return <span style={{ fontSize: "0.74rem", fontWeight: 800, padding: "3px 10px", borderRadius: "var(--radius-full)", background: "rgba(22, 163, 74, 0.15)", color: "#16A34A" }}>Active (In Your Possession)</span>;
      case "returned":
        return <span style={{ fontSize: "0.74rem", fontWeight: 800, padding: "3px 10px", borderRadius: "var(--radius-full)", background: "#E2E4DC", color: "#5A5E56" }}>Handed Back</span>;
      case "completed":
        return <span style={{ fontSize: "0.74rem", fontWeight: 800, padding: "3px 10px", borderRadius: "var(--radius-full)", background: "#E2E4DC", color: "#5A5E56" }}>Completed</span>;
      default:
        return <span style={{ fontSize: "0.74rem", fontWeight: 800, padding: "3px 10px", borderRadius: "var(--radius-full)", background: "#F4F5F0", color: "#5A5E56" }}>{status}</span>;
    }
  };

  // Filter catalog: Only items from other students (exclude own items)
  const availableRentals = rentalCatalog.filter(it => it.seller_id !== user?.id);

  return (
    <div style={{ color: "var(--text-primary)", maxWidth: "1200px", margin: "0 auto" }}>
      {/* 1. Header */}
      <div style={{ marginBottom: "28px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#121311", fontSize: "0.76rem", fontWeight: 800, textTransform: "uppercase", marginBottom: "4px" }}>
          <Calendar size={16} color="#889F18" />
          <span style={{ letterSpacing: "0.05em", color: "#5A5E56" }}>CAMPUS RENTALS • PEER BORROWING</span>
        </div>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "6px", color: "#121311" }}>
          Campus Rentals
        </h1>
        <p style={{ fontSize: "0.92rem", color: "var(--text-dark-secondary)", maxWidth: "620px", lineHeight: "1.5" }}>
          Rent scientific calculators, lab gear, textbooks, and tech peripherals directly from campus peers without paying full retail price.
        </p>
      </div>

      {/* 2. Tabs: ONLY Available Rentals & Borrowed Items */}
      <div style={{
        display: "flex",
        gap: "8px",
        marginBottom: "24px",
        borderBottom: "1px solid var(--border-light)",
        paddingBottom: "12px"
      }}>
        <button
          onClick={() => setActiveTab("catalog")}
          style={{
            padding: "8px 18px",
            borderRadius: "var(--radius-full)",
            fontSize: "0.82rem",
            fontWeight: 800,
            border: "none",
            cursor: "pointer",
            background: activeTab === "catalog" ? "#121311" : "#F4F5F0",
            color: activeTab === "catalog" ? "#FEFEFE" : "#5A5E56",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.15s ease"
          }}
        >
          <Package size={15} />
          <span>Available Rentals ({availableRentals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("borrowed")}
          style={{
            padding: "8px 18px",
            borderRadius: "var(--radius-full)",
            fontSize: "0.82rem",
            fontWeight: 800,
            border: "none",
            cursor: "pointer",
            background: activeTab === "borrowed" ? "#121311" : "#F4F5F0",
            color: activeTab === "borrowed" ? "#FEFEFE" : "#5A5E56",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.15s ease"
          }}
        >
          <Clock size={15} />
          <span>Your Borrowed Items ({borrowedRentals.length})</span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "70px 20px", color: "var(--text-dark-muted)" }}>
          Loading campus rentals...
        </div>
      ) : (
        <>
          {/* TAB 1: AVAILABLE RENTALS CATALOG */}
          {activeTab === "catalog" && (
            <div>
              {availableRentals.length === 0 ? (
                <div style={{
                  textAlign: "center",
                  padding: "60px 20px",
                  background: "#FFFFFF",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--border-light)",
                  boxShadow: "var(--shadow-card)"
                }}>
                  <Package size={48} color="#C8EA3E" style={{ margin: "0 auto 16px" }} />
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#121311", marginBottom: "8px" }}>
                    No rental gear available right now
                  </h3>
                  <p style={{ fontSize: "0.88rem", color: "#5A5E56", maxWidth: "440px", margin: "0 auto" }}>
                    When fellow campus peers list their scientific calculators, cycles, or equipment for rent, they will appear here.
                  </p>
                </div>
              ) : (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "20px"
                }}>
                  {availableRentals.map((item) => {
                    return (
                      <div
                        key={item.id}
                        style={{
                          background: "#FFFFFF",
                          border: "1px solid var(--border-light)",
                          borderRadius: "var(--radius-lg)",
                          overflow: "hidden",
                          boxShadow: "var(--shadow-card)",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between"
                        }}
                      >
                        <div>
                          {/* Image */}
                          <div style={{ height: "180px", width: "100%", overflow: "hidden", background: "#F2F3EE" }}>
                            <ItemImage
                              src={item.images?.[0]?.image_url}
                              alt={item.title}
                              iconSize={32}
                            />
                          </div>

                          {/* Details */}
                          <div style={{ padding: "18px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.74rem", marginBottom: "6px" }}>
                              <span style={{ fontWeight: 800, color: "#889F18", textTransform: "uppercase" }}>
                                {item.category}
                              </span>
                              <span style={{ color: "#8E928A", fontWeight: 600 }}>
                                {item.condition}
                              </span>
                            </div>

                            <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#121311", marginBottom: "8px" }}>
                              {item.title}
                            </h3>

                            <div style={{ fontSize: "0.78rem", color: "#8E928A", marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                              <span>Owner: <strong>{item.seller?.full_name}</strong></span>
                              <ShieldCheck size={14} color="#16A34A" />
                            </div>

                            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                              <span style={{ fontSize: "1.35rem", fontWeight: 900, color: "#121311" }}>
                                ₹{item.rental_price_per_day}
                              </span>
                              <span style={{ fontSize: "0.76rem", color: "#8E928A", fontWeight: 600 }}>/ day</span>
                            </div>
                          </div>
                        </div>

                        {/* Action: Select Dates & Rent */}
                        <div style={{ padding: "14px 18px", borderTop: "1px solid var(--border-light)", background: "#FBFBFA" }}>
                          <button
                            className="btn-primary"
                            style={{ width: "100%", padding: "10px", fontSize: "0.85rem", fontWeight: 800 }}
                            onClick={() => setSelectedRentalItem(item)}
                          >
                            <Calendar size={15} />
                            <span>Select Dates & Rent</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BORROWED ITEMS */}
          {activeTab === "borrowed" && (
            <div>
              {borrowedRentals.length === 0 ? (
                <div style={{
                  textAlign: "center",
                  padding: "60px 20px",
                  background: "#FFFFFF",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--border-light)",
                  boxShadow: "var(--shadow-card)"
                }}>
                  <Clock size={48} color="#C8EA3E" style={{ margin: "0 auto 16px" }} />
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#121311", marginBottom: "8px" }}>
                    You have no active equipment borrowings
                  </h3>
                  <p style={{ fontSize: "0.88rem", color: "#5A5E56", maxWidth: "440px", margin: "0 auto" }}>
                    When you rent items from campus peers, your booking period, total cost, and handover status will appear here.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {borrowedRentals.map((b) => (
                    <div
                      key={b.id}
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid var(--border-light)",
                        borderRadius: "var(--radius-lg)",
                        padding: "20px 24px",
                        boxShadow: "var(--shadow-card)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "16px",
                        flexWrap: "wrap"
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                          <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#121311", display: "flex", alignItems: "center", gap: "5px" }}>
                            Lender: {b.owner?.full_name}
                            <ShieldCheck size={14} color="#16A34A" />
                          </span>
                          {getStatusBadge(b.status)}
                        </div>

                        <h4 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#121311", marginBottom: "4px" }}>
                          {b.item?.title}
                        </h4>

                        <div style={{ fontSize: "0.82rem", color: "#5A5E56" }}>
                          Period: <strong>{b.start_date}</strong> to <strong>{b.end_date}</strong> ({b.total_days} days) • Total: <strong style={{ color: "#121311" }}>₹{b.total_amount}</strong>
                        </div>
                      </div>

                      {/* Action for borrower */}
                      {b.status === "rented" && (
                        <button
                          onClick={() => handleUpdateStatus(b.id, "returned")}
                          style={{
                            padding: "8px 16px",
                            fontSize: "0.82rem",
                            fontWeight: 800,
                            background: "#121311",
                            color: "#FEFEFE",
                            border: "none",
                            borderRadius: "var(--radius-md)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px"
                          }}
                        >
                          <CheckCircle2 size={14} color="#C8EA3E" />
                          <span>Mark as Handed Back</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Booking Modal */}
          {selectedRentalItem && (
            <RentalModal
              item={selectedRentalItem}
              onClose={() => setSelectedRentalItem(null)}
              onSuccess={loadRentalData}
            />
          )}
        </>
      )}
    </div>
  );
}
