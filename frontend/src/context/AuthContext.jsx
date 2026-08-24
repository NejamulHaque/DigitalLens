// src/context/AuthContext.jsx — definitive auth layer
import { createContext, useContext, useEffect, useState } from "react";
import {
  getAuth, onAuthStateChanged, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider,
  signOut, updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => onAuthStateChanged(auth, async (u) => {
    setUser(u);
    if (u) {
      try {
        const snap = await getDoc(doc(db, "users", u.uid));
        if (snap.exists()) {
          setProfile(snap.data());
        } else {
          const fresh = {
            displayName: u.displayName || "Reader",
            email: u.email,
            photoURL: u.photoURL || null,
            interests: ["general", "technology"],
            history: [],
            createdAt: Date.now(),
          };
          await setDoc(doc(db, "users", u.uid), fresh);
          setProfile(fresh);
        }
      } catch { setProfile(null); }
    } else {
      setProfile(null);
    }
    setLoading(false);
  }), []);

  // ✍️ SIGN UP (name, email, password)
  const signup = async (name, email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name }).catch(() => {});
    await setDoc(doc(db, "users", cred.user.uid), {
      displayName: name,
      email,
      photoURL: null,
      interests: ["general", "technology"],
      history: [],
      createdAt: Date.now(),
    }, { merge: true });
    setUser({ ...cred.user, displayName: name });
    return cred.user;
  };

  // 🔑 LOGIN (email, password)
  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);

  // 🌐 GOOGLE
  const loginWithGoogle = async () => {
    const cred = await signInWithPopup(auth, new GoogleAuthProvider());
    await setDoc(doc(db, "users", cred.user.uid), {
      displayName: cred.user.displayName || "Reader",
      email: cred.user.email,
      photoURL: cred.user.photoURL || null,
    }, { merge: true });
    return cred.user;
  };

  const logout = () => signOut(auth);

  const updateUserProfile = async (uid, data) => {
    await setDoc(doc(db, "users", uid), data, { merge: true });
    setProfile((p) => ({ ...(p || {}), ...data }));
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signup, login, loginWithGoogle, logout, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}