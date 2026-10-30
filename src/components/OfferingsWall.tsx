import React, { useEffect, useState } from 'react';
import { AltarOffering } from '../types';
import { Heart, Sparkles, MessageCircle, Clock } from 'lucide-react';

export const OfferingsWall: React.FC = () => {
  const [offerings, setOfferings] = useState<AltarOffering[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOfferings = async () => {
    try {
      const res = await fetch('/api/altar/offerings');
      if (res.ok) {
        const data = await res.json();
        setOfferings(data);
      }
    } catch (_err) {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOfferings();
  }, []);

  const getOfferingIcon = (type: string) => {
    switch (type) {
      case 'marigold': return '🏵️';
      case 'candle': return '🕯️';
      case 'coffee': return '☕';
      case 'pan_de_muerto': return '🍞';
      case 'fork': return '🍴';
      default: return '🏵️';
    }
  };

  return (
    <div className="rounded-2xl altar-parchment border border-marigold-500/30 p-6 sm:p-8 shadow-2xl space-y-6">
      
      {/* Header */}
      <div className="border-b border-marigold-500/20 pb-4">
        <div className="flex items-center space-x-2">
          <h2 className="text-2xl font-bold font-serif-gothic text-calavera-bone">
            🏵️ Devotee Offerings & Memorial Wall
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-calavera-aged/80 mt-1 font-serif">
          Hear the voices of developers across the world paying tribute to the software that shaped their careers.
        </p>
      </div>

      {/* Grid of Offerings */}
      {loading ? (
        <div className="text-center py-12 text-marigold-400 font-mono text-sm">
          <span className="animate-spin inline-block mr-2">🕯️</span>
          Gathering prayers from the altar...
        </div>
      ) : offerings.length === 0 ? (
        <div className="text-center py-12 text-calavera-aged/60 font-serif">
          The altar awaits its first offering. Be the first to leave a flower or candle.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {offerings.map((off) => (
            <div
              key={off.id}
              className="rounded-xl bg-obsidian-950/80 border border-marigold-500/20 p-4 flex flex-col justify-between hover:border-marigold-500/40 transition-all shadow-inner"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getOfferingIcon(off.offeringType)}</span>
                    <span className="text-xs font-mono font-bold text-marigold-300">
                      {off.repoName}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-calavera-aged/60">
                    {new Date(off.timestamp).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-calavera-bone/90 font-serif italic mb-3 leading-relaxed">
                  "{off.message}"
                </p>
              </div>

              <div className="pt-2 border-t border-marigold-500/10 flex items-center justify-between text-[11px] font-mono text-calavera-aged/70">
                <span>By {off.authorName}</span>
                <span className="text-marigold-500/80 uppercase text-[9px] font-bold">
                  {off.offeringType.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
