import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2, MessageSquare } from 'lucide-react';
import { api } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';

export default function RespondRequestModal({ requestItem, onClose, onSuccess, onOpenChat }) {
  const { showToast } = useNotifications();
  const [offeredPrice, setOfferedPrice] = useState(requestItem.budget ? requestItem.budget.toString() : "400");
  const [message, setMessage] = useState(`Hey ${requestItem.user?.full_name?.split(" ")[0]}! I have this item and would love to hand it over on campus.`);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.respondToRequest(requestItem.id, {
        offered_price: parseFloat(offeredPrice) || requestItem.budget,
        message: message
      });

      setSuccess(true);
      showToast("Response and message sent to student!", "success");
      if (onSuccess) onSuccess();
    } catch (err) {
      showToast(err.message || "Failed to submit response", "error");
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
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Respond: "I Have This"</h3>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Fulfill a peer student's campus request</p>
          </div>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }}>
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div style={{ padding: "36px 24px", textAlign: "center" }}>
            <CheckCircle2 size={48} color="#0C87FD" style={{ margin: "0 auto 16px" }} />
            <h4 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: "8px", color: "#FEFEFE" }}>Response & Message Sent!</h4>
            <p style={{ fontSize: "0.88rem", color: "var(--text-muted)", marginBottom: "22px", lineHeight: "1.5" }}>
              {requestItem.user?.full_name} has received your offer of ₹{offeredPrice}. A direct message thread has been opened in both your and their Messages tab.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={onClose}
              >
                Close
              </button>
              {onOpenChat && (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => {
                    onClose();
                    onOpenChat();
                  }}
                  style={{ gap: "6px" }}
                >
                  <MessageSquare size={16} />
                  <span>Open Chat</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: "22px" }}>
            {/* Target request summary */}
            <div style={{
              padding: "12px",
              background: "var(--bg-surface-elevated)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              marginBottom: "16px"
            }}>
              <div style={{ fontSize: "0.72rem", color: "#fbbf24", fontWeight: 700, textTransform: "uppercase" }}>
                Student Request
              </div>
              <h4 style={{ fontSize: "0.95rem", fontWeight: 700, margin: "4px 0" }}>{requestItem.title}</h4>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                <span>Posted by: {requestItem.user?.full_name}</span>
                <span>Student Budget: <strong style={{ color: "#FEFEFE" }}>₹{requestItem.budget}</strong></span>
              </div>
            </div>

            {/* Offered Price */}
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>
                Your Offered Price (₹)
              </label>
              <input
                type="number"
                min="0"
                step="10"
                value={offeredPrice}
                onChange={(e) => setOfferedPrice(e.target.value)}
                required
              />
            </div>

            {/* Message */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>
                Message to Student
              </label>
              <textarea
                rows={3}
                placeholder="Mention condition, edition, or where you can meet on campus..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                style={{ resize: "none" }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={submitting}>
                <Sparkles size={16} />
                <span>{submitting ? "Sending..." : "Submit Offer"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

