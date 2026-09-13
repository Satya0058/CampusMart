import React, { useState, useMemo } from 'react';
import { 
  X, 
  Upload, 
  Trash2, 
  Sparkles, 
  PlusCircle, 
  Image as ImageIcon,
  Check,
  AlertCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';

const CATEGORIES = [
  "Books",
  "Calculators",
  "Electronics",
  "Lab Equipment",
  "Stationery",
  "Furniture",
  "Sports",
  "Accessories",
  "Hostel Essentials",
  "Others"
];

export default function AddItemModal({ onClose, onSuccess, initialMode = "sell" }) {
  const { showToast } = useNotifications();

  // Mode selection state (can select multiple!)
  const [isSell, setIsSell] = useState(initialMode === "sell" || initialMode === "all");
  const [isRent, setIsRent] = useState(initialMode === "rent");
  const [isExchange, setIsExchange] = useState(initialMode === "exchange");

  // Form fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Books");
  const [condition, setCondition] = useState("Like New");
  const [description, setDescription] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [rentalPrice, setRentalPrice] = useState("");
  const [exchangePreference, setExchangePreference] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [images, setImages] = useState([]);

  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [aiGenerating, setAiGenerating] = useState(false);

  // Auto calculate savings
  const savingsCalc = useMemo(() => {
    if (!isSell) return null;
    const orig = parseFloat(originalPrice);
    const sell = parseFloat(sellingPrice);
    if (!isNaN(orig) && !isNaN(sell) && orig > sell) {
      const saved = Math.round(orig - sell);
      const percent = Math.round(((orig - sell) / orig) * 100);
      return { saved, percent };
    }
    return null;
  }, [isSell, originalPrice, sellingPrice]);

  // AI Description Generator placeholder
  const handleGenerateAiDescription = () => {
    if (!title) {
      showToast("Please enter an item title first to generate AI description.", "warning");
      return;
    }
    setAiGenerating(true);
    setTimeout(() => {
      setAiGenerating(false);
      setDescription(
        `Original ${title} in pristine ${condition} condition. Ideal for campus semester coursework and lab exams. Tested and well-maintained by fellow student. Ready for immediate pickup at campus library foyer or canteen.`
      );
      showToast("✨ AI generated high-converting campus description!", "success");
    }, 700);
  };

  // Image Upload Handling
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploadingImage(true);
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await api.uploadImage(formData);
        setImages((prev) => [...prev, res.url]);
      }
      showToast("Image uploaded successfully!", "success");
    } catch (err) {
      showToast(err.message || "Failed to upload image", "error");
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isSell && !isRent && !isExchange) {
      setError("Please select at least one transaction mode (Sell, Rent, or Exchange).");
      return;
    }
    if (isSell && !sellingPrice) {
      setError("Please enter a selling price.");
      return;
    }
    if (isRent && !rentalPrice) {
      setError("Please enter a daily rental price.");
      return;
    }
    if (isExchange && !isSell && !isRent && !exchangePreference.trim()) {
      setError("Please specify what item you would like in exchange.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await api.createItem({
        title,
        category,
        condition,
        description,
        selling_price: isSell && sellingPrice ? parseFloat(sellingPrice) : null,
        original_price: (isSell || isRent) && originalPrice ? parseFloat(originalPrice) : null,
        rental_price_per_day: isRent && rentalPrice ? parseFloat(rentalPrice) : null,
        is_sell: isSell,
        is_rent: isRent,
        is_exchange: isExchange,
        exchange_preference: isExchange ? exchangePreference : null,
        product_url: productUrl || null,
        images: images.length > 0 ? images : []
      });

      showToast(
        isExchange && !isSell && !isRent
          ? "Item listed for direct peer exchange!"
          : "Listing published to campus marketplace!",
        "success"
      );
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to publish listing.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "620px" }}>
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 24px",
          borderBottom: "1px solid var(--border-subtle)"
        }}>
          <div>
            <h3 style={{ fontSize: "1.15rem", fontWeight: 700 }}>Create Campus Listing</h3>
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Reach verified students across campus blocks</p>
          </div>
          <button onClick={onClose} style={{ color: "var(--text-muted)" }}>
            <X size={18} />
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
              marginBottom: "18px"
            }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Mode Selector Checkboxes */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, marginBottom: "8px", color: "var(--text-secondary)" }}>
              TRANSACTION MODES (Select one or multiple)
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
              <button
                type="button"
                onClick={() => setIsSell(!isSell)}
                style={{
                  padding: "10px",
                  borderRadius: "var(--radius-md)",
                  border: `1px solid ${isSell ? "var(--accent-primary)" : "var(--border-subtle)"}`,
                  background: isSell ? "var(--accent-primary-muted)" : "var(--bg-surface-elevated)",
                  color: isSell ? "var(--accent-primary)" : "var(--text-secondary)",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px"
                }}
              >
                {isSell && <Check size={15} />}
                <span>[ SELL ]</span>
              </button>

              <button
                type="button"
                onClick={() => setIsRent(!isRent)}
                style={{
                  padding: "10px",
                  borderRadius: "var(--radius-md)",
                  border: `1px solid ${isRent ? "#60a5fa" : "var(--border-subtle)"}`,
                  background: isRent ? "rgba(96, 165, 250, 0.15)" : "var(--bg-surface-elevated)",
                  color: isRent ? "#60a5fa" : "var(--text-secondary)",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px"
                }}
              >
                {isRent && <Check size={15} />}
                <span>[ RENT ]</span>
              </button>

              <button
                type="button"
                onClick={() => setIsExchange(!isExchange)}
                style={{
                  padding: "10px",
                  borderRadius: "var(--radius-md)",
                  border: `1px solid ${isExchange ? "#c084fc" : "var(--border-subtle)"}`,
                  background: isExchange ? "rgba(192, 132, 252, 0.15)" : "var(--bg-surface-elevated)",
                  color: isExchange ? "#c084fc" : "var(--text-secondary)",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px"
                }}
              >
                {isExchange && <Check size={15} />}
                <span>[ EXCHANGE ]</span>
              </button>
            </div>
          </div>

          {/* Item Name */}
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>
              Item Name *
            </label>
            <input
              type="text"
              placeholder="e.g. Casio FX-991ES Plus Calculator"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Category & Condition */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>
                Category *
              </label>
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>
                Condition *
              </label>
              <select value={condition} onChange={(e) => setCondition(e.target.value)}>
                <option value="Brand New">Brand New</option>
                <option value="Like New">Like New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
              </select>
            </div>
          </div>

          {/* Description & AI Generator button */}
          <div style={{ marginBottom: "14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                Description *
              </label>
              <button
                type="button"
                onClick={handleGenerateAiDescription}
                disabled={aiGenerating}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "0.74rem",
                  color: "#B5D04D",
                  fontWeight: 700
                }}
              >
                <Sparkles size={13} />
                <span>{aiGenerating ? "Generating..." : "Auto-Generate with AI"}</span>
              </button>
            </div>
            <textarea
              rows={3}
              placeholder="Provide edition, semester usefulness, working condition, accessories included..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              style={{ resize: "none" }}
            />
          </div>

          {/* Dynamic Pricing Fields based on modes */}
          {(isSell || isRent) ? (
            <div style={{ display: "grid", gridTemplateColumns: (isSell && isRent) ? "1fr 1fr 1fr" : "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
              {isSell && (
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>
                    Campus Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    placeholder="e.g. 400"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    required={isSell}
                  />
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>
                  Original Retail Price (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  placeholder="e.g. 800"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                />
              </div>

              {isRent && (
                <div>
                  <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "6px", color: "#60a5fa" }}>
                    Rental / Day (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    placeholder="e.g. 30"
                    value={rentalPrice}
                    onChange={(e) => setRentalPrice(e.target.value)}
                    required={isRent}
                  />
                </div>
              )}
            </div>
          ) : isExchange ? (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 16px",
              background: "rgba(192, 132, 252, 0.08)",
              border: "1px solid rgba(192, 132, 252, 0.25)",
              borderRadius: "var(--radius-md)",
              marginBottom: "14px",
              color: "#c084fc",
              fontSize: "0.85rem",
              fontWeight: 600
            }}>
              <span>🔄 Direct Peer-to-Peer Exchange: No pricing or payment required.</span>
            </div>
          ) : null}

          {/* Savings pill calculation display */}
          {savingsCalc && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 14px",
              borderRadius: "var(--radius-md)",
              background: "rgba(52, 211, 153, 0.1)",
              border: "1px solid rgba(52, 211, 153, 0.25)",
              color: "#34d399",
              fontSize: "0.82rem",
              fontWeight: 700,
              marginBottom: "14px"
            }}>
              <span>⚡ Student Saving: ₹{savingsCalc.saved} ({savingsCalc.percent}% OFF retail)</span>
            </div>
          )}

          {/* Exchange Preference (if Exchange mode enabled) */}
          {isExchange && (
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "6px", color: "#c084fc" }}>
                What item would you like in exchange? {(!isSell && !isRent) && "*"}
              </label>
              <input
                type="text"
                placeholder="e.g. Engineering Maths Book or USB-C Hub"
                value={exchangePreference}
                onChange={(e) => setExchangePreference(e.target.value)}
                required={!isSell && !isRent}
              />
            </div>
          )}

          {/* Product URL */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>
              Product / Book Reference URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
            />
          </div>

          {/* Image Upload Area with Drag & Drop & Previews */}
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, marginBottom: "6px", color: "var(--text-secondary)" }}>
              Item Photos
            </label>
            
            <div style={{
              border: "2px dashed var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "20px",
              textAlign: "center",
              background: "var(--bg-surface-elevated)",
              cursor: "pointer",
              position: "relative"
            }}>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  opacity: 0,
                  cursor: "pointer"
                }}
              />
              <Upload size={24} color="var(--text-muted)" style={{ margin: "0 auto 8px" }} />
              <div style={{ fontSize: "0.84rem", fontWeight: 600 }}>
                {uploadingImage ? "Uploading..." : "Click or drag photos here"}
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "4px" }}>
                Supports JPG, PNG, WEBP • First photo is primary
              </div>
            </div>

            {/* Preview Thumbnails */}
            {images.length > 0 && (
              <div style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap" }}>
                {images.map((imgUrl, idx) => (
                  <div key={idx} style={{ position: "relative", width: "70px", height: "70px", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border-subtle)" }}>
                    <img src={api.getImageUrl(imgUrl)} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      style={{
                        position: "absolute",
                        top: "2px",
                        right: "2px",
                        width: "20px",
                        height: "20px",
                        borderRadius: "50%",
                        background: "rgba(0,0,0,0.7)",
                        color: "#f87171",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <X size={12} />
                    </button>
                    {idx === 0 && (
                      <span style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        background: "var(--accent-primary)",
                        color: "#FFFFFF",
                        fontSize: "0.55rem",
                        fontWeight: 800,
                        textAlign: "center"
                      }}>
                        PRIMARY
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting || uploadingImage}>
              <PlusCircle size={16} />
              <span>{submitting ? "Publishing..." : "Publish Listing"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

