import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  MoreVertical, 
  TrendingUp, 
  Activity, 
  Moon, 
  ChevronDown, 
  Repeat, 
  Sparkles, 
  ShoppingBag, 
  Calendar, 
  ArrowRight,
  ShieldCheck,
  Package,
  Heart,
  UserCheck,
  Flame,
  Clock,
  PlusCircle
} from 'lucide-react';
import { api } from '../services/api';
import ItemCard from '../components/ItemCard';
import { useAuth } from '../context/AuthContext';

export default function BuyerDashboard({ 
  onNavigate, 
  onSelectItem, 
  onOpenExchangeModal, 
  onOpenPostRequest,
  onOpenRespondRequest
}) {
  const { user } = useAuth();
  const [recommendedItems, setRecommendedItems] = useState([]);
  const [trendingItems, setTrendingItems] = useState([]);
  const [exchangeMatches, setExchangeMatches] = useState([]);
  const [openRequests, setOpenRequests] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [items, requests] = await Promise.all([
          api.getItems({ status_filter: "active" }),
          api.getRequests()
        ]);
        const buyerItems = user ? items.filter(it => it.seller_id !== user.id) : items;
        setRecommendedItems(buyerItems.slice(0, 4));
        setTrendingItems(buyerItems.slice(4, 8));
        setOpenRequests(requests.slice(0, 3));

        if (user) {
          try {
            const matches = await api.getExchangeMatches();
            setExchangeMatches(matches || []);
          } catch {
            setExchangeMatches([]);
          }
        } else {
          setExchangeMatches([]);
        }
      } catch (err) {
        console.error("Failed to load buyer dashboard data", err);
      }
    }
    loadData();
  }, [user]);

  // Dot matrix for Exchange Synergy Index (6 rows x 10 cols)
  const dotMatrix = [
    [1, 1, 1, 2, 2, 2, 1, 1, 2, 2],
    [1, 2, 2, 2, 3, 2, 2, 1, 2, 3],
    [2, 2, 3, 3, 3, 3, 2, 2, 2, 2],
    [1, 2, 2, 3, 3, 2, 2, 1, 1, 2],
    [1, 1, 2, 2, 2, 2, 1, 1, 2, 2],
    [1, 1, 1, 2, 2, 1, 1, 1, 1, 2],
  ];

  return (
    <div style={{ color: "var(--text-dark-primary)" }}>
      {/* 1. PAGE TITLE & SUBTITLE */}
      <div style={{ marginBottom: "22px" }}>
        <h1 style={{
          fontSize: "2.1rem",
          fontWeight: 800,
          letterSpacing: "-0.03em",
          color: "var(--text-dark-primary)",
          marginBottom: "4px"
        }}>
          Campus Overview
        </h1>
        <p style={{ fontSize: "0.88rem", color: "var(--text-dark-muted)", fontWeight: 500 }}>
          Buy, rent, and exchange student gear across your campus!
        </p>
      </div>

      {/* 2. THE SIGNATURE 2-COLUMN DASHBOARD GRID */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "360px 1fr",
        gap: "20px",
        marginBottom: "32px"
      }}>
        {/* ================= COLUMN 1: TALL LEFT CARD (Campus Trade Volume) ================= */}
        <div style={{
          background: "#FFFFFF",
          borderRadius: "28px",
          padding: "26px",
          boxShadow: "var(--shadow-subtle)",
          border: "1px solid var(--border-light)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between"
        }}>
          <div>
            {/* Card Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Zap size={16} color="#121311" strokeWidth={2.5} />
                <span style={{ fontSize: "0.92rem", fontWeight: 800, color: "var(--text-dark-primary)" }}>
                  Campus Trade Volume
                </span>
              </div>
              <MoreVertical size={16} color="var(--text-dark-muted)" style={{ cursor: "pointer" }} />
            </div>

            {/* Main Metric + Lime Badge */}
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "22px" }}>
              <span style={{ fontSize: "2.5rem", fontWeight: 800, letterSpacing: "-0.04em", color: "var(--text-dark-primary)" }}>
                ₹4,3k
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                <span style={{
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  color: "#121311",
                  background: "var(--accent-lime)",
                  padding: "2px 7px",
                  borderRadius: "var(--radius-full)",
                  display: "inline-block",
                  width: "fit-content"
                }}>
                  +15%
                </span>
                <span style={{ fontSize: "0.7rem", color: "var(--text-dark-muted)", fontWeight: 600 }}>saved this term</span>
              </div>
            </div>

            {/* Overlapping 3 Bubbles */}
            <div style={{
              position: "relative",
              height: "220px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "12px 0 24px"
            }}>
              {/* Bubble 1: Lavender / Purple (Bought) */}
              <div style={{
                position: "absolute",
                top: "10px",
                left: "20px",
                width: "145px",
                height: "145px",
                borderRadius: "50%",
                background: "#A594F9",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#121311",
                boxShadow: "0 8px 24px rgba(165, 148, 249, 0.3)",
                zIndex: 1
              }}>
                <span style={{ fontSize: "1.7rem", fontWeight: 800, letterSpacing: "-0.02em" }}>₹2,6k</span>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, opacity: 0.85 }}>Bought</span>
              </div>

              {/* Bubble 2: Deep Dark Charcoal (Rented) */}
              <div style={{
                position: "absolute",
                top: "22px",
                right: "15px",
                width: "135px",
                height: "135px",
                borderRadius: "50%",
                background: "#171816",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#FEFEFE",
                boxShadow: "0 8px 25px rgba(0, 0, 0, 0.25)",
                zIndex: 2
              }}>
                <span style={{ fontSize: "1.55rem", fontWeight: 800, letterSpacing: "-0.02em" }}>₹1,2k</span>
                <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#BEBEC1" }}>Rented</span>
              </div>

              {/* Bubble 3: Vibrant Lime (Swapped) */}
              <div style={{
                position: "absolute",
                bottom: "5px",
                left: "48%",
                transform: "translateX(-50%)",
                width: "98px",
                height: "98px",
                borderRadius: "50%",
                background: "#C8EA3E",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#121311",
                boxShadow: "0 8px 24px rgba(200, 234, 62, 0.4)",
                zIndex: 3
              }}>
                <span style={{ fontSize: "1.35rem", fontWeight: 800 }}>500</span>
                <span style={{ fontSize: "0.68rem", fontWeight: 700 }}>Swapped</span>
              </div>
            </div>
          </div>

          {/* Breakdown Progress Bars */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px", marginTop: "10px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
                <span style={{ fontSize: "1.45rem", fontWeight: 800, color: "var(--text-dark-primary)" }}>
                  45<span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-dark-muted)" }}>%</span>
                </span>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-dark-secondary)" }}>
                  Textbooks & Notes <span style={{ color: "#A594F9" }}>•</span>
                </span>
              </div>
              <div style={{ height: "7px", width: "100%", background: "#F1F2ED", borderRadius: "9999px", overflow: "hidden" }}>
                <div style={{ width: "45%", height: "100%", background: "#A594F9", borderRadius: "9999px" }} />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
                <span style={{ fontSize: "1.45rem", fontWeight: 800, color: "var(--text-dark-primary)" }}>
                  30<span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-dark-muted)" }}>%</span>
                </span>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-dark-secondary)" }}>
                  Electronics & Gadgets <span style={{ color: "#171816" }}>•</span>
                </span>
              </div>
              <div style={{ height: "7px", width: "100%", background: "#F1F2ED", borderRadius: "9999px", overflow: "hidden" }}>
                <div style={{ width: "30%", height: "100%", background: "#171816", borderRadius: "9999px" }} />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
                <span style={{ fontSize: "1.45rem", fontWeight: 800, color: "var(--text-dark-primary)" }}>
                  25<span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-dark-muted)" }}>%</span>
                </span>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-dark-secondary)" }}>
                  Lab & Hostel Gear <span style={{ color: "#C8EA3E" }}>•</span>
                </span>
              </div>
              <div style={{ height: "7px", width: "100%", background: "#F1F2ED", borderRadius: "9999px", overflow: "hidden" }}>
                <div style={{ width: "25%", height: "100%", background: "#C8EA3E", borderRadius: "9999px" }} />
              </div>
            </div>
          </div>
        </div>

        {/* ================= COLUMN 2: RIGHT SECTION (2 Top Cards + 1 Bottom Wide Dark Card) ================= */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Top Row: 2 Cards Side-by-Side */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.25fr", gap: "20px" }}>
            {/* Card A: Campus Trust & Rental Turnover */}
            <div style={{
              background: "#FFFFFF",
              borderRadius: "26px",
              padding: "22px 24px",
              boxShadow: "var(--shadow-subtle)",
              border: "1px solid var(--border-light)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <ShieldCheck size={16} color="#121311" strokeWidth={2.2} />
                    <span style={{ fontSize: "0.86rem", fontWeight: 800, color: "var(--text-dark-primary)" }}>Campus Trust Rating</span>
                  </div>
                  <MoreVertical size={16} color="var(--text-dark-muted)" />
                </div>

                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "18px" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                    <span style={{ fontSize: "2.1rem", fontWeight: 800, letterSpacing: "-0.03em" }}>4.9</span>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-dark-muted)", fontWeight: 600 }}>★</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-dark-muted)", display: "block" }}>Verified</span>
                    <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#16A34A" }}>99% Verified</span>
                  </div>
                </div>
              </div>

              <div style={{ height: "1px", background: "rgba(0,0,0,0.06)", margin: "4px 0 16px" }} />

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Activity size={16} color="#121311" strokeWidth={2.2} />
                    <span style={{ fontSize: "0.86rem", fontWeight: 800, color: "var(--text-dark-primary)" }}>Rental Turnover</span>
                  </div>
                  <MoreVertical size={16} color="var(--text-dark-muted)" />
                </div>

                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                    <span style={{ fontSize: "2.1rem", fontWeight: 800, letterSpacing: "-0.03em" }}>5,8</span>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-dark-muted)", fontWeight: 600 }}>days avg</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-dark-muted)", display: "block" }}>Active Lent</span>
                    <span style={{ fontSize: "0.82rem", fontWeight: 800 }}>75 Items</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card B: Exchange Synergy Index */}
            <div style={{
              background: "#FFFFFF",
              borderRadius: "26px",
              padding: "22px 24px",
              boxShadow: "var(--shadow-subtle)",
              border: "1px solid var(--border-light)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "var(--text-dark-muted)" }}>%</span>
                    <span style={{ fontSize: "0.86rem", fontWeight: 800, color: "var(--text-dark-primary)" }}>Exchange Synergy</span>
                  </div>
                  <MoreVertical size={16} color="var(--text-dark-muted)" />
                </div>

                <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "16px" }}>
                  <span style={{ fontSize: "2.1rem", fontWeight: 800, letterSpacing: "-0.03em" }}>78</span>
                  <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-dark-muted)" }}>%</span>
                  <span style={{
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    color: "#121311",
                    background: "var(--accent-lime)",
                    padding: "2px 8px",
                    borderRadius: "var(--radius-full)"
                  }}>
                    +10%
                  </span>
                </div>

                {/* Dot Matrix Heatmap */}
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "7px",
                  padding: "14px 16px",
                  background: "#F7F8F4",
                  borderRadius: "16px"
                }}>
                  {dotMatrix.map((row, rIdx) => (
                    <div key={rIdx} style={{ display: "flex", justifyContent: "space-between" }}>
                      {row.map((val, cIdx) => {
                        let dotColor = "rgba(0,0,0,0.06)";
                        if (val === 1) dotColor = "rgba(165, 148, 249, 0.45)";
                        if (val === 2) dotColor = "#A594F9";
                        if (val === 3) dotColor = "#C8EA3E";
                        return (
                          <span
                            key={cIdx}
                            style={{
                              width: "10px",
                              height: "10px",
                              borderRadius: "50%",
                              background: dotColor
                            }}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ fontSize: "0.75rem", color: "var(--text-dark-muted)", marginTop: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#C8EA3E" }} />
                <span>Optimal campus syllabus & trade demand match index</span>
              </div>
            </div>
          </div>

          {/* Bottom Row: Wide Deep Dark Card (Campus Handover & Activity Trend) */}
          <div style={{
            background: "#171816",
            borderRadius: "28px",
            padding: "24px 28px",
            color: "#FEFEFE",
            boxShadow: "0 12px 35px rgba(0, 0, 0, 0.18)"
          }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <TrendingUp size={15} color="#C8EA3E" />
                </div>
                <span style={{ fontSize: "0.96rem", fontWeight: 800 }}>Campus Activity & Handover Trend</span>
              </div>

              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "rgba(255, 255, 255, 0.08)",
                padding: "6px 14px",
                borderRadius: "var(--radius-full)",
                fontSize: "0.78rem",
                color: "#BEBEC1",
                fontWeight: 700,
                cursor: "pointer"
              }}>
                <span>Monthly</span>
                <ChevronDown size={13} />
              </div>
            </div>

            {/* Metrics Row with Vertical Indicators */}
            <div style={{ display: "flex", gap: "40px", marginBottom: "22px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ width: "5px", height: "26px", borderRadius: "9999px", background: "#C8EA3E" }} />
                <div>
                  <div style={{ fontSize: "1.55rem", fontWeight: 800, lineHeight: 1.1 }}>
                    85<span style={{ fontSize: "0.9rem", fontWeight: 600 }}>%</span>
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#8E928A", fontWeight: 600 }}>Handover Success</div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ width: "5px", height: "26px", borderRadius: "9999px", background: "#A594F9" }} />
                <div>
                  <div style={{ fontSize: "1.55rem", fontWeight: 800, lineHeight: 1.1 }}>
                    7h 15m
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#8E928A", fontWeight: 600 }}>Avg Response Time</div>
                </div>
              </div>
            </div>

            {/* Vertical Bar Chart */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "12px",
              alignItems: "flex-end",
              height: "140px",
              padding: "8px 0"
            }}>
              {[
                { month: "Jun", height: 50, isCurrent: false },
                { month: "Jul", height: 65, isCurrent: false },
                { month: "Aug", height: 55, isCurrent: false },
                { month: "Sept ↗", height: 95, isCurrent: true },
                { month: "Oct", height: 42, isCurrent: false },
                { month: "Nov", height: 38, isCurrent: false },
                { month: "Dec", height: 32, isCurrent: false },
              ].map((bar, idx) => (
                <div key={idx} style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                  {bar.isCurrent ? (
                    <div style={{ display: "flex", alignItems: "flex-end", gap: "5px", height: "100%" }}>
                      <div style={{
                        width: "16px",
                        height: "92%",
                        background: "#C8EA3E",
                        borderRadius: "var(--radius-full)",
                        boxShadow: "0 0 16px rgba(200, 234, 62, 0.4)"
                      }} />
                      <div style={{
                        width: "16px",
                        height: "72%",
                        background: "#A594F9",
                        borderRadius: "var(--radius-full)",
                        boxShadow: "0 0 16px rgba(165, 148, 249, 0.35)"
                      }} />
                    </div>
                  ) : (
                    <div style={{
                      width: "28px",
                      height: `${bar.height}%`,
                      background: "repeating-linear-gradient(45deg, #22241F, #22241F 4px, #2A2C26 4px, #2A2C26 8px)",
                      borderRadius: "var(--radius-full)",
                      border: "1px solid rgba(255,255,255,0.04)"
                    }} />
                  )}
                  <span style={{
                    fontSize: "0.74rem",
                    marginTop: "8px",
                    color: bar.isCurrent ? "#C8EA3E" : "#7E827A",
                    fontWeight: bar.isCurrent ? 800 : 500
                  }}>
                    {bar.month}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. SIGNATURE POTENTIAL EXCHANGE MATCHES */}
      {exchangeMatches.length > 0 && (
        <div style={{ marginBottom: "36px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#7965E8", fontSize: "0.76rem", fontWeight: 800, textTransform: "uppercase" }}>
                <Repeat size={14} />
                <span>AI-Ready Exchange Pairing</span>
              </div>
              <h2 style={{ fontSize: "1.45rem", fontWeight: 800 }}>Potential Exchange Matches</h2>
            </div>
            <button className="btn-outline" onClick={() => onNavigate("exchange")}>
              <span>Exchange Center</span>
              <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
            {exchangeMatches.slice(0, 2).map((match, idx) => (
              <div
                key={idx}
                style={{
                  background: "#FFFFFF",
                  border: "1px solid var(--border-light)",
                  borderRadius: "24px",
                  padding: "20px",
                  boxShadow: "var(--shadow-subtle)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                    <span className="badge badge-purple">
                      ⚡ {match.compatibility_score || 94}% SYNERGY
                    </span>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-dark-muted)" }}>
                      {match.target_user?.department || "Campus Student"}
                    </span>
                  </div>

                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "#F7F8F4",
                    padding: "14px",
                    borderRadius: "16px",
                    marginBottom: "12px"
                  }}>
                    <div style={{ maxWidth: "42%" }}>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-dark-muted)", display: "block" }}>You Offer</span>
                      <div style={{ fontWeight: 800, fontSize: "0.85rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {match.my_item?.title || "Your Casio Calculator"}
                      </div>
                    </div>

                    <div style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "#171816",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#C8EA3E"
                    }}>
                      <Repeat size={15} />
                    </div>

                    <div style={{ maxWidth: "42%", textAlign: "right" }}>
                      <span style={{ fontSize: "0.7rem", color: "var(--text-dark-muted)", display: "block" }}>You Receive</span>
                      <div style={{ fontWeight: 800, fontSize: "0.85rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {match.target_item?.title}
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: "0.76rem", color: "var(--text-dark-secondary)", lineHeight: "1.4", margin: "6px 0 16px" }}>
                    💡 {match.reason || "High syllabus demand overlap between your semesters"}
                  </p>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    className="btn-primary"
                    style={{ flex: 1, padding: "9px" }}
                    onClick={() => {
                      if (match.target_item) {
                        onSelectItem(match.target_item);
                      } else {
                        onNavigate("exchange");
                      }
                    }}
                  >
                    <span>Inspect Match</span>
                  </button>
                  <button
                    className="btn-dark"
                    style={{ padding: "9px 14px" }}
                    onClick={() => onOpenExchangeModal(match.target_item)}
                  >
                    <span>Swap Now</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. CAMPUS GEAR FEED (WITH EMPTY STATE) */}
      <div style={{ marginBottom: "36px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#C8EA3E", background: "#171816", padding: "2px 8px", borderRadius: "9999px", width: "fit-content", fontSize: "0.72rem", fontWeight: 800, marginBottom: "4px" }}>
              <Flame size={12} />
              <span>FRESH CAMPUS LISTINGS</span>
            </div>
            <h2 style={{ fontSize: "1.45rem", fontWeight: 800 }}>Available Gear & Textbooks</h2>
          </div>
          <button className="btn-outline" onClick={() => onNavigate("marketplace")}>
            <span>View All</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {recommendedItems.length === 0 ? (
          <div style={{
            background: "#FFFFFF",
            borderRadius: "24px",
            padding: "48px 24px",
            textAlign: "center",
            border: "1px solid var(--border-light)",
            boxShadow: "var(--shadow-subtle)"
          }}>
            <div style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "#F4F5F0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px"
            }}>
              <Package size={24} color="var(--text-dark-muted)" />
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "6px" }}>
              No campus listings yet!
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-dark-muted)", maxWidth: "420px", margin: "0 auto 20px" }}>
              Be the first student to publish textbooks, drafters, calculators, or dorm gear.
            </p>
            <button
              className="btn-primary"
              onClick={() => onNavigate("seller-dashboard")}
              style={{ padding: "10px 22px" }}
            >
              <PlusCircle size={16} />
              <span>Publish First Listing</span>
            </button>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: "18px"
          }}>
            {recommendedItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onClick={() => onSelectItem(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 5. OPEN REVERSE STUDENT REQUESTS FEED */}
      {openRequests.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-dark-muted)", fontSize: "0.76rem", fontWeight: 800, textTransform: "uppercase" }}>
                <Sparkles size={14} color="#C8EA3E" />
                <span>Reverse Peer Market</span>
              </div>
              <h2 style={{ fontSize: "1.45rem", fontWeight: 800 }}>Urgent Student Requests</h2>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="btn-primary" onClick={onOpenPostRequest} style={{ padding: "8px 16px", fontSize: "0.8rem" }}>
                <span>+ Post a Request</span>
              </button>
              <button className="btn-outline" onClick={() => onNavigate("requests")} style={{ padding: "8px 14px", fontSize: "0.8rem" }}>
                <span>All Demands</span>
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
            {openRequests.map((req) => (
              <div
                key={req.id}
                style={{
                  background: "#FFFFFF",
                  borderRadius: "22px",
                  padding: "18px",
                  border: "1px solid var(--border-light)",
                  boxShadow: "var(--shadow-subtle)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <span className="badge badge-dark">
                      Budget: ₹{req.budget || "Negotiable"}
                    </span>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-dark-muted)" }}>
                      {req.category}
                    </span>
                  </div>

                  <h3 style={{ fontSize: "0.95rem", fontWeight: 800, marginBottom: "6px", color: "var(--text-dark-primary)" }}>
                    {req.title}
                  </h3>

                  <p style={{ fontSize: "0.78rem", color: "var(--text-dark-secondary)", lineHeight: "1.4", marginBottom: "14px" }}>
                    {req.description}
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "12px", borderTop: "1px solid rgba(0,0,0,0.05)" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-dark-muted)" }}>
                    Wanted by <span style={{ fontWeight: 700, color: "var(--text-dark-primary)" }}>{req.user?.full_name || "Peer"}</span>
                  </div>
                  <button
                    className="btn-primary"
                    style={{ padding: "6px 14px", fontSize: "0.76rem" }}
                    onClick={() => onOpenRespondRequest(req)}
                  >
                    <span>I Have This</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
