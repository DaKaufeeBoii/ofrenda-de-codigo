import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DepartedRepo } from './types';
import { Navbar } from './components/Navbar';
import { ThreeAltar } from './components/ThreeAltar';
import { PantheonCard } from './components/PantheonCard';
import { SeanceChat } from './components/SeanceChat';
import { ResurrectionChamber } from './components/ResurrectionChamber';
import { AudioEulogyPlayer } from './components/AudioEulogyPlayer';
import { OfferingModal } from './components/OfferingModal';
import { CustomRepoModal } from './components/CustomRepoModal';
import { OfferingsWall } from './components/OfferingsWall';
import { Sparkles, Search, Flame, Skull, Compass, Radio } from 'lucide-react';

export const App: React.FC = () => {
  const [repos, setRepos] = useState<DepartedRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<DepartedRepo | null>(null);
  const [activeTab, setActiveTab] = useState<'pantheon' | 'seance' | 'resurrection' | 'offerings'>('pantheon');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isOfferingModalOpen, setIsOfferingModalOpen] = useState(false);
  const [ambientSound, setAmbientSound] = useState(false);

  // Audio Context for Ambient Drone
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const loadRepos = async () => {
    try {
      const res = await fetch('/api/pantheon');
      if (res.ok) {
        const data: DepartedRepo[] = await res.json();
        setRepos(data);
        if (!selectedRepo && data.length > 0) {
          setSelectedRepo(data[0]);
        }
      }
    } catch (_err) {
      console.warn('Failed to load pantheon, retrying...');
    }
  };

  useEffect(() => {
    loadRepos();
  }, []);

  // Ambient tone generator
  const toggleAmbientSound = () => {
    if (!ambientSound) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(110, ctx.currentTime); // Low A2
        gain.gain.setValueAtTime(0.035, ctx.currentTime);

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

  const handleSelectRepo = (repo: DepartedRepo) => {
    setSelectedRepo(repo);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCommune = (repo: DepartedRepo) => {
    setSelectedRepo(repo);
    setActiveTab('seance');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResurrect = (repo: DepartedRepo) => {
    setSelectedRepo(repo);
    setActiveTab('resurrection');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredRepos = repos.filter((r) => {
    const matchesCat = filterCategory === 'All' || r.category === filterCategory;
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.epitaph.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const categories = ['All', 'JavaScript', 'Python', 'Build Tools', 'Frameworks'];

  return (
    <div className="min-h-screen flex flex-col bg-obsidian-950 text-calavera-bone selection:bg-marigold-500 selection:text-obsidian-950">
      
      {/* Top Glassmorphic Navigation */}
      <Navbar
        onOpenCustomModal={() => setIsCustomModalOpen(true)}
        ambientSound={ambientSound}
        onToggleSound={toggleAmbientSound}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        
        {/* 3D WebGL Altar Shrine (Hero Visual) */}
        {selectedRepo && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <ThreeAltar
              selectedRepo={selectedRepo}
              candlesLit={selectedRepo.candlesLit}
              onLightCandle={() => handleLightCandle(selectedRepo.id)}
            />

            {/* ElevenLabs Spoken Narration Player */}
            <AudioEulogyPlayer repo={selectedRepo} />
          </motion.section>
        )}

        {/* Tab View Transition Container */}
        <AnimatePresence mode="wait">
          {activeTab === 'pantheon' && (
            <motion.section
              key="pantheon-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Category Filter and Search Toolbar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-obsidian-900/70 backdrop-blur-md p-4 rounded-2xl border border-marigold-500/20 shadow-lg">
                
                {/* Category Pills */}
                <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setFilterCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-xs font-mono font-medium transition-all ${
                        filterCategory === cat
                          ? 'bg-gradient-to-r from-marigold-500 to-amber-600 text-obsidian-950 font-bold shadow-md shadow-marigold-500/20'
                          : 'bg-obsidian-800/80 text-calavera-aged hover:text-calavera-bone hover:bg-obsidian-800'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-80">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search departed libraries, authors, tags..."
                    className="w-full bg-obsidian-950 text-calavera-bone text-xs pl-10 pr-4 py-2.5 rounded-xl border border-marigold-500/20 focus:outline-none focus:border-marigold-500 font-mono"
                  />
                  <Search size={15} className="absolute left-3.5 top-3 text-calavera-aged/60" />
                </div>
              </div>

              {/* Pantheon Card Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRepos.map((repo, idx) => (
                  <motion.div
                    key={repo.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                  >
                    <PantheonCard
                      repo={repo}
                      isSelected={selectedRepo?.id === repo.id}
                      onSelect={handleSelectRepo}
                      onCommune={handleCommune}
                      onResurrect={handleResurrect}
                      onLightCandle={handleLightCandle}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {activeTab === 'seance' && selectedRepo && (
            <motion.section
              key="seance-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <SeanceChat repo={selectedRepo} />
            </motion.section>
          )}

          {activeTab === 'resurrection' && selectedRepo && (
            <motion.section
              key="resurrection-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <ResurrectionChamber repo={selectedRepo} />
            </motion.section>
          )}

          {activeTab === 'offerings' && (
            <motion.section
              key="offerings-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <OfferingsWall />
            </motion.section>
          )}
        </AnimatePresence>

      </main>

      {/* Modals */}
      {selectedRepo && (
        <OfferingModal
          repo={selectedRepo}
          isOpen={isOfferingModalOpen}
          onClose={() => setIsOfferingModalOpen(false)}
          onOfferingAdded={loadRepos}
        />
      )}

      <CustomRepoModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onRepoAdded={(newRepo) => {
          setRepos((prev) => [newRepo, ...prev]);
          setSelectedRepo(newRepo);
          setActiveTab('pantheon');
        }}
      />

      {/* Footer with Hacktoberfest Partner Attribution */}
      <footer className="border-t border-marigold-500/20 bg-obsidian-950 py-12 mt-20 text-center text-xs font-mono text-calavera-aged/60">
        <div className="max-w-7xl mx-auto px-4 space-y-4">
          <div className="flex items-center justify-center space-x-2 text-marigold-400">
            <span>🏵️</span>
            <span className="font-serif-gothic font-bold text-sm tracking-wider text-calavera-bone">
              OFRENDA DE CÓDIGO
            </span>
            <span>🕯️</span>
          </div>

          <p className="max-w-2xl mx-auto leading-relaxed">
            Built for <strong className="text-calavera-bone">Hacktoberfest 2026: Week 4 — Ghost in the Machine</strong>.
            Powered by authentic live open-source AI: Google Gemma 2 (Local Ollama), ElevenLabs Voice API, Three.js WebGL, and GitHub API.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-amber-300/70 pt-2">
            <span>● Google Gemma 2</span>
            <span>● ElevenLabs TTS</span>
            <span>● GitHub API Authenticated</span>
            <span>● Three.js WebGL Altar</span>
            <span>● Render Ready</span>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default App;
