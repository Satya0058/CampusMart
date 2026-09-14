import React, { useState, useEffect } from 'react';
import { 
  X, 
  Repeat, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  Upload, 
  PlusCircle, 
  Check, 
  Trash2 
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import ItemImage from '../common/ItemImage';

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

const CONDITIONS = ["Like New", "Brand New", "Good", "Fair"];

export default function ExchangeModal({ targetItem, onClose, onSuccess }) {
  const { user } = useAuth();
  const { showToast } = useNotifications();

  // Mode: "existing" (select from user's listed items) vs "new" (list item on the spot)
  const [offerMode, setOfferMode] = useState("existing");

  // User's existing items
  const [myExchangeItems, setMyExchangeItems] = useState([]);
  const [selectedMyItemId, setSelectedMyItemId] = useState("");
  const [message, setMessage] = useState("");
  const [loadingItems, setLoadingItems] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // New item on-the-fly fields
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState(targetItem?.category || "Books");
  const [newCondition, setNewCondition] = useState("Like New");
  const [newDescription, setNewDescription] = useState("");
  const [newImages, setNewImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Fetch current student's items that are marked as active
  useEffect(() => {
    async function loadMyItems() {
      try {
        setLoadingItems(true);
        const items = await api.getItems({ seller_id: user?.id, status_filter: "active" });
        const activeItems = (items || []).filter(i => i.status === "active");
        // Sort so exchange-flagged items appear first
        activeItems.sort((a, b) => (b.is_exchange ? 1 : 0) - (a.is_exchange ? 1 : 0));
        setMyExchangeItems(activeItems);

        if (activeItems.length > 0) {
          setSelectedMyItemId(activeItems[0].id.toString());
          setOfferMode("existing");
        } else {
          // If no active items listed yet, default directly to "new" mode so user can list on the spot!
          setOfferMode("new");
          if (targetItem?.exchange_preference) {
            setNewTitle(targetItem.exchange_preference);
          }
        }
      } catch (err) {
        console.error("Failed to load user items", err);
        setOfferMode("new");
      } finally {
        setLoadingItems(false);
      }
    }
    if (user) {
      loadMyItems();
    }
  }, [user, targetItem]);

  const selectedMyItem = myExchangeItems.find(i => i.id.toString() === selectedMyItemId);

  // Handle uploading photos for the item being listed on the spot
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploadingImage(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await api.uploadImage(formData);
        setNewImages((prev) => [...prev, res.url]);
      }
      showToast("Photo uploaded successfully!", "success");
    } catch (err) {
      showToast(err.message || "Failed to upload photo", "error");
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (index) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      let offeredItemId = null;
      let offeredTitle = "";

      if (offerMode === "new") {
        if (!newTitle.trim()) {
          setError("Please enter the title/name of the item you are offering to trade.");
          setSubmitting(false);
          return;
        }

        // 1. Create the item directly on the fly (Zero price required for exchange)
        const created = await api.createItem({
          title: newTitle.trim(),
          category: newCategory,
          condition: newCondition,
          description: newDescription.trim() || `Offered for campus barter in trade for ${targetItem.title}.`,
          selling_price: null,
          original_price: null,
          rental_price_per_day: null,
          is_sell: false,
          is_rent: false,
          is_exchange: true,
          exchange_preference: targetItem.title,
          images: newImages
        });

        offeredItemId = created.id;
        offeredTitle = created.title;
      } else {
        if (!selectedMyItemId) {
          setError("Please select one of your items to trade, or switch to '+ List Item Now'.");
          setSubmitting(false);
          return;
        }
        offeredItemId = parseInt(selectedMyItemId);
        offeredTitle = selectedMyItem?.title || "item";
      }

      // 2. Submit the exchange proposal linking the offered item with target item
      await api.proposeExchange({
        owner_id: targetItem.seller_id,
        requester_item_id: offeredItemId,
        requested_item_id: targetItem.id,
        message: message.trim() || `Hey ${targetItem.seller?.full_name?.split(" ")[0]}! I have '${offeredTitle}' and would love to trade for your '${targetItem.title}'.`
      });

      setSuccess(true);
      showToast(
        offerMode === "new"
          ? "Item listed & exchange proposal sent to student!"
          : "Exchange proposal sent to student!",
        "success"
      );
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1600);
    } catch (err) {
      setError(err.message || "Failed to submit exchange proposal.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "540px", maxHeight: "90vh", overflowY: "auto" }}>
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 22px",
          borderBottom: "1px solid var(--border-subtle)"
        }}>
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Propose Peer Exchange</h3>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Trade what you have for what you need</p>
          </div>
          <button onClick={onClose} style={{ color: "var(--text-muted)", cursor: "pointer" }}>
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div style={{ padding: "40px 24px", textAlign: "center" }}>
            <CheckCircle2 size={48} color="#B5D04D" style={{ margin: "0 auto 16px" }} />
            <h4 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "6px" }}>Exchange Proposal Sent!</h4>
            <p style={{ fontSize: "0.86rem", color: "var(--text-secondary)" }}>
              {targetItem.seller?.full_name} has received your trade proposal. Track the status in your Exchange Center.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: "22px" }}>
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

            {/* Target Item (Their Item) */}
            <div style={{
              padding: "12px 14px",
              background: "#F7F8F4",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-light)",
              marginBottom: "14px"
            }}>
              <div style={{ fontSize: "0.68rem", color: "#5A5E56", textTransform: "uppercase", fontWeight: 800, marginBottom: "6px" }}>
                Target Item You Want (Their Item)
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "8px", overflow: "hidden", flexShrink: 0, background: "#F2F3EE" }}>
                  <ItemImage
                    src={targetItem.images?.[0]?.image_url}
                    alt={targetItem.title}
                    showLabel={false}
                    iconSize={18}
                  />
                </div>
                <div>
                  <h4 style={{ fontSize: "0.9rem", fontWeight: 800, color: "#121311" }}>{targetItem.title}</h4>
                  <span style={{ fontSize: "0.74rem", color: "#5A5E56" }}>
                    Owner: {targetItem.seller?.full_name} • {(targetItem.selling_price || targetItem.original_price) ? `Est. Value: ₹${targetItem.selling_price || targetItem.original_price}` : "Direct Trade"}
                  </span>
                </div>
              </div>

              {targetItem.exchange_preference && (
                <div style={{
                  marginTop: "10px",
                  fontSize: "0.78rem",
                  color: "#121311",
                  background: "#FFFFFF",
                  border: "1px solid var(--border-light)",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px"
                }}>
                  <div>
                    <span style={{ fontWeight: 800, color: "#7C3AED" }}>Owner prefers in return: </span>
                    <span style={{ fontWeight: 600 }}>{targetItem.exchange_preference}</span>
                  </div>
                  {offerMode === "new" && newTitle !== targetItem.exchange_preference && (
                    <button
                      type="button"
                      onClick={() => setNewTitle(targetItem.exchange_preference)}
                      style={{
                        padding: "3px 8px",
                        borderRadius: "4px",
                        background: "#7C3AED",
                        color: "#FFFFFF",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        border: "none",
                        cursor: "pointer",
                        whiteSpace: "nowrap"
                      }}
                    >
                      Use as My Item Title
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Swap visual connector */}
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              margin: "14px 0"
            }}>
              <div style={{ height: "1px", flex: 1, background: "var(--border-light)" }} />
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "4px 12px",
                borderRadius: "var(--radius-full)",
                background: "rgba(200, 234, 62, 0.25)",
                border: "1px solid rgba(200, 234, 62, 0.5)",
                color: "#121311",
                fontSize: "0.76rem",
                fontWeight: 800
              }}>
                <Repeat size={13} />
                <span>Trade Offer</span>
              </div>
              <div style={{ height: "1px", flex: 1, background: "var(--border-light)" }} />
            </div>

            {/* Mode Switcher Tabs: Choose Existing Listed Item VS List Item Right Here */}
            <div style={{
              display: "flex",
              gap: "6px",
              background: "#F2F3EE",
              padding: "4px",
              borderRadius: "var(--radius-full)",
              marginBottom: "16px"
            }}>
              <button
                type="button"
                onClick={() => setOfferMode("existing")}
                style={{
                  flex: 1,
                  padding: "8px 14px",
                  borderRadius: "var(--radius-full)",
                  fontSize: "0.82rem",
                  fontWeight: offerMode === "existing" ? 800 : 600,
                  border: "none",
                  cursor: "pointer",
                  background: offerMode === "existing" ? "#121311" : "transparent",
                  color: offerMode === "existing" ? "#FEFEFE" : "#5A5E56",
                  transition: "all 0.15s ease"
                }}
              >
                Choose Listed Item ({myExchangeItems.length})
              </button>

              <button
                type="button"
                onClick={() => {
                  setOfferMode("new");
                  if (!newTitle && targetItem.exchange_preference) {
                    setNewTitle(targetItem.exchange_preference);
                  }
                }}
                style={{
                  flex: 1,
                  padding: "8px 14px",
                  borderRadius: "var(--radius-full)",
                  fontSize: "0.82rem",
                  fontWeight: offerMode === "new" ? 800 : 600,
                  border: "none",
                  cursor: "pointer",
                  background: offerMode === "new" ? "#121311" : "transparent",
                  color: offerMode === "new" ? "#FEFEFE" : "#5A5E56",
                  transition: "all 0.15s ease"
                }}
              >
                + List Item Right Here
              </button>
            </div>

            {/* TAB 1: SELECT EXISTING LISTED ITEM */}
            {offerMode === "existing" && (
              <div style={{ marginBottom: "16px" }}>
                {loadingItems ? (
                  <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", padding: "10px" }}>Loading your listings...</div>
                ) : myExchangeItems.length === 0 ? (
                  <div style={{
                    padding: "16px",
                    borderRadius: "var(--radius-md)",
                    background: "rgba(200, 234, 62, 0.12)",
                    border: "1px solid rgba(200, 234, 62, 0.4)",
                    marginBottom: "14px",
                    textAlign: "center"
                  }}>
                    <p style={{ margin: "0 0 10px 0", fontSize: "0.84rem", color: "#121311", fontWeight: 700 }}>
                      You don't have any items listed on your account yet.
                    </p>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => {
                        setOfferMode("new");
                        if (!newTitle && targetItem.exchange_preference) {
                          setNewTitle(targetItem.exchange_preference);
                        }
                      }}
                      style={{ padding: "8px 16px", fontSize: "0.82rem", display: "inline-flex", alignItems: "center", gap: "6px" }}
                    >
                      <PlusCircle size={15} />
                      <span>List Item Right Here to Trade</span>
                    </button>
                  </div>
                ) : (
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>
                      Select from Your Existing Listings
                    </label>
                    <select
                      value={selectedMyItemId}
                      onChange={(e) => setSelectedMyItemId(e.target.value)}
                      style={{ width: "100%", padding: "10px 12px" }}
                    >
                      {myExchangeItems.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.title} {item.condition ? `(${item.condition})` : ""} {item.is_exchange ? "★ [Exchange Ready]" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: LIST ITEM ON THE SPOT (IN-MODAL LISTING) */}
            {offerMode === "new" && (
              <div style={{
                background: "#FAFAF7",
                border: "1px solid var(--border-light)",
                borderRadius: "var(--radius-md)",
                padding: "16px",
                marginBottom: "16px"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px", color: "#121311", fontSize: "0.84rem", fontWeight: 800 }}>
                  <PlusCircle size={16} color="#889F18" />
                  <span>List Your Item to Offer (No price required)</span>
                </div>

                {/* Title */}
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "4px", color: "#121311" }}>
                    Item Title / Name *
                  </label>
                  <input
                    type="text"
                    placeholder={`e.g. ${targetItem.exchange_preference || "Engineering Mathematics Book"}`}
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required={offerMode === "new"}
                    style={{ width: "100%", background: "#FFFFFF" }}
                  />
                </div>

                {/* Category & Condition */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "4px", color: "#121311" }}>
                      Category
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      style={{ width: "100%", background: "#FFFFFF" }}
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "4px", color: "#121311" }}>
                      Condition
                    </label>
                    <select
                      value={newCondition}
                      onChange={(e) => setNewCondition(e.target.value)}
                      style={{ width: "100%", background: "#FFFFFF" }}
                    >
                      {CONDITIONS.map(cond => <option key={cond} value={cond}>{cond}</option>)}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "4px", color: "#121311" }}>
                    Brief Notes / Condition Details (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Good condition, 4th semester syllabus edition, no torn pages"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    style={{ width: "100%", background: "#FFFFFF" }}
                  />
                </div>

                {/* Photo Upload (Optional) */}
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "6px", color: "#121311" }}>
                    Photo (Optional)
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <label style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "7px 12px",
                      borderRadius: "var(--radius-md)",
                      border: "1px dashed var(--border-light)",
                      background: "#FFFFFF",
                      color: "#121311",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}>
                      <Upload size={14} />
                      <span>{uploadingImage ? "Uploading..." : "Upload Photo"}</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
                    </label>
                    {newImages.map((img, i) => (
                      <div key={i} style={{ position: "relative", width: "42px", height: "42px", borderRadius: "6px", overflow: "hidden", border: "1px solid var(--border-light)" }}>
                        <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          style={{
                            position: "absolute",
                            top: 1,
                            right: 1,
                            background: "rgba(0,0,0,0.65)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "50%",
                            width: "16px",
                            height: "16px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            fontSize: "10px"
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Proposal Message */}
            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>
                Proposal Note (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Hi! I have this item in great condition and ready for immediate trade."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={{ resize: "none" }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting || (offerMode === "existing" && myExchangeItems.length === 0)}
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Repeat size={16} />
                <span>
                  {submitting
                    ? "Submitting..."
                    : offerMode === "new"
                    ? "List & Send Proposal"
                    : "Send Exchange Proposal"}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
