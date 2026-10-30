import React, { useState, useEffect } from 'react';

export type ImpMood = 'idle' | 'communing' | 'resurrecting' | 'giggling';

interface ImpCompanionProps {
  mood?: ImpMood;
  speechText?: string;
  className?: string;
}

export const ImpCompanion: React.FC<ImpCompanionProps> = ({
  mood = 'idle',
  speechText,
  className = '',
}) => {
  const [blinking, setBlinking] = useState(false);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), 200);
    }, 3500);
    return () => clearInterval(blinkInterval);
  }, []);

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      
      {/* Imp Dialogue Speech Bubble */}
      {speechText && (
        <div className="mb-2 max-w-[200px] sm:max-w-[240px] px-3.5 py-1.5 rounded-2xl bg-obsidian-950/95 border border-purple-500/50 text-purple-200 text-xs font-mono shadow-xl backdrop-blur-md relative animate-float">
          <span>{speechText}</span>
          {/* Bubble tail */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-obsidian-950 rotate-45 border-r border-b border-purple-500/50" />
        </div>
      )}

      {/* SVG Imp Figure (Impidimp Inspired) */}
      <div className="relative w-28 h-28 sm:w-32 sm:h-32 filter drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]">
        
        {/* Animated Bat Wings (Behind Body) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full animate-[pulse_2s_infinite]"
          >
            {/* Left Wing */}
            <path
              d="M 32 45 C 10 25, 5 50, 18 65 C 24 55, 30 52, 34 50 Z"
              fill="#581c87"
              stroke="#9333ea"
              strokeWidth="1.5"
              className="origin-[32px_45px] animate-[flicker_1.8s_infinite]"
            />
            {/* Right Wing */}
            <path
              d="M 68 45 C 90 25, 95 50, 82 65 C 76 55, 70 52, 66 50 Z"
              fill="#581c87"
              stroke="#9333ea"
              strokeWidth="1.5"
              className="origin-[68px_45px] animate-[flicker_1.8s_infinite]"
            />
          </svg>
        </div>

        {/* Imp Body & Head */}
        <svg viewBox="0 0 120 120" className="w-full h-full relative z-10">
          
          {/* Pointed Tail */}
          <path
            d="M 60 90 Q 75 105, 88 95 Q 95 90, 92 82 Q 88 90, 80 88"
            fill="none"
            stroke="#6b21a8"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          {/* Tail Arrowhead */}
          <polygon points="90,80 98,82 92,90" fill="#a855f7" />

          {/* Torso */}
          <ellipse cx="60" cy="75" rx="16" ry="18" fill="#3b0764" stroke="#7e22ce" strokeWidth="1.5" />
          <ellipse cx="60" cy="76" rx="9" ry="11" fill="#581c87" />

          {/* Little Hands Holding Quill */}
          <circle cx="48" cy="74" r="4.5" fill="#a855f7" />
          <circle cx="72" cy="74" r="4.5" fill="#a855f7" />

          {/* Feather Quill */}
          <path
            d="M 72 74 Q 90 55, 105 35 Q 98 48, 85 65 Z"
            fill="#d97706"
            stroke="#fbbf24"
            strokeWidth="1"
          />
          {/* Glowing Purple Ink Tip */}
          <circle cx="68" cy="78" r="2.5" fill="#f43f5e" className="animate-ping" />

          {/* Imp Head */}
          <ellipse cx="60" cy="45" rx="22" ry="20" fill="#3b0764" stroke="#9333ea" strokeWidth="2" />

          {/* Spiky Imp Horns */}
          <path
            d="M 45 32 Q 38 12, 44 8 Q 50 16, 52 28 Z"
            fill="#a855f7"
            stroke="#c084fc"
            strokeWidth="1"
          />
          <path
            d="M 75 32 Q 82 12, 76 8 Q 70 16, 68 28 Z"
            fill="#a855f7"
            stroke="#c084fc"
            strokeWidth="1"
          />

          {/* Big Imp Ears */}
          <path d="M 38 42 C 20 40, 16 54, 39 52 Z" fill="#581c87" stroke="#9333ea" strokeWidth="1" />
          <path d="M 82 42 C 100 40, 104 54, 81 52 Z" fill="#581c87" stroke="#9333ea" strokeWidth="1" />

          {/* Glowing Mischievous Eyes */}
          {blinking ? (
            <>
              <line x1="48" y1="45" x2="56" y2="45" stroke="#f472b6" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="64" y1="45" x2="72" y2="45" stroke="#f472b6" strokeWidth="2.5" strokeLinecap="round" />
            </>
          ) : mood === 'giggling' ? (
            <>
              {/* Crescent Laughing Eyes */}
              <path d="M 48 46 Q 52 40, 56 46" fill="none" stroke="#f472b6" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 64 46 Q 68 40, 72 46" fill="none" stroke="#f472b6" strokeWidth="2.5" strokeLinecap="round" />
            </>
          ) : (
            <>
              <ellipse cx="52" cy="44" rx="5" ry="6" fill="#fdf4ff" />
              <ellipse cx="52" cy="44" rx="3" ry="4" fill="#d946ef" />
              <circle cx="53" cy="42" r="1.5" fill="#ffffff" />

              <ellipse cx="68" cy="44" rx="5" ry="6" fill="#fdf4ff" />
              <ellipse cx="68" cy="44" rx="3" ry="4" fill="#d946ef" />
              <circle cx="69" cy="42" r="1.5" fill="#ffffff" />
            </>
          )}

          {/* Mischievous Grin with little fang */}
          <path
            d="M 52 53 Q 60 60, 68 53"
            fill="none"
            stroke="#f472b6"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* Tiny Imp Fang */}
          <polygon points="56,54 59,54 57.5,58" fill="#ffffff" />
        </svg>

        {/* Purple Magic Aura on Resurrecting */}
        {mood === 'resurrecting' && (
          <div className="absolute inset-0 rounded-full bg-purple-500/20 blur-xl animate-pulse pointer-events-none" />
        )}
      </div>

      {/* Imp Title Badge */}
      <div className="mt-1 px-2.5 py-0.5 rounded-full bg-purple-950/80 border border-purple-500/30 text-[10px] font-mono text-purple-300">
        Grimmy • Pact Invigilator
      </div>

    </div>
  );
};
