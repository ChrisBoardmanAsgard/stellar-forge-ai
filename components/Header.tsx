import React from 'react';
import { AtomIcon } from './Icons';

export const Header: React.FC = () => {
  return (
    <header className="py-6 px-4 border-b border-cyan-500/20 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-10 print:hidden">
      <div className="container mx-auto flex items-center justify-center gap-4">
        <AtomIcon className="w-10 h-10 text-cyan-400" />
        <h1 className="text-3xl md:text-4xl font-bold tracking-wider text-center text-white font-orbitron">
          Stellar Forge <span className="text-cyan-400">AI</span>
        </h1>
      </div>
    </header>
  );
};