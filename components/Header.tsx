
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="py-8 text-center">
      <h1 
        className="font-pacifico text-5xl md:text-6xl text-pink-500"
        style={{ textShadow: '2px 2px 4px rgba(192, 38, 211, 0.3)' }}
      >
        Sparkles Nail Loft
      </h1>
      <p className="text-purple-500 mt-2">AI Content Creation Studio</p>
    </header>
  );
};
