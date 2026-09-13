import React, { useState } from 'react';
import { MarketplaceModeProvider, useMarketplaceMode } from './context/MarketplaceModeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
import LandingPage from './pages/LandingPage';
import BuyerDashboard from './pages/BuyerDashboard';
import SellerDashboard from './pages/SellerDashboard';
import MarketplacePage from './pages/MarketplacePage';
import ItemDetailsPage from './pages/ItemDetailsPage';
import ExchangeCenterPage from './pages/ExchangeCenterPage';
import RentalCenterPage from './pages/RentalCenterPage';
import SellerRentalsPage from './pages/SellerRentalsPage';
import SellerTradeRequestsPage from './pages/SellerTradeRequestsPage';
import RequestsPage from './pages/RequestsPage';
import MessagesPage from './pages/MessagesPage';
import ProfilePage from './pages/ProfilePage';
import FavoritesPage from './pages/FavoritesPage';
import OrdersSalesPage from './pages/OrdersSalesPage';

// Modals
import BuyModal from './components/modals/BuyModal';
import RentalModal from './components/modals/RentalModal';
import ExchangeModal from './components/modals/ExchangeModal';
import RespondRequestModal from './components/modals/RespondRequestModal';
import AddItemModal from './components/modals/AddItemModal';
import PostRequestModal from './components/modals/PostRequestModal';
import AuthModal from './components/modals/AuthModal';
import AuthPage from './pages/AuthPage';

