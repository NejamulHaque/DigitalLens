import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Services from "../components/Services";
import OtherServices from "../components/OtherServices";
import Contact from "../components/Contact";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-950">
      <Navbar />
      <Hero />
      <Services />
      <OtherServices />
      <Contact />
      <footer className="py-12 bg-slate-950 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-white/40">
            © 2026 DigitalLens. Powered by Irus AI. Built by Nejamul Haque.
          </p>
        </div>
      </footer>
    </main>
  );
}