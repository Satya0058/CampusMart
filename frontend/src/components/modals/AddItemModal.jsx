import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Sparkles, 
  PlusCircle, 
  Check, 
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Camera
} from 'lucide-react';
import { api } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';

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

export default function AddItemModal({ onClose, onSuccess, initialMode = "sell" }) {
  const { showToast } = useNotifications();
  const fileInputRef = useRef(null);

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

  // AI Safety Intelligence State
  const [uploadingImage, setUploadingImage] = useState(false);
  const [aiScanning, setAiScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [aiVerdict, setAiVerdict] = useState(null);

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

  // AI Description Generator
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

  // Run AI Safety Scan
  const runAiSafetyScan = async (imageUrl, currentTitle = title, currentCat = category, currentDesc = description, notify = true) => {
    if (!imageUrl) return;
    setAiScanning(true);
    setScanStep(1);
    setError(null);

    // Progressive stage animation timer
    const interval = setInterval(() => {
      setScanStep((prev) => (prev < 4 ? prev + 1 : prev));
    }, 400);

    try {
      const result = await api.checkItemSafety({
        image_url: imageUrl,
        title: currentTitle,
        category: currentCat,
        description: currentDesc
      });

      clearInterval(interval);
      setScanStep(5);
      setAiVerdict(result);

      if (result.decision === "APPROVE") {
        if (notify) {
          showToast(`🛡️ AI Verified: ${result.object_detected} approved!`, "success");
        }
        // Auto-suggest title if empty and detected object is specific
        if (!currentTitle && result.object_detected && result.object_detected !== "Unknown Object" && !result.object_detected.includes("Physical item")) {
          setTitle(result.object_detected);
        }
        // Auto-suggest category if appropriate
        const detectedLower = (result.object_detected || "").toLowerCase();
        if (detectedLower.includes("calc")) setCategory("Calculators");
        else if (detectedLower.includes("book") || detectedLower.includes("notebook")) setCategory("Books");
        else if (detectedLower.includes("laptop") || detectedLower.includes("keyboard") || detectedLower.includes("mouse")) setCategory("Electronics");
        else if (detectedLower.includes("backpack") || detectedLower.includes("bag")) setCategory("Accessories");
        else if (detectedLower.includes("bike") || detectedLower.includes("bicycle") || detectedLower.includes("cycle")) setCategory("Sports");
        else if (detectedLower.includes("pen") || detectedLower.includes("scale") || detectedLower.includes("ruler") || detectedLower.includes("drafter")) setCategory("Stationery");
        else if (detectedLower.includes("shirt") || detectedLower.includes("hoodie") || detectedLower.includes("shoe") || detectedLower.includes("jean")) setCategory("Fashion");
      } else if (result.decision === "REVIEW") {
        if (notify) {
          showToast("⚠️ Additional listing details or review required.", "warning");
        }
      } else if (result.decision === "BLOCK") {
        showToast("✕ Item violates CampusMart Safety Policy.", "error");
      }
    } catch (err) {
      clearInterval(interval);
      setAiVerdict({
        decision: "REVIEW",
        object_detected: "Unverified Item",
        object_confidence: 0,
        risk_level: "MEDIUM",
        reason: err.message || "Safety scan service temporarily unavailable. Listing requires manual review."
      });
    } finally {
      setAiScanning(false);
    }
  };

  // Automatically re-verify with multimodal listing details when title or category is entered
  useEffect(() => {
    if (!images.length) return;
    if (aiVerdict && aiVerdict.decision === "BLOCK") return;
    if (!title.trim() && (!category || category === "Others")) return;

    const timer = setTimeout(() => {
      runAiSafetyScan(images[0], title, category, description, false);
    }, 500);

    return () => clearTimeout(timer);
  }, [title, category]);

  // Image Upload Handling
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploadingImage(true);
    setError(null);
    try {
      const uploadedUrls = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        const res = await api.uploadImage(formData);
        uploadedUrls.push(res.url);
      }
      setImages((prev) => [...prev, ...uploadedUrls]);
      const primaryUrl = images.length > 0 ? images[0] : uploadedUrls[0];
      await runAiSafetyScan(primaryUrl);
    } catch (err) {
      showToast(err.message || "Failed to upload image", "error");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (index) => {
    const next = images.filter((_, i) => i !== index);
    setImages(next);
    if (next.length === 0) {
      setAiVerdict(null);
      setScanStep(0);
    } else if (index === 0) {
      runAiSafetyScan(next[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Safety checks
    if (!images.length) {
      setError("A photo of the item is mandatory. Please upload an image first.");
      return;
    }
    if (!aiVerdict || aiVerdict.decision !== "APPROVE") {
      setError("Cannot publish listing: Only items verified and approved by CampusMart AI Safety Intelligence can be published.");
      return;
    }

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
          : "Listing verified & published to campus marketplace!",
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
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "660px", maxHeight: "90vh", overflowY: "auto" }}>
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
            <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Reach verified students with AI safety verification</p>
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

          {/* ─────────────────────────────────────────────────────────────
              MANDATORY PHOTO UPLOAD & AI SAFETY SCAN SECTION
          ───────────────────────────────────────────────────────────── */}
          <div style={{
            marginBottom: "22px",
            background: "var(--bg-surface-sunken)",
            borderRadius: "var(--radius-md)",
            padding: "16px",
            border: "1px solid var(--border-subtle)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <label style={{ fontSize: "0.84rem", fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                <Camera size={16} />
                <span>Item Photo * (Mandatory for AI Safety Verification)</span>
              </label>
              {images.length > 0 && !aiScanning && (
                <button
                  type="button"
                  onClick={() => runAiSafetyScan(images[0], title, category, description, true)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "0.74rem",
                    color: "var(--text-muted)",
                    background: "none",
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  <RefreshCw size={12} />
                  <span>Re-scan</span>
                </button>
              )}
            </div>

            {/* Dropzone */}
            {images.length === 0 ? (
              <div style={{
                border: "2px dashed var(--border-default)",
                borderRadius: "var(--radius-md)",
                padding: "24px 16px",
                textAlign: "center",
                background: "var(--bg-surface)",
                cursor: "pointer",
                position: "relative"
              }}>
                <input
                  ref={fileInputRef}
                  type="file"
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
                <Upload size={28} color="var(--text-muted)" style={{ margin: "0 auto 8px" }} />
                <div style={{ fontSize: "0.88rem", fontWeight: 700 }}>
                  {uploadingImage ? "Uploading & preparing safety scan..." : "Click or drag item photo here"}
                </div>
                <div style={{ fontSize: "0.74rem", color: "var(--text-muted)", marginTop: "4px" }}>
                  Sharp, well-lit photos required • Evaluated by CampusMart AI Safety Intelligence
                </div>
              </div>
            ) : (
              <div>
                {/* Thumbnail Display */}
                <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginBottom: "14px" }}>
                  {images.map((imgUrl, idx) => (
                    <div key={idx} style={{ position: "relative", width: "75px", height: "75px", borderRadius: "10px", overflow: "hidden", border: "1px solid var(--border-subtle)" }}>
                      <img src={api.getImageUrl(imgUrl)} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        style={{
                          position: "absolute",
                          top: "3px",
                          right: "3px",
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          background: "rgba(0,0,0,0.75)",
                          color: "#f87171",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "none",
                          cursor: "pointer"
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
                          background: "var(--accent-secondary)",
                          color: "#FEFEFE",
                          fontSize: "0.55rem",
                          fontWeight: 800,
                          textAlign: "center",
                          padding: "1px 0"
                        }}>
                          PRIMARY
                        </span>
                      )}
                    </div>
                  ))}
                  
                  <div style={{ position: "relative", width: "75px", height: "75px", borderRadius: "10px", border: "2px dashed var(--border-subtle)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "var(--bg-surface)" }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage || aiScanning}
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
                    <Upload size={18} color="var(--text-muted)" />
                    <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: "4px" }}>Add photo</span>
                  </div>
                </div>

                {/* Progressive Scanning Animation */}
                {aiScanning && (
                  <div style={{
                    padding: "14px 16px",
                    borderRadius: "var(--radius-md)",
                    background: "rgba(56, 189, 248, 0.08)",
                    border: "1px solid rgba(56, 189, 248, 0.25)",
                    marginBottom: "8px"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                      <Loader2 size={16} className="animate-spin" color="#38bdf8" />
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#38bdf8" }}>
                        CampusMart AI Safety Intelligence Scanning...
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {scanStep >= 1 ? <Check size={12} color="#34d399" /> : <span style={{ width: "12px" }}>•</span>}
                        <span>1. Image Format & Physical Integrity Verification</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {scanStep >= 2 ? <Check size={12} color="#34d399" /> : <span style={{ width: "12px" }}>•</span>}
                        <span>2. Visual Quality & Laplacian Defocus Analysis</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {scanStep >= 3 ? <Check size={12} color="#34d399" /> : <span style={{ width: "12px" }}>•</span>}
                        <span>3. Non-Closed-Set Vision & Domain Classification</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {scanStep >= 4 ? <Check size={12} color="#34d399" /> : <span style={{ width: "12px" }}>•</span>}
                        <span>4. Campus Policy Compliance (Allowed / Unsupported / Prohibited)</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {scanStep >= 5 ? <Check size={12} color="#34d399" /> : <span style={{ width: "12px" }}>•</span>}
                        <span>5. Listing Text & Physical Object Consistency</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI VERDICT CARDS */}
                {!aiScanning && aiVerdict && (
                  <div>
                    {aiVerdict.decision === "APPROVE" && (
                      <div style={{
                        padding: "14px 16px",
                        borderRadius: "var(--radius-md)",
                        background: "rgba(52, 211, 153, 0.1)",
                        border: "1px solid rgba(52, 211, 153, 0.3)",
                        color: "#059669"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 800, fontSize: "0.85rem" }}>
                            <ShieldCheck size={18} color="#10b981" />
                            <span>CAMPUSMART VERIFIED • APPROVED</span>
                          </div>
                          <span style={{
                            padding: "2px 8px",
                            borderRadius: "9999px",
                            background: "rgba(16, 185, 129, 0.2)",
                            fontSize: "0.72rem",
                            fontWeight: 700
                          }}>
                            {Math.round(aiVerdict.object_confidence * 100)}% Confidence
                          </span>
                        </div>
                        <div style={{ fontSize: "0.80rem", color: "var(--text-primary)", marginBottom: "4px" }}>
                          <strong>Identified Object:</strong> {aiVerdict.object_detected} • <strong>Risk Level:</strong> {aiVerdict.risk_level}
                        </div>
                        <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)" }}>
                          {aiVerdict.reason}
                        </div>
                      </div>
                    )}

                    {aiVerdict.decision === "REVIEW" && (
                      <div style={{
                        padding: "14px 16px",
                        borderRadius: "var(--radius-md)",
                        background: "rgba(245, 158, 11, 0.1)",
                        border: "1px solid rgba(245, 158, 11, 0.35)",
                        color: "#b45309"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 800, fontSize: "0.85rem" }}>
                            <AlertTriangle size={18} color="#f59e0b" />
                            <span>NEEDS MANUAL SAFETY REVIEW</span>
                          </div>
                          <span style={{
                            padding: "2px 8px",
                            borderRadius: "9999px",
                            background: "rgba(245, 158, 11, 0.2)",
                            fontSize: "0.72rem",
                            fontWeight: 700
                          }}>
                            Review Required
                          </span>
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-primary)", marginBottom: "8px" }}>
                          {aiVerdict.reason}
                        </div>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <button
                            type="button"
                            onClick={() => runAiSafetyScan(images[0], title, category, description, true)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "6px",
                              background: "#f59e0b",
                              color: "#FFFFFF",
                              fontSize: "0.74rem",
                              fontWeight: 700,
                              border: "none",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <RefreshCw size={12} />
                            <span>Verify with Details</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setImages([]);
                              setAiVerdict(null);
                            }}
                            style={{
                              padding: "6px 12px",
                              borderRadius: "6px",
                              background: "rgba(245, 158, 11, 0.15)",
                              color: "#b45309",
                              fontSize: "0.74rem",
                              fontWeight: 600,
                              border: "1px solid rgba(245, 158, 11, 0.3)",
                              cursor: "pointer"
                            }}
                          >
                            <span>Upload Different Photo</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {aiVerdict.decision === "BLOCK" && (
                      <div style={{
                        padding: "14px 16px",
                        borderRadius: "var(--radius-md)",
                        background: "rgba(239, 68, 68, 0.1)",
                        border: "1px solid rgba(239, 68, 68, 0.35)",
                        color: "#b91c1c"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 800, fontSize: "0.85rem" }}>
                            <ShieldAlert size={18} color="#ef4444" />
                            <span>LISTING BLOCKED BY SAFETY POLICY</span>
                          </div>
                          <span style={{
                            padding: "2px 8px",
                            borderRadius: "9999px",
                            background: "rgba(239, 68, 68, 0.2)",
                            fontSize: "0.72rem",
                            fontWeight: 700
                          }}>
                            Blocked
                          </span>
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-primary)", marginBottom: "8px" }}>
                          {aiVerdict.reason}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setImages([]);
                            setAiVerdict(null);
                          }}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            background: "#ef4444",
                            color: "#FFFFFF",
                            fontSize: "0.74rem",
                            fontWeight: 700,
                            border: "none",
                            cursor: "pointer"
                          }}
                        >
                          Replace with Permitted Item
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

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
              placeholder="e.g. Casio FX-991ES Plus Scientific Calculator"
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

          {/* Action buttons & Publish Safeguard */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "24px" }}>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button type="button" className="btn-secondary" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn-primary" 
                disabled={submitting || uploadingImage || aiScanning || !aiVerdict || aiVerdict.decision !== "APPROVE"}
                style={{
                  opacity: (!aiVerdict || aiVerdict.decision !== "APPROVE") ? 0.6 : 1,
                  cursor: (!aiVerdict || aiVerdict.decision !== "APPROVE") ? "not-allowed" : "pointer"
                }}
              >
                <PlusCircle size={16} />
                <span>{submitting ? "Publishing..." : "Publish Listing"}</span>
              </button>
            </div>

            {/* Publishing Safeguard Helper Text */}
            {(!aiVerdict || aiVerdict.decision !== "APPROVE") && (
              <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", textAlign: "right" }}>
                {images.length === 0 
                  ? "ⓘ Photo upload is required to verify item safety."
                  : aiScanning 
                  ? "ⓘ Verifying safety with CampusMart AI..."
                  : aiVerdict?.decision === "REVIEW"
                  ? "ⓘ Listing requires a clearer photo or manual review before publication."
                  : aiVerdict?.decision === "BLOCK"
                  ? "ⓘ Prohibited/unsupported items cannot be published."
                  : "ⓘ AI Safety approval is required to publish."}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