function MainApp() {
  const { mode, isBuyer, isSeller, setMode, isTransitioning } = useMarketplaceMode();
  const { user, loading, authModalOpen, authModalTab, closeAuthModal, openAuthModal } = useAuth();

  // Navigation State
  const [currentPage, setCurrentPage] = useState(isSeller ? "my-listings" : "marketplace");
  const [previousPage, setPreviousPage] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [marketplaceFilter, setMarketplaceFilter] = useState({ query: "", mode: "all" });

  // Modal Triggers
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [rentalModalOpen, setRentalModalOpen] = useState(false);
  const [exchangeModalOpen, setExchangeModalOpen] = useState(false);
  const [respondRequestModalOpen, setRespondRequestModalOpen] = useState(false);
  const [activeRequestItem, setActiveRequestItem] = useState(null);
  const [addItemModalOpen, setAddItemModalOpen] = useState(false);
  const [addItemMode, setAddItemMode] = useState("sell");
  const [postRequestModalOpen, setPostRequestModalOpen] = useState(false);

  const handleOpenAddItem = (initialMode = "sell") => {
    setAddItemMode(typeof initialMode === "string" ? initialMode : "sell");
    setAddItemModalOpen(true);
  };

  // Sync page when switching between Buyer and Seller modes
  React.useEffect(() => {
    if (isSeller && (currentPage === "marketplace" || currentPage === "home")) {
      setCurrentPage("my-listings");
    } else if (isBuyer && (
      currentPage === "my-listings" || 
      currentPage === "seller-dashboard" || 
      currentPage === "seller-sales" || 
      currentPage === "seller-rentals" || 
      currentPage === "requests"
    )) {
      setCurrentPage("marketplace");
    }
  }, [mode, isSeller, isBuyer]);

  // Router handler
  const handleNavigate = (page, options = {}) => {
    if (page === "marketplace") {
      setMarketplaceFilter({
        query: options.query || "",
        mode: options.mode || "all"
      });
    }
    setPreviousPage(currentPage);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSelectItem = (item) => {
    setPreviousPage(currentPage);
    setSelectedItem(item);
    setCurrentPage("item-details");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenRespondRequest = (req) => {
    setActiveRequestItem(req);
    setRespondRequestModalOpen(true);
  };

  // Auth gate: if verifying token, show splash
  if (loading) {
    return (
      <div style={{
        width: "100vw",
        height: "100vh",
        background: "#121311",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#FEFEFE"
      }}>
        <div style={{ textAlign: "center" }}>
          <img src="/logo.png" alt="CampusMart" style={{ width: "48px", height: "48px", objectFit: "contain", margin: "0 auto 12px", display: "block" }} />
          <div style={{
            width: "28px",
            height: "28px",
            border: "3px solid rgba(200, 234, 62, 0.2)",
            borderTopColor: "#C8EA3E",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 14px"
          }} />
          <div style={{ fontSize: "1.2rem", fontWeight: 800 }}>Campus<span style={{ color: "#C8EA3E" }}>Mart</span></div>
        </div>
      </div>
    );
  }

  // Not logged in: block access to everything and show Auth Portal!
  if (!user) {
    return <AuthPage />;
  }

  // Content Renderer based on current page and active mode
  const renderContent = () => {
    if (currentPage === "landing") {
      return (
        <LandingPage
          onNavigate={handleNavigate}
          onSelectItem={handleSelectItem}
          onOpenPostRequest={() => setPostRequestModalOpen(true)}
          onOpenAddItem={() => setAddItemModalOpen(true)}
        />
      );
    }

    if (currentPage === "item-details" && selectedItem) {
      return (
        <ItemDetailsPage
          item={selectedItem}
          onBack={() => {
            if (previousPage && previousPage !== "item-details") {
              handleNavigate(previousPage);
            } else {
              handleNavigate(isSeller ? "my-listings" : "marketplace");
            }
          }}
          onOpenBuyModal={() => setBuyModalOpen(true)}
          onOpenRentalModal={() => setRentalModalOpen(true)}
          onOpenExchangeModal={() => setExchangeModalOpen(true)}
          onOpenMessageModal={() => handleNavigate("messages")}
        />
      );
    }

    // Role guard: if user is in Seller mode, never render buyer marketplace; render Seller dashboard instead
    if (isSeller && (currentPage === "marketplace" || currentPage === "home")) {
      return (
        <SellerDashboard
          onNavigate={handleNavigate}
          onOpenAddItem={() => setAddItemModalOpen(true)}
          onOpenRespondRequest={handleOpenRespondRequest}
        />
      );
    }

    if (currentPage === "marketplace") {
      return (
        <MarketplacePage
          initialQuery={marketplaceFilter.query}
          initialMode={marketplaceFilter.mode}
          onSelectItem={handleSelectItem}
          onOpenPostRequest={() => setPostRequestModalOpen(true)}
        />
      );
    }

    // Exchange Center accessible by both Buyer and Seller
    if (currentPage === "exchange" || currentPage === "seller-exchanges") {
      return (
        <ExchangeCenterPage
          onNavigate={handleNavigate}
          onOpenAddItem={() => handleOpenAddItem("exchange")}
        />
      );
    }

    if (currentPage === "seller-rentals") {
      if (isBuyer) {
        return <RentalCenterPage onNavigate={handleNavigate} />;
      }
      return (
        <SellerRentalsPage
          onNavigate={handleNavigate}
          onOpenAddItem={() => setAddItemModalOpen(true)}
        />
      );
    }

    if (currentPage === "rentals") {
      if (isSeller) {
        return (
          <SellerRentalsPage
            onNavigate={handleNavigate}
            onOpenAddItem={() => setAddItemModalOpen(true)}
          />
        );
      }
      return (
        <RentalCenterPage onNavigate={handleNavigate} />
      );
    }

    if (currentPage === "requests") {
      // Role protection: Peer Demands is only for Sellers
      if (isBuyer) {
        return (
          <MarketplacePage
            initialQuery={marketplaceFilter.query}
            initialMode={marketplaceFilter.mode}
            onSelectItem={handleSelectItem}
            onOpenPostRequest={() => setPostRequestModalOpen(true)}
          />
        );
      }
      return (
        <RequestsPage
          onNavigate={handleNavigate}
          onOpenRespondRequest={handleOpenRespondRequest}
        />
      );
    }

    if (currentPage === "messages") {
      return (
        <MessagesPage onSelectItem={handleSelectItem} />
      );
    }

    if (currentPage === "profile") {
      return (
        <ProfilePage onSelectItem={handleSelectItem} />
      );
    }

    if (currentPage === "favorites") {
      return (
        <FavoritesPage
          onSelectItem={handleSelectItem}
          onNavigate={handleNavigate}
        />
      );
    }

    if (currentPage === "seller-sales" || currentPage === "analytics") {
      return (
        <OrdersSalesPage
          onNavigate={handleNavigate}
          onOpenAddItem={() => setAddItemModalOpen(true)}
        />
      );
    }

    // Default Home views depending on Buyer vs Seller Mode!
    if (isSeller || currentPage === "seller-dashboard" || currentPage === "my-listings") {
      return (
        <SellerDashboard
          onNavigate={handleNavigate}
          onOpenAddItem={() => setAddItemModalOpen(true)}
          onOpenRespondRequest={handleOpenRespondRequest}
        />
      );
    }

    // Default Buyer view: Campus Marketplace
    return (
      <MarketplacePage
        initialQuery={marketplaceFilter.query}
        initialMode={marketplaceFilter.mode}
        onSelectItem={handleSelectItem}
        onOpenPostRequest={() => setPostRequestModalOpen(true)}
      />
    );
  };

  return (
    <div className="app-window-shell">
      {/* Deep Matte Charcoal Sidebar matching Dribbble reference */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onOpenAddItem={() => setAddItemModalOpen(true)}
      />

      {/* Main Content Workspace with rounded corners */}
      <div className="main-workspace">
        {/* Top Navigation Bar with Avatar, Search Pill, Bell, and Mode Toggle */}
        <Navbar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          onOpenAddItem={() => setAddItemModalOpen(true)}
          onOpenPostRequest={() => setPostRequestModalOpen(true)}
        />

        {/* Scrollable Dashboard Body */}
        <main
          className="workspace-content"
          style={{
            opacity: isTransitioning ? 0.35 : 1,
            transform: isTransitioning ? "translateY(5px)" : "translateY(0)",
            transition: "opacity 0.2s ease, transform 0.2s ease"
          }}
        >
          {renderContent()}
        </main>
      </div>

      {/* Global Modals */}
      {buyModalOpen && selectedItem && (
        <BuyModal
          item={selectedItem}
          onClose={() => setBuyModalOpen(false)}
          onChatInitiated={() => handleNavigate("messages")}
        />
      )}

      {rentalModalOpen && selectedItem && (
        <RentalModal
          item={selectedItem}
          onClose={() => setRentalModalOpen(false)}
          onSuccess={() => handleNavigate("rentals")}
        />
      )}

      {exchangeModalOpen && selectedItem && (
        <ExchangeModal
          targetItem={selectedItem}
          onClose={() => setExchangeModalOpen(false)}
          onSuccess={() => handleNavigate("exchange")}
        />
      )}

      {respondRequestModalOpen && activeRequestItem && (
        <RespondRequestModal
          requestItem={activeRequestItem}
          onClose={() => setRespondRequestModalOpen(false)}
          onSuccess={() => {}}
          onOpenChat={() => handleNavigate("messages")}
        />
      )}

      {addItemModalOpen && (
        <AddItemModal
          initialMode={addItemMode}
          onClose={() => setAddItemModalOpen(false)}
          onSuccess={() => {
            setMode("seller");
            handleNavigate(addItemMode === "exchange" ? "exchange" : "my-listings");
          }}
        />
      )}

      {postRequestModalOpen && (
        <PostRequestModal
          onClose={() => setPostRequestModalOpen(false)}
          onSuccess={() => handleNavigate("marketplace")}
        />
      )}

      {authModalOpen && (
        <AuthModal
          defaultTab={authModalTab}
          onClose={closeAuthModal}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MarketplaceModeProvider>
        <NotificationProvider>
          <MainApp />
        </NotificationProvider>
      </MarketplaceModeProvider>
    </AuthProvider>
  );
}
