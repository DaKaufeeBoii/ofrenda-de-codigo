import React, { useState, useEffect } from 'react';
import { DepartedRepo } from '../types';
import { Sparkles, ArrowRight, Copy, Check, Terminal, Wand2, RefreshCw } from 'lucide-react';

interface ResurrectionChamberProps {
  repo: DepartedRepo;
}

export const ResurrectionChamber: React.FC<ResurrectionChamberProps> = ({ repo }) => {
  const [vintageCode, setVintageCode] = useState(repo.vintageSnippet.code);
  const [modernCode, setModernCode] = useState(repo.modernResurrection.code);
  const [explanation, setExplanation] = useState(repo.modernResurrection.explanation);
  const [isTransmuting, setIsTransmuting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setVintageCode(repo.vintageSnippet.code);
    setModernCode(repo.modernResurrection.code);
    setExplanation(repo.modernResurrection.explanation);
  }, [repo]);

  const handleTransmute = async () => {
    setIsTransmuting(true);
    try {
      const res = await fetch('/api/resurrect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoId: repo.id,
          vintageCode: vintageCode,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setModernCode(data.modernCode);
        setExplanation(data.explanation);
      }
    } catch (_err) {
      // Keep existing modern code
    } finally {
      setIsTransmuting(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(modernCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl altar-parchment border border-marigold-500/30 p-6 sm:p-8 shadow-2xl space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-marigold-500/20 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-bold font-serif-gothic text-calavera-bone">
              ✨ The Resurrection Chamber
            </h2>
            <span className="px-2 py-0.5 rounded text-xs font-mono bg-marigold-500/20 text-marigold-300 border border-marigold-500/30">
              Code Transmutation
            </span>
          </div>
          <p className="text-xs sm:text-sm text-calavera-aged/80 mt-1 font-serif">
            Watch how the soul of <span className="text-marigold-400 font-semibold">{repo.name}</span> is reincarnated into modern 2026 software idioms.
          </p>
        </div>

        <button
          onClick={handleTransmute}
          disabled={isTransmuting}
          className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-marigold-500 to-amber-600 hover:from-marigold-400 hover:to-amber-500 text-obsidian-950 font-bold text-xs uppercase tracking-wider transition-all transform active:scale-95 shadow-md shadow-marigold-500/20 disabled:opacity-50"
        >
          {isTransmuting ? <RefreshCw size={15} className="animate-spin" /> : <Wand2 size={15} />}
          <span>{isTransmuting ? 'Transmuting...' : 'Perform Ritual'}</span>
        </button>
      </div>

      {/* Side by Side Editors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left: Vintage Code (From the Past) */}
        <div className="flex flex-col rounded-xl bg-obsidian-950 border border-red-500/30 overflow-hidden shadow-inner">
          <div className="bg-obsidian-900/90 px-4 py-2.5 border-b border-red-500/20 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-mono text-red-300">
              <span>🕯️</span>
              <span className="font-semibold">{repo.vintageSnippet.title}</span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-500/30">
              {repo.vintageSnippet.language} (Deprecated)
            </span>
          </div>

          <div className="p-4 flex-1">
            <textarea
              value={vintageCode}
              onChange={(e) => setVintageCode(e.target.value)}
              rows={14}
              className="w-full bg-transparent text-calavera-bone font-mono text-xs leading-relaxed focus:outline-none resize-none"
              spellCheck={false}
            />
          </div>

          <div className="px-4 py-2 bg-red-950/20 border-t border-red-500/10 text-[11px] font-mono text-red-300/80">
            ⚠️ Contains legacy patterns of the {repo.birthYear}–{repo.deathYear} era
          </div>
        </div>

        {/* Right: Resurrected Code (Modern 2026) */}
        <div className="flex flex-col rounded-xl bg-obsidian-950 border border-emerald-500/40 overflow-hidden shadow-inner">
          <div className="bg-obsidian-900/90 px-4 py-2.5 border-b border-emerald-500/20 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-mono text-emerald-300">
              <span>🌱</span>
              <span className="font-semibold">{repo.modernResurrection.title}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                {repo.modernResurrection.language} (2026)
              </span>
              <button
                onClick={handleCopy}
                className="p-1 rounded hover:bg-emerald-500/20 text-emerald-400 transition-colors"
                title="Copy modernized code"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>

          <div className="p-4 flex-1">
            <pre className="text-emerald-300 font-mono text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap">
              <code>{modernCode}</code>
            </pre>
          </div>

          <div className="px-4 py-2.5 bg-emerald-950/20 border-t border-emerald-500/10 text-xs font-serif text-emerald-200/90">
            <span className="font-bold text-emerald-400 font-mono">Architectural Evolution: </span>
            {explanation}
          </div>
        </div>

      </div>

    </div>
  );
};
