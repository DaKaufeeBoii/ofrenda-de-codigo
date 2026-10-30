import React, { useState } from 'react';
import { DepartedRepo } from '../types';
import { X, HeartHandshake, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface OfferingModalProps {
  repo: DepartedRepo;
  isOpen: boolean;
  onClose: () => void;
  onOfferingAdded: () => void;
}

export const OfferingModal: React.FC<OfferingModalProps> = ({
  repo,
  isOpen,
  onClose,
  onOfferingAdded,
}) => {
  const [authorName, setAuthorName] = useState('');
  const [offeringType, setOfferingType] = useState<'candle' | 'marigold' | 'coffee' | 'pan_de_muerto' | 'fork'>('marigold');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/altar/offering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoId: repo.id,
          authorName: authorName.trim() || 'Anonymous Devotee',
          offeringType,
          message: message.trim() || `In eternal gratitude to ${repo.name}.`,
        }),
      });

      if (res.ok) {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#fbbf24', '#dc2626', '#9333ea'],
        });
        onOfferingAdded();
        onClose();
      }
    } catch (_err) {
      // Handled
    } finally {
      setIsSubmitting(false);
    }
  };

  const offeringOptions = [
    { type: 'marigold', icon: '🏵️', label: 'Cempasúchil', desc: 'Marigold flower to guide the spirit back' },
    { type: 'candle', icon: '🕯️', label: 'Vela', desc: 'Light to illuminate the path' },
    { type: 'coffee', icon: '☕', label: 'Late Night Coffee', desc: 'Fuel for midnight debugging sessions' },
    { type: 'pan_de_muerto', icon: '🍞', label: 'Pan de Muerto', desc: 'Traditional sweet bread of the departed' },
    { type: 'fork', icon: '🍴', label: 'Eternal Fork', desc: 'A promise that the code lives on' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-obsidian-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl altar-parchment border border-marigold-500/40 p-6 sm:p-8 shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-calavera-aged/60 hover:text-calavera-bone hover:bg-obsidian-800 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Modal Title */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-marigold-500/10 border border-marigold-500/30 flex items-center justify-center text-xl">
            🏵️
          </div>
          <div>
            <h3 className="text-xl font-bold font-serif-gothic text-calavera-bone">
              Place an Offering on the Altar
            </h3>
            <p className="text-xs text-amber-200/70 font-mono">
              In memory of {repo.name} ({repo.yearsActive})
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Select Offering Type */}
          <div>
            <label className="block text-xs font-mono text-calavera-aged mb-2">
              Select Your Offering:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {offeringOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.type}
                  onClick={() => setOfferingType(opt.type as any)}
                  className={`p-2.5 rounded-xl text-left border transition-all ${
                    offeringType === opt.type
                      ? 'bg-marigold-500/20 border-marigold-500 text-marigold-300 shadow-sm'
                      : 'bg-obsidian-900/80 border-marigold-500/10 text-calavera-bone hover:border-marigold-500/30'
                  }`}
                >
                  <div className="text-xl mb-1">{opt.icon}</div>
                  <div className="text-xs font-semibold">{opt.label}</div>
                  <div className="text-[10px] text-calavera-aged/60 leading-tight">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Devotee Name */}
          <div>
            <label className="block text-xs font-mono text-calavera-aged mb-1">
              Your Name or GitHub Handle (Optional):
            </label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="e.g. dev_miguel or Anonymous"
              className="w-full bg-obsidian-900 text-calavera-bone text-sm px-3.5 py-2 rounded-xl border border-marigold-500/30 focus:outline-none focus:border-marigold-500 font-mono"
            />
          </div>

          {/* Personal Message */}
          <div>
            <label className="block text-xs font-mono text-calavera-aged mb-1">
              Farewell or Remembrance Message:
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder={`Write a note honoring ${repo.name}... e.g., "Thank you for getting me through my first web project back in 2013."`}
              className="w-full bg-obsidian-900 text-calavera-bone text-sm px-3.5 py-2 rounded-xl border border-marigold-500/30 focus:outline-none focus:border-marigold-500 font-serif resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-marigold-500/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-obsidian-800 text-calavera-aged hover:text-calavera-bone text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-marigold-500 to-amber-600 hover:from-marigold-400 hover:to-amber-500 text-obsidian-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-marigold-500/20"
            >
              <Sparkles size={14} />
              <span>{isSubmitting ? 'Placing...' : 'Place Offering'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
