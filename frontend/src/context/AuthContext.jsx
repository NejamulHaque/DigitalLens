// src/context/AuthContext.jsx — Resilient Neon DB Authentication Layer
import { createContext, useContext, useEffect, useState, useCallback } from "react";

const rawApi = import.meta.env.VITE_API_URL || "http://localhost:8000";
const API = (rawApi.split(/\s+or\s+/i)[0] || rawApi).trim().replace(/\/+$/, "");

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const normalizeDisplayName = (name, email) => {
  const cleanEmail = (email || "").trim().toLowerCase();
  if (cleanEmail === "nejamulhaque.works@gmail.com") return "Nejamul Haque";
  const n = (name || "").trim();
  if (!n || n.includes("@") || n.toLowerCase() === "reader") {
    if (cleanEmail) {
      const parts = cleanEmail.split("@")[0].split(/[._-]/);
      return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ") || "Reader";
    }
    return "Reader";
  }
  return n;
};

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
        const cleanName = normalizeDisplayName(u.displayName, u.email);
        u.displayName = cleanName;
        setUser(u);
        setProfile({
          displayName: cleanName,
          email: u.email,
          interests: u.interests || ["general", "technology"],
          history: u.history || [],
          role: u.role || (u.email === "nejamulhaque.works@gmail.com" ? "Owner / Architect" : "Reader"),
        });
        localStorage.setItem("dl_user_data", JSON.stringify(u));
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
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = normalizeDisplayName(name, cleanEmail);
    try {
      const res = await fetch(`${API}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cleanName, email: cleanEmail, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Registration failed. Please try again.");
      }
      u = {
        uid: data.user.id,
        id: data.user.id,
        email: data.user.email,
        displayName: normalizeDisplayName(data.user.displayName, data.user.email),
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
        email: cleanEmail,
        displayName: cleanName,
        role: cleanEmail === "nejamulhaque.works@gmail.com" ? "Owner / Architect" : "Reader",
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
    const cleanEmail = email.trim().toLowerCase();
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Invalid email or password. Please try again.");
      }
      u = {
        uid: data.user.id,
        id: data.user.id,
        email: data.user.email,
        displayName: normalizeDisplayName(data.user.displayName, data.user.email),
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
          if (saved.email === cleanEmail) {
            u = saved;
            u.displayName = normalizeDisplayName(u.displayName, cleanEmail);
          }
        } catch {}
      }
      if (!u) {
        u = {
          uid: `u_${Date.now()}`,
          id: `u_${Date.now()}`,
          email: cleanEmail,
          displayName: normalizeDisplayName("", cleanEmail),
          role: cleanEmail === "nejamulhaque.works@gmail.com" ? "Owner / Architect" : "Reader",
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