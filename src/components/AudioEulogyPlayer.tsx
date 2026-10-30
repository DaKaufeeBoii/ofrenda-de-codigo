import React, { useState, useRef, useEffect } from 'react';
import { DepartedRepo } from '../types';
import { Play, Pause, Volume2, Sparkles, Radio } from 'lucide-react';

interface AudioEulogyPlayerProps {
  repo: DepartedRepo;
}

export const AudioEulogyPlayer: React.FC<AudioEulogyPlayerProps> = ({ repo }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Reset audio state when repo changes
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setAudioUrl(null);
    setTranscript(`In memory of ${repo.name}. Born in ${repo.birthYear}, laid to rest in ${repo.deathYear}. "${repo.epitaph}"`);
  }, [repo]);

  const handleTogglePlay = async () => {
    if (isPlaying) {
      if (audioRef.current) audioRef.current.pause();
      window.speechSynthesis?.cancel();
      setIsPlaying(false);
      return;
    }

    if (audioUrl && audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    // Fetch from backend
    setLoading(true);
    try {
      const res = await fetch('/api/eulogy/narrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoId: repo.id }),
      });

      if (res.ok) {
        const data = await res.json();
        setTranscript(data.transcript);

        if (data.audioBase64) {
          setAudioUrl(data.audioBase64);
          const audio = new Audio(data.audioBase64);
          audioRef.current = audio;
          audio.onended = () => setIsPlaying(false);
          audio.play();
          setIsPlaying(true);
        } else {
          // Native solemn Web Speech synthesis fallback
          if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(data.transcript);
            utterance.rate = 0.88;
            utterance.pitch = 0.85; // Solemn, reverent tone
            utterance.onend = () => setIsPlaying(false);
            window.speechSynthesis.speak(utterance);
            setIsPlaying(true);
          }
        }
      }
    } catch (_err) {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl altar-parchment border border-marigold-500/20 p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-5 my-6">
      
      {/* Player info & controls */}
      <div className="flex items-center space-x-4 w-full sm:w-auto">
        <button
          onClick={handleTogglePlay}
          disabled={loading}
          className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-r from-marigold-500 to-amber-600 hover:from-marigold-400 hover:to-amber-500 text-obsidian-950 flex items-center justify-center font-bold shadow-md shadow-marigold-500/30 transition-all transform active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <span className="animate-spin text-sm">🕯️</span>
          ) : isPlaying ? (
            <Pause size={20} />
          ) : (
            <Play size={20} className="ml-0.5" />
          )}
        </button>

        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h4 className="text-sm font-bold font-serif-gothic text-calavera-bone">
              Spoken Memorial Eulogy
            </h4>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-marigold-500/10 text-marigold-400 border border-marigold-500/20">
              🎙️ ElevenLabs Audio
            </span>
          </div>
          <p className="text-xs text-calavera-aged/70 font-serif italic line-clamp-1 mt-0.5">
            "{transcript}"
          </p>
        </div>
      </div>

      {/* Visual Audio Waveform Animation */}
      <div className="flex items-center space-x-1.5 h-6">
        {[40, 70, 30, 90, 60, 100, 45, 80, 50, 65].map((height, i) => (
          <div
            key={i}
            className={`w-1 rounded-full bg-marigold-500/80 transition-all duration-300 ${
              isPlaying ? 'animate-pulse' : 'opacity-30'
            }`}
            style={{
              height: isPlaying ? `${height}%` : '20%',
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>

    </div>
  );
};
