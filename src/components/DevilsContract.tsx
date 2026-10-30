import React, { useState, useEffect, useRef } from 'react';
import { DepartedRepo, ChatMessage } from '../types';
import { ImpCompanion, ImpMood } from './ImpCompanion';
import { AudioEulogyPlayer } from './AudioEulogyPlayer';
import { X, Send, Sparkles, Wand2, Copy, Check, Flame, Scroll, Feather } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DevilsContractProps {
  repo: DepartedRepo;
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'seance' | 'resurrection';
}

export const DevilsContract: React.FC<DevilsContractProps> = ({
  repo,
  isOpen,
  onClose,
  initialMode = 'seance',
}) => {
  const [mode, setMode] = useState<'seance' | 'resurrection'>(initialMode);
  const [impMood, setImpMood] = useState<ImpMood>('idle');
  const [impSpeech, setImpSpeech] = useState<string>('Hehehe! Welcome to the pact chamber!');

  // Séance States
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Resurrection States
  const [vintageCode, setVintageCode] = useState(repo.vintageSnippet.code);
  const [modernCode, setModernCode] = useState(repo.modernResurrection.code);
  const [explanation, setExplanation] = useState(repo.modernResurrection.explanation);
  const [isTransmuting, setIsTransmuting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setVintageCode(repo.vintageSnippet.code);
    setModernCode(repo.modernResurrection.code);
    setExplanation(repo.modernResurrection.explanation);

    // Initial greeting from ghost
    setMessages([
      {
        id: `init-${repo.id}`,
        sender: 'ghost',
        text: `*The ink flows across the parchment...* "I am the spirit of ${repo.name}. Between ${repo.birthYear} and ${repo.deathYear}, I bore the weight of millions of builds. Ask of me what you will, traveler."`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        ambientTone: 'Gemma 2 Telepathic Link',
      },
    ]);

    setImpSpeech(`A communion with ${repo.name}! What secrets do you seek from ${repo.birthYear}?`);
  }, [repo, initialMode]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  if (!isOpen) return null;

  // Handle Séance Send Message
  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsSending(true);
    setImpMood('communing');
    setImpSpeech('Hush! The spirit is whispering from beyond...');

    try {
      const res = await fetch('/api/ghost/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoId: repo.id,
          messages: messages.map((m) => ({ sender: m.sender, text: m.text })),
          userMessage: query,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const ghostMsg: ChatMessage = {
          id: `ghost-${Date.now()}`,
          sender: 'ghost',
          text: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          ambientTone: data.ambientTone,
        };
        setMessages((prev) => [...prev, ghostMsg]);
        setImpMood('giggling');
        setImpSpeech('Fascinating! The old gods of code still remember!');
      }
    } catch (_err) {
      // Handled
    } finally {
      setIsSending(false);
      setTimeout(() => setImpMood('idle'), 3000);
    }
  };

  // Handle Code Transmutation
  const handleSignPact = async () => {
    setIsTransmuting(true);
    setImpMood('resurrecting');
    setImpSpeech('Burn the legacy callbacks! Blood and ink, resurrect this code!');

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

        confetti({
          particleCount: 60,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#a855f7', '#d946ef', '#f59e0b', '#dc2626'],
        });

        setImpMood('giggling');
        setImpSpeech('Hahaha! The pact is sealed! Pure 2026 perfection!');
      }
    } catch (_err) {
      // Handled
    } finally {
      setIsTransmuting(false);
      setTimeout(() => setImpMood('idle'), 4000);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(modernCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sampleQuestions = [
    `What was developer life like in ${repo.birthYear}?`,
    `Why did you decide to step down?`,
    `What advice do you leave for modern engineers?`,
    `Do you ever miss handling ${repo.peakWeeklyDownloads} requests?`,
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-obsidian-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      
      {/* Ancient Devil's Contract Container */}
      <div className="relative w-full max-w-4xl rounded-3xl bg-[#1b151e] border-2 border-[#7e22ce]/50 shadow-[0_0_60px_rgba(147,51,234,0.3)] overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Ragged / Burnt Parchment Texture Layer */}
        <div
          className="absolute inset-0 pointer-events-none opacity-90"
          style={{
            background: 'radial-gradient(ellipse at 50% 20%, #2a1f33 0%, #150f1b 75%, #0d0912 100%)',
          }}
        />

        {/* Arcane Rune Border Watermark */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-purple-600 to-amber-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-30 p-2 rounded-full bg-obsidian-900/80 hover:bg-red-950 text-calavera-bone border border-purple-500/30 transition-colors shadow-lg"
        >
          <X size={18} />
        </button>

        {/* Contract Header & Imp Companion */}
        <div className="relative z-20 px-6 sm:px-8 pt-6 pb-4 border-b border-purple-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          
          <div className="flex-1 text-center sm:text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-mono mb-2">
              <Scroll size={13} className="text-purple-400" />
              <span>PACTA MORTUORUM • FAUSTIAN CODE CONTRACT</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold font-serif-gothic text-calavera-bone tracking-wide">
              {repo.name} <span className="text-purple-400 text-lg font-mono">({repo.yearsActive})</span>
            </h2>
            <p className="text-xs font-serif italic text-amber-200/80 max-w-xl">
              "{repo.epitaph}"
            </p>
          </div>

          {/* Cute Animated Imp Companion */}
          <div className="flex-shrink-0">
            <ImpCompanion mood={impMood} speechText={impSpeech} />
          </div>

        </div>

        {/* Mode Switcher Pills (Séance vs Resurrection Pact) */}
        <div className="relative z-20 px-6 sm:px-8 py-2.5 bg-obsidian-950/60 border-b border-purple-900/30 flex items-center justify-center sm:justify-start space-x-3">
          <button
            onClick={() => setMode('seance')}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
              mode === 'seance'
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500 shadow-md shadow-purple-900/40'
                : 'text-calavera-aged/60 hover:text-calavera-bone hover:bg-obsidian-900'
            }`}
          >
            <span>👻 Arcane Séance (Commune)</span>
          </button>

          <button
            onClick={() => setMode('resurrection')}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
              mode === 'resurrection'
                ? 'bg-red-600/30 text-red-300 border border-red-500 shadow-md shadow-red-900/40'
                : 'text-calavera-aged/60 hover:text-calavera-bone hover:bg-obsidian-900'
            }`}
          >
            <Wand2 size={13} />
            <span>📜 Pact of Transmutation (Resurrection)</span>
          </button>
        </div>

        {/* Contract Body Area */}
        <div className="relative z-20 flex-1 overflow-y-auto p-5 sm:p-8">
          
          {/* MODE 1: THE ARCANE SÉANCE */}
          {mode === 'seance' && (
            <div className="flex flex-col h-[460px] space-y-4">
              
              {/* Spoken Eulogy Player */}
              <div className="bg-obsidian-950/70 p-3 rounded-2xl border border-purple-500/20 shadow-inner">
                <AudioEulogyPlayer repo={repo} />
              </div>

              {/* Chat Message Scroll */}
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-2">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-gradient-to-r from-purple-700 to-indigo-700 text-calavera-bone font-medium rounded-tr-none shadow-lg'
                          : 'bg-obsidian-950/90 text-amber-100 border border-purple-500/30 rounded-tl-none font-serif shadow-inner'
                      }`}
                    >
                      {msg.sender === 'ghost' && (
                        <div className="flex items-center space-x-1.5 text-xs text-purple-400 font-mono mb-1">
                          <Feather size={12} />
                          <span className="font-bold">Spirit of {repo.name}</span>
                        </div>
                      )}
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>

                    <div className="flex items-center space-x-2 mt-1 px-1 text-[10px] font-mono text-purple-300/50">
                      <span>{msg.timestamp}</span>
                      {msg.ambientTone && <span>• {msg.ambientTone}</span>}
                    </div>
                  </div>
                ))}

                {isSending && (
                  <div className="flex items-center space-x-2 text-purple-400 text-xs font-mono p-3 bg-obsidian-950/80 rounded-2xl border border-purple-500/20 animate-pulse">
                    <Flame size={14} className="text-amber-400 animate-bounce" />
                    <span>Grimmy dips the quill into ink... communing with {repo.name}...</span>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* Prompt Whisper Chips */}
              <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs no-scrollbar">
                <span className="text-[11px] font-mono text-purple-400/60 whitespace-nowrap">Whisper:</span>
                {sampleQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(q)}
                    className="whitespace-nowrap px-3 py-1 rounded-full bg-obsidian-950 hover:bg-purple-900/40 text-purple-300 border border-purple-500/30 text-xs transition-colors"
                  >
                    "{q}"
                  </button>
                ))}
              </div>

              {/* Chat Input Console */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center space-x-3 pt-2 border-t border-purple-900/40"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`Write your question to the spirit of ${repo.name}...`}
                  disabled={isSending}
                  className="flex-1 bg-obsidian-950 text-calavera-bone text-sm px-4 py-2.5 rounded-xl border border-purple-500/40 focus:outline-none focus:border-purple-400 font-mono placeholder-purple-400/40"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isSending}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-calavera-bone font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 shadow-lg shadow-purple-900/40"
                >
                  <Send size={15} />
                </button>
              </form>

            </div>
          )}

          {/* MODE 2: PACT OF TRANSMUTATION */}
          {mode === 'resurrection' && (
            <div className="space-y-6">
              
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-obsidian-950/80 p-4 rounded-2xl border border-red-500/30 shadow-inner">
                <div>
                  <h3 className="text-lg font-bold font-serif-gothic text-red-300">
                    Sacrifice the Legacy • Rebirth into 2026
                  </h3>
                  <p className="text-xs text-calavera-aged/80 font-serif">
                    Sign with blood-ink to transmute deprecated callback architecture into immortal modern code.
                  </p>
                </div>

                <button
                  onClick={handleSignPact}
                  disabled={isTransmuting}
                  className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-calavera-bone font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-red-900/50 transform active:scale-95 disabled:opacity-50"
                >
                  <Feather size={15} />
                  <span>{isTransmuting ? 'Transmuting...' : 'Sign Pact in Blood'}</span>
                </button>
              </div>

              {/* Dual Scrolls Comparison */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                
                {/* Left: The Vintage Deprecation */}
                <div className="flex flex-col rounded-2xl bg-obsidian-950/90 border border-red-500/30 overflow-hidden shadow-inner">
                  <div className="bg-red-950/40 px-4 py-2 border-b border-red-500/20 flex items-center justify-between">
                    <span className="text-xs font-mono text-red-300 font-bold">
                      💀 Legacy Deprecated Syntax ({repo.birthYear})
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-500/30">
                      {repo.vintageSnippet.language}
                    </span>
                  </div>

                  <div className="p-4 flex-1">
                    <textarea
                      value={vintageCode}
                      onChange={(e) => setVintageCode(e.target.value)}
                      rows={12}
                      className="w-full bg-transparent text-red-200 font-mono text-xs leading-relaxed focus:outline-none resize-none"
                      spellCheck={false}
                    />
                  </div>
                </div>

                {/* Right: Modern 2026 Rebirth */}
                <div className="flex flex-col rounded-2xl bg-obsidian-950/90 border border-emerald-500/40 overflow-hidden shadow-inner">
                  <div className="bg-emerald-950/40 px-4 py-2 border-b border-emerald-500/20 flex items-center justify-between">
                    <span className="text-xs font-mono text-emerald-300 font-bold">
                      🌱 Reborn Immortal Architecture (2026)
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                        {repo.modernResurrection.language}
                      </span>
                      <button
                        onClick={handleCopy}
                        className="p-1 rounded text-emerald-400 hover:bg-emerald-900/40 transition-colors"
                        title="Copy modern code"
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

                  <div className="px-4 py-2.5 bg-emerald-950/20 border-t border-emerald-500/20 text-xs font-serif text-emerald-200">
                    <span className="font-bold text-emerald-400 font-mono">Evolution: </span>
                    {explanation}
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* Demonic Wax Seal at Bottom */}
        <div className="relative z-20 px-8 py-3 bg-obsidian-950/90 border-t border-purple-900/50 flex items-center justify-between text-xs font-mono text-purple-400/60">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-red-600 inline-block shadow-[0_0_8px_rgba(220,38,38,0.8)]" />
            <span className="italic">Witnessed by Grimmy • In Nomine Codicis</span>
          </div>

          <span className="text-[11px] text-amber-300/60 font-mono">
            {repo.starsAtSunset.toLocaleString()} Stargazers Resting Here
          </span>
        </div>

      </div>

    </div>
  );
};
