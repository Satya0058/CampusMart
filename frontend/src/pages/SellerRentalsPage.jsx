import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Package, 
  Trash2, 
  Play, 
  Pause, 
  PlusCircle, 
  Check, 
  X, 
  ShieldCheck, 
  ShoppingBag, 
  Tag,
  AlertCircle,
  ArrowUpRight
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import ItemImage from '../components/common/ItemImage';

export default function SellerRentalsPage({ onNavigate, onOpenAddItem }) {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [rentalListings, setRentalListings] = useState([]);
  const [lentBookings, setLentBookings] = useState([]);
  const [activeTab, setActiveTab] = useState("listings"); // 'listings' | 'bookings'
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [items, myRentals] = await Promise.all([
        api.getItems({ seller_id: user?.id, status_filter: "all" }),
        api.getMyRentals().catch(() => ({ lent: [] }))
      ]);

      // Filter: only items that have rental enabled (is_rent: true)
      const forRent = (items || []).filter(i => i.is_rent);
      setRentalListings(forRent);
      setLentBookings(myRentals?.lent || []);
    } catch (err) {
      console.error("Failed to load seller rental data", err);
      showToast("Unable to load rental studio data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const handleTogglePause = async (item) => {
    const nextStatus = item.status === "active" ? "paused" : "active";
    try {
      await api.updateItemStatus(item.id, nextStatus);
      showToast(`Rental listing ${nextStatus === "paused" ? "paused" : "resumed"}`, "info");
      loadData();
    } catch (e) {
      showToast("Failed to update status", "error");
    }
  };

  const handleMarkSold = async (item) => {
    try {
      await api.updateItemStatus(item.id, "sold");
      showToast(`'${item.title}' marked as Sold/Unavailable! 🎉`, "success");
      loadData();
    } catch (e) {
      showToast("Failed to mark item as sold", "error");
    }
  };

  const handleDeleteListing = async (itemId) => {
    if (!window.confirm("Are you sure you want to permanently delete this rental listing?")) return;
    try {
      await api.deleteItem(itemId);
      showToast("Rental listing deleted successfully", "info");
      loadData();
    } catch (e) {
      showToast("Failed to delete listing", "error");
    }
  };

  const handleUpdateBookingStatus = async (rentalId, status) => {
    try {
      await api.updateRentalStatus(rentalId, status);
      showToast(`Rental booking updated to ${status}!`, "success");
      loadData();
    } catch (err) {
      showToast(err.message || "Failed to update booking status", "error");
    }
  };

  const getStatusBadge = (status, availability) => {
    if (status === "sold") {
      return (
        <span style={{ fontSize: "0.72rem", fontWeight: 800, padding: "3px 10px", borderRadius: "var(--radius-full)", background: "#E2E4DC", color: "#5A5E56" }}>
          Sold / Inactive
        </span>
      );
    }
    if (status === "paused") {
      return (
        <span style={{ fontSize: "0.72rem", fontWeight: 800, padding: "3px 10px", borderRadius: "var(--radius-full)", background: "rgba(217, 119, 6, 0.15)", color: "#D97706" }}>
          Paused
        </span>
      );
    }
    if (availability === "In Rental") {
      return (
        <span style={{ fontSize: "0.72rem", fontWeight: 800, padding: "3px 10px", borderRadius: "var(--radius-full)", background: "rgba(37, 99, 235, 0.15)", color: "#1D4ED8" }}>
          Currently In Rental
        </span>
      );
    }
    return (
      <span style={{ fontSize: "0.72rem", fontWeight: 800, padding: "3px 10px", borderRadius: "var(--radius-full)", background: "rgba(22, 163, 74, 0.15)", color: "#16A34A" }}>
        Available for Rent
      </span>
    );
  };

  const getBookingBadge = (status) => {
    switch (status) {
      case "requested":
        return <span style={{ fontSize: "0.74rem", fontWeight: 800, padding: "3px 10px", borderRadius: "var(--radius-full)", background: "rgba(245, 158, 11, 0.2)", color: "#B45309" }}>Booking Requested</span>;
      case "approved":
        return <span style={{ fontSize: "0.74rem", fontWeight: 800, padding: "3px 10px", borderRadius: "var(--radius-full)", background: "rgba(12, 135, 253, 0.15)", color: "#0C87FD" }}>Approved</span>;
      case "reserved":
        return <span style={{ fontSize: "0.74rem", fontWeight: 800, padding: "3px 10px", borderRadius: "var(--radius-full)", background: "rgba(96, 165, 250, 0.2)", color: "#2563EB" }}>Reserved</span>;
      case "rented":
        return <span style={{ fontSize: "0.74rem", fontWeight: 800, padding: "3px 10px", borderRadius: "var(--radius-full)", background: "rgba(22, 163, 74, 0.2)", color: "#15803D" }}>Active on Campus</span>;
      case "returned":
        return <span style={{ fontSize: "0.74rem", fontWeight: 800, padding: "3px 10px", borderRadius: "var(--radius-full)", background: "rgba(147, 51, 234, 0.15)", color: "#7E22CE" }}>Handed Back (Pending Confirmation)</span>;
      case "completed":
        return <span style={{ fontSize: "0.74rem", fontWeight: 800, padding: "3px 10px", borderRadius: "var(--radius-full)", background: "#E2E4DC", color: "#5A5E56" }}>Completed</span>;
      default:
        return <span style={{ fontSize: "0.74rem", fontWeight: 800, padding: "3px 10px", borderRadius: "var(--radius-full)", background: "#F4F5F0", color: "#5A5E56" }}>{status}</span>;
    }
  };

  const activeBookingsCount = lentBookings.filter(b => ["requested", "approved", "rented", "returned"].includes(b.status)).length;

  return (
    <div style={{ color: "var(--text-primary)", maxWidth: "1200px", margin: "0 auto" }}>
      {/* 1. Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "16px",
        marginBottom: "28px"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#121311", fontSize: "0.76rem", fontWeight: 800, textTransform: "uppercase", marginBottom: "4px" }}>
            <Calendar size={16} color="#0C87FD" />
            <span style={{ letterSpacing: "0.05em", color: "#5A5E56" }}>SELLER STUDIO • ACTIVE RENTALS</span>
          </div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "6px", color: "#121311" }}>
            Active Rentals & Lending Hub
          </h1>
          <p style={{ fontSize: "0.92rem", color: "var(--text-dark-secondary)", maxWidth: "620px", lineHeight: "1.5" }}>
            Manage the equipment, cycles, and calculators you offer for daily campus rent. Fulfill student bookings and confirm returns.
          </p>
        </div>

        {onOpenAddItem && (
          <button 
            className="btn-primary"
            onClick={onOpenAddItem}
            style={{ padding: "10px 22px", fontSize: "0.88rem", fontWeight: 800 }}
          >
            <PlusCircle size={16} />
            <span>Add Rental Listing</span>
          </button>
        )}
      </div>

      {/* 2. Mode Tabs */}
      <div style={{
        display: "flex",
        gap: "8px",
        marginBottom: "24px",
        borderBottom: "1px solid var(--border-light)",
        paddingBottom: "12px"
      }}>
        <button
          onClick={() => setActiveTab("listings")}
          style={{
            padding: "8px 18px",
            borderRadius: "var(--radius-full)",
            fontSize: "0.82rem",
            fontWeight: 800,
            border: "none",
            cursor: "pointer",
            background: activeTab === "listings" ? "#121311" : "#F4F5F0",
            color: activeTab === "listings" ? "#FEFEFE" : "#5A5E56",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.15s ease"
          }}
        >
          <Package size={15} />
          <span>Your Rental Listings ({rentalListings.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("bookings")}
          style={{
            padding: "8px 18px",
            borderRadius: "var(--radius-full)",
            fontSize: "0.82rem",
            fontWeight: 800,
            border: "none",
            cursor: "pointer",
            background: activeTab === "bookings" ? "#121311" : "#F4F5F0",
            color: activeTab === "bookings" ? "#FEFEFE" : "#5A5E56",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.15s ease"
          }}
        >
          <Clock size={15} />
          <span>Student Bookings & Lent Items ({lentBookings.length})</span>
          {activeBookingsCount > 0 && (
            <span style={{ background: "#0C87FD", color: "#FFFFFF", fontSize: "0.68rem", fontWeight: 900, padding: "1px 7px", borderRadius: "var(--radius-full)" }}>
              {activeBookingsCount}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "70px 20px", color: "var(--text-dark-muted)" }}>
          Loading your rental gear and student bookings...
        </div>
      ) : (
        <>
          {/* TAB 1: RENTAL LISTINGS */}
          {activeTab === "listings" && (
            <div>
              {rentalListings.length === 0 ? (
                <div style={{
                  textAlign: "center",
                  padding: "60px 20px",
                  background: "#FFFFFF",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--border-light)",
                  boxShadow: "var(--shadow-card)"
                }}>
                  <Calendar size={48} color="#0C87FD" style={{ margin: "0 auto 16px" }} />
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#121311", marginBottom: "8px" }}>
                    No rental items listed yet
                  </h3>
                  <p style={{ fontSize: "0.88rem", color: "#5A5E56", maxWidth: "440px", margin: "0 auto 20px" }}>
                    Have a cycle, scientific calculator, lab coat, or electronics? List them for rent on campus to earn recurring student income!
                  </p>
                  {onOpenAddItem && (
                    <button className="btn-primary" onClick={onOpenAddItem} style={{ padding: "10px 20px", fontWeight: 800 }}>
                      <PlusCircle size={16} />
                      <span>List an Item for Rent</span>
                    </button>
                  )}
                </div>
              ) : (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                  gap: "20px"
                }}>
                  {rentalListings.map((item) => {
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
                          {/* Image with status overlay */}
                          <div style={{ height: "180px", width: "100%", position: "relative", background: "#F2F3EE", overflow: "hidden" }}>
                            <ItemImage
                              src={item.images?.[0]?.image_url}
                              alt={item.title}
                              iconSize={32}
                            />
                            <div style={{ position: "absolute", top: "12px", right: "12px", zIndex: 2 }}>
                              {getStatusBadge(item.status, item.availability)}
                            </div>
                          </div>

                          {/* Details */}
                          <div style={{ padding: "18px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.74rem", marginBottom: "6px" }}>
                              <span style={{ fontWeight: 800, color: "#0C87FD", textTransform: "uppercase" }}>
                                {item.category}
                              </span>
                              <span style={{ color: "#8E928A", fontWeight: 600 }}>
                                {item.condition}
                              </span>
                            </div>

                            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#121311", marginBottom: "8px" }}>
                              {item.title}
                            </h3>

                            <p style={{ fontSize: "0.82rem", color: "#5A5E56", lineHeight: "1.4", marginBottom: "16px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                              {item.description || "No description provided."}
                            </p>

                            {/* Daily rate */}
                            <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginBottom: "6px" }}>
                              <span style={{ fontSize: "1.4rem", fontWeight: 900, color: "#121311" }}>
                                ₹{item.rental_price_per_day}
                              </span>
                              <span style={{ fontSize: "0.78rem", color: "#8E928A", fontWeight: 600 }}>/ day</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons: Mark Sold, Delete, Pause */}
                        <div style={{
                          padding: "14px 18px",
                          borderTop: "1px solid var(--border-light)",
                          background: "#FBFBFA",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "8px"
                        }}>
                          {/* Toggle Pause / Resume */}
                          <button
                            onClick={() => handleTogglePause(item)}
                            style={{
                              padding: "6px 12px",
                              fontSize: "0.76rem",
                              fontWeight: 700,
                              borderRadius: "var(--radius-md)",
                              border: "1px solid var(--border-light)",
                              background: "#FFFFFF",
                              color: "#121311",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              cursor: "pointer"
                            }}
                            title={item.status === "active" ? "Pause rental listing" : "Resume rental listing"}
                          >
                            {item.status === "active" ? <Pause size={13} /> : <Play size={13} />}
                            <span>{item.status === "active" ? "Pause" : "Resume"}</span>
                          </button>

                          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                            {/* Mark Sold */}
                            {item.status !== "sold" && (
                              <button
                                onClick={() => handleMarkSold(item)}
                                style={{
                                  padding: "6px 12px",
                                  fontSize: "0.76rem",
                                  fontWeight: 800,
                                  borderRadius: "var(--radius-md)",
                                  border: "none",
                                  background: "#0C87FD",
                                  color: "#FFFFFF",
                                  boxShadow: "0 2px 8px rgba(12, 135, 253, 0.3)",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  cursor: "pointer"
                                }}
                                title="Mark as Sold / Finished"
                              >
                                <CheckCircle2 size={13} />
                                <span>Mark Sold</span>
                              </button>
                            )}

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteListing(item.id)}
                              style={{
                                padding: "6px 10px",
                                fontSize: "0.76rem",
                                fontWeight: 700,
                                borderRadius: "var(--radius-md)",
                                border: "1px solid rgba(239, 68, 68, 0.2)",
                                background: "rgba(239, 68, 68, 0.08)",
                                color: "#DC2626",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                cursor: "pointer"
                              }}
                              title="Delete rental listing"
                            >
                              <Trash2 size={13} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LENT BOOKINGS */}
          {activeTab === "bookings" && (
            <div>
              {lentBookings.length === 0 ? (
                <div style={{
                  textAlign: "center",
                  padding: "60px 20px",
                  background: "#FFFFFF",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--border-light)",
                  boxShadow: "var(--shadow-card)"
                }}>
                  <Clock size={48} color="#0C87FD" style={{ margin: "0 auto 16px" }} />
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#121311", marginBottom: "8px" }}>
                    No student bookings received yet
                  </h3>
                  <p style={{ fontSize: "0.88rem", color: "#5A5E56", maxWidth: "440px", margin: "0 auto" }}>
                    When fellow campus peers book your equipment for rent, their reservation details, dates, and handover confirmation actions will appear here.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {lentBookings.map((l) => (
                    <div
                      key={l.id}
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
                            Borrower: {l.renter?.full_name}
                            <ShieldCheck size={14} color="#16A34A" />
                          </span>
                          <span style={{ fontSize: "0.74rem", color: "#8E928A" }}>
                            ({l.renter?.department || "Student"})
                          </span>
                          {getBookingBadge(l.status)}
                        </div>

                        <h4 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#121311", marginBottom: "4px" }}>
                          {l.item?.title}
                        </h4>

                        <div style={{ fontSize: "0.82rem", color: "#5A5E56" }}>
                          Dates: <strong>{l.start_date}</strong> to <strong>{l.end_date}</strong> ({l.total_days} days) • Total Revenue: <strong style={{ color: "#16A34A" }}>₹{l.total_amount}</strong>
                        </div>
                      </div>

                      {/* Status Action Controls */}
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        {l.status === "requested" && (
                          <>
                            <button
                              onClick={() => handleUpdateBookingStatus(l.id, "approved")}
                              style={{
                                padding: "8px 16px",
                                fontSize: "0.82rem",
                                fontWeight: 800,
                                background: "#0C87FD",
                                color: "#FFFFFF",
                                boxShadow: "0 2px 8px rgba(12, 135, 253, 0.3)",
                                border: "none",
                                borderRadius: "var(--radius-md)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px"
                              }}
                            >
                              <Check size={14} />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleUpdateBookingStatus(l.id, "cancelled")}
                              style={{
                                padding: "8px 14px",
                                fontSize: "0.82rem",
                                fontWeight: 700,
                                background: "rgba(239, 68, 68, 0.1)",
                                color: "#DC2626",
                                border: "1px solid rgba(239, 68, 68, 0.2)",
                                borderRadius: "var(--radius-md)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px"
                              }}
                            >
                              <X size={14} />
                              <span>Decline</span>
                            </button>
                          </>
                        )}

                        {l.status === "approved" && (
                          <button
                            onClick={() => handleUpdateBookingStatus(l.id, "rented")}
                            style={{
                              padding: "8px 18px",
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
                            <CheckCircle2 size={15} color="#0C87FD" />
                            <span>Confirm Handed Over (Active)</span>
                          </button>
                        )}

                        {l.status === "returned" && (
                          <button
                            onClick={() => handleUpdateBookingStatus(l.id, "completed")}
                            style={{
                              padding: "8px 18px",
                              fontSize: "0.82rem",
                              fontWeight: 800,
                              background: "#16A34A",
                              color: "#FEFEFE",
                              border: "none",
                              borderRadius: "var(--radius-md)",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px"
                            }}
                          >
                            <CheckCircle2 size={15} />
                            <span>Confirm Returned & Complete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

