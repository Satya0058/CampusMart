const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (typeof window !== "undefined" && window.location.hostname === "127.0.0.1" 
    ? "http://127.0.0.1:8000" 
    : "http://localhost:8000");

// Helper to get stored auth token
function getAuthHeaders(isFormData = false) {
  const token = localStorage.getItem("campusmate_token");
  const headers = {};
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const isFormData = options.body instanceof FormData;
  const headers = {
    ...getAuthHeaders(isFormData),
    ...(options.headers || {})
  };

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers
    });
  } catch {
    // If primary host failed, try alternate host (127.0.0.1 <-> localhost)
    try {
      const altUrl = url.includes("localhost:8000")
        ? url.replace("localhost:8000", "127.0.0.1:8000")
        : url.replace("127.0.0.1:8000", "localhost:8000");
      response = await fetch(altUrl, { ...options, headers });
    } catch {
      throw new Error("Unable to connect to CampusMart server. Please ensure the backend is running on port 8000.");
    }
  }

  if (!response.ok) {
    let errorDetail = "Request failed";
    try {
      const data = await response.json();
      errorDetail = data.detail || data.message || JSON.stringify(data);
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }

  return await response.json();
}

export const api = {
  // Auth
  register: (data) => request("/api/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (data) => request("/api/auth/login", { method: "POST", body: JSON.stringify(data) }),
  forgotPassword: (email) => request("/api/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),

  // Users & Trust
  getMe: () => request("/api/users/me"),
  updateMe: (data) => request("/api/users/me", { method: "PUT", body: JSON.stringify(data) }),
  getUser: (id) => request(`/api/users/${id}`),
  getUserReviews: (id) => request(`/api/users/${id}/reviews`),
  createReview: (data) => request("/api/users/reviews", { method: "POST", body: JSON.stringify(data) }),
  report: (data) => request("/api/users/report", { method: "POST", body: JSON.stringify(data) }),

  // Items
  getItems: (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        searchParams.append(key, val);
      }
    });
    const qs = searchParams.toString();
    return request(`/api/items${qs ? `?${qs}` : ""}`);
  },
  getItem: (id) => request(`/api/items/${id}`),
  createItem: (data) => request("/api/items", { method: "POST", body: JSON.stringify(data) }),
  updateItem: (id, data) => request(`/api/items/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  updateItemStatus: (id, status) => request(`/api/items/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }),
  deleteItem: (id) => request(`/api/items/${id}`, { method: "DELETE" }),
  uploadImage: (formData) => request("/api/items/upload-image", { method: "POST", body: formData }),
  sendBuyRequest: (itemId, data) => request(`/api/items/${itemId}/buy-request`, { method: "POST", body: JSON.stringify(data) }),

  // Exchange
  proposeExchange: (data) => request("/api/exchanges/propose", { method: "POST", body: JSON.stringify(data) }),
  getMyExchanges: () => request("/api/exchanges/my-requests"),
  respondExchange: (id, status) => request(`/api/exchanges/${id}/respond`, { method: "PUT", body: JSON.stringify({ status }) }),
  getExchangeMatches: () => request("/api/exchanges/matches"),

  // Rentals
  bookRental: (data) => request("/api/rentals/book", { method: "POST", body: JSON.stringify(data) }),
  getMyRentals: () => request("/api/rentals/my-rentals"),
  updateRentalStatus: (id, status) => request(`/api/rentals/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }),

  // Requests
  getRequests: (params = {}) => {
    const searchParams = new URLSearchParams(params);
    const qs = searchParams.toString();
    return request(`/api/requests${qs ? `?${qs}` : ""}`);
  },
  createRequest: (data) => request("/api/requests/create", { method: "POST", body: JSON.stringify(data) }),
  respondToRequest: (id, data) => request(`/api/requests/${id}/respond`, { method: "POST", body: JSON.stringify(data) }),
  updateRequestStatus: (id, status) => request(`/api/requests/${id}/status`, { method: "PUT", body: JSON.stringify({ status }) }),

  // Messages
  getConversations: () => request("/api/messages/conversations"),
  getMessages: (conversationId) => request(`/api/messages/conversations/${conversationId}/messages`),
  sendMessage: (data) => request("/api/messages/send", { method: "POST", body: JSON.stringify(data) }),

  // Favorites
  getFavorites: () => request("/api/favorites"),
  toggleFavorite: (itemId) => request(`/api/favorites/toggle/${itemId}`, { method: "POST" }),

  // Notifications
  getNotifications: () => request("/api/notifications"),
  markNotificationRead: (id) => request(`/api/notifications/${id}/read`, { method: "PUT" }),
  markAllNotificationsRead: () => request("/api/notifications/read-all", { method: "PUT" }),

  // Seller Analytics
  getSellerAnalytics: () => request("/api/analytics/seller"),

  // Seed
  seedDatabase: () => request("/api/seed", { method: "POST" }),

  // Helpers
  getImageUrl: (path) => {
    if (!path) return null;
    if (path.startsWith("http")) return path;
    return `${API_BASE_URL}${path}`;
  }
};

