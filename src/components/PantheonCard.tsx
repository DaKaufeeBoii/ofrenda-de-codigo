import React from 'react';
import { DepartedRepo } from '../types';
import { Flame, MessageSquare, Sparkles, ExternalLink, ArrowRight } from 'lucide-react';

interface PantheonCardProps {
  repo: DepartedRepo;
  isSelected: boolean;
  onSelect: (repo: DepartedRepo) => void;
  onCommune: (repo: DepartedRepo) => void;
  onResurrect: (repo: DepartedRepo) => void;
  onLightCandle: (repoId: string) => void;
}

export const PantheonCard: React.FC<PantheonCardProps> = ({
  repo,
  isSelected,
  onSelect,
  onCommune,
  onResurrect,
  onLightCandle,
}) => {
  return (
    <div
      onClick={() => onSelect(repo)}
      className={`relative rounded-2xl p-5 cursor-pointer altar-card-hover border transition-all ${
        isSelected
          ? 'bg-obsidian-900 border-marigold-500 shadow-lg shadow-marigold-500/20'
          : 'bg-obsidian-900/60 border-marigold-500/20 hover:border-marigold-500/40'
      }`}
    >
      {/* Category Ribbon */}
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-marigold-500/10 text-marigold-300 border border-marigold-500/20">
          {repo.category}
        </span>
        <span className="text-xs font-mono text-calavera-aged/80">
          {repo.yearsActive}
        </span>
      </div>

      {/* Repo Title & Avatar */}
      <div className="flex items-center space-x-3 mb-3">
        <img
          src={repo.avatarUrl}
          alt={repo.name}
          className="w-10 h-10 rounded-xl bg-obsidian-800 border border-marigold-500/20 object-cover"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold font-serif-gothic text-calavera-bone truncate">
            {repo.name}
          </h3>
          <p className="text-xs font-mono text-calavera-aged/70 truncate">
            {repo.fullName}
          </p>
        </div>
      </div>

      {/* Epitaph snippet */}
      <p className="text-xs text-calavera-bone/80 line-clamp-2 italic mb-4 leading-relaxed font-serif">
        "{repo.epitaph}"
      </p>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-obsidian-950/70 p-2.5 rounded-xl border border-marigold-500/10 mb-4">
        <div>
          <span className="text-calavera-aged/60 block text-[10px] uppercase">Peak Weekly</span>
          <span className="text-marigold-300 font-semibold">{repo.peakWeeklyDownloads}</span>
        </div>
        <div>
          <span className="text-calavera-aged/60 block text-[10px] uppercase">Stars</span>
          <span className="text-calavera-bone font-semibold">★ {repo.starsAtSunset.toLocaleString()}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2 pt-1 border-t border-marigold-500/10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onCommune(repo);
          }}
          className="flex-1 flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg bg-obsidian-800 hover:bg-marigold-500/20 text-marigold-300 text-xs font-medium border border-marigold-500/20 transition-colors"
        >
          <MessageSquare size={13} />
          <span>Commune</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onResurrect(repo);
          }}
          className="flex-1 flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg bg-obsidian-800 hover:bg-marigold-500/20 text-calavera-bone text-xs font-medium border border-marigold-500/20 transition-colors"
        >
          <Sparkles size={13} className="text-marigold-400" />
          <span>Resurrect</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onLightCandle(repo.id);
          }}
          title="Light a candle"
          className="p-1.5 rounded-lg bg-obsidian-800 hover:bg-marigold-500/20 text-marigold-400 border border-marigold-500/20 transition-colors"
        >
          <Flame size={14} />
        </button>
      </div>

    </div>
  );
};
