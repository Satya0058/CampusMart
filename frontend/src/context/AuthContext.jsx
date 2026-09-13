import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("campusmate_token"));
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState("login"); // 'login' | 'register'

  // Fetch current user on mount or token change
  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const profile = await api.getMe();
          setUser(profile);
        } catch (err) {
          console.warn("Session expired or token invalid:", err);
          localStorage.removeItem("campusmate_token");
          setToken(null);
          setUser(null);
        } finally {
          setLoading(false);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    }
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    localStorage.setItem("campusmate_token", res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    setAuthModalOpen(false);
    return res.user;
  };

  const register = async (formData) => {
    const res = await api.register(formData);
    localStorage.setItem("campusmate_token", res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    setAuthModalOpen(false);
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem("campusmate_token");
    setToken(null);
    setUser(null);
  };

  const openAuthModal = (tab = "login") => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        authModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
