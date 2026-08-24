import { useState } from "react";
import { motion } from "framer-motion";
import { X, Scale, Loader2 } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function CompareModal({ onClose }) {
  const [url1, setUrl1] = useState("");
  const [url2, setUrl2] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCompare = async () => {
    if (!url1 || !url2) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url1, url2 })
      });
      const data = await res.json();
      setResult(data.comparison);
    } catch (err) {
      setResult({ error: "Failed to compare articles. Check backend." });
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-dark-800 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-8 relative"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={24} /></button>
        
        <div className="flex items-center gap-3 mb-6">
          <Scale className="text-gold-400" size={28} />
          <h2 className="font-serif text-3xl font-bold text-white">Side-by-Side AI Comparison</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-xs font-mono text-gray-500 uppercase mb-2">Article 1 URL</label>
            <input value={url1} onChange={e => setUrl1(e.target.value)} placeholder="https://news-site.com/article-1" className="w-full bg-dark-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-gold-500 outline-none transition-colors" />
          </div>
          <div>
            <label className="block text-xs font-mono text-gray-500 uppercase mb-2">Article 2 URL</label>
            <input value={url2} onChange={e => setUrl2(e.target.value)} placeholder="https://news-site.com/article-2" className="w-full bg-dark-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-gold-500 outline-none transition-colors" />
          </div>
        </div>

        <button onClick={handleCompare} disabled={loading || !url1 || !url2} className="w-full py-3 bg-gold-500 hover:bg-gold-400 text-dark-900 font-bold rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <><Loader2 className="animate-spin" size={18} /> Analyzing with Claude...</> : "⚡ Compare Articles"}
        </button>

        {result && (
          <div className="mt-8 p-6 glass-panel rounded-xl">
            <h3 className="font-serif text-xl font-bold text-white mb-4">AI Analysis Results</h3>
            {result.error ? (
              <p className="text-red-400">{result.error}</p>
            ) : (
              <div className="space-y-4 text-gray-300">
                <div><span className="text-gold-400 font-bold">Bias Difference:</span> <p className="mt-1">{result.bias_difference}</p></div>
                <div><span className="text-gold-400 font-bold">Fact Overlap:</span> <p className="mt-1">{result.fact_overlap}</p></div>
                <div><span className="text-gold-400 font-bold">Sentiment Contrast:</span> <p className="mt-1">{result.sentiment_contrast}</p></div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}