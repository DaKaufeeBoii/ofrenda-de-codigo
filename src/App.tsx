import React, { useState, useEffect, useRef } from 'react';
import { DepartedRepo, AltarOffering } from './types';
import { CemeteryWorld } from './components/CemeteryWorld';
import { ThreeAltar } from './components/ThreeAltar';
import { DevilsContract } from './components/DevilsContract';
import { OfferingModal } from './components/OfferingModal';
import { CustomRepoModal } from './components/CustomRepoModal';
import { OfferingsWall } from './components/OfferingsWall';
import { AudioEulogyPlayer } from './components/AudioEulogyPlayer';
import { X, Flame, Scroll, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const [repos, setRepos] = useState<DepartedRepo[]>([]);
  const [offerings, setOfferings] = useState<AltarOffering[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<DepartedRepo | null>(null);

  // In-World Modal Overlays
  const [isContractOpen, setIsContractOpen] = useState(false);
  const [contractMode, setContractMode] = useState<'seance' | 'resurrection'>('seance');
  const [is3DAltarOpen, setIs3DAltarOpen] = useState(false);
  const [isOfferingsWallOpen, setIsOfferingsWallOpen] = useState(false);
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isOfferingModalOpen, setIsOfferingModalOpen] = useState(false);

  // Ambient Cathedral Sound Synthesizer
  const [ambientSound, setAmbientSound] = useState(false);
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

  const handleOpenContract = (repo: DepartedRepo, mode: 'seance' | 'resurrection' = 'seance') => {
    setSelectedRepo(repo);
    setContractMode(mode);
    setIsContractOpen(true);
  };

  const handleOpen3DAltar = (repo: DepartedRepo) => {
    setSelectedRepo(repo);
    setIs3DAltarOpen(true);
  };

  const handleOpenOfferingModal = (repo: DepartedRepo) => {
    setSelectedRepo(repo);
    setIsOfferingModalOpen(true);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#08060e] text-calavera-bone">
      
      {/* THE FULLSCREEN CEMETERY GAME ENGINE (The Entire Website) */}
      <CemeteryWorld
        repos={repos}
        offerings={offerings}
        onOpenContract={handleOpenContract}
        onOpen3DAltar={handleOpen3DAltar}
        onOpenOfferingsWall={() => setIsOfferingsWallOpen(true)}
        onOpenSummonModal={() => setIsCustomModalOpen(true)}
        onOpenOfferingModal={handleOpenOfferingModal}
        ambientSound={ambientSound}
        onToggleSound={toggleAmbientSound}
      />

      {/* 3D CANDLE SANCTUARY MODAL OVERLAY */}
      {is3DAltarOpen && selectedRepo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-obsidian-950/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-5xl rounded-3xl bg-obsidian-950 border-2 border-amber-500/50 shadow-[0_0_60px_rgba(245,158,11,0.3)] overflow-hidden flex flex-col max-h-[92vh]">
            
            {/* Header */}
            <div className="px-6 py-4 bg-obsidian-900/90 border-b border-amber-500/20 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl animate-pulse">🕯️</span>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold font-serif-gothic text-calavera-bone">
                    The Grand Candle Sanctuary • {selectedRepo.name}
                  </h3>
                  <p className="text-xs text-amber-200/70 font-mono">
                    Real WebGL 3D PointLights, Flickering Wax Physics & Drifting Marigolds
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    setIs3DAltarOpen(false);
                    handleOpenContract(selectedRepo, 'seance');
                  }}
                  className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-900/80 hover:bg-purple-800 text-purple-200 text-xs font-mono border border-purple-500/30"
                >
                  <Scroll size={13} />
                  <span>Open Devil's Contract</span>
                </button>

                <button
                  onClick={() => setIs3DAltarOpen(false)}
                  className="p-2 rounded-full bg-obsidian-800 hover:bg-obsidian-700 text-calavera-bone border border-amber-500/30"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* 3D Scene Viewport */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
              <ThreeAltar
                selectedRepo={selectedRepo}
                candlesLit={selectedRepo.candlesLit}
                onLightCandle={() => handleLightCandle(selectedRepo.id)}
              />

              {/* Spoken Eulogy Narration Audio */}
              <AudioEulogyPlayer repo={selectedRepo} />
            </div>

          </div>
        </div>
      )}

      {/* DEVIL'S CONTRACT MODAL (With Animated Imp Companion Grimmy) */}
      {selectedRepo && (
        <DevilsContract
          repo={selectedRepo}
          isOpen={isContractOpen}
          onClose={() => setIsContractOpen(false)}
          initialMode={contractMode}
        />
      )}

      {/* DEVOTEE MEMORIAL SHRINE & WALL MODAL */}
      {isOfferingsWallOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-obsidian-950/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-5xl rounded-3xl bg-obsidian-950 border-2 border-purple-500/40 shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsOfferingsWallOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-obsidian-900 text-purple-300 border border-purple-500/30"
            >
              <X size={18} />
            </button>
            <OfferingsWall />
          </div>
        </div>
      )}

      {/* DEVOTEE OFFERING PLACEMENT MODAL */}
      {selectedRepo && (
        <OfferingModal
          repo={selectedRepo}
          isOpen={isOfferingModalOpen}
          onClose={() => setIsOfferingModalOpen(false)}
          onOfferingAdded={loadData}
        />
      )}

      {/* SUMMON CUSTOM REPO MODAL (The Summoning Obelisk) */}
      <CustomRepoModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onRepoAdded={(newRepo) => {
          setRepos((prev) => [newRepo, ...prev]);
          setSelectedRepo(newRepo);
          handleOpenContract(newRepo, 'seance');
        }}
      />

    </div>
  );
};

export default App;
