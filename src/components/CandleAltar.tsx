import React, { useState } from 'react';
import { DepartedRepo } from '../types';
import confetti from 'canvas-confetti';
import { Sparkles, HeartHandshake, Skull, Flame } from 'lucide-react';

interface CandleAltarProps {
  selectedRepo: DepartedRepo;
  onLightCandle: (repoId: string) => void;
  onOpenOfferingModal: () => void;
}

export const CandleAltar: React.FC<CandleAltarProps> = ({
  selectedRepo,
  onLightCandle,
  onOpenOfferingModal,
}) => {
  const [isLighting, setIsLighting] = useState(false);

  const handleLightCandle = () => {
    setIsLighting(true);
    onLightCandle(selectedRepo.id);

    // Trigger golden/marigold floral confetti
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.65 },
      colors: ['#f59e0b', '#fbbf24', '#ea580c', '#ffffff', '#dc2626'],
      shapes: ['circle'],
    });

    setTimeout(() => setIsLighting(false), 800);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl altar-parchment p-6 sm:p-8 my-8 border border-marigold-500/30 shadow-2xl">
      
      {/* Decorative Traditional Papel Picado / Marigold garland border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-calavera-crimson via-marigold-500 to-calavera-purple" />

      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
        
        {/* Left: Altar Veneration Details */}
        <div className="flex-1 text-center md:text-left">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-marigold-500/10 border border-marigold-500/30 text-marigold-400 text-xs font-mono mb-3">
            <span>🏵️ OFRENDA DEL DÍA DE LOS MUERTOS</span>
          </div>

          <div className="flex items-center justify-center md:justify-start space-x-3 mb-2">
            <h2 className="text-3xl sm:text-4xl font-extrabold font-serif-gothic text-calavera-bone">
              {selectedRepo.name}
            </h2>
            <span className="text-sm font-mono px-2.5 py-0.5 rounded bg-obsidian-800 border border-marigold-500/30 text-amber-300">
              {selectedRepo.yearsActive}
            </span>
          </div>

          <p className="text-sm sm:text-base text-amber-100/80 italic font-serif leading-relaxed max-w-2xl mb-4">
            "{selectedRepo.epitaph}"
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-mono text-calavera-aged">
            <div className="flex items-center space-x-1.5 bg-obsidian-900/80 px-3 py-1.5 rounded-lg border border-marigold-500/20">
              <span className="text-marigold-400">★</span>
              <span>{selectedRepo.starsAtSunset.toLocaleString()} Stars at Sunset</span>
            </div>
            <div className="flex items-center space-x-1.5 bg-obsidian-900/80 px-3 py-1.5 rounded-lg border border-marigold-500/20">
              <span className="text-marigold-400">⚡</span>
              <span>{selectedRepo.peakWeeklyDownloads} Weekly Peak</span>
            </div>
            <div className="flex items-center space-x-1.5 bg-obsidian-900/80 px-3 py-1.5 rounded-lg border border-marigold-500/20">
              <span className="text-marigold-400">👤</span>
              <span>{selectedRepo.authorOrMaintainer}</span>
            </div>
          </div>
        </div>

        {/* Right: The Tiered Candle Shrine */}
        <div className="flex flex-col items-center bg-obsidian-900/90 p-6 rounded-2xl border border-marigold-500/30 shadow-inner">
          
          {/* Candle Flames Display */}
          <div className="flex items-end justify-center space-x-4 mb-5 h-20">
            {/* Candle 1 */}
            <div className="flex flex-col items-center">
              <div className="w-3 h-5 candle-flame mb-1" />
              <div className="w-5 h-10 bg-amber-200/90 rounded-sm shadow-md border-t-2 border-amber-300" />
            </div>

            {/* Center Candle (Hero) */}
            <div className="flex flex-col items-center">
              <div className="w-4 h-7 candle-flame mb-1 shadow-lg" />
              <div className="w-6 h-14 bg-amber-100 rounded-sm shadow-lg border-t-2 border-amber-200" />
            </div>

            {/* Candle 3 */}
            <div className="flex flex-col items-center">
              <div className="w-3 h-5 candle-flame mb-1" />
              <div className="w-5 h-8 bg-amber-200/90 rounded-sm shadow-md border-t-2 border-amber-300" />
            </div>
          </div>

          {/* Counts */}
          <div className="text-center mb-4">
            <div className="flex items-center justify-center space-x-2">
              <Flame size={18} className="text-marigold-500 animate-pulse" />
              <span className="text-2xl font-bold font-mono text-calavera-bone">
                {selectedRepo.candlesLit.toLocaleString()}
              </span>
              <span className="text-xs text-calavera-aged">Candles Lit</span>
            </div>
            <p className="text-xs text-amber-200/60 mt-0.5">
              {selectedRepo.offeringsCount} offerings placed on this altar
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3 w-full">
            <button
              onClick={handleLightCandle}
              disabled={isLighting}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-marigold-500 to-amber-600 hover:from-marigold-400 hover:to-amber-500 text-obsidian-950 font-bold text-xs uppercase tracking-wider transition-all transform active:scale-95 shadow-md shadow-marigold-500/20"
            >
              <Sparkles size={16} />
              <span>{isLighting ? 'Lighting...' : 'Light Candle'}</span>
            </button>

            <button
              onClick={onOpenOfferingModal}
              className="flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-xl bg-obsidian-800 hover:bg-obsidian-700 text-marigold-300 border border-marigold-500/40 font-medium text-xs transition-all"
              title="Leave an offering (Marigold, Pan de Muerto, Coffee)"
            >
              <HeartHandshake size={16} />
              <span>Offer</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
