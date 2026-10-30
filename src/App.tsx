import React, { useState, useEffect, useRef } from 'react';
import { DepartedRepo } from './types';
import { Navbar } from './components/Navbar';
import { CandleAltar } from './components/CandleAltar';
import { PantheonCard } from './components/PantheonCard';
import { SeanceChat } from './components/SeanceChat';
import { ResurrectionChamber } from './components/ResurrectionChamber';
import { AudioEulogyPlayer } from './components/AudioEulogyPlayer';
import { OfferingModal } from './components/OfferingModal';
import { CustomRepoModal } from './components/CustomRepoModal';
import { OfferingsWall } from './components/OfferingsWall';
import { Sparkles, Search, Skull, Heart, Terminal } from 'lucide-react';

export const App: React.FC = () => {
  const [repos, setRepos] = useState<DepartedRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<DepartedRepo | null>(null);
  const [activeTab, setActiveTab] = useState<'pantheon' | 'seance' | 'resurrection' | 'offerings'>('pantheon');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isOfferingModalOpen, setIsOfferingModalOpen] = useState(false);
  const [ambientSound, setAmbientSound] = useState(false);

  // Audio Context for Ambient Cathedral Tone
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  // Fetch initial repositories from backend
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

  // Ambient sound synthesizer (Cathedral organ drone / wind harmony)
  const toggleAmbientSound = () => {
    if (!ambientSound) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(110, ctx.currentTime); // Deep A2 note
        gain.gain.setValueAtTime(0.04, ctx.currentTime); // Very quiet ambient drone

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        oscRef.current = osc;
        gainRef.current = gain;
        setAmbientSound(true);
      } catch (_e) {
        // AudioContext not allowed without user gesture
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
      // Ignore
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
      
      {/* Top Navigation */}
      <Navbar
        onOpenCustomModal={() => setIsCustomModalOpen(true)}
        ambientSound={ambientSound}
        onToggleSound={toggleAmbientSound}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        
        {/* Hero Banner: Ofrenda Shrine & Candlelight */}
        {selectedRepo && (
          <>
            <CandleAltar
              selectedRepo={selectedRepo}
              onLightCandle={handleLightCandle}
              onOpenOfferingModal={() => setIsOfferingModalOpen(true)}
            />
            <AudioEulogyPlayer repo={selectedRepo} />
          </>
        )}

        {/* Tab Switcher Body */}
        {activeTab === 'pantheon' && (
          <section className="space-y-6">
            
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-obsidian-900/60 p-4 rounded-2xl border border-marigold-500/20">
              
              {/* Category Pills */}
              <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all ${
                      filterCategory === cat
                        ? 'bg-marigold-500 text-obsidian-950 font-bold shadow-md shadow-marigold-500/20'
                        : 'bg-obsidian-800 text-calavera-aged hover:text-calavera-bone hover:bg-obsidian-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search departed tools..."
                  className="w-full bg-obsidian-950 text-calavera-bone text-xs pl-9 pr-4 py-2 rounded-xl border border-marigold-500/20 focus:outline-none focus:border-marigold-500 font-mono"
                />
                <Search size={14} className="absolute left-3 top-2.5 text-calavera-aged/60" />
              </div>

            </div>

            {/* Pantheon Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRepos.map((repo) => (
                <PantheonCard
                  key={repo.id}
                  repo={repo}
                  isSelected={selectedRepo?.id === repo.id}
                  onSelect={handleSelectRepo}
                  onCommune={handleCommune}
                  onResurrect={handleResurrect}
                  onLightCandle={handleLightCandle}
                />
              ))}
            </div>

          </section>
        )}

        {activeTab === 'seance' && selectedRepo && (
          <section className="space-y-6">
            <SeanceChat repo={selectedRepo} />
          </section>
        )}

        {activeTab === 'resurrection' && selectedRepo && (
          <section className="space-y-6">
            <ResurrectionChamber repo={selectedRepo} />
          </section>
        )}

        {activeTab === 'offerings' && (
          <section className="space-y-6">
            <OfferingsWall />
          </section>
        )}

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

      {/* Footer */}
      <footer className="border-t border-marigold-500/20 bg-obsidian-950 py-10 mt-16 text-center text-xs font-mono text-calavera-aged/60">
        <div className="max-w-7xl mx-auto px-4 space-y-3">
          <div className="flex items-center justify-center space-x-2 text-marigold-400">
            <span>🏵️</span>
            <span className="font-serif-gothic font-bold text-calavera-bone">OFRENDA DE CÓDIGO</span>
            <span>🕯️</span>
          </div>
          <p className="max-w-xl mx-auto leading-relaxed">
            Built for <strong className="text-calavera-bone">Hacktoberfest 2026: Week 4 — Ghost in the Machine</strong>.
            Powered by open-source AI: Google Gemma 2 (Open-Weights), ElevenLabs Voice API, and deployable to Render.
          </p>
          <p className="text-[11px] text-calavera-aged/40">
            Dedicated to the millions of open-source maintainers whose sleepless nights built the web we stand on today.
          </p>
        </div>
      </footer>

    </div>
  );
};
export default App;
