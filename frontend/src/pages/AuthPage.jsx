import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  GraduationCap, 
  Lock, 
  Mail, 
  User, 
  Building2, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  Repeat,
  ShoppingBag
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [tab, setTab] = useState('login'); // 'login' | 'register'
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regDepartment, setRegDepartment] = useState('Computer Science & Engineering');
  const [regYear, setRegYear] = useState('3rd Year');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const departments = [
    "Computer Science & Engineering",
    "Mechanical Engineering",
    "Electronics & Communication",
    "Information Technology",
    "Electrical & Electronics",
    "Civil Engineering",
    "Chemical Engineering",
    "Biotechnology",
    "Management / MBA",
    "Architecture & Design",
    "Physics / Applied Sciences"
  ];

  const years = [
    "1st Year",
    "2nd Year",
    "3rd Year",
    "4th Year",
    "Postgraduate",
    "PhD Scholar"
  ];

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setError("Please enter your campus email and password.");
      return;
    }

    setLoading(true);
    try {
      await login(loginEmail.trim(), loginPassword.trim());
    } catch (err) {
      setError(err.message || "Invalid credentials. Please check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!regFullName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    if (regPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      await register({
        full_name: regFullName.trim(),
        email: regEmail.trim(),
        password: regPassword.trim(),
        department: regDepartment,
        year: regYear
      });
      setSuccessMsg("Account created! Entering CampusMart...");
    } catch (err) {
      setError(err.message || "Registration failed. This email may already be in use.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      width: "100vw",
      height: "100vh",
      minHeight: "100vh",
      background: "#121311",
      display: "flex",
      overflow: "hidden",
      position: "relative",
      color: "#FEFEFE"
    }}>
      {/* Background Subtle Lime Glows */}
      <div style={{
        position: "absolute",
        top: "-150px",
        left: "-100px",
        width: "500px",
        height: "500px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(200, 234, 62, 0.09) 0%, rgba(18, 19, 17, 0) 70%)",
        pointerEvents: "none"
      }} />

      <div style={{
        position: "absolute",
        bottom: "-200px",
        right: "-100px",
        width: "600px",
        height: "600px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(165, 148, 249, 0.08) 0%, rgba(18, 19, 17, 0) 70%)",
        pointerEvents: "none"
      }} />

      {/* Main Full-Screen Layout: Left Branding + Right Auth Card */}
      <div style={{
        display: "flex",
        width: "100%",
        height: "100%",
        zIndex: 1
      }}>
        {/* Left Hero Section (Desktop) */}
        <div style={{
          flex: "1 1 50%",
          padding: "60px 70px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          borderRight: "1px solid rgba(255, 255, 255, 0.06)",
          background: "linear-gradient(180deg, #161715 0%, #121311 100%)"
        }} className="auth-hero-left">
          
          {/* Brand Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <img src="/logo.png" alt="CampusMart" style={{ width: "36px", height: "36px", objectFit: "contain" }} />
            <span style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
              Campus<span style={{ color: "#C8EA3E" }}>Mart</span>
            </span>
            <span style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              padding: "3px 9px",
              borderRadius: "9999px",
              background: "rgba(200, 234, 62, 0.15)",
              color: "#C8EA3E",
              marginLeft: "6px"
            }}>
              Private Campus Network
            </span>
          </div>

          {/* Hero Narrative */}
          <div style={{ maxWidth: "520px", margin: "40px 0" }}>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              borderRadius: "9999px",
              background: "rgba(255, 255, 255, 0.06)",
              fontSize: "0.82rem",
              fontWeight: 600,
              color: "#C8EA3E",
              marginBottom: "20px"
            }}>
              <ShieldCheck size={15} />
              <span>Campus Verified Student Marketplace</span>
            </div>

            <h1 style={{
              fontSize: "2.8rem",
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: "-0.04em",
              marginBottom: "20px"
            }}>
              Buy, sell, rent & swap with <span style={{ color: "#C8EA3E" }}>students on your campus.</span>
            </h1>

            <p style={{
              fontSize: "1.05rem",
              color: "#9A9C96",
              lineHeight: 1.6,
              marginBottom: "36px"
            }}>
              Pass down engineering books, rent scientific calculators for exams, or swap lab gear directly with peers. Zero platform fees and 100% on-campus handovers.
            </p>

            {/* 3 Pillars */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "rgba(200, 234, 62, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#C8EA3E"
                }}>
                  <ShoppingBag size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: "0.94rem", fontWeight: 700 }}>Direct Student Handovers</h4>
                  <p style={{ fontSize: "0.8rem", color: "#7E827A" }}>Meet in the library foyer or cafeteria. No shipping or waiting.</p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "rgba(165, 148, 249, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#A594F9"
                }}>
                  <Repeat size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: "0.94rem", fontWeight: 700 }}>Syllabus Exchange & Rentals</h4>
                  <p style={{ fontSize: "0.8rem", color: "#7E827A" }}>Rent lab equipment for a week or swap textbooks course-for-course.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div style={{ fontSize: "0.78rem", color: "#5A5E56" }}>
            CampusMart Platform • Only verified campus students can list or buy.
          </div>
        </div>

        {/* Right Auth Section */}
        <div style={{
          flex: "1 1 50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 30px",
          background: "#121311",
          overflowY: "auto"
        }}>
          <div style={{
            width: "100%",
            maxWidth: "460px",
            background: "#1A1C18",
            borderRadius: "28px",
            padding: "36px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)"
          }}>
            {/* Header / Tabs */}
            <div style={{ marginBottom: "26px" }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: "6px" }}>
                {tab === 'login' ? "Welcome Back!" : "Join CampusMart"}
              </h2>
              <p style={{ fontSize: "0.85rem", color: "#8E928A" }}>
                {tab === 'login' 
                  ? "Sign in to access your campus marketplace and messages." 
                  : "Register with your student profile to start trading on campus."}
              </p>

              {/* Tab Selector */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                background: "rgba(0,0,0,0.3)",
                padding: "4px",
                borderRadius: "9999px",
                marginTop: "20px",
                border: "1px solid rgba(255,255,255,0.06)"
              }}>
                <button
                  type="button"
                  onClick={() => { setTab('login'); setError(null); }}
                  style={{
                    padding: "9px 0",
                    borderRadius: "9999px",
                    fontSize: "0.85rem",
                    fontWeight: tab === 'login' ? 800 : 600,
                    background: tab === 'login' ? "#C8EA3E" : "transparent",
                    color: tab === 'login' ? "#121311" : "#8E928A",
                    transition: "all 0.2s ease"
                  }}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => { setTab('register'); setError(null); }}
                  style={{
                    padding: "9px 0",
                    borderRadius: "9999px",
                    fontSize: "0.85rem",
                    fontWeight: tab === 'register' ? 800 : 600,
                    background: tab === 'register' ? "#C8EA3E" : "transparent",
                    color: tab === 'register' ? "#121311" : "#8E928A",
                    transition: "all 0.2s ease"
                  }}
                >
                  Create Account
                </button>
              </div>
            </div>

            {/* Feedback Alerts */}
            {error && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "11px 14px",
                borderRadius: "12px",
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#FCA5A5",
                fontSize: "0.82rem",
                marginBottom: "18px"
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "11px 14px",
                borderRadius: "12px",
                background: "rgba(200, 234, 62, 0.15)",
                border: "1px solid rgba(200, 234, 62, 0.3)",
                color: "#C8EA3E",
                fontSize: "0.82rem",
                marginBottom: "18px"
              }}>
                <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Tab 1: SIGN IN FORM */}
            {tab === 'login' && (
              <form onSubmit={handleLoginSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: "6px", color: "#BEBEC1" }}>
                    Student College Email
                  </label>
                  <div style={{ position: "relative" }}>
                    <Mail size={16} color="#7E827A" style={{ position: "absolute", left: "14px", top: "13px" }} />
                    <input
                      type="email"
                      required
                      placeholder="e.g. rahul.sharma@campus.edu"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      style={{
                        paddingLeft: "42px",
                        background: "#121311",
                        borderColor: "rgba(255,255,255,0.1)",
                        color: "#FEFEFE"
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: "6px", color: "#BEBEC1" }}>
                    Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <Lock size={16} color="#7E827A" style={{ position: "absolute", left: "14px", top: "13px" }} />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      style={{
                        paddingLeft: "42px",
                        background: "#121311",
                        borderColor: "rgba(255,255,255,0.1)",
                        color: "#FEFEFE"
                      }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "13px",
                    borderRadius: "9999px",
                    background: "#C8EA3E",
                    color: "#121311",
                    fontWeight: 800,
                    fontSize: "0.92rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    marginTop: "8px",
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  <span>{loading ? "Signing in..." : "Sign In to CampusMart"}</span>
                  <ArrowRight size={16} />
                </button>
              </form>
            )}

            {/* Tab 2: CREATE ACCOUNT FORM */}
            {tab === 'register' && (
              <form onSubmit={handleRegisterSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: "5px", color: "#BEBEC1" }}>
                    Full Student Name
                  </label>
                  <div style={{ position: "relative" }}>
                    <User size={16} color="#7E827A" style={{ position: "absolute", left: "14px", top: "13px" }} />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aarav Patel"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      style={{
                        paddingLeft: "42px",
                        background: "#121311",
                        borderColor: "rgba(255,255,255,0.1)",
                        color: "#FEFEFE"
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: "5px", color: "#BEBEC1" }}>
                    College Email Address
                  </label>
                  <div style={{ position: "relative" }}>
                    <Mail size={16} color="#7E827A" style={{ position: "absolute", left: "14px", top: "13px" }} />
                    <input
                      type="email"
                      required
                      placeholder="e.g. aarav.patel@campus.edu"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      style={{
                        paddingLeft: "42px",
                        background: "#121311",
                        borderColor: "rgba(255,255,255,0.1)",
                        color: "#FEFEFE"
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: "5px", color: "#BEBEC1" }}>
                    Create Password
                  </label>
                  <div style={{ position: "relative" }}>
                    <Lock size={16} color="#7E827A" style={{ position: "absolute", left: "14px", top: "13px" }} />
                    <input
                      type="password"
                      required
                      placeholder="At least 6 characters"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      style={{
                        paddingLeft: "42px",
                        background: "#121311",
                        borderColor: "rgba(255,255,255,0.1)",
                        color: "#FEFEFE"
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 700, marginBottom: "5px", color: "#BEBEC1" }}>
                      Department
                    </label>
                    <select
                      value={regDepartment}
                      onChange={(e) => setRegDepartment(e.target.value)}
                      style={{
                        background: "#121311",
                        borderColor: "rgba(255,255,255,0.1)",
                        color: "#FEFEFE",
                        fontSize: "0.82rem",
                        padding: "10px 12px"
                      }}
                    >
                      {departments.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 700, marginBottom: "5px", color: "#BEBEC1" }}>
                      Year of Study
                    </label>
                    <select
                      value={regYear}
                      onChange={(e) => setRegYear(e.target.value)}
                      style={{
                        background: "#121311",
                        borderColor: "rgba(255,255,255,0.1)",
                        color: "#FEFEFE",
                        fontSize: "0.82rem",
                        padding: "10px 12px"
                      }}
                    >
                      {years.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: "100%",
                    padding: "13px",
                    borderRadius: "9999px",
                    background: "#C8EA3E",
                    color: "#121311",
                    fontWeight: 800,
                    fontSize: "0.92rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    marginTop: "10px",
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  <span>{loading ? "Creating Account..." : "Create Student Account"}</span>
                  <ArrowRight size={16} />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

