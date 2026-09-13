import React, { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { api } from '../../services/api';

export default function ItemImage({ 
  src, 
  alt = "Product image", 
  style = {}, 
  className = "", 
  showLabel = true, 
  iconSize = 28 
}) {
  const [hasError, setHasError] = useState(false);

  // Check if image path is valid and not an empty string or placeholder
  const rawUrl = typeof src === "string" ? src.trim() : "";
  const isValid = rawUrl && rawUrl.length > 0;
  const resolvedUrl = isValid ? api.getImageUrl(rawUrl) : null;

  if (!resolvedUrl || hasError) {
    return (
      <div 
        className={className}
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#F2F3EE",
          color: "#8E928A",
          gap: "6px",
          userSelect: "none",
          padding: "8px",
          textAlign: "center",
          ...style
        }}
      >
        <div style={{
          width: iconSize + 16,
          height: iconSize + 16,
          borderRadius: "50%",
          background: "rgba(0, 0, 0, 0.04)",
          border: "1px solid rgba(0, 0, 0, 0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <ImageOff size={iconSize} color="#71756D" />
        </div>
        {showLabel && (
          <span style={{ 
            fontSize: "0.72rem", 
            fontWeight: 700, 
            color: "#71756D", 
            letterSpacing: "0.02em" 
          }}>
            No Image Uploaded
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={resolvedUrl}
      alt={alt}
      className={className}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        ...style
      }}
      onError={() => setHasError(true)}
    />
  );
}

