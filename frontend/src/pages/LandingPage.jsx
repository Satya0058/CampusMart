import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  ShoppingBag, 
  Store, 
  Calendar, 
  Repeat, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  Search,
  Star,
  Users,
  Layers,
  Flame
} from 'lucide-react';
import { api } from '../services/api';
import ItemCard from '../components/ItemCard';
import { useMarketplaceMode } from '../context/MarketplaceModeContext';

export default function LandingPage({ onNavigate, onSelectItem, onOpenPostRequest, onOpenAddItem }) {
  const { setMode } = useMarketplaceMode();
  const [popularItems, setPopularItems] = useState([]);
  const [studentRequests, setStudentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [items, requests] = await Promise.all([
          api.getItems({ status_filter: "active" }),
          api.getRequests()
        ]);
        setPopularItems(items.slice(0, 4));
        setStudentRequests(requests.slice(0, 3));
      } catch (err) {
        console.error("Failed to load landing data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div style={{ color: "var(--text-primary)" }}>
      {/* 1. HERO SECTION */}
      <section style={{
        padding: "70px 0 60px",
        textAlign: "center",
        maxWidth: "920px",
        margin: "0 auto",
        position: "relative"
      }}>
        {/* Subtle background glow effect */}
        <div style={{
          position: "absolute",
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "550px",
          height: "280px",
          background: "radial-gradient(circle, rgba(181, 208, 77, 0.12) 0%, rgba(7, 7, 6, 0) 70%)",
          pointerEvents: "none",
          zIndex: 0
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(181, 208, 77, 0.1)",
            border: "1px solid rgba(181, 208, 77, 0.25)",
            padding: "6px 14px",
            borderRadius: "var(--radius-full)",
            fontSize: "0.82rem",
            color: "#B5D04D",
            fontWeight: 700,
            marginBottom: "20px"
          }}>
            <ShieldCheck size={16} />
            <span>Private & Verified Campus Marketplace</span>
          </div>

          <h1 style={{
            fontSize: "clamp(2.5rem, 5.5vw, 4.2rem)",
            fontWeight: 800,
            lineHeight: "1.12",
            letterSpacing: "-0.03em",
            marginBottom: "20px"
          }}>
            Your Campus. <br />
            <span style={{
              background: "linear-gradient(135deg, #FEFEFE 30%, #B5D04D 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>
              Your Marketplace.
            </span>
          </h1>

          <p style={{
            fontSize: "clamp(1rem, 2vw, 1.22rem)",
            color: "var(--text-secondary)",
            maxWidth: "680px",
            margin: "0 auto 32px",
            lineHeight: "1.6"
          }}>
            Buy, sell, rent and exchange textbooks, calculators, lab equipment, and gadgets directly with students around your campus.
          </p>

          <div style={{ display: "flex", gap: "14px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              className="btn-primary"
              style={{ fontSize: "1rem", padding: "12px 28px" }}
              onClick={() => {
                setMode("buyer");
                onNavigate("marketplace");
              }}
            >
              <ShoppingBag size={18} />
              <span>Explore Marketplace</span>
            </button>

            <button
              className="btn-secondary"
              style={{ fontSize: "1rem", padding: "12px 28px" }}
              onClick={() => {
                setMode("seller");
                onNavigate("seller-dashboard");
              }}
            >
              <Store size={18} />
              <span>Start Selling</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. THE FOUR PILLARS (BUY, SELL, RENT, EXCHANGE) */}
      <section style={{ padding: "40px 0 60px" }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "20px"
        }}>
          {/* BUY */}
          <div style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: "26px 22px",
            transition: "all var(--transition-normal)"
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = "#B5D04D"}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border-subtle)"}
          >
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "rgba(181, 208, 77, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px"
            }}>
              <ShoppingBag size={22} color="#B5D04D" />
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "8px" }}>BUY</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              Snag verified textbooks, calculators, and electronics at up to 60% below retail from seniors.
            </p>
          </div>

          {/* SELL */}
          <div style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: "26px 22px",
            transition: "all var(--transition-normal)"
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = "#535E25"}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border-subtle)"}
          >
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "rgba(83, 94, 37, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px"
            }}>
              <Store size={22} color="#B5D04D" />
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "8px" }}>SELL</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              Turn last semester's lab kits and reference books into instant pocket cash with zero platform commission.
            </p>
          </div>

          {/* RENT */}
          <div style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: "26px 22px",
            transition: "all var(--transition-normal)"
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = "#60a5fa"}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border-subtle)"}
          >
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "rgba(96, 165, 250, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px"
            }}>
              <Calendar size={22} color="#60a5fa" />
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "8px" }}>RENT</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              Borrow scientific calculators or drafter kits for exam week without paying full purchase price.
            </p>
          </div>

          {/* EXCHANGE */}
          <div style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
            padding: "26px 22px",
            transition: "all var(--transition-normal)"
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = "#c084fc"}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = "var(--border-subtle)"}
          >
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "rgba(192, 132, 252, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px"
            }}>
              <Repeat size={22} color="#c084fc" />
            </div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "8px" }}>EXCHANGE</h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              Swap course materials directly with matching students using our algorithmic match scoring.
            </p>
          </div>
        </div>
      </section>

      {/* 3. HOW CAMPUSMART WORKS */}
      <section style={{
        padding: "50px 30px",
        background: "var(--bg-surface)",
        borderRadius: "var(--radius-xl)",
        border: "1px solid var(--border-subtle)",
        marginBottom: "60px"
      }}>
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <span style={{ fontSize: "0.78rem", color: "#B5D04D", fontWeight: 700, textTransform: "uppercase" }}>
            Simple & Transparent
          </span>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, marginTop: "6px" }}>
            How CampusMart Works
          </h2>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "24px"
        }}>
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "#B5D04D",
              color: "#070706",
              fontWeight: 800,
              fontSize: "1.1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px"
            }}>
              1
            </div>
            <h4 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "6px" }}>Find</h4>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
              Browse listings, check rental terms, or post a reverse request for what you need.
            </p>
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "#B5D04D",
              color: "#070706",
              fontWeight: 800,
              fontSize: "1.1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px"
            }}>
              2
            </div>
            <h4 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "6px" }}>Connect</h4>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
              Message the verified student directly with item context already attached to the chat.
            </p>
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "#B5D04D",
              color: "#070706",
              fontWeight: 800,
              fontSize: "1.1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px"
            }}>
              3
            </div>
            <h4 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "6px" }}>Buy / Rent / Exchange</h4>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
              Agree on a campus landmark (library foyer, cafeteria, hostel gate) for physical handover.
            </p>
          </div>

          <div style={{ textAlign: "center" }}>
            <div style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "#B5D04D",
              color: "#070706",
              fontWeight: 800,
              fontSize: "1.1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 14px"
            }}>
              4
            </div>
            <h4 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "6px" }}>Complete</h4>
            <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
              Inspect the item, settle with cash or UPI, and leave peer reviews to build campus trust.
            </p>
          </div>
        </div>
      </section>

      {/* 4. POPULAR ON CAMPUS */}
      <section style={{ marginBottom: "60px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "24px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#f87171", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase" }}>
              <Flame size={16} />
              <span>Trending Gear</span>
            </div>
            <h2 style={{ fontSize: "1.8rem", fontWeight: 800 }}>Popular on Campus</h2>
          </div>
          <button 
            className="btn-outline" 
            onClick={() => { setMode("buyer"); onNavigate("marketplace"); }}
          >
            <span>View All Items</span>
            <ArrowRight size={15} />
          </button>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: "20px"
        }}>
          {popularItems.map((item) => (
            <ItemCard key={item.id} item={item} onClick={() => onSelectItem(item)} />
          ))}
        </div>
      </section>

      {/* 5. OPEN STUDENT REQUESTS */}
      <section style={{ marginBottom: "60px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "24px" }}>
          <div>
            <div style={{ color: "#fbbf24", fontSize: "0.8rem", fontWeight: 700, textTransform: "uppercase" }}>
              Reverse Marketplace
            </div>
            <h2 style={{ fontSize: "1.8rem", fontWeight: 800 }}>Students Looking For Items</h2>
          </div>
          <button className="btn-outline" onClick={() => onNavigate("requests")}>
            <span>Browse All Requests</span>
            <ArrowRight size={15} />
          </button>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "18px"
        }}>
          {studentRequests.map((req) => (
            <div
              key={req.id}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-lg)",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "0.72rem", color: "#B5D04D", fontWeight: 700, textTransform: "uppercase" }}>
                    {req.category}
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
                    Needed by {req.needed_before}
                  </span>
                </div>
                <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "8px" }}>{req.title}</h3>
                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: "1.45" }}>
                  {req.description}
                </p>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "18px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                <div>
                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Student Budget</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#FEFEFE" }}>₹{req.budget}</div>
                </div>
                <button
                  className="btn-primary"
                  style={{ padding: "8px 14px", fontSize: "0.82rem" }}
                  onClick={() => onNavigate("requests")}
                >
                  <Sparkles size={14} />
                  <span>I Have This</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. TRUSTED STUDENT COMMUNITY */}
      <section style={{
        padding: "40px",
        borderRadius: "var(--radius-xl)",
        background: "linear-gradient(135deg, #10130d 0%, #070706 100%)",
        border: "1px solid var(--border-subtle)",
        textAlign: "center"
      }}>
        <ShieldCheck size={40} color="#B5D04D" style={{ margin: "0 auto 16px" }} />
        <h2 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: "12px" }}>
          Trusted Student Community
        </h2>
        <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", maxWidth: "600px", margin: "0 auto 28px", lineHeight: "1.6" }}>
          Every buyer and seller is verified through campus-email authentication. Real peer ratings, zero stranger meetups outside campus, and full transaction accountability.
        </p>

        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.86rem", color: "#FEFEFE" }}>
            <CheckCircle2 size={16} color="#34d399" />
            <span>Campus Email Verified</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.86rem", color: "#FEFEFE" }}>
            <CheckCircle2 size={16} color="#34d399" />
            <span>Peer Ratings & Reviews</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.86rem", color: "#FEFEFE" }}>
            <CheckCircle2 size={16} color="#34d399" />
            <span>Zero Commission Fees</span>
          </div>
        </div>
      </section>
    </div>
  );
}

