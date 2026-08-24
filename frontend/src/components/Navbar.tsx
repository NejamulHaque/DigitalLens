import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { FiMenu, FiX, FiLogOut } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import AuthModal from "./AuthModal";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showAuth, setShowAuth] = useState<"login" | "signup" | null>(null);
  const auth: any = useAuth();
  const user = auth?.user;
  const logout = auth?.logout;
  const navigate = useNavigate();

  const navLinks = [
    { href: "#", label: "Home" },
    { href: "#services", label: "Services" },
    { href: "#projects", label: "Other Services" },
    { href: "#contact", label: "Contact Us" },
  ];

  const handleLogout = async () => {
    try { await logout(); } catch {}
    navigate("/");
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <span className="text-white font-bold">DL</span>
              </div>
              <span className="text-xl font-bold text-white">DigitalLens</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a key={link.label} href={link.href} className="text-white/70 hover:text-white transition-colors font-medium">
                  {link.label}
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <>
                  <Link to="/app"
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all">
                    ◉ Open Dashboard
                  </Link>
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                    {(user.displayName || user.email || "?")[0].toUpperCase()}
                  </div>
                  <button onClick={handleLogout} title="Sign Out"
                    className="p-2 text-white/50 hover:text-red-400 transition-colors">
                    <FiLogOut className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setShowAuth("login")} className="px-6 py-2 text-white/80 hover:text-white font-medium transition-colors">
                    Login
                  </button>
                  <button onClick={() => setShowAuth("signup")}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all">
                    Sign Up
                  </button>
                </>
              )}
            </div>

            <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 text-white">
              {isOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </button>
          </div>

          <AnimatePresence>
            {isOpen && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="md:hidden mt-4 pb-4 space-y-4">
                {navLinks.map((link) => (
                  <a key={link.label} href={link.href} onClick={() => setIsOpen(false)} className="block text-white/70 hover:text-white transition-colors font-medium">
                    {link.label}
                  </a>
                ))}
                <div className="flex flex-col gap-2 pt-4 border-t border-white/10">
                  {user ? (
                    <>
                      <Link to="/app" onClick={() => setIsOpen(false)}
                        className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl text-center">
                        ◉ Open Dashboard
                      </Link>
                      <button onClick={handleLogout} className="px-6 py-2 text-red-400 font-medium text-left">Sign Out</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setShowAuth("login"); setIsOpen(false); }} className="px-6 py-2 text-white/80 hover:text-white font-medium text-left">
                        Login
                      </button>
                      <button onClick={() => { setShowAuth("signup"); setIsOpen(false); }}
                        className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl">
                        Sign Up
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </nav>

      <AnimatePresence>
        {showAuth && (
          <AuthModal type={showAuth} onClose={() => setShowAuth(null)} onSwitch={(t) => setShowAuth(t)} />
        )}
      </AnimatePresence>
    </>
  );
}