// src/firebase/config.js
// ─────────────────────────────────────────────────────────────────────────────
// STEP: Replace every value below with your actual Firebase project config.
// Get it from: Firebase Console → Project Settings → Your Apps → SDK setup
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCdCNTUISHNZ6aQGCemhKP44bgCf-_mMMw",
  authDomain: "news-analyzer-01.firebaseapp.com",
  projectId: "news-analyzer-01",
  storageBucket: "news-analyzer-01.firebasestorage.app",
  messagingSenderId: "1018040469147",
  appId: "1:1018040469147:web:ef04b86833cd76d4cb683e",
  measurementId: "G-4EJVZNMQMJ"
};
const app      = initializeApp(firebaseConfig);
export const auth     = getAuth(app);
export const db       = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();