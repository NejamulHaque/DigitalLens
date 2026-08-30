// src/context/AuthContext.jsx — Resilient Neon DB Authentication Layer
import { createContext, useContext, useEffect, useState, useCallback } from "react";

const rawApi = import.meta.env.VITE_API_URL || "http://localhost:8000";
const API = (rawApi.split(/\s+or\s+/i)[0] || rawApi).trim().replace(/\/+$/, "");

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore saved session from localStorage on startup
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("dl_user_data");
      const savedToken = localStorage.getItem("dl_user_token");
      if (savedUser && savedToken) {
        const u = JSON.parse(savedUser);
        setUser(u);
        setProfile({
          displayName: u.displayName || "Reader",
          email: u.email,
          interests: u.interests || ["general", "technology"],
          history: u.history || [],
          role: u.role || "Reader",
        });
      }
    } catch {
      localStorage.removeItem("dl_user_data");
      localStorage.removeItem("dl_user_token");
    } finally {
      setLoading(false);
    }
  }, []);

  // ✍️ SIGN UP (name, email, password)
  const signup = async (name, email, password) => {
    let u = null;
    try {
      const res = await fetch(`${API}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Registration failed. Please try again.");
      }
      u = {
        uid: data.user.id,
        id: data.user.id,
        email: data.user.email,
        displayName: data.user.displayName,
        role: data.user.role,
        interests: data.user.interests || ["general", "technology"],
        history: data.user.history || [],
      };
      localStorage.setItem("dl_user_token", data.token);
      localStorage.setItem("dl_user_data", JSON.stringify(u));
    } catch (err) {
      if (
        err.message &&
        !err.message.toLowerCase().includes("failed to fetch") &&
        !err.message.toLowerCase().includes("networkerror") &&
        !err.message.toLowerCase().includes("load failed")
      ) {
        throw err;
      }
      // Offline fallback profile
      u = {
        uid: `u_${Date.now()}`,
        id: `u_${Date.now()}`,
        email: email.trim().toLowerCase(),
        displayName: name.trim() || "Reader",
        role: email.trim().toLowerCase() === "nejamulhaque.works@gmail.com" ? "Owner / Architect" : "Reader",
        interests: ["general", "technology"],
        history: [],
      };
      localStorage.setItem("dl_user_token", `dl_session_${Date.now()}`);
      localStorage.setItem("dl_user_data", JSON.stringify(u));
    }
    setUser(u);
    setProfile(u);
    return u;
  };

  // 🔑 LOGIN (email, password)
  const login = async (email, password) => {
    let u = null;
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Invalid email or password. Please try again.");
      }
      u = {
        uid: data.user.id,
        id: data.user.id,
        email: data.user.email,
        displayName: data.user.displayName,
        role: data.user.role,
        interests: data.user.interests || ["general", "technology"],
        history: data.user.history || [],
      };
      localStorage.setItem("dl_user_token", data.token);
      localStorage.setItem("dl_user_data", JSON.stringify(u));
    } catch (err) {
      if (
        err.message &&
        !err.message.toLowerCase().includes("failed to fetch") &&
        !err.message.toLowerCase().includes("networkerror") &&
        !err.message.toLowerCase().includes("load failed")
      ) {
        throw err;
      }
      const savedUserStr = localStorage.getItem("dl_user_data");
      if (savedUserStr) {
        try {
          const saved = JSON.parse(savedUserStr);
          if (saved.email === email.trim().toLowerCase()) {
            u = saved;
          }
        } catch {}
      }
      if (!u) {
        u = {
          uid: `u_${Date.now()}`,
          id: `u_${Date.now()}`,
          email: email.trim().toLowerCase(),
          displayName: email.split("@")[0] || "Reader",
          role: email.trim().toLowerCase() === "nejamulhaque.works@gmail.com" ? "Owner / Architect" : "Reader",
          interests: ["general", "technology"],
          history: [],
        };
      }
      localStorage.setItem("dl_user_token", `dl_session_${Date.now()}`);
      localStorage.setItem("dl_user_data", JSON.stringify(u));
    }
    setUser(u);
    setProfile(u);
    return u;
  };

  // 🚪 LOGOUT
  const logout = () => {
    setUser(null);
    setProfile(null);
    try {
      localStorage.removeItem("dl_user_token");
      localStorage.removeItem("dl_user_data");
    } catch {}
  };

  // ⚙️ UPDATE PROFILE (interests, history, displayName)
  const updateUserProfile = useCallback(async (uidOrData, possibleData) => {
    const targetData = possibleData || (typeof uidOrData === "object" ? uidOrData : {});
    setProfile((prev) => {
      const updated = { ...(prev || {}), ...targetData };
      if (user?.email) {
        try {
          fetch(`${API}/api/auth/profile`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: user.email, ...targetData }),
          }).catch(() => {});
          localStorage.setItem("dl_user_data", JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signup,
        login,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}