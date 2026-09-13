import React, { useState } from 'react';
import { X, ShieldCheck, MapPin, MessageSquare, CheckCircle2, ShoppingBag } from 'lucide-react';
import { api } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import ItemImage from '../common/ItemImage';

export default function BuyModal({ item, onClose, onChatInitiated }) {
  const { user, openAuthModal } = useAuth();
  const { showToast } = useNotifications();
  const [meetupLocation, setMeetupLocation] = useState("Main Campus Library Foyer");
  const [customNote, setCustomNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirmInterest = async (e) => {
    e.preventDefault();

    if (!user) {
      showToast("Please sign in to send a buy request.", "error");
      openAuthModal("login");
      return;
    }

    setSubmitting(true);
    try {
      // Call dedicated buy request endpoint which notifies seller and creates chat thread
      await api.sendBuyRequest(item.id, {
        meetup_location: meetupLocation,
        note: customNote
      });

      setConfirmed(true);
      showToast("Buy request sent to seller!", "success");
      setTimeout(() => {
        if (onChatInitiated) onChatInitiated();
        onClose();
      }, 1800);
    } catch (err) {
      showToast(err.message || "Failed to send buy request", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "500px" }}>
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 22px",
          borderBottom: "1px solid var(--border-subtle)"
        }}>
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800 }}>Campus Buy & Meetup</h3>
            <p style={{ fontSize: "0.78rem", color: "var(--text-dark-muted)" }}>Zero platform fees • Direct student handover</p>
          </div>
          <button onClick={onClose} style={{ color: "var(--text-dark-muted)" }}>
            <X size={18} />
          </button>
        </div>

        {confirmed ? (
          <div style={{ padding: "40px 24px", textAlign: "center" }}>
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "rgba(200, 234, 62, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px"
            }}>
              <CheckCircle2 size={36} color="#16A34A" />
            </div>
            <h4 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "8px", color: "var(--text-dark-primary)" }}>
              Buy Request Sent!
            </h4>
            <p style={{ fontSize: "0.88rem", color: "var(--text-dark-secondary)", lineHeight: "1.45" }}>
              A notification and message thread have been sent to <strong>{item.seller?.full_name}</strong>. You can finalize pickup details in Messages.
            </p>
          </div>
        ) : (
          <form onSubmit={handleConfirmInterest} style={{ padding: "22px" }}>
            {/* Item summary card */}
            <div style={{
              display: "flex",
              gap: "14px",
              padding: "14px",
              background: "#F7F8F4",
              borderRadius: "18px",
              border: "1px solid var(--border-light)",
              marginBottom: "18px"
            }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "12px", overflow: "hidden", flexShrink: 0 }}>
                <ItemImage
                  src={item.images?.[0]?.image_url}
                  alt={item.title}
                  showLabel={false}
                  iconSize={20}
                />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: "0.94rem", fontWeight: 800, marginBottom: "4px" }}>{item.title}</h4>
                <div style={{ fontSize: "0.78rem", color: "var(--text-dark-muted)" }}>Seller: {item.seller?.full_name}</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-dark-primary)", marginTop: "4px" }}>
                  ₹{item.selling_price}
                </div>
              </div>
            </div>

            {/* Meetup Location Suggestion */}
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px", color: "var(--text-dark-secondary)" }}>
                Suggested Campus Meetup Spot
              </label>
              <select
                value={meetupLocation}
                onChange={(e) => setMeetupLocation(e.target.value)}
                style={{ width: "100%" }}
              >
                <option value="Central Library Ground Foyer">Central Library Ground Foyer</option>
                <option value="Campus Student Canteen / Cafeteria">Campus Student Canteen / Cafeteria</option>
                <option value="Hostel Gate #1 Common Area">Hostel Gate #1 Common Area</option>
                <option value="Main Academic Block Atrium">Main Academic Block Atrium</option>
                <option value="Department Notice Board Entrance">Department Notice Board Entrance</option>
                <option value="Sports Complex / Pavilion">Sports Complex / Pavilion</option>
              </select>
            </div>

            {/* Note to seller */}
            <div style={{ marginBottom: "18px" }}>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px", color: "var(--text-dark-secondary)" }}>
                Note to Seller (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Free after 4:00 PM today right after lab sessions."
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                style={{ resize: "none" }}
              />
            </div>

            {/* Trust note */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 14px",
              borderRadius: "14px",
              background: "rgba(200, 234, 62, 0.2)",
              marginBottom: "20px"
            }}>
              <ShieldCheck size={16} color="#121311" />
              <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#121311" }}>
                CampusMart verified student transaction. Pay with UPI or cash upon physical handover.
              </span>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                <ShoppingBag size={16} />
                <span>{submitting ? "Sending Request..." : "Send Buy Request"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
