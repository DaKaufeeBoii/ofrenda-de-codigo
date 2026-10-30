import React, { useRef, useEffect, useState } from 'react';
import { DepartedRepo, AltarOffering } from '../types';
import { Compass, Sparkles, PlusCircle, Ghost, Flame, Volume2, VolumeX, Eye } from 'lucide-react';

interface CemeteryGameProps {
  repos: DepartedRepo[];
  offerings: AltarOffering[];
  onInspectRepo: (repo: DepartedRepo, mode?: 'seance' | 'resurrection') => void;
  onOpenSummonModal: () => void;
  onOpenOfferingModal: (repo: DepartedRepo) => void;
}

interface GraveEntity {
  repo: DepartedRepo;
  x: number;
  y: number;
  width: number;
  height: number;
  style: 'cross' | 'monolith' | 'obelisk' | 'celtic';
}

interface SoulWisp {
  id: string;
  repoId: string;
  x: number;
  y: number;
  originX: number;
  originY: number;
  angle: number;
  radius: number;
  speed: number;
  prayer: string;
  author: string;
}

interface FogParticle {
  x: number;
  y: number;
  radius: number;
  speedX: number;
  alpha: number;
}

export const CemeteryGame: React.FC<CemeteryGameProps> = ({
  repos,
  offerings,
  onInspectRepo,
  onOpenSummonModal,
  onOpenOfferingModal,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [nearbyGrave, setNearbyGrave] = useState<DepartedRepo | null>(null);
  const [activeWhisper, setActiveWhisper] = useState<{ text: string; author: string; repo: string } | null>(null);
  const [controlsHint, setControlsHint] = useState(true);

  // World and Player dimensions
  const WORLD_WIDTH = 2200;
  const WORLD_HEIGHT = 1600;

  // Player State
  const playerRef = useRef({
    x: 1100,
    y: 800,
    vx: 0,
    vy: 0,
    speed: 4.2,
    facing: 'down' as 'down' | 'up' | 'left' | 'right',
    walking: false,
    walkCycle: 0,
    targetX: 1100,
    targetY: 800,
  });

  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const gravesRef = useRef<GraveEntity[]>([]);
  const wispsRef = useRef<SoulWisp[]>([]);
  const fogRef = useRef<FogParticle[]>([]);

  // Setup Graves in evocative graveyard layout
  useEffect(() => {
    const graveStyles: ('cross' | 'monolith' | 'obelisk' | 'celtic')[] = ['monolith', 'cross', 'celtic', 'obelisk'];
    
    // Spread graves aesthetically across the cemetery grounds around stone plazas
    const gravePositions = [
      { x: 750, y: 550 },   // request
      { x: 1450, y: 550 },  // moment
      { x: 650, y: 1050 },  // urllib2
      { x: 1550, y: 1050 }, // coffeescript
      { x: 1100, y: 400 },  // bower
      { x: 1100, y: 1200 }, // enzyme
    ];

    const entities: GraveEntity[] = repos.map((repo, idx) => {
      const pos = gravePositions[idx] || {
        x: 400 + ((idx * 330) % 1400),
        y: 350 + Math.floor(idx / 4) * 350,
      };
      return {
        repo,
        x: pos.x,
        y: pos.y,
        width: 70,
        height: 90,
        style: graveStyles[idx % graveStyles.length],
      };
    });

    gravesRef.current = entities;

    // Create Soul Wisps orbiting each grave with real devotee prayers
    const wisps: SoulWisp[] = [];
    entities.forEach((grave, gIdx) => {
      const graveOfferings = offerings.filter((o) => o.repoId === grave.repo.id);
      const prayerCount = Math.max(1, Math.min(3, graveOfferings.length || 1));

      for (let i = 0; i < prayerCount; i++) {
        const off = graveOfferings[i] || {
          message: `Rest in eternal honor, ${grave.repo.name}.`,
          authorName: 'Graveyard Devotee',
        };
        wisps.push({
          id: `wisp-${grave.repo.id}-${i}`,
          repoId: grave.repo.id,
          x: grave.x,
          y: grave.y - 20,
          originX: grave.x,
          originY: grave.y - 30,
          angle: (i * Math.PI * 2) / prayerCount,
          radius: 45 + i * 15,
          speed: 0.015 + (i % 2 === 0 ? 0.005 : -0.005),
          prayer: off.message,
          author: off.authorName,
        });
      }
    });

    wispsRef.current = wisps;

    // Create drifting fog particles
    const fogs: FogParticle[] = [];
    for (let i = 0; i < 40; i++) {
      fogs.push({
        x: Math.random() * WORLD_WIDTH,
        y: Math.random() * WORLD_HEIGHT,
        radius: 120 + Math.random() * 160,
        speedX: 0.2 + Math.random() * 0.35,
        alpha: 0.04 + Math.random() * 0.07,
      });
    }
    fogRef.current = fogs;
  }, [repos, offerings]);

  // Input listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true;
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', ' '].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }

      // Interact with nearby grave
      if ((e.key.toLowerCase() === 'e' || e.key === 'Enter') && nearbyGrave) {
        onInspectRepo(nearbyGrave);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [nearbyGrave, onInspectRepo]);

  // Canvas Click-to-move & Tap
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickScreenX = e.clientX - rect.left;
    const clickScreenY = e.clientY - rect.top;

    // Convert screen coordinates to world coordinates based on camera offset
    const camX = playerRef.current.x - canvas.width / 2;
    const camY = playerRef.current.y - canvas.height / 2;

    const worldClickX = clickScreenX + camX;
    const worldClickY = clickScreenY + camY;

    // Check if clicked directly on a grave
    for (const grave of gravesRef.current) {
      const dist = Math.hypot(worldClickX - grave.x, worldClickY - grave.y);
      if (dist < 60) {
        onInspectRepo(grave.repo);
        return;
      }
    }

    playerRef.current.targetX = worldClickX;
    playerRef.current.targetY = worldClickY;
  };

  // Main 60 FPS Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || 650;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const gameLoop = () => {
      animId = requestAnimationFrame(gameLoop);

      const player = playerRef.current;
      const keys = keysPressed.current;

      // 1. Process Keyboard / Movement Input
      let dx = 0;
      let dy = 0;

      if (keys['w'] || keys['arrowup']) dy -= 1;
      if (keys['s'] || keys['arrowdown']) dy += 1;
      if (keys['a'] || keys['arrowleft']) dx -= 1;
      if (keys['d'] || keys['arrowright']) dx += 1;

      if (dx !== 0 || dy !== 0) {
        // Keyboard drive
        const len = Math.hypot(dx, dy);
        player.vx = (dx / len) * player.speed;
        player.vy = (dy / len) * player.speed;
        player.targetX = player.x;
        player.targetY = player.y;

        if (Math.abs(dx) > Math.abs(dy)) {
          player.facing = dx > 0 ? 'right' : 'left';
        } else {
          player.facing = dy > 0 ? 'down' : 'up';
        }
        player.walking = true;
      } else {
        // Click-to-move drive
        const toTargetX = player.targetX - player.x;
        const toTargetY = player.targetY - player.y;
        const targetDist = Math.hypot(toTargetX, toTargetY);

        if (targetDist > 6) {
          player.vx = (toTargetX / targetDist) * player.speed;
          player.vy = (toTargetY / targetDist) * player.speed;
          if (Math.abs(toTargetX) > Math.abs(toTargetY)) {
            player.facing = toTargetX > 0 ? 'right' : 'left';
          } else {
            player.facing = toTargetY > 0 ? 'down' : 'up';
          }
          player.walking = true;
        } else {
          player.vx = 0;
          player.vy = 0;
          player.walking = false;
        }
      }

      // Update player position with world boundary clamping
      player.x = Math.max(50, Math.min(WORLD_WIDTH - 50, player.x + player.vx));
      player.y = Math.max(50, Math.min(WORLD_HEIGHT - 50, player.y + player.vy));

      if (player.walking) {
        player.walkCycle = (player.walkCycle + 0.18) % (Math.PI * 2);
      }

      // 2. Camera Viewport Tracking (Smooth Lerp Centered on Player)
      const camX = player.x - canvas.width / 2;
      const camY = player.y - canvas.height / 2;

      // 3. Render World
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(-camX, -camY);

      // --- LAYER A: Ground Texture (Earth & Stone Paths) ---
      // Dark gothic soil
      ctx.fillStyle = '#0c0a13';
      ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

      // Cobblestone Crossroad Pathways
      ctx.fillStyle = '#171322';
      // Main horizontal avenue
      ctx.fillRect(100, 760, WORLD_WIDTH - 200, 80);
      // Main vertical avenue
      ctx.fillRect(1060, 100, 80, WORLD_HEIGHT - 200);

      // Secondary stone paths connecting graves
      ctx.fillStyle = '#14101e';
      ctx.fillRect(600, 500, 1000, 40);
      ctx.fillRect(600, 1020, 1000, 40);

      // Ground path stones detail
      ctx.strokeStyle = '#221a30';
      ctx.lineWidth = 1;
      for (let px = 120; px < WORLD_WIDTH - 120; px += 35) {
        ctx.strokeRect(px, 765, 30, 32);
        ctx.strokeRect(px + 15, 802, 30, 32);
      }

      // Cemetery Outer Wrought Iron Fences
      ctx.strokeStyle = '#2b213a';
      ctx.lineWidth = 3;
      ctx.strokeRect(40, 40, WORLD_WIDTH - 80, WORLD_HEIGHT - 80);

      // --- LAYER B: Decorative Dead Trees & Shrines ---
      const deadTrees = [
        { x: 300, y: 300 },
        { x: 1900, y: 300 },
        { x: 300, y: 1300 },
        { x: 1900, y: 1300 },
        { x: 900, y: 700 },
        { x: 1300, y: 700 },
      ];

      deadTrees.forEach((tree) => {
        ctx.fillStyle = '#07050a';
        ctx.beginPath();
        ctx.arc(tree.x, tree.y, 16, 0, Math.PI * 2);
        ctx.fill();

        // Gnarled branches
        ctx.strokeStyle = '#120d1c';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(tree.x, tree.y);
        ctx.lineTo(tree.x - 30, tree.y - 40);
        ctx.lineTo(tree.x - 55, tree.y - 50);
        ctx.moveTo(tree.x, tree.y);
        ctx.lineTo(tree.x + 35, tree.y - 35);
        ctx.lineTo(tree.x + 60, tree.y - 55);
        ctx.stroke();
      });

      // --- LAYER C: Interactive Graves / Tombstones ---
      let currentClosestGrave: DepartedRepo | null = null;
      let minGraveDist = Infinity;

      gravesRef.current.forEach((grave) => {
        const dist = Math.hypot(player.x - grave.x, player.y - grave.y);
        if (dist < minGraveDist && dist < 95) {
          minGraveDist = dist;
          currentClosestGrave = grave.repo;
        }

        // Grave Base Mound
        ctx.fillStyle = '#181224';
        ctx.beginPath();
        ctx.ellipse(grave.x, grave.y + 20, 40, 18, 0, 0, Math.PI * 2);
        ctx.fill();

        // Marigold petals scattered around grave
        ctx.fillStyle = '#f59e0b';
        for (let p = 0; p < 8; p++) {
          const petalX = grave.x + Math.sin(p * 2.3) * 32;
          const petalY = grave.y + 18 + Math.cos(p * 2.3) * 12;
          ctx.beginPath();
          ctx.arc(petalX, petalY, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Steaming coffee mug offering on some graves
        if (grave.repo.offeringsCount > 0) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(grave.x + 22, grave.y + 12, 6, 7);
          ctx.fillStyle = '#92400e';
          ctx.fillRect(grave.x + 23, grave.y + 13, 4, 3);
        }

        // Candles at Grave Base
        const candle1X = grave.x - 24;
        const candle1Y = grave.y + 14;
        const candle2X = grave.x + 24;
        const candle2Y = grave.y + 14;

        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(candle1X, candle1Y, 4, 10);
        ctx.fillRect(candle2X, candle2Y, 4, 10);

        // Flickering Candle Flames
        const flamePulse = Math.sin(Date.now() * 0.008 + grave.x) * 1.5;
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(candle1X + 2, candle1Y - 2, 3 + flamePulse * 0.4, 0, Math.PI * 2);
        ctx.arc(candle2X + 2, candle2Y - 2, 3 - flamePulse * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Headstone Body
        const isTargeted = grave.repo.id === currentClosestGrave?.id;

        ctx.fillStyle = isTargeted ? '#3b2f52' : '#231b32';
        ctx.strokeStyle = isTargeted ? '#f59e0b' : '#3d3056';
        ctx.lineWidth = isTargeted ? 2.5 : 1.5;

        if (grave.style === 'cross') {
          // Celtic / Latin Stone Cross
          ctx.fillRect(grave.x - 10, grave.y - 55, 20, 65);
          ctx.strokeRect(grave.x - 10, grave.y - 55, 20, 65);
          ctx.fillRect(grave.x - 28, grave.y - 42, 56, 16);
          ctx.strokeRect(grave.x - 28, grave.y - 42, 56, 16);
        } else if (grave.style === 'celtic') {
          // Arched Monument
          ctx.beginPath();
          ctx.arc(grave.x, grave.y - 25, 25, Math.PI, 0);
          ctx.lineTo(grave.x + 25, grave.y + 15);
          ctx.lineTo(grave.x - 25, grave.y + 15);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        } else {
          // Classic Rounded Stele Tombstone
          ctx.beginPath();
          ctx.arc(grave.x, grave.y - 20, 22, Math.PI, 0);
          ctx.lineTo(grave.x + 22, grave.y + 15);
          ctx.lineTo(grave.x - 22, grave.y + 15);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }

        // Tombstone Engraved Text
        ctx.fillStyle = isTargeted ? '#fef3c7' : '#9ca3af';
        ctx.font = 'bold 11px Cinzel, serif';
        ctx.textAlign = 'center';
        ctx.fillText(grave.repo.name, grave.x, grave.y - 8);

        ctx.fillStyle = '#6b7280';
        ctx.font = '9px monospace';
        ctx.fillText(grave.repo.yearsActive, grave.x, grave.y + 6);
      });

      setNearbyGrave(currentClosestGrave);

      // --- LAYER D: Floating Soul Wisps (Luminous Orbs) ---
      let touchingWisp: SoulWisp | null = null;

      wispsRef.current.forEach((wisp) => {
        wisp.angle += wisp.speed;
        wisp.x = wisp.originX + Math.cos(wisp.angle) * wisp.radius;
        wisp.y = wisp.originY + Math.sin(wisp.angle) * (wisp.radius * 0.6);

        // Check if player walks into soul wisp
        const dist = Math.hypot(player.x - wisp.x, player.y - wisp.y);
        if (dist < 32 && !touchingWisp) {
          touchingWisp = wisp;
        }

        // Draw Wisp Outer Glow
        const wispGrad = ctx.createRadialGradient(wisp.x, wisp.y, 1, wisp.x, wisp.y, 16);
        wispGrad.addColorStop(0, 'rgba(217, 70, 239, 0.9)');
        wispGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.4)');
        wispGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');

        ctx.fillStyle = wispGrad;
        ctx.beginPath();
        ctx.arc(wisp.x, wisp.y, 16, 0, Math.PI * 2);
        ctx.fill();

        // Wisp Core
        ctx.fillStyle = '#fdf4ff';
        ctx.beginPath();
        ctx.arc(wisp.x, wisp.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      });

      if (touchingWisp) {
        const found = touchingWisp as SoulWisp;
        setActiveWhisper({
          text: found.prayer,
          author: found.author,
          repo: found.repoId,
        });
      }

      // --- LAYER E: Player Character (Cloaked Developer with Lantern) ---
      const bob = Math.sin(player.walkCycle) * 2;

      // Cloak Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.ellipse(player.x, player.y + 14, 14, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cloak Body
      ctx.fillStyle = '#2e1065'; // Deep dark purple robe
      ctx.beginPath();
      ctx.moveTo(player.x - 12, player.y + 12);
      ctx.lineTo(player.x, player.y - 12 + bob);
      ctx.lineTo(player.x + 12, player.y + 12);
      ctx.closePath();
      ctx.fill();

      // Cloak Hood
      ctx.fillStyle = '#4c1d95';
      ctx.beginPath();
      ctx.arc(player.x, player.y - 12 + bob, 9, 0, Math.PI * 2);
      ctx.fill();

      // Glowing Eyes in Shadow of Hood
      ctx.fillStyle = '#f59e0b';
      if (player.facing === 'down') {
        ctx.fillRect(player.x - 3, player.y - 12 + bob, 2, 2);
        ctx.fillRect(player.x + 2, player.y - 12 + bob, 2, 2);
      } else if (player.facing === 'left') {
        ctx.fillRect(player.x - 5, player.y - 12 + bob, 2, 2);
      } else if (player.facing === 'right') {
        ctx.fillRect(player.x + 4, player.y - 12 + bob, 2, 2);
      }

      // Lantern Position
      let lanternX = player.x + (player.facing === 'left' ? -16 : 16);
      let lanternY = player.y + 2 + bob;

      // Draw Golden Lantern
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(lanternX - 4, lanternY - 4, 8, 10);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(lanternX - 3, lanternY - 3, 6, 8);

      ctx.restore();

      // --- LAYER F: Dynamic Lantern Light Falloff (Fog of War) ---
      // Creates real dark cemetery ambiance where only lantern illuminates surroundings
      const screenPlayerX = player.x - camX;
      const screenPlayerY = player.y - camY;

      const darkMask = ctx.createRadialGradient(
        screenPlayerX,
        screenPlayerY,
        40,
        screenPlayerX,
        screenPlayerY,
        340
      );
      darkMask.addColorStop(0, 'rgba(7, 5, 13, 0)');
      darkMask.addColorStop(0.5, 'rgba(7, 5, 13, 0.45)');
      darkMask.addColorStop(1, 'rgba(7, 5, 13, 0.95)');

      ctx.fillStyle = darkMask;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // --- LAYER G: Drifting Midnight Fog Clouds ---
      fogRef.current.forEach((fog) => {
        fog.x += fog.speedX;
        if (fog.x > WORLD_WIDTH + 100) fog.x = -150;

        const screenFogX = fog.x - camX;
        const screenFogY = fog.y - camY;

        if (screenFogX > -200 && screenFogX < canvas.width + 200 && screenFogY > -200 && screenFogY < canvas.height + 200) {
          const fogGrad = ctx.createRadialGradient(screenFogX, screenFogY, 10, screenFogX, screenFogY, fog.radius);
          fogGrad.addColorStop(0, `rgba(168, 85, 247, ${fog.alpha})`);
          fogGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

          ctx.fillStyle = fogGrad;
          ctx.beginPath();
          ctx.arc(screenFogX, screenFogY, fog.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    };

    gameLoop();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <div className="relative w-full h-[620px] sm:h-[680px] rounded-3xl overflow-hidden border-2 border-purple-900/60 shadow-[0_0_50px_rgba(88,28,135,0.4)] bg-obsidian-950 select-none">
      
      {/* 2.5D Canvas */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full h-full cursor-crosshair block"
      />

      {/* Top Left: Cemetery Atmosphere HUD */}
      <div className="absolute top-5 left-5 z-20 pointer-events-none flex flex-col space-y-2">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-obsidian-950/85 backdrop-blur-md border border-purple-500/40 text-purple-300 text-xs font-mono shadow-xl">
          <Ghost size={14} className="text-purple-400 animate-pulse" />
          <span>NECROPOLIS OF DEPARTED CODE • 2.5D GRAVEYARD</span>
        </div>

        {controlsHint && (
          <div className="px-3 py-1 rounded-xl bg-obsidian-950/70 border border-purple-900/40 text-[11px] font-mono text-calavera-aged/70 max-w-xs">
            🎮 <strong>WASD / Arrow Keys</strong> to roam • Click anywhere to walk • Approach a grave to commune
          </div>
        )}
      </div>

      {/* Top Right: Summon Custom Grave & Controls */}
      <div className="absolute top-5 right-5 z-20 flex items-center space-x-3">
        <button
          onClick={onOpenSummonModal}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-calavera-bone text-xs font-mono font-bold shadow-lg shadow-purple-950/60 border border-purple-400/40 transition-all transform active:scale-95"
        >
          <PlusCircle size={15} />
          <span>Summon Grave</span>
        </button>
      </div>

      {/* Bottom Center: Interaction Prompt (When Near Tombstone) */}
      {nearbyGrave && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center animate-fade-in pointer-events-auto">
          <div className="px-6 py-3 rounded-2xl bg-obsidian-950/90 backdrop-blur-lg border-2 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.5)] flex items-center space-x-4">
            
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-xl">
              🪦
            </div>

            <div className="text-left">
              <div className="flex items-center space-x-2">
                <h4 className="text-base font-bold font-serif-gothic text-calavera-bone">
                  {nearbyGrave.name}
                </h4>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                  {nearbyGrave.yearsActive}
                </span>
              </div>
              <p className="text-xs text-amber-200/70 font-mono">
                ★ {nearbyGrave.starsAtSunset.toLocaleString()} Stargazers • {nearbyGrave.peakWeeklyDownloads}
              </p>
            </div>

            {/* Inspect / Contract Buttons */}
            <div className="flex items-center space-x-2 pl-2 border-l border-amber-500/30">
              <button
                onClick={() => onInspectRepo(nearbyGrave, 'seance')}
                className="flex items-center space-x-1 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-obsidian-950 font-bold text-xs font-mono uppercase tracking-wider transition-all transform active:scale-95 shadow-md"
              >
                <span>[E] Commune</span>
              </button>

              <button
                onClick={() => onInspectRepo(nearbyGrave, 'resurrection')}
                className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-purple-900/60 hover:bg-purple-800 text-purple-200 text-xs font-mono font-medium border border-purple-500/40 transition-colors"
                title="Open Code Resurrection Chamber"
              >
                <Sparkles size={13} className="text-purple-300" />
                <span>Resurrect</span>
              </button>

              <button
                onClick={() => onOpenOfferingModal(nearbyGrave)}
                className="p-2 rounded-xl bg-obsidian-900 hover:bg-obsidian-800 text-amber-400 border border-amber-500/30 transition-colors"
                title="Leave an offering at this grave"
              >
                <Flame size={15} />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Floating Soul Wisp Prayer Whisper Notification */}
      {activeWhisper && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 max-w-md w-full px-4 animate-fade-in">
          <div className="p-4 rounded-2xl bg-purple-950/95 backdrop-blur-md border border-purple-500/60 shadow-[0_0_25px_rgba(168,85,247,0.4)] flex items-start space-x-3 text-left">
            <span className="text-xl animate-pulse">✨</span>
            <div className="flex-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-purple-300 mb-1">
                <span>Soul Whisper at {activeWhisper.repo}'s Grave</span>
                <button
                  onClick={() => setActiveWhisper(null)}
                  className="text-purple-400/60 hover:text-purple-200"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs font-serif italic text-purple-100 leading-relaxed">
                "{activeWhisper.text}"
              </p>
              <span className="block text-[10px] font-mono text-purple-400/70 mt-1">
                — Devotee {activeWhisper.author}
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
