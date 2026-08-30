import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Services from "../components/Services";
import LiveSimulator from "../components/LiveSimulator";
import SentimentRadar from "../components/SentimentRadar";
import ComparisonMatrix from "../components/ComparisonMatrix";
import PricingTiers from "../components/PricingTiers";
import OtherServices from "../components/OtherServices";
import FaqSection from "../components/FaqSection";
import Contact from "../components/Contact";
import Footer from "../components/Footer";
import { useEffect } from "react";

const rawApi = import.meta.env.VITE_API_URL || "http://localhost:8000";
const API = (rawApi.split(/\s+or\s+/i)[0] || rawApi).trim().replace(/\/+$/, "");

export default function LandingPage() {
  // Telemetry auto-log visit
  useEffect(() => {
    try {
      fetch(`${API}/api/telemetry/event`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: "/",
          referrer: document.referrer || "Direct",
          screen: `${window.innerWidth}x${window.innerHeight}`,
          action: "landing_pageview",
        }),
      }).catch(() => {});
    } catch {}
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 selection:bg-purple-500 selection:text-white">
      <Navbar />
      <Hero />
      <Services />
      <LiveSimulator />
      <SentimentRadar />
      <ComparisonMatrix />
      <PricingTiers />
      <OtherServices />
      <FaqSection />
      <Contact />
      <Footer />
    </main>
  );
}