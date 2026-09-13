import React, { useState, useEffect, useMemo } from 'react';
import { 
  Repeat, 
  Package, 
  Search, 
  Clock, 
  MessageSquare, 
  ShieldCheck, 
  User, 
  AlertCircle,
  PlusCircle,
  Check,
  X,
  CheckCircle2,
  Trash2,
  CheckCheck
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useMarketplaceMode } from '../context/MarketplaceModeContext';
import ItemImage from '../components/common/ItemImage';
import ExchangeModal from '../components/modals/ExchangeModal';

export default function ExchangeCenterPage({ onNavigate, onOpenAddItem }) {
  const { user } = useAuth();
  const { isSeller } = useMarketplaceMode();
  const { showToast } = useNotifications();

  // Data states
  const [exchangeItems, setExchangeItems] = useState([]);
  const [myExchangeItems, setMyExchangeItems] = useState([]);
  const [proposals, setProposals] = useState({ incoming: [], outgoing: [] });
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(false);

  // Main 2 Tabs: 'available' | 'my-exchange'
  const [mainTab, setMainTab] = useState("available"); // 'available' | 'my-exchange'

  // Sub-section inside 'my-exchange': 'items' | 'incoming' | 'sent'
  const [mySubSection, setMySubSection] = useState("items");

  // Search & Filter for Available Listings
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Modal
  const [selectedTargetItem, setSelectedTargetItem] = useState(null);

  const loadExchangeData = async () => {
    try {
      setLoading(true);
      const [itemsRes, myItemsRes, exchRes] = await Promise.all([
        api.getItems({ mode: "exchange", status_filter: "active" }),
        user ? api.getItems({ seller_id: user.id, status_filter: "active" }).catch(() => []) : Promise.resolve([]),
        user ? api.getMyExchanges().catch(() => ({ incoming: [], outgoing: [] })) : Promise.resolve({ incoming: [], outgoing: [] })
      ]);

      // 1. Available Listings: from other students only (exclude own items)
      const othersItems = (itemsRes || []).filter(
        item => item.is_exchange && item.seller_id !== user?.id && item.status === "active"
      );
      setExchangeItems(othersItems);

      // 2. User's own items marked for exchange
      const myExch = (myItemsRes || []).filter(item => item.is_exchange);
      setMyExchangeItems(myExch);

      // 3. User's exchange proposals (incoming & outgoing)
      setProposals(exchRes || { incoming: [], outgoing: [] });
    } catch (err) {
      console.error("Error loading exchange data", err);
      showToast("Unable to load exchange listings", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExchangeData();
  }, [user]);

  // Categories list for Available Listings
  const categories = useMemo(() => {
    const cats = new Set(exchangeItems.map(i => i.category).filter(Boolean));
    return ["All", ...Array.from(cats)];
  }, [exchangeItems]);

  // Filtered available items
  const filteredExchangeItems = useMemo(() => {
    return exchangeItems.filter(item => {
      const matchesSearch = 
        !searchQuery || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.exchange_preference && item.exchange_preference.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat = selectedCategory === "All" || item.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [exchangeItems, searchQuery, selectedCategory]);

  // Respond to incoming barter proposal
  const handleRespondProposal = async (proposalId, status) => {
    try {
      setActionInProgress(true);
      await api.respondExchange(proposalId, status);
      showToast(
        status === "accepted" 
          ? "Exchange accepted! Coordinate meetup in Messages." 
          : status === "completed"
          ? "Trade marked as completed! Both items updated."
          : `Proposal ${status}.`,
        "success"
      );
      loadExchangeData();
    } catch (e) {
      showToast(e.message || "Failed to update proposal", "error");
    } finally {
      setActionInProgress(false);
    }
  };

  // Mark listed item as swapped
  const handleMarkItemSwapped = async (itemId) => {
    try {
      setActionInProgress(true);
      await api.updateItemStatus(itemId, "sold");
      showToast("Item marked as swapped / completed! 🎉", "success");
      loadExchangeData();
    } catch (e) {
      showToast("Failed to update item status", "error");
    } finally {
      setActionInProgress(false);
    }
  };

  // Delete listed exchange item
  const handleDeleteItem = async (itemId) => {
    if (!window.confirm("Are you sure you want to remove this exchange listing?")) return;
    try {
      setActionInProgress(true);
      await api.deleteItem(itemId);
      showToast("Exchange listing removed", "info");
      loadExchangeData();
    } catch (e) {
      showToast("Failed to delete item", "error");
    } finally {
      setActionInProgress(false);
    }
  };

  const pendingIncomingCount = proposals.incoming?.filter(p => p.status === "pending").length || 0;
  const myTotalCount = myExchangeItems.length + (proposals.incoming?.length || 0) + (proposals.outgoing?.length || 0);

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
            <Repeat size={16} color={isSeller ? "#0C87FD" : "#889F18"} />
            <span style={{ letterSpacing: "0.05em", color: "#5A5E56" }}>CAMPUS EXCHANGES • BARTER MARKET</span>
          </div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "6px", color: "#121311" }}>
            Campus Exchange Center
          </h1>
          <p style={{ fontSize: "0.92rem", color: "var(--text-dark-secondary)", maxWidth: "620px", lineHeight: "1.5" }}>
            Swap books, calculators, and study gear directly with campus peers without spending cash.
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

      {/* 2. THE TWO MAIN TABS: Available Listings & My Exchange List */}
      <div style={{
        display: "flex",
        gap: "8px",
        marginBottom: "24px",
        borderBottom: "1px solid var(--border-light)",
        paddingBottom: "12px",
        overflowX: "auto"
      }}>
        <button
          onClick={() => setMainTab("available")}
          style={{
            padding: "8px 20px",
            borderRadius: "var(--radius-full)",
            fontSize: "0.84rem",
            fontWeight: 800,
            border: "none",
            cursor: "pointer",
            background: mainTab === "available" ? "#121311" : "#F4F5F0",
            color: mainTab === "available" ? "#FEFEFE" : "#5A5E56",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.15s ease"
          }}
        >
          <Package size={15} />
          <span>Available Listings ({exchangeItems.length})</span>
        </button>

        <button
          onClick={() => setMainTab("my-exchange")}
          style={{
            padding: "8px 20px",
            borderRadius: "var(--radius-full)",
            fontSize: "0.84rem",
            fontWeight: 800,
            border: "none",
            cursor: "pointer",
            background: mainTab === "my-exchange" ? "#121311" : "#F4F5F0",
            color: mainTab === "my-exchange" ? "#FEFEFE" : "#5A5E56",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.15s ease"
          }}
        >
          <Repeat size={15} />
          <span>My Exchange List ({myTotalCount})</span>
          {pendingIncomingCount > 0 && (
            <span style={{
              fontSize: "0.7rem",
              padding: "1px 7px",
              borderRadius: "var(--radius-full)",
              background: isSeller ? "#0C87FD" : "#C8EA3E",
              color: isSeller ? "#FFFFFF" : "#121311",
              fontWeight: 800
            }}>
              {pendingIncomingCount} new
            </span>
          )}
        </button>
      </div>

      {/* 3. TAB 1: AVAILABLE LISTINGS */}
      {mainTab === "available" && (
        <div>
          {/* Search & Category Filter Bar */}
          <div style={{
            display: "flex",
            gap: "12px",
            marginBottom: "24px",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            {/* Search Input Box */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "#FFFFFF",
              border: "1px solid var(--border-light)",
              borderRadius: "var(--radius-full)",
              padding: "8px 16px",
              flex: "1 1 300px",
              maxWidth: "480px",
              boxShadow: "var(--shadow-subtle)"
            }}>
              <Search size={16} color="var(--text-dark-muted)" />
              <input
                type="text"
                placeholder="Search exchange items, notes, or peer wishlists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#121311",
                  fontSize: "0.88rem",
                  width: "100%"
                }}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  style={{ background: "none", border: "none", color: "#5A5E56", cursor: "pointer", fontSize: "0.78rem" }}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "var(--radius-full)",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    border: "none",
                    background: selectedCategory === cat ? "#121311" : "#F4F5F0",
                    color: selectedCategory === cat ? "#FEFEFE" : "#5A5E56",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    whiteSpace: "nowrap"
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Catalog Grid */}
          {loading ? (
            <div style={{ textAlign: "center", padding: "70px 20px", color: "var(--text-dark-muted)" }}>
              Loading available campus exchange items...
            </div>
          ) : filteredExchangeItems.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding: "60px 20px",
              background: "#FFFFFF",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-light)",
              boxShadow: "var(--shadow-card)"
            }}>
              <Repeat size={48} color={isSeller ? "#0C87FD" : "#C8EA3E"} style={{ margin: "0 auto 16px" }} />
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#121311", marginBottom: "8px" }}>
                {searchQuery || selectedCategory !== "All" ? "No exchange items match your search" : "No items listed for exchange right now"}
              </h3>
              <p style={{ fontSize: "0.88rem", color: "#5A5E56", maxWidth: "440px", margin: "0 auto 20px" }}>
                {searchQuery || selectedCategory !== "All"
                  ? "Try searching for other keywords or reset the category filter."
                  : "When students list items with exchange enabled, they will appear here. You can also list items in My Exchange List!"}
              </p>
              <button 
                className="btn-primary" 
                onClick={onOpenAddItem}
                style={{ padding: "10px 22px", fontSize: "0.88rem" }}
              >
                + List Your Item for Exchange
              </button>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "20px"
            }}>
              {filteredExchangeItems.map(item => (
                <div
                  key={item.id}
                  style={{
                    background: "#FFFFFF",
                    borderRadius: "var(--radius-lg)",
                    border: "1px solid var(--border-light)",
                    overflow: "hidden",
                    boxShadow: "var(--shadow-card)",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    transition: "transform 0.15s ease, box-shadow 0.15s ease"
                  }}
                >
                  <div>
                    {/* Image Area */}
                    <div style={{ position: "relative", height: "190px", background: "#F2F3EE", overflow: "hidden" }}>
                      <ItemImage
                        src={item.images?.[0]?.image_url}
                        alt={item.title}
                        iconSize={32}
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
                          background: isSeller ? "#0C87FD" : "#C8EA3E",
                          color: isSeller ? "#FFFFFF" : "#121311",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
                        }}>
                          EXCHANGE
                        </span>
                        {item.condition && (
                          <span style={{
                            fontSize: "0.68rem",
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: "var(--radius-full)",
                            background: "rgba(18, 19, 17, 0.75)",
                            color: "#FEFEFE"
                          }}>
                            {item.condition}
                          </span>
                        )}
                      </div>

                      {/* Estimated Value Pill */}
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
                        {(item.selling_price || item.original_price) ? `Est. ₹${item.selling_price || item.original_price}` : "Peer Swap"}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div style={{ padding: "16px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                        <span style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "var(--text-dark-muted)", fontWeight: 700 }}>
                          {item.category}
                        </span>
                        <span style={{ fontSize: "0.74rem", color: "var(--text-dark-secondary)", fontWeight: 600 }}>
                          {item.seller?.full_name?.split(" ")[0]}
                        </span>
                      </div>

                      <h3 style={{
                        fontSize: "1rem",
                        fontWeight: 800,
                        color: "#121311",
                        marginBottom: "10px",
                        lineHeight: "1.35",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden"
                      }}>
                        {item.title}
                      </h3>

                      {/* Wishlist / Wants in Return Banner */}
                      <div style={{
                        background: "#F7F8F4",
                        border: "1px solid var(--border-light)",
                        borderRadius: "var(--radius-md)",
                        padding: "10px 12px",
                        marginBottom: "12px"
                      }}>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "5px",
                          fontSize: "0.68rem",
                          fontWeight: 800,
                          color: "#5A5E56",
                          textTransform: "uppercase",
                          marginBottom: "3px"
                        }}>
                          <Repeat size={12} color={isSeller ? "#0C87FD" : "#889F18"} />
                          <span>Owner Wants in Return:</span>
                        </div>
                        <p style={{
                          fontSize: "0.84rem",
                          color: "#121311",
                          margin: 0,
                          fontWeight: 600,
                          lineHeight: "1.4"
                        }}>
                          {item.exchange_preference || "Open to any fair campus trade"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div style={{
                    padding: "12px 18px",
                    borderTop: "1px solid var(--border-light)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "#FAFAF7"
                  }}>
                    <span style={{ fontSize: "0.74rem", color: "var(--text-dark-muted)", fontWeight: 600 }}>
                      Verified campus trade
                    </span>
                    <button
                      className="btn-primary"
                      style={{
                        padding: "7px 15px",
                        fontSize: "0.82rem",
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                      onClick={() => setSelectedTargetItem(item)}
                    >
                      <Repeat size={14} />
                      <span>Propose Exchange</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. TAB 2: MY EXCHANGE LIST */}
      {mainTab === "my-exchange" && (
        <div>
          {/* Sub-selector pills inside My Exchange List */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "20px",
            flexWrap: "wrap",
            gap: "12px"
          }}>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                onClick={() => setMySubSection("items")}
                style={{
                  padding: "6px 14px",
                  borderRadius: "var(--radius-full)",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  background: mySubSection === "items" ? "#121311" : "#F4F5F0",
                  color: mySubSection === "items" ? "#FEFEFE" : "#5A5E56",
                  transition: "all 0.15s ease"
                }}
              >
                Your Exchange Items ({myExchangeItems.length})
              </button>

              <button
                onClick={() => setMySubSection("incoming")}
                style={{
                  padding: "6px 14px",
                  borderRadius: "var(--radius-full)",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  background: mySubSection === "incoming" ? "#121311" : "#F4F5F0",
                  color: mySubSection === "incoming" ? "#FEFEFE" : "#5A5E56",
                  transition: "all 0.15s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <span>Incoming Offers ({proposals.incoming?.length || 0})</span>
                {pendingIncomingCount > 0 && (
                  <span style={{
                    fontSize: "0.68rem",
                    padding: "1px 6px",
                    borderRadius: "var(--radius-full)",
                    background: isSeller ? "#0C87FD" : "#C8EA3E",
                    color: isSeller ? "#FFFFFF" : "#121311",
                    fontWeight: 800
                  }}>
                    {pendingIncomingCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => setMySubSection("sent")}
                style={{
                  padding: "6px 14px",
                  borderRadius: "var(--radius-full)",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  background: mySubSection === "sent" ? "#121311" : "#F4F5F0",
                  color: mySubSection === "sent" ? "#FEFEFE" : "#5A5E56",
                  transition: "all 0.15s ease"
                }}
              >
                Sent Proposals ({proposals.outgoing?.length || 0})
              </button>
            </div>

            {mySubSection === "items" && onOpenAddItem && (
              <button
                className="btn-primary"
                onClick={onOpenAddItem}
                style={{ padding: "7px 14px", fontSize: "0.8rem", fontWeight: 800, display: "flex", alignItems: "center", gap: "5px" }}
              >
                <PlusCircle size={14} />
                <span>Add Item</span>
              </button>
            )}
          </div>

          {/* SUB-SECTION 1: YOUR LISTED EXCHANGE ITEMS */}
          {mySubSection === "items" && (
            <div>
              {myExchangeItems.length === 0 ? (
                <div style={{
                  textAlign: "center",
                  padding: "60px 20px",
                  background: "#FFFFFF",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--border-light)",
                  boxShadow: "var(--shadow-card)"
                }}>
                  <Package size={48} color={isSeller ? "#0C87FD" : "#C8EA3E"} style={{ margin: "0 auto 16px" }} />
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#121311", marginBottom: "8px" }}>
                    You haven't listed any exchange items yet
                  </h3>
                  <p style={{ fontSize: "0.88rem", color: "#5A5E56", maxWidth: "440px", margin: "0 auto 20px" }}>
                    Have books, tools, or electronics you'd like to barter with peers? Add a listing and check "[ EXCHANGE ]" with your wishlist!
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
                              background: isSeller ? "#0C87FD" : "#C8EA3E",
                              color: isSeller ? "#FFFFFF" : "#121311"
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
                            {(item.selling_price || item.original_price) ? `Est. ₹${item.selling_price || item.original_price}` : "Peer Swap"}
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

                      {/* Actions */}
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

          {/* SUB-SECTION 2: INCOMING OFFERS FROM OTHERS */}
          {mySubSection === "incoming" && (
            <div>
              {proposals.incoming?.length === 0 ? (
                <div style={{
                  textAlign: "center",
                  padding: "60px 20px",
                  background: "#FFFFFF",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--border-light)",
                  boxShadow: "var(--shadow-card)"
                }}>
                  <Repeat size={48} color={isSeller ? "#0C87FD" : "#C8EA3E"} style={{ margin: "0 auto 16px" }} />
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#121311", marginBottom: "8px" }}>
                    No incoming trade offers yet
                  </h3>
                  <p style={{ fontSize: "0.88rem", color: "#5A5E56", maxWidth: "440px", margin: "0 auto" }}>
                    When other campus peers propose to swap for your exchange items, their offers will appear here for you to accept, decline, or chat.
                  </p>
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
                          padding: "20px 24px"
                        }}
                      >
                        {/* Header */}
                        <div style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "14px",
                          flexWrap: "wrap",
                          gap: "8px"
                        }}>
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <h4 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#121311" }}>
                                Barter Offer from {p.requester?.full_name}
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
                              {p.requester?.department} • Year {p.requester?.year || "1"}
                            </span>
                          </div>
                        </div>

                        {/* Swap visual comparison */}
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
                          {/* Left: What they offer */}
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

                          {/* Center Swap Arrow */}
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

                          {/* Right: Your item they want */}
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

                        {/* Actions */}
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

          {/* SUB-SECTION 3: SENT PROPOSALS */}
          {mySubSection === "sent" && (
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
                  <Repeat size={48} color={isSeller ? "#0C87FD" : "#C8EA3E"} style={{ margin: "0 auto 16px" }} />
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#121311", marginBottom: "8px" }}>
                    No sent trade proposals
                  </h3>
                  <p style={{ fontSize: "0.88rem", color: "#5A5E56", maxWidth: "440px", margin: "0 auto 20px" }}>
                    You haven't initiated any barter proposals yet. Browse "Available Listings" to find items to trade for!
                  </p>
                  <button 
                    className="btn-primary" 
                    onClick={() => setMainTab("available")}
                    style={{ padding: "8px 20px", fontSize: "0.86rem" }}
                  >
                    Browse Available Listings
                  </button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {proposals.outgoing.map((p) => {
                    const isAccepted = p.status === "accepted";
                    const isCompleted = p.status === "completed";
                    const isRejected = p.status === "rejected";

                    return (
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
                              Sent to {p.owner?.full_name} ({p.owner?.department || "Campus"})
                            </span>
                            <span style={{
                              fontSize: "0.72rem",
                              fontWeight: 800,
                              padding: "2px 8px",
                              borderRadius: "var(--radius-full)",
                              textTransform: "capitalize",
                              background: isAccepted ? "rgba(200, 234, 62, 0.3)" : isCompleted ? "#E2E4DC" : isRejected ? "rgba(239, 68, 68, 0.15)" : "rgba(245, 158, 11, 0.15)",
                              color: isAccepted ? "#566F0B" : isCompleted ? "#5A5E56" : isRejected ? "#DC2626" : "#B45309"
                            }}>
                              {p.status}
                            </span>
                          </div>
                          <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: "#121311" }}>
                            Offering your '{p.requester_item?.title}' in exchange for '{p.requested_item?.title}'
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
                          <span>Chat with Owner</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Trigger Modal if proposing an exchange */}
      {selectedTargetItem && (
        <ExchangeModal
          targetItem={selectedTargetItem}
          onClose={() => setSelectedTargetItem(null)}
          onSuccess={loadExchangeData}
        />
      )}
    </div>
  );
}
