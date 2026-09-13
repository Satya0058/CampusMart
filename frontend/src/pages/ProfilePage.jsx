import React, { useState, useEffect } from 'react';
import { 
  User, 
  ShieldCheck, 
  Star, 
  Package, 
  Repeat, 
  Calendar, 
  Edit3, 
  Check, 
  Clock,
  Sparkles,
  Award
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import ItemCard from '../components/ItemCard';

export default function ProfilePage({ onSelectItem }) {
  const { user, setUser } = useAuth();
  const { showToast } = useNotifications();

  const [activeTab, setActiveTab] = useState("listings"); // 'listings' | 'reviews' | 'exchanges' | 'rentals'
  const [userListings, setUserListings] = useState([]);
  const [userReviews, setUserReviews] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  // Edit fields
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [department, setDepartment] = useState(user?.department || "");
  const [year, setYear] = useState(user?.year || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadUserData() {
      if (!user) return;
      try {
        const [items, reviews] = await Promise.all([
          api.getItems({ seller_id: user.id, status_filter: "all" }),
          api.getUserReviews(user.id)
        ]);
        setUserListings(items);
        setUserReviews(reviews);
      } catch (err) {
        console.error("Failed to load user profile data", err);
      }
    }
    loadUserData();
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.updateMe({
        full_name: fullName,
        department,
        year,
        bio
      });
      setUser(updated);
      setIsEditing(false);
      showToast("Profile updated successfully!", "success");
    } catch (err) {
      showToast("Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ color: "var(--text-primary)" }}>
      {/* Profile Header Card */}
      <div style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-xl)",
        padding: "32px",
        marginBottom: "32px",
        position: "relative"
      }}>
        <div style={{ display: "flex", gap: "24px", alignItems: "flex-start", flexWrap: "wrap" }}>
          {/* Avatar */}
          <div style={{ position: "relative" }}>
            <img
              src={user?.profile_image || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.full_name || 'User'}&backgroundColor=c8ea3e&textColor=121311`}
              alt={user?.full_name}
              style={{
                width: "90px",
                height: "90px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "2px solid #B5D04D",
                boxShadow: "0 0 20px rgba(181, 208, 77, 0.25)"
              }}
            />
            <div style={{
              position: "absolute",
              bottom: "0",
              right: "0",
              background: "#B5D04D",
              borderRadius: "50%",
              padding: "4px",
              display: "flex"
            }}>
              <ShieldCheck size={16} color="#070706" />
            </div>
          </div>

          {/* User Details */}
          <div style={{ flex: 1, minWidth: "260px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <h1 style={{ fontSize: "1.6rem", fontWeight: 800 }}>{user?.full_name}</h1>
                  <span className="badge badge-verified" style={{ fontSize: "0.68rem" }}>
                    Verified Student
                  </span>
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "2px" }}>
                  {user?.department} • {user?.year ? user.year.replace(/\s*\(.*?\)/g, "").trim() : "Active Student"} • {user?.email}
                </div>
              </div>

              {!isEditing && (
                <button
                  className="btn-secondary"
                  onClick={() => {
                    setFullName(user?.full_name || "");
                    setDepartment(user?.department || "");
                    setYear(user?.year ? user.year.replace(/\s*\(.*?\)/g, "").trim() : "1st Year");
                    setBio(user?.bio || "");
                    setIsEditing(true);
                  }}
                  style={{ padding: "8px 14px", fontSize: "0.82rem" }}
                >
                  <Edit3 size={14} />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>

            {/* Bio */}
            {!isEditing ? (
              <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", marginTop: "12px", lineHeight: "1.5" }}>
                {user?.bio || "Active student participating in the CampusMart community."}
              </p>
            ) : (
              <form onSubmit={handleSaveProfile} style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                  <input
                    type="text"
                    value={fullName}
                    placeholder="Full Name"
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    value={department}
                    placeholder="Department"
                    onChange={(e) => setDepartment(e.target.value)}
                    required
                  />
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    style={{ padding: "8px 12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--border-light)", background: "#FFFFFF", color: "var(--text-dark-primary)", fontWeight: 600 }}
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="Postgraduate">Postgraduate</option>
                    <option value="PhD Scholar">PhD Scholar</option>
                  </select>
                </div>
                <textarea
                  rows={2}
                  value={bio}
                  placeholder="Tell campus students about yourself..."
                  onChange={(e) => setBio(e.target.value)}
                />
                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="submit" className="btn-primary" disabled={saving} style={{ padding: "6px 14px", fontSize: "0.82rem" }}>
                    <Check size={14} />
                    <span>Save Changes</span>
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => setIsEditing(false)} style={{ padding: "6px 14px", fontSize: "0.82rem" }}>
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Trust Metrics Bar */}
            <div style={{
              display: "flex",
              gap: "24px",
              marginTop: "20px",
              paddingTop: "16px",
              borderTop: "1px solid rgba(255,255,255,0.05)"
            }}>
              <div>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#FEFEFE", display: "flex", alignItems: "center", gap: "4px" }}>
                  <Star size={16} fill="#B5D04D" color="#B5D04D" />
                  <span>{user?.rating || "4.9"}</span>
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  {userReviews.length || user?.review_count || 12} Campus Reviews
                </div>
              </div>

              <div>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#FEFEFE" }}>
                  {user?.transactions_count || userListings.length || 18}
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  Successful Handovers
                </div>
              </div>

              <div>
                <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#B5D04D" }}>
                  100%
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                  Response Rate
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex",
        gap: "12px",
        borderBottom: "1px solid var(--border-subtle)",
        marginBottom: "24px"
      }}>
        <button
          onClick={() => setActiveTab("listings")}
          style={{
            padding: "10px 18px",
            fontWeight: 700,
            fontSize: "0.88rem",
            color: activeTab === "listings" ? "#B5D04D" : "var(--text-secondary)",
            borderBottom: activeTab === "listings" ? "2px solid #B5D04D" : "2px solid transparent"
          }}
        >
          My Listings ({userListings.length})
        </button>

        <button
          onClick={() => setActiveTab("reviews")}
          style={{
            padding: "10px 18px",
            fontWeight: 700,
            fontSize: "0.88rem",
            color: activeTab === "reviews" ? "#B5D04D" : "var(--text-secondary)",
            borderBottom: activeTab === "reviews" ? "2px solid #B5D04D" : "2px solid transparent"
          }}
        >
          Peer Reviews ({userReviews.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "listings" && (
        <div>
          {userListings.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
              No listings currently published.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "20px" }}>
              {userListings.map((item) => (
                <ItemCard key={item.id} item={item} onClick={() => onSelectItem(item)} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "reviews" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {userReviews.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
              No reviews received yet. Reviews appear after successful transactions.
            </div>
          ) : (
            userReviews.map((r) => (
              <div
                key={r.id}
                style={{
                  padding: "18px",
                  background: "var(--bg-surface)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.9rem" }}>{r.reviewer?.full_name}</span>
                    <span className="badge badge-dark" style={{ fontSize: "0.65rem" }}>
                      Verified {r.transaction_type?.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "2px", color: "#B5D04D" }}>
                    <Star size={13} fill="#B5D04D" />
                    <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>{r.rating}</span>
                  </div>
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.45" }}>
                  "{r.comment}"
                </p>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "6px" }}>
                  {new Date(r.created_at).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

