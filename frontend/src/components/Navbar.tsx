import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FiMenu, FiX, FiLogOut, FiShield } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import AuthModal from "./AuthModal";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showAuth, setShowAuth] = useState<"login" | "signup" | null>(null);
  const auth: any = useAuth();
  const user = auth?.user;
  const logout = auth?.logout;
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const authParam = params.get("auth");
    if (authParam === "login" || authParam === "required") {
      setShowAuth("login");
    } else if (authParam === "signup") {
      setShowAuth("signup");
    }
  }, [location.search]);

  const isOwner = user?.email === "nejamulhaque.works@gmail.com";

  const navLinks = [
    { href: "#services", label: "Intelligence" },
    { href: "#simulator", label: "Simulator" },
    { href: "#sentiment-radar", label: "Mood Radar" },
    { href: "#comparison", label: "Compare" },
    { href: "#pricing", label: "Plans" },
    { href: "#projects", label: "Portfolio" },
    { href: "#contact", label: "Contact" },
  ];

  const handleLogout = async () => {
    try { await logout(); } catch {}
    navigate("/");
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/85 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-3.5">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5">
              <img
                src="/icon-192.png"
                alt="DigitalLens"
                className="w-10 h-10 rounded-xl shadow-lg shadow-purple-500/25 object-cover border border-white/15"
              />
              <div>
                <span className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
                  DigitalLens
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-6">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-slate-300 hover:text-white transition-colors text-xs font-semibold tracking-wide uppercase font-mono"
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Actions & User State */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  <Link
                    to="/app"
                    className="px-5 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-xs uppercase tracking-wider rounded-xl hover:shadow-lg hover:shadow-purple-500/40 transition-all duration-300"
                  >
                    ◉ Open Dashboard
                  </Link>
                  <div
                    title={user.email}
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xs shadow-md"
                  >
                    {(user.displayName || user.email || "?")[0].toUpperCase()}
                  </div>
                  <button
                    onClick={handleLogout}
                    title="Sign Out"
                    className="p-2 text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    <FiLogOut className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowAuth("login")}
                    className="px-4 py-2 text-slate-300 hover:text-white font-medium text-xs uppercase tracking-wider transition-colors"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => setShowAuth("signup")}
                    className="px-5 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold text-xs uppercase tracking-wider rounded-xl hover:shadow-lg hover:shadow-purple-500/40 transition-all duration-300"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 text-slate-300 hover:text-white"
            >
              {isOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Dropdown Menu */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden mt-4 pb-4 space-y-3 border-t border-white/10 pt-4"
              >
                {navLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="block text-slate-300 hover:text-white transition-colors text-sm font-medium py-1"
                  >
                    {link.label}
                  </a>
                ))}

                <div className="flex flex-col gap-2 pt-4 border-t border-white/10">
                  {user ? (
                    <>
                      <Link
                        to="/app"
                        onClick={() => setIsOpen(false)}
                        className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl text-center text-sm"
                      >
                        ◉ Open Dashboard
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="px-6 py-2 text-rose-400 font-medium text-left text-sm"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => { setShowAuth("login"); setIsOpen(false); }}
                        className="px-6 py-2 text-slate-300 hover:text-white font-medium text-left text-sm"
                      >
                        Login
                      </button>
                      <button
                        onClick={() => { setShowAuth("signup"); setIsOpen(false); }}
                        className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl text-center text-sm"
                      >
                        Get Started
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
          <AuthModal
            type={showAuth}
            onClose={() => {
              setShowAuth(null);
              if (window.location.search.includes("auth=")) {
                window.history.replaceState({}, document.title, window.location.pathname);
              }
            }}
            onSwitch={(t) => setShowAuth(t)}
          />
        )}
      </AnimatePresence>
    </>
  );
}