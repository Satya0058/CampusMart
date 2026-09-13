import React, { createContext, useContext, useState, useEffect } from 'react';

const MarketplaceModeContext = createContext();

export const MarketplaceModeProvider = ({ children }) => {
  // Persist mode in local storage; defaults to 'buyer'
  const [mode, setModeState] = useState(() => {
    const saved = localStorage.getItem("campus_mode");
    return saved === "seller" ? "seller" : "buyer";
  });

  const [isTransitioning, setIsTransitioning] = useState(false);

  const setMode = (newMode) => {
    if (newMode === mode) return;
    setIsTransitioning(true);
    setModeState(newMode);
    localStorage.setItem("campus_mode", newMode);
    setTimeout(() => {
      setIsTransitioning(false);
    }, 280);
  };

  const toggleMode = () => {
    setMode(mode === "buyer" ? "seller" : "buyer");
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-mode", mode);
  }, [mode]);

  return (
    <MarketplaceModeContext.Provider
      value={{
        mode,
        isBuyer: mode === "buyer",
        isSeller: mode === "seller",
        setMode,
        toggleMode,
        isTransitioning
      }}
    >
      {children}
    </MarketplaceModeContext.Provider>
  );
};

export const useMarketplaceMode = () => {
  const context = useContext(MarketplaceModeContext);
  if (!context) {
    throw new Error("useMarketplaceMode must be used within MarketplaceModeProvider");
  }
  return context;
};

