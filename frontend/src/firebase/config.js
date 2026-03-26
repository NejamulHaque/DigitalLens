// src/firebase/config.js
// ─────────────────────────────────────────────────────────────────────────────
// STEP: Replace every value below with your actual Firebase project config.
// Get it from: Firebase Console → Project Settings → Your Apps → SDK setup
// ─────────────────────────────────────────────────────────────────────────────

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// --- VALIDATION LAYER ---
if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("undefined")) {
  console.error(
    "❌ FIREBASE ERROR: API Key is missing or invalid.\n" +
    "Check your .env file in the /frontend directory.\n" +
    "Make sure it contains: VITE_FIREBASE_API_KEY=...\n" +
    "Then RESTART your dev server (npm run dev)."
  );
}

const app      = initializeApp(firebaseConfig);
export const auth     = getAuth(app);
export const db       = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();