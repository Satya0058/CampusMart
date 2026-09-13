import React, { useState, useMemo } from 'react';
import { X, Calendar, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

export default function RentalModal({ item, onClose, onSuccess }) {
  const { user, openAuthModal } = useAuth();
  const { showToast } = useNotifications();
  
  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const defaultEnd = new Date();
  defaultEnd.setDate(defaultEnd.getDate() + 4);
  const defaultEndStr = defaultEnd.toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(tomorrowStr);
  const [endDate, setEndDate] = useState(defaultEndStr);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Auto calculate duration & cost
  const { totalDays, totalAmount } = useMemo(() => {
    if (!startDate || !endDate) return { totalDays: 0, totalAmount: 0 };
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const days = Math.max(1, diffDays);
    const cost = days * (item.rental_price_per_day || 0);
    return { totalDays: days, totalAmount: cost };
  }, [startDate, endDate, item.rental_price_per_day]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      showToast("Please sign in to send a rental request.", "error");
      openAuthModal("login");
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setError("Return date must be on or after the pickup date.");
      return;
    }

    setSubmitting(true);
    try {
      await api.bookRental({
        item_id: item.id,
        start_date: startDate,
        end_date: endDate
      });

      setBookingSuccess(true);
      showToast("Rental request sent to owner!", "success");
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1800);
    } catch (err) {
      setError(err.message || "Failed to submit rental request. Check date conflicts.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 22px",
          borderBottom: "1px solid var(--border-subtle)"
        }}>
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800 }}>Reserve for Campus Rental</h3>
            <p style={{ fontSize: "0.78rem", color: "var(--text-dark-muted)" }}>Short term peer-to-peer equipment borrowing</p>
          </div>
          <button onClick={onClose} style={{ color: "var(--text-dark-muted)" }}>
            <X size={18} />
          </button>
        </div>

        {bookingSuccess ? (
          <div style={{ padding: "40px 24px", textAlign: "center" }}>
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "rgba(56, 189, 248, 0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px"
            }}>
              <CheckCircle2 size={36} color="#0284C7" />
            </div>
            <h4 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "8px", color: "var(--text-dark-primary)" }}>
              Rental Request Sent!
            </h4>
            <p style={{ fontSize: "0.88rem", color: "var(--text-dark-secondary)", lineHeight: "1.45" }}>
              The owner (<strong>{item.seller?.full_name}</strong>) has received your booking request for {totalDays} {totalDays === 1 ? "day" : "days"} (₹{totalAmount}). You will receive a notification once approved.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: "22px" }}>
            {error && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                background: "rgba(248, 113, 113, 0.1)",
                border: "1px solid rgba(248, 113, 113, 0.3)",
                color: "#f87171",
                fontSize: "0.84rem",
                marginBottom: "16px"
              }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Item summary */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "14px",
              background: "#F7F8F4",
              borderRadius: "16px",
              border: "1px solid var(--border-light)",
              marginBottom: "18px"
            }}>
              <div>
                <h4 style={{ fontSize: "0.92rem", fontWeight: 800 }}>{item.title}</h4>
                <div style={{ fontSize: "0.76rem", color: "var(--text-dark-muted)" }}>Owner: {item.seller?.full_name}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0284C7" }}>
                  ₹{item.rental_price_per_day}
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-dark-muted)" }}>per day</div>
              </div>
            </div>

            {/* Date Selectors */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "18px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px", color: "var(--text-dark-secondary)" }}>
                  Pickup Date
                </label>
                <input
                  type="date"
                  min={todayStr}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px", color: "var(--text-dark-secondary)" }}>
                  Return Date
                </label>
                <input
                  type="date"
                  min={startDate || todayStr}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Auto-Calculation Breakdown Card */}
            <div style={{
              padding: "14px 16px",
              background: "rgba(56, 189, 248, 0.08)",
              border: "1px solid rgba(56, 189, 248, 0.2)",
              borderRadius: "16px",
              marginBottom: "20px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--text-dark-secondary)", marginBottom: "6px" }}>
                <span>Daily Rental Rate:</span>
                <span style={{ fontWeight: 700 }}>₹{item.rental_price_per_day} / day</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--text-dark-secondary)", marginBottom: "8px" }}>
                <span>Rental Duration:</span>
                <span style={{ fontWeight: 800, color: "var(--text-dark-primary)" }}>{totalDays} {totalDays === 1 ? "day" : "days"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.05rem", fontWeight: 800, color: "#0284C7", borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: "8px" }}>
                <span>Total Calculated Rent:</span>
                <span>₹{totalAmount}</span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                <Calendar size={16} />
                <span>{submitting ? "Submitting..." : "Confirm Rental Request"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
