import { motion } from "framer-motion";
import { useState } from "react";
import { FiMail, FiSend, FiCheckCircle, FiAlertCircle } from "react-icons/fi";

// 👉 Get a FREE form ID at https://formspree.io → add to frontend/.env:
//    VITE_FORMSPREE_ID=xyzabc123
// Without it, the form gracefully falls back to opening the visitor's mail app.
const FORMSPREE_ID = (import.meta as any).env?.VITE_FORMSPREE_ID || "";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"" | "sending" | "sent" | "error" | "mailto">("");

  const submit = async (e: any) => {
    e.preventDefault();
    setStatus("sending");
    try {
      if (FORMSPREE_ID) {
        const r = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ ...form, _subject: `DigitalLens inquiry from ${form.name}` }),
        });
        if (!r.ok) throw new Error("send failed");
        setStatus("sent");
      } else {
        // Instant fallback — opens visitor's email app, pre-filled
        const body = encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`);
        const subj = encodeURIComponent(`DigitalLens inquiry from ${form.name}`);
        window.location.href = `mailto:nejamulhaque.works@gmail.com?subject=${subj}&body=${body}`;
        setStatus("mailto");
      }
      setForm({ name: "", email: "", message: "" });
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className="py-32 bg-slate-950" id="contact">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div className="text-center mb-16" initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Get in{" "}
            <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">Touch</span>
          </h2>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Questions, feedback, or partnership ideas? We usually reply within 24 hours.
          </p>
        </motion.div>

        <motion.div className="grid md:grid-cols-2 gap-12" initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }}>
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500">
                <FiMail className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Email</h3>
                <a href="mailto:nejamulhaque.works@gmail.com" className="text-white/60 hover:text-white transition-colors">
                  nejamulhaque.works@gmail.com
                </a>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
              <h3 className="text-xl font-bold text-white mb-4">Direct & Fast</h3>
              <p className="text-white/60 mb-4">
                Messages land straight in my inbox. For anything urgent, mention
                <span className="text-purple-400 font-semibold"> “URGENT”</span> in your message.
              </p>
              <a href="https://irus-ai.onrender.com/" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors">
                Try Irus AI →
              </a>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Name</label>
              <input type="text" required value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                placeholder="Your name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Email</label>
              <input type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
                placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">Message</label>
              <textarea required rows={4} value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all resize-none"
                placeholder="Your message..." />
            </div>

            <button type="submit" disabled={status === "sending"}
              className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed">
              {status === "sending" ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</>
              ) : (
                <>Send Message <FiSend className="w-5 h-5" /></>
              )}
            </button>

            {status === "sent" && (
              <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3">
                <FiCheckCircle /> Message delivered! I'll reply within 24 hours.
              </div>
            )}
            {status === "mailto" && (
              <div className="flex items-center gap-2 text-green-400 text-sm bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3">
                <FiCheckCircle /> Opening your email app with the message pre-filled…
              </div>
            )}
            {status === "error" && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                <FiAlertCircle /> Something went wrong. Please email me directly instead.
              </div>
            )}
          </form>
        </motion.div>
      </div>
    </section>
  );
}