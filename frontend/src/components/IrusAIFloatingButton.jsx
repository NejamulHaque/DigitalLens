import { useState } from 'react';
import { Sparkles, X } from 'lucide-react';

export default function IrusAIFloatingButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-gold-500 to-gold-600 text-dark-900 p-4 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center gap-2 font-bold"
      >
        <Sparkles size={20} />
        <span>Ask Irus AI</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-dark-800 border border-gold-500/30 rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col relative">
            <button onClick={() => setIsOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
              <X size={24} />
            </button>
            <iframe 
              src="https://irus-ai.onrender.com/" 
              className="w-full h-full rounded-b-2xl bg-dark-900"
              title="Irus AI Assistant"
              allow="microphone"
            />
          </div>
        </div>
      )}
    </>
  );
}