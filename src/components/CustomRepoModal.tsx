import React, { useState } from 'react';
import { DepartedRepo } from '../types';
import { X, Search, Sparkles, AlertCircle } from 'lucide-react';

interface CustomRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRepoAdded: (repo: DepartedRepo) => void;
}

export const CustomRepoModal: React.FC<CustomRepoModalProps> = ({
  isOpen,
  onClose,
  onRepoAdded,
}) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSummon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoUrl.trim() || isAnalyzing) return;

    setError(null);
    setIsAnalyzing(true);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: repoUrl.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        onRepoAdded(data.repo);
        onClose();
        setRepoUrl('');
      } else {
        const errJson = await res.json();
        setError(errJson.error || 'Failed to summon repository');
      }
    } catch (_err) {
      setError('Network error while querying repository. Please check URL.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const sampleSuggestions = [
    'facebook/flux',
    'angular/angular.js',
    'zeit/hyper',
    'ariya/phantomjs',
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

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-marigold-500/10 border border-marigold-500/30 flex items-center justify-center text-xl">
            🕯️
          </div>
          <div>
            <h3 className="text-xl font-bold font-serif-gothic text-calavera-bone">
              Summon a Departed Repository
            </h3>
            <p className="text-xs text-amber-200/70 font-mono">
              Build an altar for any archived or abandoned open-source project
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSummon} className="space-y-4">
          <div>
            <label className="block text-xs font-mono text-calavera-aged mb-1.5">
              GitHub Repository URL or owner/repo:
            </label>
            <div className="relative">
              <input
                type="text"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="e.g. facebook/flux or https://github.com/angular/angular.js"
                className="w-full bg-obsidian-900 text-calavera-bone text-sm pl-4 pr-10 py-2.5 rounded-xl border border-marigold-500/30 focus:outline-none focus:border-marigold-500 font-mono"
              />
              <Search size={16} className="absolute right-3.5 top-3 text-calavera-aged/60" />
            </div>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-xs text-red-400 bg-red-950/30 p-2.5 rounded-lg border border-red-500/20">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Suggestions */}
          <div>
            <span className="block text-[11px] font-mono text-calavera-aged/60 mb-1.5">
              Famous Departed Suggestions:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {sampleSuggestions.map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setRepoUrl(s)}
                  className="px-2.5 py-1 rounded-lg bg-obsidian-900 hover:bg-marigold-500/10 text-marigold-300 border border-marigold-500/20 text-xs font-mono transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-marigold-500/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-obsidian-800 text-calavera-aged hover:text-calavera-bone text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!repoUrl.trim() || isAnalyzing}
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-marigold-500 to-amber-600 hover:from-marigold-400 hover:to-amber-500 text-obsidian-950 font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-marigold-500/20 disabled:opacity-50"
            >
              <Sparkles size={14} />
              <span>{isAnalyzing ? 'Summoning...' : 'Summon to Altar'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
