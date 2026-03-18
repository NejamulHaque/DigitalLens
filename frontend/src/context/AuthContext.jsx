// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase/config";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Upsert user doc in Firestore
  async function upsertProfile(firebaseUser, extra = {}) {
    try {
      const ref  = doc(db, "users", firebaseUser.uid);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        const data = {
          uid:          firebaseUser.uid,
          email:        firebaseUser.email,
          displayName:  firebaseUser.displayName || extra.displayName || "Reader",
          photoURL:     firebaseUser.photoURL || null,
          interests:    ["general", "technology"],
          theme:        "dark",
          history:      [],
          createdAt:    serverTimestamp(),
          ...extra,
        };
        await setDoc(ref, data);
        return data;
      }
      return snap.data();
    } catch (e) {
      console.warn("Firestore profile sync failed:", e.message);
      return { 
        uid: firebaseUser.uid, 
        email: firebaseUser.email, 
        displayName: firebaseUser.displayName || extra.displayName || "Reader",
        interests: ["general", "technology"],
        theme: "dark",
        history: []
      };
    }
  }

  async function refreshProfile(uid) {
    try {
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) setProfile(snap.data());
    } catch (e) {
      console.warn("Firestore profile refresh failed:", e.message);
    }
  }

  async function updateUserProfile(uid, data) {
    await setDoc(doc(db, "users", uid), data, { merge: true });
    await refreshProfile(uid);
  }

  async function loginWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider);
    const p = await upsertProfile(result.user);
    setProfile(p);
  }

  async function loginWithEmail(email, password) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    await refreshProfile(result.user.uid);
  }

  async function registerWithEmail(email, password, displayName) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName });
    const p = await upsertProfile(result.user, { displayName });
    setProfile(p);
  }

  async function logout() {
    await signOut(auth);
    setProfile(null);
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) await refreshProfile(u.uid);
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      loginWithGoogle, loginWithEmail,
      registerWithEmail, logout, updateUserProfile,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}