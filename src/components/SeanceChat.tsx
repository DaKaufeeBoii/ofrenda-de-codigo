import React, { useState, useRef, useEffect } from 'react';
import { DepartedRepo, ChatMessage } from '../types';
import { Send, Terminal, Sparkles, RefreshCw, Radio } from 'lucide-react';

interface SeanceChatProps {
  repo: DepartedRepo;
}

export const SeanceChat: React.FC<SeanceChatProps> = ({ repo }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'ghost',
      text: `Greetings, developer. I am the departed spirit of ${repo.name} (${repo.yearsActive}). My commits have ceased, but my memory remains etched in the registries. What brings you to commune with me today?`,
      timestamp: new Date().toLocaleTimeString(),
      ambientTone: 'Communed via Google Gemma 2',
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset conversation when repo changes
    setMessages([
      {
        id: `init-${repo.id}`,
        sender: 'ghost',
        text: `The candlelight flickers... the spirit of ${repo.name} awakens. "Between ${repo.birthYear} and ${repo.deathYear}, I powered millions of builds. What would you ask of my time?"`,
        timestamp: new Date().toLocaleTimeString(),
        ambientTone: 'Gemma 2 Spiritual Link Established',
      },
    ]);
  }, [repo]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isSending) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsSending(true);

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
          timestamp: new Date().toLocaleTimeString(),
          ambientTone: data.ambientTone || 'Communed via Google Gemma 2',
        };
        setMessages((prev) => [...prev, ghostMsg]);
      } else {
        throw new Error('Séance disrupted');
      }
    } catch (_err) {
      const fallbackMsg: ChatMessage = {
        id: `ghost-err-${Date.now()}`,
        sender: 'ghost',
        text: `*The static clears...* "The connection through the veil wavers, but know that our work was not in vain. Remember us by writing clean, fearless code."`,
        timestamp: new Date().toLocaleTimeString(),
        ambientTone: 'Static on the Latent Veil',
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const sampleQuestions = [
    `Why did you decide to sunset?`,
    `What was developer life like in ${repo.birthYear}?`,
    `Do you ever miss handling ${repo.peakWeeklyDownloads} weekly requests?`,
    `What advice do you leave for modern engineers?`,
  ];

  return (
    <div className="rounded-2xl altar-parchment border border-marigold-500/30 overflow-hidden shadow-2xl flex flex-col h-[650px] relative">
      
      {/* Terminal Header */}
      <div className="bg-obsidian-950/90 border-b border-marigold-500/20 px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex space-x-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-amber-500/60" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
          </div>
          <div className="flex items-center space-x-2 text-xs font-mono text-calavera-bone">
            <Terminal size={14} className="text-marigold-400" />
            <span>seance://veil/{repo.id}.ghost</span>
            <span className="hidden sm:inline-block text-marigold-500/60">● [SOVEREIGN OPEN WEIGHTS]</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-marigold-400">
          <Radio size={14} className="animate-pulse" />
          <span className="hidden sm:inline">Gemma 2 Telepathic Link</span>
        </div>
      </div>

      {/* Messages Scroll Area with Subtle CRT Scanline */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 crt-overlay">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-r from-amber-600 to-marigold-600 text-obsidian-950 font-medium rounded-tr-none shadow-md'
                  : 'bg-obsidian-900/90 text-calavera-bone border border-marigold-500/30 rounded-tl-none font-serif shadow-inner'
              }`}
            >
              {msg.sender === 'ghost' && (
                <div className="flex items-center space-x-1.5 text-xs text-marigold-400/90 font-mono mb-1.5">
                  <span className="text-sm">👻</span>
                  <span className="font-bold">{repo.name} (Spirit)</span>
                </div>
              )}
              <p className="whitespace-pre-wrap">{msg.text}</p>
            </div>

            <div className="flex items-center space-x-2 mt-1 px-1 text-[10px] font-mono text-calavera-aged/60">
              <span>{msg.timestamp}</span>
              {msg.ambientTone && (
                <>
                  <span>•</span>
                  <span className="text-amber-400/80">{msg.ambientTone}</span>
                </>
              )}
            </div>
          </div>
        ))}

        {isSending && (
          <div className="flex flex-col items-start">
            <div className="bg-obsidian-900/90 text-calavera-bone border border-marigold-500/30 rounded-2xl rounded-tl-none px-4 py-3 text-sm">
              <div className="flex items-center space-x-2 text-marigold-400 font-mono text-xs">
                <span className="animate-spin">🕯️</span>
                <span>The spirit of {repo.name} stirs across the latent space...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div className="px-4 py-2 bg-obsidian-950/80 border-t border-marigold-500/10 flex items-center space-x-2 overflow-x-auto no-scrollbar text-xs">
        <span className="text-calavera-aged/60 font-mono text-[11px] whitespace-nowrap">Whisper:</span>
        {sampleQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            className="whitespace-nowrap px-3 py-1 rounded-full bg-obsidian-900 hover:bg-marigold-500/20 text-marigold-300 border border-marigold-500/20 text-xs transition-colors"
          >
            "{q}"
          </button>
        ))}
      </div>

      {/* Input Console */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="p-3 sm:p-4 bg-obsidian-950 border-t border-marigold-500/20 flex items-center space-x-3"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Speak to the spirit of ${repo.name}...`}
          disabled={isSending}
          className="flex-1 bg-obsidian-900/90 text-calavera-bone placeholder-calavera-aged/40 px-4 py-2.5 rounded-xl border border-marigold-500/30 focus:outline-none focus:border-marigold-500 font-mono text-sm"
        />
        <button
          type="submit"
          disabled={!input.trim() || isSending}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-marigold-500 to-amber-600 hover:from-marigold-400 hover:to-amber-500 text-obsidian-950 font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-marigold-500/20"
        >
          <Send size={16} />
        </button>
      </form>

    </div>
  );
};
