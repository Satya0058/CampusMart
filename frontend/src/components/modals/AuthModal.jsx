import React, { useState } from 'react';
import { X, ShieldCheck, Mail, Lock, User as UserIcon, BookOpen, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

export default function AuthModal({ onClose, defaultTab = "login" }) {
  const { login, register } = useAuth();
  const { showToast } = useNotifications();

  const [tab, setTab] = useState(defaultTab); // 'login' | 'register'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("Computer Science & Engineering");
  const [year, setYear] = useState("3rd Year");
  const [gender, setGender] = useState("Prefer not to say");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (tab === "login") {
        await login(email, password);
        showToast("Welcome back to CampusMart!", "success");
      } else {
        await register({
          email,
          password,
          full_name: fullName,
          department,
          year,
          gender
        });
        showToast("Account created successfully! Welcome to CampusMart.", "success");
      }
      onClose();
    } catch (err) {
      setError(err.message || "Authentication failed. Please verify credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "460px" }}>
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 24px",
          borderBottom: "1px solid var(--border-subtle)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img src="/logo.png" alt="CampusMart" style={{ width: "24px", height: "24px", objectFit: "contain" }} />
            <span style={{ fontSize: "1.05rem", fontWeight: 800 }}>CampusMart Portal</span>
          </div>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }}>
            <X size={18} />
          </button>
        </div>

        {/* Tab switchers */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          borderBottom: "1px solid var(--border-subtle)"
        }}>
          <button
            type="button"
            onClick={() => { setTab("login"); setError(null); }}
            style={{
              padding: "12px",
              fontWeight: 800,
              fontSize: "0.88rem",
              color: tab === "login" ? "#121311" : "var(--text-dark-muted)",
              borderBottom: tab === "login" ? "2px solid #121311" : "2px solid transparent",
              background: tab === "login" ? "rgba(200, 234, 62, 0.15)" : "transparent"
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setTab("register"); setError(null); }}
            style={{
              padding: "12px",
              fontWeight: 800,
              fontSize: "0.88rem",
              color: tab === "register" ? "#121311" : "var(--text-dark-muted)",
              borderBottom: tab === "register" ? "2px solid #121311" : "2px solid transparent",
              background: tab === "register" ? "rgba(200, 234, 62, 0.15)" : "transparent"
            }}
          >
            Register Student
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

          {tab === "register" && (
            <>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px", color: "var(--text-dark-secondary)" }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Your Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px", color: "var(--text-dark-secondary)" }}>
                    Department *
                  </label>
                  <select value={department} onChange={(e) => setDepartment(e.target.value)}>
                    <option value="Computer Science & Engineering">CSE</option>
                    <option value="Mechanical Engineering">Mechanical</option>
                    <option value="Electronics & Communication">ECE</option>
                    <option value="Information Technology">IT</option>
                    <option value="Civil Engineering">Civil</option>
                    <option value="Electrical Engineering">EEE</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px", color: "var(--text-dark-secondary)" }}>
                    Academic Year *
                  </label>
                  <select value={year} onChange={(e) => setYear(e.target.value)}>
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="Postgraduate">Postgraduate</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Email */}
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px", color: "var(--text-dark-secondary)" }}>
              College Email Address *
            </label>
            <input
              type="email"
              placeholder="student@campus.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: "22px" }}>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px", color: "var(--text-dark-secondary)" }}>
              Password *
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: "100%", padding: "12px", fontSize: "0.92rem" }}
            disabled={submitting}
          >
            <span>{submitting ? "Processing..." : tab === "login" ? "Sign In to CampusMart" : "Complete Registration"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
