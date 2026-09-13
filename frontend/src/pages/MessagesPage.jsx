import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  MessageSquare, 
  User, 
  ShoppingBag,
  Clock,
  ShieldCheck,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { useMarketplaceMode } from '../context/MarketplaceModeContext';
import ItemImage from '../components/common/ItemImage';

export default function MessagesPage({ initialConversationId, onSelectItem }) {
  const { user } = useAuth();
  const { isSeller } = useMarketplaceMode();
  const { showToast } = useNotifications();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [previewProduct, setPreviewProduct] = useState(null);

  const messagesEndRef = useRef(null);

  const loadConversations = async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const data = await api.getConversations();
      setConversations(data);

      if (data.length > 0) {
        setActiveConversation(prev => {
          if (!prev) {
            return initialConversationId 
              ? data.find(c => c.id === initialConversationId) || data[0]
              : data[0];
          }
          // Refresh active conversation object with new item/user context if available
          return data.find(c => c.id === prev.id) || prev;
        });
      }
    } catch (err) {
      console.error("Error loading conversations", err);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadConversations(true);
      const interval = setInterval(() => loadConversations(false), 4000);
      return () => clearInterval(interval);
    }
  }, [user, initialConversationId]);

  // Load messages when active conversation changes
  useEffect(() => {
    async function loadChatMessages() {
      if (!activeConversation) return;
      try {
        const msgs = await api.getMessages(activeConversation.id);
        setMessages(msgs);
        setTimeout(scrollToBottom, 100);
      } catch (err) {
        console.error("Error loading chat messages", err);
      }
    }
    loadChatMessages();
    const interval = setInterval(loadChatMessages, 4000); // 4-sec message polling
    return () => clearInterval(interval);
  }, [activeConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConversation) return;

    const content = inputText.trim();
    setInputText("");
    setSending(true);

    try {
      const newMsg = await api.sendMessage({
        conversation_id: activeConversation.id,
        content: content
      });
      setMessages((prev) => [...prev, newMsg]);
      setConversations(prev => prev.map(c => 
        c.id === activeConversation.id 
          ? { ...c, last_message: content, updated_at: new Date().toISOString() } 
          : c
      ));
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      showToast("Failed to send message", "error");
    } finally {
      setSending(false);
    }
  };

  // Get recipient student info
  const getOtherUser = (conv) => {
    if (!conv) return null;
    return conv.user1_id === user?.id ? conv.user2 : conv.user1;
  };

  const currentOtherUser = getOtherUser(activeConversation);

  return (
    <div style={{
      height: "calc(100vh - 140px)",
      minHeight: "550px",
      display: "flex",
      borderRadius: "var(--radius-xl)",
      overflow: "hidden",
      border: "1px solid var(--border-light)",
      background: "#FFFFFF",
      boxShadow: "var(--shadow-card)"
    }}>
      {/* LEFT: Conversation List */}
      <div style={{
        width: "320px",
        minWidth: "280px",
        borderRight: "1px solid var(--border-light)",
        display: "flex",
        flexDirection: "column",
        background: "#FFFFFF"
      }}>
        <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border-light)" }}>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#121311", letterSpacing: "-0.02em" }}>Campus Messages</h2>
          <span style={{ fontSize: "0.76rem", color: "#8E928A" }}>
            Direct peer student conversations
          </span>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{ padding: "20px", color: "var(--text-dark-muted)", fontSize: "0.85rem" }}>
              Loading conversations...
            </div>
          ) : conversations.length === 0 ? (
            <div style={{ padding: "30px 20px", textAlign: "center", color: "var(--text-dark-muted)", fontSize: "0.85rem" }}>
              No messages yet. Message a seller on an item card to begin chatting!
            </div>
          ) : (
            conversations.map((conv) => {
              const other = getOtherUser(conv);
              const isSelected = activeConversation?.id === conv.id;

              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConversation(conv)}
                  style={{
                    padding: "14px 18px",
                    display: "flex",
                    gap: "12px",
                    cursor: "pointer",
                    background: isSelected ? "#F4F5F0" : "transparent",
                    borderBottom: "1px solid rgba(0, 0, 0, 0.04)",
                    borderLeft: isSelected ? `3px solid ${isSeller ? "#0C87FD" : "#C8EA3E"}` : "3px solid transparent",
                    transition: "background 0.15s"
                  }}
                >
                  <img
                    src={other?.profile_image || `https://api.dicebear.com/7.x/initials/svg?seed=${other?.full_name}&backgroundColor=${isSeller ? "0C87FD" : "c8ea3e"}&textColor=${isSeller ? "ffffff" : "121311"}`}
                    alt={other?.full_name}
                    style={{ width: "42px", height: "42px", borderRadius: "50%", objectFit: "cover" }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "2px" }}>
                      <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#121311", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {other?.full_name}
                      </span>
                      <span style={{ fontSize: "0.68rem", color: "#8E928A" }}>
                        {new Date(conv.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {conv.item && (
                      <div style={{ fontSize: "0.72rem", color: isSeller ? "#0C87FD" : "#566F0B", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginBottom: "2px" }}>
                        Re: {conv.item.title}
                      </div>
                    )}

                    <div style={{ fontSize: "0.78rem", color: "#5A5E56", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {conv.last_message || "Started a conversation"}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT: Active Chat Window */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#F7F8F4" }}>
        {activeConversation ? (
          <>
            {/* Chat Header with Attached Item Context */}
            <div style={{
              padding: "14px 22px",
              borderBottom: "1px solid var(--border-light)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "#FFFFFF"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <img
                  src={currentOtherUser?.profile_image || `https://api.dicebear.com/7.x/initials/svg?seed=${currentOtherUser?.full_name}&backgroundColor=${isSeller ? "0C87FD" : "c8ea3e"}&textColor=${isSeller ? "ffffff" : "121311"}`}
                  alt={currentOtherUser?.full_name}
                  style={{ width: "38px", height: "38px", borderRadius: "50%", objectFit: "cover" }}
                />
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#121311" }}>{currentOtherUser?.full_name}</span>
                    <ShieldCheck size={14} color="#16A34A" />
                  </div>
                  <span style={{ fontSize: "0.74rem", color: "#8E928A" }}>
                    {currentOtherUser?.department || "Student Member"} • {currentOtherUser?.year ? currentOtherUser.year.replace(/\s*\(.*?\)/g, "").trim() : "Active"}
                  </span>
                </div>
              </div>

              {/* Item Context Header Pill - Opens In-place Preview Popup */}
              {activeConversation.item && (
                <div 
                  onClick={() => setPreviewProduct(activeConversation.item)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 14px",
                    background: isSeller ? "rgba(12, 135, 253, 0.15)" : "rgba(200, 234, 62, 0.18)",
                    border: isSeller ? "1px solid rgba(12, 135, 253, 0.35)" : "1px solid rgba(200, 234, 62, 0.4)",
                    borderRadius: "var(--radius-full)",
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                  title="Click to view product preview"
                >
                  <ShoppingBag size={14} color={isSeller ? "#0C87FD" : "#121311"} />
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#121311", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {activeConversation.item.title}
                  </span>
                </div>
              )}
            </div>

            {/* Chat Messages Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {messages.map((m) => {
                const isMe = m.sender_id === user?.id;
                return (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: isMe ? "flex-end" : "flex-start",
                      maxWidth: "70%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: isMe ? "flex-end" : "flex-start"
                    }}
                  >
                    <div style={{
                      padding: "12px 18px",
                      borderRadius: "18px",
                      borderBottomRightRadius: isMe ? "4px" : "18px",
                      borderBottomLeftRadius: isMe ? "18px" : "4px",
                      background: isMe ? (isSeller ? "#0C87FD" : "#C8EA3E") : "#FFFFFF",
                      color: isMe ? (isSeller ? "#FFFFFF" : "#121311") : "#121311",
                      fontWeight: isMe ? 600 : 500,
                      fontSize: "0.92rem",
                      lineHeight: "1.5",
                      border: isMe ? "none" : "1px solid rgba(0, 0, 0, 0.08)",
                      boxShadow: isMe 
                        ? (isSeller ? "0 2px 10px rgba(12, 135, 253, 0.35)" : "0 2px 8px rgba(200, 234, 62, 0.25)") 
                        : "0 2px 10px rgba(0, 0, 0, 0.04)",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word"
                    }}>
                      {m.content}
                    </div>
                    <span style={{ fontSize: "0.7rem", color: "#8E928A", marginTop: "4px", padding: "0 4px", fontWeight: 500 }}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Bar */}
            <form onSubmit={handleSendMessage} style={{
              padding: "16px 20px",
              borderTop: "1px solid var(--border-light)",
              display: "flex",
              gap: "10px",
              background: "#FFFFFF"
            }}>
              <input
                type="text"
                placeholder={`Message ${currentOtherUser?.full_name?.split(" ")[0]}...`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                style={{ 
                  flex: 1, 
                  padding: "12px 18px", 
                  fontSize: "0.92rem", 
                  borderRadius: "var(--radius-full)",
                  border: "1px solid var(--border-light)",
                  background: "#F4F5F0",
                  outline: "none",
                  color: "#121311"
                }}
              />
              <button
                type="submit"
                className="btn-primary"
                disabled={!inputText.trim() || sending}
                style={{ 
                  borderRadius: "var(--radius-full)", 
                  width: "44px", 
                  height: "44px", 
                  padding: 0,
                  background: isSeller ? "#0C87FD" : undefined,
                  color: isSeller ? "#FFFFFF" : undefined,
                  border: "none",
                  boxShadow: isSeller ? "0 4px 14px rgba(12, 135, 253, 0.35)" : undefined
                }}
              >
                <Send size={18} />
              </button>
            </form>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-dark-muted)" }}>
            Select a conversation to start chatting.
          </div>
        )}
      </div>

      {/* In-place Product Preview Modal (Name & Image only, NO buy/rent/cost buttons) */}
      {previewProduct && (
        <div 
          className="modal-overlay" 
          onClick={() => setPreviewProduct(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999
          }}
        >
          <div 
            className="modal-card" 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              maxWidth: "460px", 
              width: "90%",
              background: "#FFFFFF",
              borderRadius: "24px",
              padding: "24px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              animation: "fadeIn 0.2s ease"
            }}
          >
            {/* Modal Header */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "18px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: isSeller ? "rgba(12, 135, 253, 0.15)" : "rgba(200, 234, 62, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <ShoppingBag size={16} color={isSeller ? "#0C87FD" : "#121311"} />
                </div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#121311" }}>
                  Discussed Product
                </h3>
              </div>
              <button 
                onClick={() => setPreviewProduct(null)} 
                style={{ 
                  background: "#F4F5F1", 
                  border: "none", 
                  width: "32px", 
                  height: "32px", 
                  borderRadius: "50%", 
                  cursor: "pointer", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  color: "#121311" 
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Product Image */}
            <div style={{
              width: "100%",
              height: "260px",
              borderRadius: "16px",
              overflow: "hidden",
              background: "#F2F3EE",
              marginBottom: "16px",
              border: "1px solid rgba(0, 0, 0, 0.06)"
            }}>
              <ItemImage
                src={previewProduct.images?.[0]?.image_url}
                alt={previewProduct.title}
                iconSize={40}
              />
            </div>

            {/* Product Title */}
            <h4 style={{ 
              fontSize: "1.2rem", 
              fontWeight: 800, 
              color: "#121311", 
              marginBottom: "8px" 
            }}>
              {previewProduct.title}
            </h4>

            {/* Category / Condition Badges (NO buy, rent, or cost) */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
              <span style={{
                fontSize: "0.74rem",
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: "var(--radius-full)",
                background: "#EEF1EB",
                color: "#5A5E56"
              }}>
                {previewProduct.category || "Item"}
              </span>
              {previewProduct.condition && (
                <span style={{
                  fontSize: "0.74rem",
                  fontWeight: 700,
                  padding: "4px 10px",
                  borderRadius: "var(--radius-full)",
                  background: isSeller ? "rgba(12, 135, 253, 0.15)" : "rgba(200, 234, 62, 0.2)",
                  color: isSeller ? "#0C87FD" : "#121311"
                }}>
                  Condition: {previewProduct.condition}
                </span>
              )}
            </div>

            {/* Description (brief preview) */}
            {previewProduct.description && (
              <p style={{
                fontSize: "0.85rem",
                color: "#5A5E56",
                lineHeight: "1.5",
                marginBottom: "20px",
                maxHeight: "90px",
                overflowY: "auto"
              }}>
                {previewProduct.description}
              </p>
            )}

            {/* Close Button */}
            <button
              onClick={() => setPreviewProduct(null)}
              className="btn-primary"
              style={{ width: "100%", padding: "12px", borderRadius: "var(--radius-full)", fontWeight: 700 }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
