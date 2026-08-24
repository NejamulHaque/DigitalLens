import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import AdminPage from "./pages/AdminPage.jsx";

import App from "./App.jsx";                      // Your original news app
import LandingPage from "./pages/LandingPage.jsx"; // Your new landing page

// 👇 1. IMPORT YOUR AUTH PROVIDER HERE 👇
import { AuthProvider } from "./context/AuthContext"; 

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* 👇 2. WRAP THE ROUTER INSIDE THE AUTH PROVIDER 👇 */}
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* 🌟 Landing page at root */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/admin" element={<AdminPage />} />
          
          {/* 📰 News app at /app */}
          <Route path="/app" element={<App />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);