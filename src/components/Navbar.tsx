import React from 'react';
import { Flame, Sparkles, PlusCircle, Volume2, VolumeX } from 'lucide-react';

interface NavbarProps {
  onOpenCustomModal: () => void;
  ambientSound: boolean;
  onToggleSound: () => void;
  activeTab: 'pantheon' | 'seance' | 'resurrection' | 'offerings';
  onSelectTab: (tab: 'pantheon' | 'seance' | 'resurrection' | 'offerings') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenCustomModal,
  ambientSound,
  onToggleSound,
  activeTab,
  onSelectTab,
}) => {
  return (
    <header className="border-b border-marigold-500/20 bg-obsidian-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand & Altar Title */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectTab('pantheon')}>
          <div className="relative flex items-center justify-center w-11 h-11 rounded-full bg-marigold-500/10 border border-marigold-500/40">
            <span className="text-2xl animate-flicker">🕯️</span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold font-serif-gothic tracking-wider text-calavera-bone">
                OFRENDA DE CÓDIGO
              </h1>
              <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-marigold-500/20 text-marigold-400 border border-marigold-500/30">
                Hacktoberfest 2026
              </span>
            </div>
            <p className="text-xs text-amber-200/60 font-mono">
              Altar of Departed Repositories • Ghost in the Machine
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden lg:flex items-center space-x-1 bg-obsidian-900/90 p-1.5 rounded-xl border border-marigold-500/20">
          <button
            onClick={() => onSelectTab('pantheon')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'pantheon'
                ? 'bg-marigold-500/20 text-marigold-300 border border-marigold-500/40 shadow-sm'
                : 'text-calavera-aged/70 hover:text-calavera-bone hover:bg-obsidian-800/60'
            }`}
          >
            🏵️ The Pantheon
          </button>
          <button
            onClick={() => onSelectTab('seance')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'seance'
                ? 'bg-marigold-500/20 text-marigold-300 border border-marigold-500/40 shadow-sm'
                : 'text-calavera-aged/70 hover:text-calavera-bone hover:bg-obsidian-800/60'
            }`}
          >
            👻 Séance Terminal
          </button>
          <button
            onClick={() => onSelectTab('resurrection')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'resurrection'
                ? 'bg-marigold-500/20 text-marigold-300 border border-marigold-500/40 shadow-sm'
                : 'text-calavera-aged/70 hover:text-calavera-bone hover:bg-obsidian-800/60'
            }`}
          >
            ✨ Resurrection Chamber
          </button>
          <button
            onClick={() => onSelectTab('offerings')}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'offerings'
                ? 'bg-marigold-500/20 text-marigold-300 border border-marigold-500/40 shadow-sm'
                : 'text-calavera-aged/70 hover:text-calavera-bone hover:bg-obsidian-800/60'
            }`}
          >
            🕯️ Devotee Offerings
          </button>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleSound}
            title={ambientSound ? "Mute ambient cathedral chime" : "Play ambient cathedral chime"}
            className="p-2 rounded-lg bg-obsidian-900 border border-marigold-500/30 text-marigold-400 hover:bg-marigold-500/10 transition-colors"
          >
            {ambientSound ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>

          <button
            onClick={onOpenCustomModal}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-gradient-to-r from-marigold-600 to-amber-600 text-obsidian-950 font-semibold text-xs md:text-sm hover:from-marigold-500 hover:to-amber-500 transition-all shadow-md shadow-marigold-500/20"
          >
            <PlusCircle size={16} />
            <span>Summon Repo</span>
          </button>
        </div>

      </div>

      {/* Mobile Sub-Navigation */}
      <div className="lg:hidden flex items-center justify-around border-t border-marigold-500/10 bg-obsidian-950 px-2 py-2 text-xs">
        <button
          onClick={() => onSelectTab('pantheon')}
          className={`px-2 py-1 rounded ${activeTab === 'pantheon' ? 'text-marigold-400 font-bold' : 'text-calavera-aged'}`}
        >
          Pantheon
        </button>
        <button
          onClick={() => onSelectTab('seance')}
          className={`px-2 py-1 rounded ${activeTab === 'seance' ? 'text-marigold-400 font-bold' : 'text-calavera-aged'}`}
        >
          Séance
        </button>
        <button
          onClick={() => onSelectTab('resurrection')}
          className={`px-2 py-1 rounded ${activeTab === 'resurrection' ? 'text-marigold-400 font-bold' : 'text-calavera-aged'}`}
        >
          Resurrection
        </button>
        <button
          onClick={() => onSelectTab('offerings')}
          className={`px-2 py-1 rounded ${activeTab === 'offerings' ? 'text-marigold-400 font-bold' : 'text-calavera-aged'}`}
        >
          Offerings
        </button>
      </div>
    </header>
  );
};
