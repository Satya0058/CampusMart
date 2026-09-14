import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';

const CATEGORIES = [
  "Books",
  "Calculators",
  "Electronics",
  "Lab Equipment",
  "Stationery",
  "Fashion",
  "Furniture",
  "Sports",
  "Accessories",
  "Hostel Essentials",
  "Others"
];

export default function PostRequestModal({ onClose, onSuccess }) {
  const { showToast } = useNotifications();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Books");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [neededBefore, setNeededBefore] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!budget || parseFloat(budget) <= 0) {
      setError("Please enter a valid budget amount.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await api.createRequest({
        title,
        category,
        description,
        budget: parseFloat(budget),
        needed_before: neededBefore || "End of current semester"
      });

      showToast("Your request was posted to the campus community!", "success");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to post request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px" }}>
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 24px",
          borderBottom: "1px solid var(--border-subtle)"
        }}>
          <div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700 }}>What Do You Need?</h3>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Broadcast your item request to campus peers</p>
          </div>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "24px" }}>
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

          {/* Title */}
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>
              Item Name / Model / Edition *
            </label>
            <input
              type="text"
              placeholder="e.g. Looking for Casio FX-991ES Plus or ClassWiz"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Category */}
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>
              Category *
            </label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>
              Specific Requirements *
            </label>
            <textarea
              rows={3}
              placeholder="Specify edition, urgency, whether rental is also fine, or branch requirements..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              style={{ resize: "none" }}
            />
          </div>

          {/* Budget & Needed Before */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>
                Max Budget (₹) *
              </label>
              <input
                type="number"
                min="10"
                step="10"
                placeholder="e.g. 500"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>
                Needed Before
              </label>
              <input
                type="text"
                placeholder="e.g. 20 September"
                value={neededBefore}
                onChange={(e) => setNeededBefore(e.target.value)}
              />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              <Sparkles size={16} />
              <span>{submitting ? "Broadcasting..." : "Post Request to Campus"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

