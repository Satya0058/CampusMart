import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Calendar, 
  PackageCheck, 
  Users, 
  ArrowUpRight, 
  Sparkles, 
  CheckCircle2, 
  PlusCircle, 
  MessageSquare, 
  Store, 
  ShieldCheck, 
  Filter,
  BarChart3,
  Clock
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export default function OrdersSalesPage({ onNavigate, onOpenAddItem }) {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'sales' | 'rentals'
  const [chartMetric, setChartMetric] = useState("revenue"); // 'revenue' | 'orders'
  const [hoveredBar, setHoveredBar] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getSellerAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to load seller analytics", err);
      showToast("Unable to load sales performance data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const stats = analytics?.stats || {
    total_revenue: 0,
    sales_revenue: 0,
    rental_revenue: 0,
    inventory_value: 0,
    active_listings: 0,
    items_sold: 0,
    active_rentals: 0,
    total_inquiries: 0,
    total_views: 0,
    rating: 5.0,
    payout_status: "Ready (0% fees)"
  };

  const trend = analytics?.revenue_trend || [
    { day: "Mon", revenue: 0, orders: 0 },
    { day: "Tue", revenue: 0, orders: 0 },
    { day: "Wed", revenue: 0, orders: 0 },
    { day: "Thu", revenue: 0, orders: 0 },
    { day: "Fri", revenue: 0, orders: 0 },
    { day: "Sat", revenue: 0, orders: 0 },
    { day: "Sun", revenue: 0, orders: 0 }
  ];

  const recentOrders = analytics?.recent_orders || [];
  const categories = analytics?.category_breakdown || [];

  const filteredOrders = recentOrders.filter(ord => {
    if (activeTab === "all") return true;
    if (activeTab === "sales") return ord.type === "Direct Sale";
    if (activeTab === "rentals") return ord.type === "Rental";
    return true;
  });

  // Calculate max for SVG bar chart scaling
  const maxMetricVal = Math.max(...trend.map(t => chartMetric === "revenue" ? t.revenue : t.orders), chartMetric === "revenue" ? 100 : 5);

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
            <TrendingUp size={16} color="#889F18" />
            <span style={{ letterSpacing: "0.05em", color: "#5A5E56" }}>SELLER STUDIO • REVENUE & SALES</span>
          </div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "6px", color: "#121311" }}>
            Orders & Sales Dashboard
          </h1>
          <p style={{ fontSize: "0.92rem", color: "var(--text-dark-secondary)", maxWidth: "600px", lineHeight: "1.5" }}>
            Monitor your marketplace earnings, student orders, handover status, and sales trends with zero platform fees.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {onOpenAddItem && (
            <button 
              className="btn-primary"
              onClick={onOpenAddItem}
              style={{ padding: "10px 20px", fontSize: "0.88rem", fontWeight: 800 }}
            >
              <PlusCircle size={16} />
              <span>Add Listing</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--text-dark-muted)" }}>
          Loading your sales analytics and orders ledger...
        </div>
      ) : (
        <>
          {/* 2. Top Metric KPI Summary Cards */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "16px",
            marginBottom: "28px"
          }}>
            {/* KPI 1: Total Revenue */}
            <div style={{
              background: "#FFFFFF",
              border: "1px solid var(--border-light)",
              borderRadius: "var(--radius-lg)",
              padding: "22px",
              boxShadow: "var(--shadow-card)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#5A5E56", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Total Earnings
                </span>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(12, 135, 253, 0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <TrendingUp size={18} color="#0C87FD" />
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "6px" }}>
                <span style={{ fontSize: "2rem", fontWeight: 900, color: "#121311", letterSpacing: "-0.03em" }}>
                  ₹{stats.total_revenue}
                </span>
                <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "#16A34A", background: "rgba(22, 163, 74, 0.1)", padding: "2px 8px", borderRadius: "var(--radius-full)" }}>
                  100% Kept
                </span>
              </div>
              <div style={{ fontSize: "0.78rem", color: "#8E928A" }}>
                ₹{stats.sales_revenue} direct sales • ₹{stats.rental_revenue} rentals
              </div>
            </div>

            {/* KPI 2: Completed Orders */}
            <div style={{
              background: "#FFFFFF",
              border: "1px solid var(--border-light)",
              borderRadius: "var(--radius-lg)",
              padding: "22px",
              boxShadow: "var(--shadow-card)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#5A5E56", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Completed Orders
                </span>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#F4F5F0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <PackageCheck size={18} color="#121311" />
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "6px" }}>
                <span style={{ fontSize: "2rem", fontWeight: 900, color: "#121311", letterSpacing: "-0.03em" }}>
                  {stats.items_sold}
                </span>
                <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "#566F0B", background: "rgba(200, 234, 62, 0.2)", padding: "2px 8px", borderRadius: "var(--radius-full)" }}>
                  Handed Over
                </span>
              </div>
              <div style={{ fontSize: "0.78rem", color: "#8E928A" }}>
                Successful peer student handovers on campus
              </div>
            </div>

            {/* KPI 3: Listed Inventory Value */}
            <div style={{
              background: "#FFFFFF",
              border: "1px solid var(--border-light)",
              borderRadius: "var(--radius-lg)",
              padding: "22px",
              boxShadow: "var(--shadow-card)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#5A5E56", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Active Inventory Value
                </span>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "#F4F5F0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Store size={18} color="#121311" />
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "6px" }}>
                <span style={{ fontSize: "2rem", fontWeight: 900, color: "#121311", letterSpacing: "-0.03em" }}>
                  ₹{stats.inventory_value}
                </span>
                <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "#5A5E56" }}>
                  {stats.active_listings} items
                </span>
              </div>
              <div style={{ fontSize: "0.78rem", color: "#8E928A" }}>
                Currently available to buyers on marketplace
              </div>
            </div>

            {/* KPI 4: Buyer Inquiries */}
            <div style={{
              background: "#FFFFFF",
              border: "1px solid var(--border-light)",
              borderRadius: "var(--radius-lg)",
              padding: "22px",
              boxShadow: "var(--shadow-card)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#5A5E56", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Buyer Inquiries
                </span>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(200, 234, 62, 0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <MessageSquare size={18} color="#121311" />
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "6px" }}>
                <span style={{ fontSize: "2rem", fontWeight: 900, color: "#121311", letterSpacing: "-0.03em" }}>
                  {stats.total_inquiries}
                </span>
                <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "#16A34A" }}>
                  Active Leads
                </span>
              </div>
              <div style={{ fontSize: "0.78rem", color: "#8E928A" }}>
                Direct student chat conversations opened
              </div>
            </div>
          </div>

          {/* 3. Interactive Charts Grid */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: "20px",
            marginBottom: "32px"
          }}>
            {/* Left: Revenue Timeline Bar Chart */}
            <div style={{
              background: "#FFFFFF",
              border: "1px solid var(--border-light)",
              borderRadius: "var(--radius-lg)",
              padding: "24px",
              boxShadow: "var(--shadow-card)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#121311", marginBottom: "4px" }}>
                    Performance Overview
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "#8E928A" }}>
                    Daily sales velocity and earnings distribution
                  </p>
                </div>

                {/* Metric toggle */}
                <div style={{ display: "flex", background: "#F4F5F0", padding: "3px", borderRadius: "var(--radius-full)" }}>
                  <button
                    onClick={() => setChartMetric("revenue")}
                    style={{
                      padding: "5px 14px",
                      borderRadius: "var(--radius-full)",
                      fontSize: "0.76rem",
                      fontWeight: 700,
                      border: "none",
                      cursor: "pointer",
                      background: chartMetric === "revenue" ? "#121311" : "transparent",
                      color: chartMetric === "revenue" ? "#FEFEFE" : "#5A5E56",
                      transition: "all 0.15s ease"
                    }}
                  >
                    Revenue (₹)
                  </button>
                  <button
                    onClick={() => setChartMetric("orders")}
                    style={{
                      padding: "5px 14px",
                      borderRadius: "var(--radius-full)",
                      fontSize: "0.76rem",
                      fontWeight: 700,
                      border: "none",
                      cursor: "pointer",
                      background: chartMetric === "orders" ? "#121311" : "transparent",
                      color: chartMetric === "orders" ? "#FEFEFE" : "#5A5E56",
                      transition: "all 0.15s ease"
                    }}
                  >
                    Orders
                  </button>
                </div>
              </div>

              {/* Chart Visual Bars */}
              <div style={{ height: "200px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "14px", padding: "10px 10px 0", borderBottom: "1px solid var(--border-light)" }}>
                {trend.map((t, idx) => {
                  const val = chartMetric === "revenue" ? t.revenue : t.orders;
                  const heightPercent = maxMetricVal > 0 ? Math.max(12, Math.round((val / maxMetricVal) * 100)) : 12;
                  const isHovered = hoveredBar === idx;

                  return (
                    <div 
                      key={t.day}
                      onMouseEnter={() => setHoveredBar(idx)}
                      onMouseLeave={() => setHoveredBar(null)}
                      style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        height: "100%",
                        justifyContent: "flex-end",
                        position: "relative",
                        cursor: "pointer"
                      }}
                    >
                      {/* Floating tooltip */}
                      {isHovered && (
                        <div style={{
                          position: "absolute",
                          bottom: `${heightPercent + 8}%`,
                          background: "#161715",
                          color: "#FEFEFE",
                          padding: "6px 10px",
                          borderRadius: "8px",
                          fontSize: "0.74rem",
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                          boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
                          zIndex: 10,
                          pointerEvents: "none"
                        }}>
                          {chartMetric === "revenue" ? `₹${t.revenue}` : `${t.orders} orders`}
                        </div>
                      )}

                      {/* Bar fill */}
                      <div style={{
                        width: "100%",
                        maxWidth: "42px",
                        height: `${heightPercent}%`,
                        background: isHovered ? "#0C87FD" : "rgba(12, 135, 253, 0.45)",
                        border: isHovered ? "2px solid #0070F3" : "1px solid rgba(12, 135, 253, 0.8)",
                        borderRadius: "8px 8px 2px 2px",
                        transition: "all 0.2s ease"
                      }} />
                    </div>
                  );
                })}
              </div>

              {/* Day Labels */}
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "10px", paddingLeft: "10px", paddingRight: "10px" }}>
                {trend.map(t => (
                  <span key={t.day} style={{ flex: 1, textAlign: "center", fontSize: "0.76rem", fontWeight: 700, color: "#8E928A" }}>
                    {t.day}
                  </span>
                ))}
              </div>
            </div>

            {/* Right: Sales & Category Breakdown */}
            <div style={{
              background: "#FFFFFF",
              border: "1px solid var(--border-light)",
              borderRadius: "var(--radius-lg)",
              padding: "24px",
              boxShadow: "var(--shadow-card)",
              display: "flex",
              flexDirection: "column"
            }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#121311", marginBottom: "4px" }}>
                Category Breakdown
              </h3>
              <p style={{ fontSize: "0.8rem", color: "#8E928A", marginBottom: "20px" }}>
                Inventory and revenue concentration
              </p>

              {categories.length === 0 ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#8E928A", fontSize: "0.85rem", textAlign: "center" }}>
                  No category sales recorded yet.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", flex: 1 }}>
                  {categories.map((cat) => (
                    <div key={cat.category}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 700, marginBottom: "6px" }}>
                        <span style={{ color: "#121311" }}>{cat.category}</span>
                        <span style={{ color: "#0C87FD" }}>₹{cat.revenue} ({cat.share}%)</span>
                      </div>
                      <div style={{ width: "100%", height: "8px", background: "#F4F5F0", borderRadius: "var(--radius-full)", overflow: "hidden" }}>
                        <div style={{
                          width: `${cat.share}%`,
                          height: "100%",
                          background: "#0C87FD",
                          borderRadius: "var(--radius-full)"
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Zero platform fees reminder */}
              <div style={{
                marginTop: "20px",
                padding: "12px",
                background: "#F7F8F4",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-light)",
                display: "flex",
                alignItems: "center",
                gap: "10px"
              }}>
                <ShieldCheck size={20} color="#16A34A" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: "0.76rem", color: "#5A5E56", lineHeight: "1.4" }}>
                  <strong>CampusMart Direct Handover:</strong> 100% of payment goes directly to you via UPI/cash with 0% platform commission.
                </div>
              </div>
            </div>
          </div>

          {/* 4. Orders & Sales Ledger */}
          <div style={{
            background: "#FFFFFF",
            border: "1px solid var(--border-light)",
            borderRadius: "var(--radius-lg)",
            padding: "24px",
            boxShadow: "var(--shadow-card)"
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
              marginBottom: "20px"
            }}>
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#121311", marginBottom: "4px" }}>
                  Orders & Transactions Ledger
                </h3>
                <p style={{ fontSize: "0.82rem", color: "#8E928A" }}>
                  Complete record of sold items and active student handovers
                </p>
              </div>

              {/* Filter Tabs */}
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  onClick={() => setActiveTab("all")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "var(--radius-full)",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    background: activeTab === "all" ? "#121311" : "#F4F5F0",
                    color: activeTab === "all" ? "#FEFEFE" : "#5A5E56"
                  }}
                >
                  All ({recentOrders.length})
                </button>
                <button
                  onClick={() => setActiveTab("sales")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "var(--radius-full)",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    background: activeTab === "sales" ? "#121311" : "#F4F5F0",
                    color: activeTab === "sales" ? "#FEFEFE" : "#5A5E56"
                  }}
                >
                  Sales ({recentOrders.filter(o => o.type === "Direct Sale").length})
                </button>
                <button
                  onClick={() => setActiveTab("rentals")}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "var(--radius-full)",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    background: activeTab === "rentals" ? "#121311" : "#F4F5F0",
                    color: activeTab === "rentals" ? "#FEFEFE" : "#5A5E56"
                  }}
                >
                  Rentals ({recentOrders.filter(o => o.type === "Rental").length})
                </button>
              </div>
            </div>

            {filteredOrders.length === 0 ? (
              <div style={{
                textAlign: "center",
                padding: "50px 20px",
                background: "#F7F8F4",
                borderRadius: "var(--radius-md)"
              }}>
                <ShoppingBag size={40} color="#0C87FD" style={{ margin: "0 auto 12px" }} />
                <h4 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#121311", marginBottom: "6px" }}>
                  No orders found in this view
                </h4>
                <p style={{ fontSize: "0.84rem", color: "#5A5E56", maxWidth: "420px", margin: "0 auto" }}>
                  When items you list are purchased or rented by campus students, their order details, amounts, and handover status will appear here.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid #F4F5F0", color: "#8E928A", fontSize: "0.76rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      <th style={{ padding: "12px 14px" }}>Order ID</th>
                      <th style={{ padding: "12px 14px" }}>Item Details</th>
                      <th style={{ padding: "12px 14px" }}>Type</th>
                      <th style={{ padding: "12px 14px" }}>Student Buyer</th>
                      <th style={{ padding: "12px 14px" }}>Amount</th>
                      <th style={{ padding: "12px 14px" }}>Date</th>
                      <th style={{ padding: "12px 14px" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((ord) => (
                      <tr key={ord.id} style={{ borderBottom: "1px solid rgba(0,0,0,0.04)", fontSize: "0.85rem", transition: "background 0.1s" }}>
                        {/* Order ID */}
                        <td style={{ padding: "14px", fontFamily: "monospace", fontWeight: 700, color: "#5A5E56" }}>
                          {ord.id}
                        </td>

                        {/* Item Details */}
                        <td style={{ padding: "14px" }}>
                          <div style={{ fontWeight: 800, color: "#121311" }}>{ord.item_title}</div>
                          <div style={{ fontSize: "0.74rem", color: "#8E928A" }}>{ord.category}</div>
                        </td>

                        {/* Type */}
                        <td style={{ padding: "14px" }}>
                          <span style={{
                            fontSize: "0.72rem",
                            fontWeight: 800,
                            padding: "4px 10px",
                            borderRadius: "var(--radius-full)",
                            background: ord.type === "Direct Sale" ? "rgba(200, 234, 62, 0.25)" : "rgba(37, 99, 235, 0.15)",
                            color: ord.type === "Direct Sale" ? "#121311" : "#1D4ED8"
                          }}>
                            {ord.type}
                          </span>
                        </td>

                        {/* Student Buyer */}
                        <td style={{ padding: "14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontWeight: 700, color: "#121311" }}>{ord.buyer_name}</span>
                            <ShieldCheck size={14} color="#16A34A" />
                          </div>
                        </td>

                        {/* Amount */}
                        <td style={{ padding: "14px" }}>
                          <strong style={{ fontSize: "0.95rem", color: "#121311" }}>₹{ord.amount}</strong>
                        </td>

                        {/* Date */}
                        <td style={{ padding: "14px", color: "#8E928A", fontSize: "0.78rem" }}>
                          {ord.date}
                        </td>

                        {/* Status */}
                        <td style={{ padding: "14px" }}>
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "0.74rem",
                            fontWeight: 800,
                            padding: "4px 10px",
                            borderRadius: "var(--radius-full)",
                            background: "rgba(22, 163, 74, 0.12)",
                            color: "#15803D"
                          }}>
                            <CheckCircle2 size={12} />
                            <span>{ord.status}</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

