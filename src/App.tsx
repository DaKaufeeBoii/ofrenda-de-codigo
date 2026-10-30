import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DepartedRepo, AltarOffering } from './types';
import { Navbar } from './components/Navbar';
import { ThreeAltar } from './components/ThreeAltar';
import { CemeteryGame } from './components/CemeteryGame';
import { DevilsContract } from './components/DevilsContract';
import { OfferingModal } from './components/OfferingModal';
import { CustomRepoModal } from './components/CustomRepoModal';
import { AudioEulogyPlayer } from './components/AudioEulogyPlayer';
import { OfferingsWall } from './components/OfferingsWall';
import { Ghost, Sparkles, Scroll, Flame, MapPin, Feather, Eye } from 'lucide-react';

export const App: React.FC = () => {
  const [repos, setRepos] = useState<DepartedRepo[]>([]);
  const [offerings, setOfferings] = useState<AltarOffering[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<DepartedRepo | null>(null);
  const [activeTab, setActiveTab] = useState<'graveyard' | 'altar3d' | 'offerings'>('graveyard');
  
  // Devil's Contract Modal State
  const [isContractOpen, setIsContractOpen] = useState(false);
  const [contractMode, setContractMode] = useState<'seance' | 'resurrection'>('seance');

  // Other Modals
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isOfferingModalOpen, setIsOfferingModalOpen] = useState(false);
  const [ambientSound, setAmbientSound] = useState(false);

  // Audio Context for Ambient Cemetery Drone
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const loadData = async () => {
    try {
      const [repoRes, offRes] = await Promise.all([
        fetch('/api/pantheon'),
        fetch('/api/altar/offerings'),
      ]);

      if (repoRes.ok) {
        const repoData: DepartedRepo[] = await repoRes.json();
        setRepos(repoData);
        if (!selectedRepo && repoData.length > 0) {
          setSelectedRepo(repoData[0]);
        }
      }

      if (offRes.ok) {
        const offData: AltarOffering[] = await offRes.json();
        setOfferings(offData);
      }
    } catch (_err) {
      console.warn('Failed to load cemetery data, retrying...');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleAmbientSound = () => {
    if (!ambientSound) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(108, ctx.currentTime);
        gain.gain.setValueAtTime(0.04, ctx.currentTime);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        oscRef.current = osc;
        gainRef.current = gain;
        setAmbientSound(true);
      } catch (_e) {
        // Ignored
      }
    } else {
      if (oscRef.current) {
        oscRef.current.stop();
        oscRef.current.disconnect();
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
      setAmbientSound(false);
    }
  };

  const handleLightCandle = async (repoId: string) => {
    try {
      const res = await fetch('/api/altar/candle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoId }),
      });
      if (res.ok) {
        const data = await res.json();
        setRepos((prev) =>
          prev.map((r) => (r.id === repoId ? { ...r, candlesLit: data.candlesLit } : r))
        );
        if (selectedRepo && selectedRepo.id === repoId) {
          setSelectedRepo((prev) => (prev ? { ...prev, candlesLit: data.candlesLit } : null));
        }
      }
    } catch (_e) {
      // Ignored
    }
  };

  // Inspect a grave from the cemetery game
  const handleInspectRepo = (repo: DepartedRepo, mode: 'seance' | 'resurrection' = 'seance') => {
    setSelectedRepo(repo);
    setContractMode(mode);
    setIsContractOpen(true);
  };

  const handleOpenOfferingForRepo = (repo: DepartedRepo) => {
    setSelectedRepo(repo);
    setIsOfferingModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#07050d] text-calavera-bone selection:bg-purple-600 selection:text-calavera-bone">
      
      {/* Gothic Navigation Bar */}
      <header className="border-b border-purple-900/40 bg-[#0c0816]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Altar Brand */}
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => setActiveTab('graveyard')}
          >
            <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-purple-950/80 border border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.3)]">
              <span className="text-2xl animate-pulse">🪦</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold font-serif-gothic tracking-wider text-calavera-bone">
                  OFRENDA DE CÓDIGO
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950 text-purple-300 border border-purple-500/30">
                  Cemetery Game
                </span>
              </div>
              <p className="text-xs text-purple-300/60 font-mono">
                The Playable Graveyard of Departed Software • Hacktoberfest 2026
              </p>
            </div>
          </div>

          {/* Navigation Mode Tabs */}
          <nav className="flex items-center space-x-1 bg-obsidian-950 p-1.5 rounded-2xl border border-purple-900/40">
            <button
              onClick={() => setActiveTab('graveyard')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                activeTab === 'graveyard'
                  ? 'bg-purple-900/50 text-purple-200 border border-purple-500 shadow-md'
                  : 'text-calavera-aged/60 hover:text-calavera-bone'
              }`}
            >
              <Ghost size={14} className="text-purple-400" />
              <span>Graveyard Game</span>
            </button>

            <button
              onClick={() => setActiveTab('altar3d')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                activeTab === 'altar3d'
                  ? 'bg-amber-900/50 text-amber-200 border border-amber-500 shadow-md'
                  : 'text-calavera-aged/60 hover:text-calavera-bone'
              }`}
            >
              <Flame size={14} className="text-amber-400" />
              <span>3D Candle Shrine</span>
            </button>

            <button
              onClick={() => setActiveTab('offerings')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                activeTab === 'offerings'
                  ? 'bg-purple-900/50 text-purple-200 border border-purple-500 shadow-md'
                  : 'text-calavera-aged/60 hover:text-calavera-bone'
              }`}
            >
              <span>🏵️ Devotee Wisps</span>
            </button>
          </nav>

          {/* Controls */}
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleAmbientSound}
              title={ambientSound ? 'Mute eerie graveyard organ' : 'Play eerie graveyard organ'}
              className="p-2.5 rounded-xl bg-obsidian-900 border border-purple-500/30 text-purple-300 hover:bg-purple-900/30 transition-colors"
            >
              {ambientSound ? '🔊' : '🔇'}
            </button>

            <button
              onClick={() => setIsCustomModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-calavera-bone font-mono font-bold text-xs shadow-lg shadow-purple-950/50 border border-purple-400/40 transition-all transform active:scale-95"
            >
              <span>+ Summon Repo</span>
            </button>
          </div>

        </div>
      </header>

      {/* Main Sanctuary Viewport */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full space-y-8">
        
        {/* VIEW 1: THE PLAYABLE CEMETERY GAME */}
        {activeTab === 'graveyard' && (
          <section className="space-y-6">
            
            {/* The 2.5D Canvas World */}
            <CemeteryGame
              repos={repos}
              offerings={offerings}
              onInspectRepo={handleInspectRepo}
              onOpenSummonModal={() => setIsCustomModalOpen(true)}
              onOpenOfferingModal={handleOpenOfferingForRepo}
            />

            {/* Quick Tombstone Directory Strip (Click to Jump/Commune directly) */}
            <div className="bg-obsidian-950/70 p-4 rounded-2xl border border-purple-900/30">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-purple-300 uppercase tracking-wider font-bold">
                  🪦 Tombstones Resting in the Cemetery:
                </span>
                <span className="text-[11px] font-mono text-calavera-aged/60">
                  Click any grave to summon the Devil's Contract
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {repos.map((repo) => (
                  <button
                    key={repo.id}
                    onClick={() => handleInspectRepo(repo)}
                    className="p-3 rounded-xl bg-obsidian-900/90 hover:bg-purple-950/60 border border-purple-500/20 hover:border-purple-500/60 text-left transition-all transform hover:-translate-y-1 shadow-md"
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-base">🪦</span>
                      <span className="text-xs font-bold font-serif-gothic text-calavera-bone truncate">
                        {repo.name}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-purple-300/70">
                      {repo.yearsActive}
                    </div>
                    <div className="text-[9px] font-mono text-amber-400 mt-1">
                      ★ {repo.starsAtSunset.toLocaleString()}
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </section>
        )}

        {/* VIEW 2: THE 3D CANDLE SHRINE (Preserved & Celebrated) */}
        {activeTab === 'altar3d' && selectedRepo && (
          <section className="space-y-6 animate-fade-in">
            <div className="p-4 rounded-2xl bg-obsidian-950/80 border border-amber-500/30 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold font-serif-gothic text-amber-300">
                  3D Candle Altar • {selectedRepo.name}
                </h3>
                <p className="text-xs text-calavera-aged/70 font-mono">
                  Real WebGL PointLights & Wax Physics. Light candles on the stone pedestal.
                </p>
              </div>

              <button
                onClick={() => handleInspectRepo(selectedRepo, 'seance')}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-purple-900 hover:bg-purple-800 text-purple-200 text-xs font-mono font-bold border border-purple-500/40"
              >
                <Scroll size={14} />
                <span>Open Devil's Contract</span>
              </button>
            </div>

            {/* The 3D Three.js Candle Scene */}
            <ThreeAltar
              selectedRepo={selectedRepo}
              candlesLit={selectedRepo.candlesLit}
              onLightCandle={() => handleLightCandle(selectedRepo.id)}
            />

            {/* Audio Eulogy Stream */}
            <AudioEulogyPlayer repo={selectedRepo} />
          </section>
        )}

        {/* VIEW 3: DEVOTEE SOUL WISPS & OFFERINGS */}
        {activeTab === 'offerings' && (
          <section className="animate-fade-in">
            <OfferingsWall />
          </section>
        )}

      </main>

      {/* DEVIL'S CONTRACT MODAL (With Imp Companion Grimmy) */}
      {selectedRepo && (
        <DevilsContract
          repo={selectedRepo}
          isOpen={isContractOpen}
          onClose={() => setIsContractOpen(false)}
          initialMode={contractMode}
        />
      )}

      {/* DEVOTEE OFFERING MODAL */}
      {selectedRepo && (
        <OfferingModal
          repo={selectedRepo}
          isOpen={isOfferingModalOpen}
          onClose={() => setIsOfferingModalOpen(false)}
          onOfferingAdded={loadData}
        />
      )}

      {/* SUMMON CUSTOM REPO MODAL */}
      <CustomRepoModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onRepoAdded={(newRepo) => {
          setRepos((prev) => [newRepo, ...prev]);
          setSelectedRepo(newRepo);
          setActiveTab('graveyard');
        }}
      />

      {/* Atmospheric Gothic Footer */}
      <footer className="border-t border-purple-900/30 bg-[#050308] py-12 mt-20 text-center text-xs font-mono text-purple-400/50">
        <div className="max-w-7xl mx-auto px-4 space-y-3">
          <div className="flex items-center justify-center space-x-2 text-purple-400">
            <span>🪦</span>
            <span className="font-serif-gothic font-bold text-sm tracking-wider text-calavera-bone">
              OFRENDA DE CÓDIGO
            </span>
            <span>🕯️</span>
          </div>

          <p className="max-w-2xl mx-auto leading-relaxed">
            The Playable Cemetery of Departed Software • Built for <strong className="text-calavera-bone">Hacktoberfest 2026: Week 4 — Ghost in the Machine</strong>.
            Powered by 2.5D Canvas Engine, Three.js 3D Candles, Google Gemma 2, and ElevenLabs.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-purple-300/60 pt-2">
            <span>● 2.5D Playable Graveyard</span>
            <span>● Three.js Candle Altar</span>
            <span>● Devil's Contract & Grimmy the Imp</span>
            <span>● Local Gemma 2 Telepathy</span>
            <span>● Soul Wisps & Live Offerings</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default App;
