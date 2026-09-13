import React, { useState, useEffect } from 'react';
import { 
  Repeat, 
  Check, 
  X, 
  CheckCircle2, 
  Package, 
  PlusCircle, 
  Clock, 
  MessageSquare, 
  Trash2, 
  CheckCheck,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import ItemImage from '../components/common/ItemImage';

export default function SellerTradeRequestsPage({ onNavigate, onOpenAddItem }) {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [myExchangeItems, setMyExchangeItems] = useState([]);
  const [proposals, setProposals] = useState({ incoming: [], outgoing: [] });
  const [activeTab, setActiveTab] = useState("incoming"); // 'incoming' | 'listings' | 'outgoing'
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [items, exchData] = await Promise.all([
        api.getItems({ seller_id: user?.id, status_filter: "active" }),
        api.getMyExchanges().catch(() => ({ incoming: [], outgoing: [] }))
      ]);

      setMyExchangeItems((items || []).filter(i => i.is_exchange));
      setProposals(exchData || { incoming: [], outgoing: [] });
    } catch (err) {
      console.error("Error loading seller trade requests data", err);
      showToast("Unable to load trade requests", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const handleRespondProposal = async (proposalId, status) => {
    try {
      setActionInProgress(true);
      await api.respondExchange(proposalId, status);
      showToast(
        status === "accepted" 
          ? "Exchange proposal accepted! Coordinate exchange in Messages." 
          : status === "completed"
          ? "Trade marked as completed! Both items marked exchanged."
          : `Proposal ${status}.`,
        "success"
      );
      loadData();
    } catch (e) {
      showToast(e.message || "Failed to update proposal", "error");
    } finally {
      setActionInProgress(false);
    }
  };

  const handleMarkItemSwapped = async (itemId) => {
    try {
      setActionInProgress(true);
      await api.updateItemStatus(itemId, "sold");
      showToast("Item marked as swapped / completed! 🎉", "success");
      loadData();
    } catch (e) {
      showToast("Failed to update item status", "error");
    } finally {
      setActionInProgress(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Are you sure you want to remove this exchange listing?")) return;
    try {
      setActionInProgress(true);
      await api.deleteItem(itemId);
      showToast("Exchange listing removed", "info");
      loadData();
    } catch (e) {
      showToast("Failed to delete item", "error");
    } finally {
      setActionInProgress(false);
    }
  };

  const pendingCount = proposals.incoming?.filter(p => p.status === "pending").length || 0;

  return (
    <div style={{ color: "var(--text-dark-primary)", maxWidth: "1200px", margin: "0 auto" }}>
      {/* 1. Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "28px",
        flexWrap: "wrap",
        gap: "16px"
      }}>
        <div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: "#121311",
            fontSize: "0.76rem",
            fontWeight: 800,
            textTransform: "uppercase",
            marginBottom: "4px"
          }}>
            <Repeat size={16} color="#889F18" />
            <span style={{ letterSpacing: "0.05em", color: "#5A5E56" }}>SELLER STUDIO • TRADE REQUESTS</span>
          </div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "6px", color: "#121311" }}>
            Trade Requests
          </h1>
          <p style={{ fontSize: "0.92rem", color: "var(--text-dark-secondary)", maxWidth: "620px", lineHeight: "1.5" }}>
            Review incoming barter offers from campus peers and manage your exchange inventory.
          </p>
        </div>

        {onOpenAddItem && (
          <button
            className="btn-primary"
            onClick={onOpenAddItem}
            style={{
              padding: "10px 20px",
              fontSize: "0.88rem",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <PlusCircle size={16} />
            <span>List Item for Exchange</span>
          </button>
        )}
      </div>

      {/* 2. Navigation Tabs (Clean Light Theme) */}
      <div style={{
        display: "flex",
        gap: "8px",
        marginBottom: "24px",
        borderBottom: "1px solid var(--border-light)",
        paddingBottom: "12px",
        overflowX: "auto"
      }}>
        <button
          onClick={() => setActiveTab("incoming")}
          style={{
            padding: "8px 18px",
            borderRadius: "var(--radius-full)",
            fontSize: "0.82rem",
            fontWeight: 800,
            border: "none",
            cursor: "pointer",
            background: activeTab === "incoming" ? "#121311" : "#F4F5F0",
            color: activeTab === "incoming" ? "#FEFEFE" : "#5A5E56",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.15s ease"
          }}
        >
          <Repeat size={15} />
          <span>Incoming Trade Requests ({proposals.incoming?.length || 0})</span>
          {pendingCount > 0 && (
            <span style={{
              fontSize: "0.7rem",
              padding: "1px 7px",
              borderRadius: "var(--radius-full)",
              background: "#0C87FD",
              color: "#FFFFFF",
              fontWeight: 800
            }}>
              {pendingCount} new
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("listings")}
          style={{
            padding: "8px 18px",
            borderRadius: "var(--radius-full)",
            fontSize: "0.82rem",
            fontWeight: 800,
            border: "none",
            cursor: "pointer",
            background: activeTab === "listings" ? "#121311" : "#F4F5F0",
            color: activeTab === "listings" ? "#FEFEFE" : "#5A5E56",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.15s ease"
          }}
        >
          <Package size={15} />
          <span>Your Exchange Listings ({myExchangeItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("outgoing")}
          style={{
            padding: "8px 18px",
            borderRadius: "var(--radius-full)",
            fontSize: "0.82rem",
            fontWeight: 800,
            border: "none",
            cursor: "pointer",
            background: activeTab === "outgoing" ? "#121311" : "#F4F5F0",
            color: activeTab === "outgoing" ? "#FEFEFE" : "#5A5E56",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.15s ease"
          }}
        >
          <Clock size={15} />
          <span>Sent Proposals ({proposals.outgoing?.length || 0})</span>
        </button>
      </div>

      {/* 3. TAB 1: INCOMING TRADE PROPOSALS */}
      {activeTab === "incoming" && (
        <div>
          {loading ? (
            <div style={{ textAlign: "center", padding: "70px 20px", color: "var(--text-dark-muted)" }}>
              Loading trade proposals...
            </div>
          ) : proposals.incoming?.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "60px 20px",
              background: "#FFFFFF",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-light)",
              boxShadow: "var(--shadow-card)"
            }}>
              <Repeat size={48} color="#0C87FD" style={{ margin: "0 auto 16px" }} />
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#121311", marginBottom: "8px" }}>
                No incoming trade proposals yet
              </h3>
              <p style={{ fontSize: "0.88rem", color: "#5A5E56", maxWidth: "480px", margin: "0 auto 20px" }}>
                When other students discover your exchange items in the campus Exchange Center and propose a trade, their barter offers will appear here.
              </p>
              {myExchangeItems.length === 0 && (
                <button
                  className="btn-primary"
                  onClick={onOpenAddItem}
                  style={{ padding: "8px 20px", fontSize: "0.86rem" }}
                >
                  <PlusCircle size={15} />
                  <span>List Your First Exchange Item</span>
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {proposals.incoming.map((p) => {
                const isPending = p.status === "pending";
                const isAccepted = p.status === "accepted";
                const isCompleted = p.status === "completed";
                const isRejected = p.status === "rejected";

                return (
                  <div
                    key={p.id}
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid var(--border-light)",
                      borderRadius: "var(--radius-lg)",
                      boxShadow: "var(--shadow-card)",
                      padding: "22px 24px"
                    }}
                  >
                    {/* Card Top Header */}
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "16px",
                      flexWrap: "wrap",
                      gap: "10px"
                    }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <h4 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#121311" }}>
                            Trade Proposal from {p.requester?.full_name}
                          </h4>
                          <span style={{
                            fontSize: "0.72rem",
                            fontWeight: 800,
                            padding: "3px 10px",
                            borderRadius: "var(--radius-full)",
                            textTransform: "capitalize",
                            background: isPending ? "rgba(245, 158, 11, 0.15)" : isAccepted ? "rgba(200, 234, 62, 0.3)" : isCompleted ? "#E2E4DC" : "rgba(239, 68, 68, 0.15)",
                            color: isPending ? "#B45309" : isAccepted ? "#566F0B" : isCompleted ? "#5A5E56" : "#DC2626"
                          }}>
                            {p.status}
                          </span>
                        </div>
                        <span style={{ fontSize: "0.78rem", color: "#5A5E56" }}>
                          {p.requester?.department} • Year {p.requester?.year || "1"} • Room {p.requester?.room_number || "Hostel"}
                        </span>
                      </div>
                    </div>

                    {/* Swap Comparison Box */}
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto 1fr",
                      gap: "16px",
                      alignItems: "center",
                      background: "#F7F8F4",
                      borderRadius: "var(--radius-md)",
                      border: "1px solid var(--border-light)",
                      padding: "16px",
                      marginBottom: "14px"
                    }}>
                      {/* Left: What They Offer */}
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "56px", height: "56px", borderRadius: "8px", overflow: "hidden", flexShrink: 0, background: "#F2F3EE" }}>
                          <ItemImage
                            src={p.requester_item?.images?.[0]?.image_url}
                            alt={p.requester_item?.title}
                            iconSize={22}
                          />
                        </div>
                        <div>
                          <span style={{ fontSize: "0.68rem", color: "#2563EB", fontWeight: 800, textTransform: "uppercase" }}>
                            THEY OFFER
                          </span>
                          <h5 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#121311", margin: "2px 0" }}>
                            {p.requester_item?.title}
                          </h5>
                          <span style={{ fontSize: "0.76rem", color: "#5A5E56" }}>
                            Est. ₹{p.requester_item?.selling_price || p.requester_item?.original_price} • {p.requester_item?.condition || "Good"}
                          </span>
                        </div>
                      </div>

                      {/* Center Swap Icon */}
                      <div style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "50%",
                        background: "#E2E4DC",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#121311"
                      }}>
                        <Repeat size={16} />
                      </div>

                      {/* Right: Your Item Requested */}
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "flex-end", textAlign: "right" }}>
                        <div>
                          <span style={{ fontSize: "0.68rem", color: "#566F0B", fontWeight: 800, textTransform: "uppercase" }}>
                            FOR YOUR ITEM
                          </span>
                          <h5 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#121311", margin: "2px 0" }}>
                            {p.requested_item?.title}
                          </h5>
                          <span style={{ fontSize: "0.76rem", color: "#5A5E56" }}>
                            Est. ₹{p.requested_item?.selling_price || p.requested_item?.original_price}
                          </span>
                        </div>
                        <div style={{ width: "56px", height: "56px", borderRadius: "8px", overflow: "hidden", flexShrink: 0, background: "#F2F3EE" }}>
                          <ItemImage
                            src={p.requested_item?.images?.[0]?.image_url}
                            alt={p.requested_item?.title}
                            iconSize={22}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Proposer's Note */}
                    {p.message && (
                      <div style={{
                        fontSize: "0.84rem",
                        color: "#121311",
                        background: "#FAFAF7",
                        border: "1px solid var(--border-light)",
                        padding: "10px 14px",
                        borderRadius: "var(--radius-sm)",
                        marginBottom: "16px",
                        fontStyle: "italic"
                      }}>
                        "{p.message}"
                      </div>
                    )}

                    {/* Actions Row */}
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderTop: "1px solid var(--border-light)",
                      paddingTop: "14px",
                      flexWrap: "wrap",
                      gap: "10px"
                    }}>
                      <button
                        className="btn-outline"
                        onClick={() => onNavigate("messages")}
                        style={{
                          padding: "8px 16px",
                          fontSize: "0.82rem",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          background: "#FFFFFF",
                          border: "1px solid var(--border-light)",
                          color: "#121311"
                        }}
                      >
                        <MessageSquare size={14} />
                        <span>Chat with Student</span>
                      </button>

                      <div style={{ display: "flex", gap: "10px" }}>
                        {isPending && (
                          <>
                            <button
                              className="btn-secondary"
                              onClick={() => handleRespondProposal(p.id, "rejected")}
                              disabled={actionInProgress}
                              style={{ padding: "8px 16px", fontSize: "0.82rem", color: "#DC2626", fontWeight: 700 }}
                            >
                              <X size={15} />
                              <span>Decline</span>
                            </button>
                            <button
                              className="btn-primary"
                              onClick={() => handleRespondProposal(p.id, "accepted")}
                              disabled={actionInProgress}
                              style={{ padding: "8px 18px", fontSize: "0.82rem", fontWeight: 800 }}
                            >
                              <Check size={15} />
                              <span>Accept Trade</span>
                            </button>
                          </>
                        )}

                        {isAccepted && (
                          <button
                            className="btn-primary"
                            onClick={() => handleRespondProposal(p.id, "completed")}
                            disabled={actionInProgress}
                            style={{ padding: "8px 18px", fontSize: "0.82rem", fontWeight: 800 }}
                          >
                            <CheckCheck size={15} />
                            <span>Mark Swapped & Completed</span>
                          </button>
                        )}

                        {isCompleted && (
                          <span style={{ fontSize: "0.82rem", color: "#16A34A", fontWeight: 700, display: "flex", alignItems: "center", gap: "5px" }}>
                            <CheckCircle2 size={16} />
                            <span>Trade Completed</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. TAB 2: YOUR EXCHANGE LISTINGS */}
      {activeTab === "listings" && (
        <div>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "18px",
            flexWrap: "wrap",
            gap: "10px"
          }}>
            <p style={{ fontSize: "0.9rem", color: "var(--text-dark-secondary)" }}>
              Items you have listed with exchange enabled. Visible to all campus students on the Exchange Center.
            </p>
            <button
              className="btn-primary"
              onClick={onOpenAddItem}
              style={{ padding: "8px 16px", fontSize: "0.82rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "6px" }}
            >
              <PlusCircle size={15} />
              <span>Add Exchange Item</span>
            </button>
          </div>

          {myExchangeItems.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "60px 20px",
              background: "#FFFFFF",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-light)",
              boxShadow: "var(--shadow-card)"
            }}>
              <Package size={48} color="#0C87FD" style={{ margin: "0 auto 16px" }} />
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#121311", marginBottom: "8px" }}>
                No exchange listings yet
              </h3>
              <p style={{ fontSize: "0.88rem", color: "#5A5E56", maxWidth: "440px", margin: "0 auto 20px" }}>
                You don't have any active listings with exchange enabled. Add an item and select "[ EXCHANGE ]" with your wishlist!
              </p>
              <button className="btn-primary" onClick={onOpenAddItem} style={{ padding: "8px 20px", fontSize: "0.86rem" }}>
                <PlusCircle size={15} />
                <span>Create Exchange Listing</span>
              </button>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "20px"
            }}>
              {myExchangeItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: "#FFFFFF",
                    border: "1px solid var(--border-light)",
                    borderRadius: "var(--radius-lg)",
                    overflow: "hidden",
                    boxShadow: "var(--shadow-card)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                  }}
                >
                  <div>
                    {/* Image Header */}
                    <div style={{ position: "relative", width: "100%", height: "170px", background: "#F2F3EE" }}>
                      <ItemImage
                        src={item.images?.[0]?.image_url}
                        alt={item.title}
                        iconSize={30}
                      />
                      <div style={{
                        position: "absolute",
                        top: "10px",
                        left: "10px",
                        display: "flex",
                        gap: "6px"
                      }}>
                        <span style={{
                          fontSize: "0.68rem",
                          fontWeight: 800,
                          padding: "3px 9px",
                          borderRadius: "var(--radius-full)",
                          background: "#0C87FD",
                          color: "#FFFFFF"
                        }}>
                          EXCHANGE
                        </span>
                        <span style={{
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: "var(--radius-full)",
                          background: "rgba(18, 19, 17, 0.8)",
                          color: "#FEFEFE"
                        }}>
                          {item.condition || "Good"}
                        </span>
                      </div>
                      <div style={{
                        position: "absolute",
                        bottom: "10px",
                        right: "10px",
                        background: "rgba(18, 19, 17, 0.85)",
                        color: "#FEFEFE",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: "var(--radius-sm)"
                      }}>
                        Est. ₹{item.selling_price || item.original_price}
                      </div>
                    </div>

                    {/* Content */}
                    <div style={{ padding: "16px 18px" }}>
                      <span style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "var(--text-dark-muted)", fontWeight: 700 }}>
                        {item.category}
                      </span>
                      <h4 style={{ fontSize: "1rem", fontWeight: 800, color: "#121311", margin: "4px 0 10px" }}>
                        {item.title}
                      </h4>

                      <div style={{
                        background: "#F7F8F4",
                        border: "1px solid var(--border-light)",
                        borderRadius: "var(--radius-md)",
                        padding: "10px 12px"
                      }}>
                        <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#5A5E56", textTransform: "uppercase", marginBottom: "3px" }}>
                          Your Wishlist / Preference:
                        </div>
                        <p style={{ fontSize: "0.82rem", color: "#121311", margin: 0, fontWeight: 600 }}>
                          {item.exchange_preference || "Open to any fair campus trade"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div style={{
                    padding: "12px 18px",
                    borderTop: "1px solid var(--border-light)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "#FAFAF7"
                  }}>
                    <button
                      className="btn-secondary"
                      onClick={() => handleDeleteItem(item.id)}
                      disabled={actionInProgress}
                      style={{ padding: "6px 12px", fontSize: "0.78rem", color: "#DC2626", fontWeight: 700 }}
                    >
                      <Trash2 size={13} />
                      <span>Delete</span>
                    </button>

                    <button
                      className="btn-primary"
                      onClick={() => handleMarkItemSwapped(item.id)}
                      disabled={actionInProgress}
                      style={{ padding: "6px 14px", fontSize: "0.78rem", fontWeight: 800 }}
                    >
                      <CheckCircle2 size={13} />
                      <span>Mark Swapped</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. TAB 3: SENT PROPOSALS */}
      {activeTab === "outgoing" && (
        <div>
          {proposals.outgoing?.length === 0 ? (
            <div style={{ 
              textAlign: "center",
              padding: "60px 20px", 
              background: "#FFFFFF", 
              borderRadius: "var(--radius-lg)", 
              border: "1px solid var(--border-light)",
              boxShadow: "var(--shadow-card)"
            }}>
              <Repeat size={48} color="#0C87FD" style={{ margin: "0 auto 16px" }} />
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#121311", marginBottom: "8px" }}>
                No sent trade proposals
              </h3>
              <p style={{ fontSize: "0.88rem", color: "#5A5E56", maxWidth: "440px", margin: "0 auto" }}>
                You haven't initiated any barter proposals from your seller account.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {proposals.outgoing.map((p) => (
                <div
                  key={p.id}
                  style={{
                    padding: "18px 22px",
                    background: "#FFFFFF",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--border-light)",
                    boxShadow: "var(--shadow-card)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "16px",
                    flexWrap: "wrap"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{ fontSize: "0.76rem", color: "#5A5E56", fontWeight: 600 }}>
                        Sent to {p.owner?.full_name}
                      </span>
                      <span style={{
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        padding: "2px 8px",
                        borderRadius: "var(--radius-full)",
                        textTransform: "capitalize",
                        background: p.status === "accepted" ? "rgba(200, 234, 62, 0.3)" : "#F4F5F0",
                        color: p.status === "accepted" ? "#566F0B" : "#5A5E56"
                      }}>
                        {p.status}
                      </span>
                    </div>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#121311" }}>
                      Offering your '{p.requester_item?.title}' for their '{p.requested_item?.title}'
                    </h4>
                  </div>

                  <button
                    className="btn-outline"
                    onClick={() => onNavigate("messages")}
                    style={{
                      padding: "7px 14px",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      background: "#FFFFFF",
                      border: "1px solid var(--border-light)",
                      color: "#121311"
                    }}
                  >
                    <MessageSquare size={14} />
                    <span>Message Owner</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
