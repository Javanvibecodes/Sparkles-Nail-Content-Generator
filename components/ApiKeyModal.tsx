import React, { useState } from 'react';

interface ApiKeyModalProps {
  onApiKeySubmit: (apiKey: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onApiKeySubmit }) => {
  const [key, setKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim()) {
      onApiKeySubmit(key.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-rose-100 p-4">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-pink-100 text-center animate-fade-in">
        <h1 
          className="font-pacifico text-4xl text-pink-500 mb-2"
          style={{ textShadow: '2px 2px 4px rgba(192, 38, 211, 0.3)' }}
        >
          Sparkles Nail Loft
        </h1>
        <p className="text-purple-500 mb-6">AI Content Creation Studio</p>
        
        <h2 className="text-xl font-bold text-gray-700 mb-2">Enter Your Gemini API Key</h2>
        <p className="text-gray-500 mb-6 text-sm">
          To start creating, please provide your Google AI Gemini API key. Your key is secure and is not stored.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Enter your API key here"
            className="w-full p-3 bg-white border-2 border-pink-200 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition"
            required
            aria-label="Gemini API Key"
          />
          <button
            type="submit"
            className="w-full bg-cyan-400 text-white font-bold py-3 px-4 rounded-full hover:bg-cyan-500 transition-transform transform hover:scale-105 shadow-lg"
          >
            Start Creating
          </button>
        </form>

        <p className="text-xs text-gray-400 mt-6">
          You can get your API key from{' '}
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-purple-500 underline hover:text-purple-700">
            Google AI Studio
          </a>.
        </p>
      </div>
       <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};