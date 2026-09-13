import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  MessageSquare, 
  ShieldCheck, 
  CheckCircle2,
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import RespondRequestModal from '../components/modals/RespondRequestModal';

export default function RequestsPage({ onNavigate }) {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await api.getRequests();
      setRequests(data);
    } catch (err) {
      console.error("Error loading requests", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  // Filter: ONLY show demands from other students (exclude user's own requests)
  const peerDemands = requests.filter(req => req.user_id !== user?.id);

  return (
    <div style={{ color: "var(--text-primary)" }}>
      {/* Header */}
      <div style={{
        marginBottom: "28px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#121311", fontSize: "0.76rem", fontWeight: 800, textTransform: "uppercase", marginBottom: "4px" }}>
          <Users size={16} color="#0C87FD" />
          <span style={{ letterSpacing: "0.05em", color: "#5A5E56" }}>SELLER STUDIO • PEER DEMANDS</span>
        </div>
        <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "6px", color: "#121311" }}>
          Campus Peer Demands
        </h1>
        <p style={{ fontSize: "0.92rem", color: "var(--text-dark-secondary)", maxWidth: "680px", lineHeight: "1.5" }}>
          Review items requested by campus peers that aren't yet in the marketplace. Fulfill their demand with <strong>"I Have This"</strong> to connect and sell directly.
        </p>
      </div>

      {/* Requests Feed */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px", color: "var(--text-dark-muted)" }}>
          Loading peer demands...
        </div>
      ) : peerDemands.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "60px 20px",
          background: "#FFFFFF",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-light)",
          boxShadow: "var(--shadow-card)"
        }}>
          <Users size={48} color="#0C87FD" style={{ margin: "0 auto 16px" }} />
          <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "8px", color: "#121311" }}>No peer demands right now</h3>
          <p style={{ fontSize: "0.88rem", color: "#5A5E56", maxWidth: "440px", margin: "0 auto" }}>
            When fellow campus students post requests for items they can't find in the marketplace, they will appear here for you to fulfill.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {peerDemands.map((req) => (
            <div
              key={req.id}
              style={{
                background: "#FFFFFF",
                border: "1px solid var(--border-light)",
                borderRadius: "var(--radius-lg)",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
                boxShadow: "var(--shadow-card)"
              }}
            >
              {/* Top Row: User & Timing */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <img
                    src={req.user?.profile_image || `https://api.dicebear.com/7.x/initials/svg?seed=${req.user?.full_name}&backgroundColor=0C87FD&textColor=ffffff`}
                    alt={req.user?.full_name}
                    style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }}
                  />
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "0.92rem", fontWeight: 800, color: "#121311" }}>{req.user?.full_name}</span>
                      <ShieldCheck size={14} color="#16A34A" />
                    </div>
                    <span style={{ fontSize: "0.76rem", color: "#8E928A" }}>
                      {req.user?.department} • {req.user?.year ? req.user.year.replace(/\s*\(.*?\)/g, "").trim() : "Student"}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{
                    fontSize: "0.74rem",
                    fontWeight: 700,
                    padding: "4px 12px",
                    borderRadius: "var(--radius-full)",
                    background: "rgba(12, 135, 253, 0.15)",
                    color: "#0C87FD"
                  }}>
                    {req.category}
                  </span>
                  <span style={{ fontSize: "0.78rem", color: "#8E928A", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Clock size={13} />
                    <span>Needed by {req.needed_before}</span>
                  </span>
                </div>
              </div>

              {/* Middle: Title & Description */}
              <div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: "8px", color: "#121311" }}>
                  {req.title}
                </h3>
                <p style={{ fontSize: "0.88rem", color: "#5A5E56", lineHeight: "1.5" }}>
                  {req.description}
                </p>
              </div>

              {/* Bottom Row: Budget & Action */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: "14px",
                borderTop: "1px solid rgba(0, 0, 0, 0.05)"
              }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                  <span style={{ fontSize: "0.82rem", color: "#8E928A" }}>Target Budget:</span>
                  <span style={{ fontSize: "1.35rem", fontWeight: 800, color: "#121311" }}>₹{req.budget}</span>
                </div>

                <button
                  className="btn-primary"
                  style={{ padding: "8px 20px", fontSize: "0.85rem", fontWeight: 800 }}
                  onClick={() => setSelectedRequest(req)}
                >
                  <Sparkles size={15} />
                  <span>I HAVE THIS</span>
                </button>
              </div>

              {/* Responses Thread if any */}
              {req.responses && req.responses.length > 0 && (
                <div style={{
                  marginTop: "6px",
                  padding: "12px 16px",
                  background: "#F7F8F4",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-light)"
                }}>
                  <div style={{ fontSize: "0.74rem", color: "#121311", fontWeight: 800, textTransform: "uppercase", marginBottom: "8px" }}>
                    Campus Offers Received ({req.responses.length}):
                  </div>
                  {req.responses.map((resp) => (
                    <div key={resp.id} style={{ fontSize: "0.82rem", marginBottom: "6px", display: "flex", justifyContent: "space-between", color: "#5A5E56" }}>
                      <span><strong>{resp.responder?.full_name}:</strong> "{resp.message}"</span>
                      <strong style={{ color: "#16A34A" }}>₹{resp.offered_price}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Respond Modal */}
      {selectedRequest && (
        <RespondRequestModal
          requestItem={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onSuccess={loadRequests}
          onOpenChat={() => onNavigate && onNavigate("messages")}
        />
      )}
    </div>
  );
}
