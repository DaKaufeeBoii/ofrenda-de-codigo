import React, { useRef, useEffect, useState } from 'react';
import { DepartedRepo, AltarOffering } from '../types';
import { Ghost, Flame, Sparkles, Scroll, PlusCircle, Volume2, VolumeX, MapPin, Eye, Compass } from 'lucide-react';

interface CemeteryWorldProps {
  repos: DepartedRepo[];
  offerings: AltarOffering[];
  onOpenContract: (repo: DepartedRepo, mode?: 'seance' | 'resurrection') => void;
  onOpen3DAltar: (repo: DepartedRepo) => void;
  onOpenOfferingsWall: () => void;
  onOpenSummonModal: () => void;
  onOpenOfferingModal: (repo: DepartedRepo) => void;
  ambientSound: boolean;
  onToggleSound: () => void;
}

interface Landmark {
  id: string;
  name: string;
  x: number;
  y: number;
  radius: number;
  type: 'central-altar' | 'memorial-wall' | 'summon-gate' | 'grave';
  repo?: DepartedRepo;
}

interface SoulWisp {
  id: string;
  x: number;
  y: number;
  originX: number;
  originY: number;
  angle: number;
  radius: number;
  speed: number;
  prayer: string;
  author: string;
  repoName: string;
}

interface FogParticle {
  x: number;
  y: number;
  radius: number;
  speedX: number;
  alpha: number;
}

export const CemeteryWorld: React.FC<CemeteryWorldProps> = ({
  repos,
  offerings,
  onOpenContract,
  onOpen3DAltar,
  onOpenOfferingsWall,
  onOpenSummonModal,
  onOpenOfferingModal,
  ambientSound,
  onToggleSound,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [activePrompt, setActivePrompt] = useState<{
    text: string;
    subtext: string;
    action: () => void;
    secondaryAction?: () => void;
    secondaryText?: string;
  } | null>(null);

  const [activeWhisper, setActiveWhisper] = useState<{ text: string; author: string; repo: string } | null>(null);
  const [directoryOpen, setDirectoryOpen] = useState(false);

  // Map Dimensions
  const WORLD_WIDTH = 2400;
  const WORLD_HEIGHT = 1800;

  // Player State
  const playerRef = useRef({
    x: 1200,
    y: 1050,
    vx: 0,
    vy: 0,
    speed: 4.4,
    facing: 'up' as 'down' | 'up' | 'left' | 'right',
    walking: false,
    walkCycle: 0,
    targetX: 1200,
    targetY: 1050,
  });

  const keysPressed = useRef<{ [key: string]: boolean }>({});
  const landmarksRef = useRef<Landmark[]>([]);
  const wispsRef = useRef<SoulWisp[]>([]);
  const fogRef = useRef<FogParticle[]>([]);

  // Setup World Landmarks
  useEffect(() => {
    const list: Landmark[] = [];

    // 1. Central 3D Candle Shrine / Mausoleum of Eternal Flame
    list.push({
      id: 'central-altar',
      name: 'The Grand Candle Altar (Eternal Sanctuary)',
      x: 1200,
      y: 850,
      radius: 95,
      type: 'central-altar',
    });

    // 2. Devotee Memorial Wall (Weeping Wall of Code)
    list.push({
      id: 'memorial-wall',
      name: 'The Devotee Memorial Shrine',
      x: 650,
      y: 500,
      radius: 80,
      type: 'memorial-wall',
    });

    // 3. Summoning Portal (The Gateway to the Living)
    list.push({
      id: 'summon-gate',
      name: 'The Summoning Obelisk',
      x: 1750,
      y: 500,
      radius: 80,
      type: 'summon-gate',
    });

    // 4. Grave Placements
    const graveCoords = [
      { x: 800, y: 700 },   // request
      { x: 1600, y: 700 },  // moment
      { x: 700, y: 1200 },  // urllib2
      { x: 1700, y: 1200 }, // coffeescript
      { x: 1200, y: 480 },  // bower
      { x: 1200, y: 1400 }, // enzyme
    ];

    repos.forEach((repo, idx) => {
      const pos = graveCoords[idx] || {
        x: 450 + ((idx * 380) % 1500),
        y: 400 + Math.floor(idx / 4) * 450,
      };
      list.push({
        id: `grave-${repo.id}`,
        name: `${repo.name} Tombstone (${repo.yearsActive})`,
        x: pos.x,
        y: pos.y,
        radius: 75,
        type: 'grave',
        repo,
      });
    });

    landmarksRef.current = list;

    // Generate Soul Wisps from Devotee Offerings
    const wisps: SoulWisp[] = [];
    list.forEach((lm) => {
      if (lm.type === 'grave' && lm.repo) {
        const graveOfferings = offerings.filter((o) => o.repoId === lm.repo?.id);
        const count = Math.max(1, Math.min(3, graveOfferings.length || 1));

        for (let i = 0; i < count; i++) {
          const off = graveOfferings[i] || {
            message: `Honor and remembrance to ${lm.repo.name}.`,
            authorName: 'Graveyard Traveler',
          };
          wisps.push({
            id: `wisp-${lm.repo.id}-${i}`,
            x: lm.x,
            y: lm.y - 20,
            originX: lm.x,
            originY: lm.y - 25,
            angle: (i * Math.PI * 2) / count,
            radius: 40 + i * 18,
            speed: 0.015 + (i % 2 === 0 ? 0.005 : -0.005),
            prayer: off.message,
            author: off.authorName,
            repoName: lm.repo.name,
          });
        }
      }
    });

    wispsRef.current = wisps;

    // Drifting Fog Particles
    const fogs: FogParticle[] = [];
    for (let i = 0; i < 45; i++) {
      fogs.push({
        x: Math.random() * WORLD_WIDTH,
        y: Math.random() * WORLD_HEIGHT,
        radius: 130 + Math.random() * 180,
        speedX: 0.2 + Math.random() * 0.35,
        alpha: 0.04 + Math.random() * 0.06,
      });
    }
    fogRef.current = fogs;
  }, [repos, offerings]);

  // Input Listeners (Keyboard)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true;

      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', ' '].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }

      // Action Key E / Enter
      if ((e.key.toLowerCase() === 'e' || e.key === 'Enter') && activePrompt) {
        activePrompt.action();
      }

      // Fast-key R for Secondary Action (Resurrect)
      if (e.key.toLowerCase() === 'r' && activePrompt?.secondaryAction) {
        activePrompt.secondaryAction();
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
  }, [activePrompt]);

  // Canvas Click / Tap to move
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const camX = playerRef.current.x - canvas.width / 2;
    const camY = playerRef.current.y - canvas.height / 2;

    const worldX = screenX + camX;
    const worldY = screenY + camY;

    // Check if clicked directly on a landmark
    for (const lm of landmarksRef.current) {
      const dist = Math.hypot(worldX - lm.x, worldY - lm.y);
      if (dist < lm.radius) {
        if (lm.type === 'central-altar' && repos.length > 0) {
          onOpen3DAltar(repos[0]);
          return;
        } else if (lm.type === 'memorial-wall') {
          onOpenOfferingsWall();
          return;
        } else if (lm.type === 'summon-gate') {
          onOpenSummonModal();
          return;
        } else if (lm.type === 'grave' && lm.repo) {
          onOpenContract(lm.repo);
          return;
        }
      }
    }

    playerRef.current.targetX = worldX;
    playerRef.current.targetY = worldY;
  };

  // Main 60 FPS Engine Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const gameLoop = () => {
      animId = requestAnimationFrame(gameLoop);

      const player = playerRef.current;
      const keys = keysPressed.current;

      // 1. Player Velocity
      let dx = 0;
      let dy = 0;

      if (keys['w'] || keys['arrowup']) dy -= 1;
      if (keys['s'] || keys['arrowdown']) dy += 1;
      if (keys['a'] || keys['arrowleft']) dx -= 1;
      if (keys['d'] || keys['arrowright']) dx += 1;

      if (dx !== 0 || dy !== 0) {
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
        const toX = player.targetX - player.x;
        const toY = player.targetY - player.y;
        const dist = Math.hypot(toX, toY);

        if (dist > 6) {
          player.vx = (toX / dist) * player.speed;
          player.vy = (toY / dist) * player.speed;
          if (Math.abs(toX) > Math.abs(toY)) {
            player.facing = toX > 0 ? 'right' : 'left';
          } else {
            player.facing = toY > 0 ? 'down' : 'up';
          }
          player.walking = true;
        } else {
          player.vx = 0;
          player.vy = 0;
          player.walking = false;
        }
      }

      player.x = Math.max(70, Math.min(WORLD_WIDTH - 70, player.x + player.vx));
      player.y = Math.max(70, Math.min(WORLD_HEIGHT - 70, player.y + player.vy));

      if (player.walking) {
        player.walkCycle = (player.walkCycle + 0.18) % (Math.PI * 2);
      }

      // Camera Offset
      const camX = player.x - canvas.width / 2;
      const camY = player.y - canvas.height / 2;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(-camX, -camY);

      // --- LAYER 1: Ground & Gothic Cemetery Crossroads ---
      ctx.fillStyle = '#08060e';
      ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

      // Main Crossroad Avenue Paths
      ctx.fillStyle = '#14101e';
      // Center Plaza
      ctx.beginPath();
      ctx.arc(1200, 850, 180, 0, Math.PI * 2);
      ctx.fill();

      // Horizontal avenue
      ctx.fillRect(100, 810, WORLD_WIDTH - 200, 80);
      // Vertical avenue
      ctx.fillRect(1160, 100, 80, WORLD_HEIGHT - 200);

      // Secondary cobblestone arteries
      ctx.fillStyle = '#110d19';
      ctx.fillRect(500, 480, 1400, 45);
      ctx.fillRect(500, 1180, 1400, 45);

      // Cobblestone outline details
      ctx.strokeStyle = '#221932';
      ctx.lineWidth = 1;
      for (let px = 140; px < WORLD_WIDTH - 140; px += 40) {
        ctx.strokeRect(px, 815, 36, 32);
        ctx.strokeRect(px + 18, 852, 36, 32);
      }

      // Iron Gothic Perimeter Fences
      ctx.strokeStyle = '#281c3b';
      ctx.lineWidth = 4;
      ctx.strokeRect(50, 50, WORLD_WIDTH - 100, WORLD_HEIGHT - 100);

      // --- LAYER 2: Cemetery Landmarks ---
      let nearestPrompt: {
        text: string;
        subtext: string;
        action: () => void;
        secondaryAction?: () => void;
        secondaryText?: string;
      } | null = null;
      let minDistance = Infinity;

      landmarksRef.current.forEach((lm) => {
        const dist = Math.hypot(player.x - lm.x, player.y - lm.y);

        if (lm.type === 'central-altar') {
          // --- THE GRAND 3D CANDLE SANCTUARY / MAUSOLEUM ---
          // Glowing stone platform
          const altarGlow = ctx.createRadialGradient(lm.x, lm.y, 10, lm.x, lm.y, 120);
          altarGlow.addColorStop(0, 'rgba(245, 158, 11, 0.45)');
          altarGlow.addColorStop(0.5, 'rgba(234, 88, 12, 0.2)');
          altarGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = altarGlow;
          ctx.beginPath();
          ctx.arc(lm.x, lm.y, 120, 0, Math.PI * 2);
          ctx.fill();

          // Tiered Stone Monument Base
          ctx.fillStyle = '#1c152a';
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(lm.x, lm.y, 75, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Inner Marigold Ring
          ctx.fillStyle = '#f59e0b';
          for (let p = 0; p < 18; p++) {
            const angle = (p * Math.PI * 2) / 18;
            ctx.beginPath();
            ctx.arc(lm.x + Math.cos(angle) * 58, lm.y + Math.sin(angle) * 58, 3.5, 0, Math.PI * 2);
            ctx.fill();
          }

          // Burning Candelabra Center
          ctx.fillStyle = '#fef3c7';
          ctx.fillRect(lm.x - 12, lm.y - 15, 6, 20);
          ctx.fillRect(lm.x - 2, lm.y - 25, 6, 30);
          ctx.fillRect(lm.x + 8, lm.y - 15, 6, 20);

          // Candle Flames with dynamic flicker
          const flamePulse = Math.sin(Date.now() * 0.009) * 2;
          ctx.fillStyle = '#ffaa00';
          ctx.beginPath();
          ctx.arc(lm.x - 9, lm.y - 20, 5 + flamePulse * 0.4, 0, Math.PI * 2);
          ctx.arc(lm.x + 1, lm.y - 30, 7 + flamePulse * 0.5, 0, Math.PI * 2);
          ctx.arc(lm.x + 11, lm.y - 20, 5 - flamePulse * 0.4, 0, Math.PI * 2);
          ctx.fill();

          // Central Label
          ctx.fillStyle = '#fef3c7';
          ctx.font = 'bold 12px Cinzel, serif';
          ctx.textAlign = 'center';
          ctx.fillText('3D CANDLE SANCTUARY', lm.x, lm.y + 28);
          ctx.fillStyle = '#d97706';
          ctx.font = '9px monospace';
          ctx.fillText('Altar of Eternal Flame', lm.x, lm.y + 42);

          if (dist < 110 && dist < minDistance) {
            minDistance = dist;
            nearestPrompt = {
              text: '[E] Enter 3D Candle Sanctuary',
              subtext: 'Light 3D candles with real WebGL wax physics and hear cathedral echoes',
              action: () => {
                if (repos.length > 0) onOpen3DAltar(repos[0]);
              },
            };
          }

        } else if (lm.type === 'memorial-wall') {
          // --- THE DEVOTEE MEMORIAL SHRINE (WEEPING WALL) ---
          ctx.fillStyle = '#1c152a';
          ctx.strokeStyle = '#9333ea';
          ctx.lineWidth = 2;
          ctx.fillRect(lm.x - 65, lm.y - 30, 130, 60);
          ctx.strokeRect(lm.x - 65, lm.y - 30, 130, 60);

          // Inscribed prayer tablets
          ctx.fillStyle = '#a855f7';
          ctx.font = 'bold 11px Cinzel, serif';
          ctx.textAlign = 'center';
          ctx.fillText('DEVOTEE SHRINE', lm.x, lm.y - 6);
          ctx.fillStyle = '#c084fc';
          ctx.font = '9px monospace';
          ctx.fillText('Weeping Wall of Prayers', lm.x, lm.y + 10);
          ctx.fillText(`🏵️ ${offerings.length} Offerings Resting`, lm.x, lm.y + 22);

          if (dist < 100 && dist < minDistance) {
            minDistance = dist;
            nearestPrompt = {
              text: '[E] Read Devotee Prayers & Offerings',
              subtext: 'Read the memorial wall of community prayers or leave your offering',
              action: onOpenOfferingsWall,
            };
          }

        } else if (lm.type === 'summon-gate') {
          // --- THE SUMMONING OBELISK (GATEWAY TO GITHUB) ---
          ctx.fillStyle = '#171126';
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(lm.x, lm.y, 45, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Occult Runic Circle
          const pulse = Math.sin(Date.now() * 0.005) * 3;
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(lm.x, lm.y, 35 + pulse, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = '#7dd3fc';
          ctx.font = 'bold 10px Cinzel, serif';
          ctx.textAlign = 'center';
          ctx.fillText('SUMMONING GATE', lm.x, lm.y - 2);
          ctx.fillStyle = '#38bdf8';
          ctx.font = '8px monospace';
          ctx.fillText('Erect New Grave from URL', lm.x, lm.y + 12);

          if (dist < 90 && dist < minDistance) {
            minDistance = dist;
            nearestPrompt = {
              text: '[E] Summon a New Grave from GitHub',
              subtext: 'Paste any GitHub repo to summon a tombstone with live stars & commits',
              action: onOpenSummonModal,
            };
          }

        } else if (lm.type === 'grave' && lm.repo) {
          // --- TOMBSTONE MONUMENTS ---
          const isTargeted = dist < 90;

          // Mound
          ctx.fillStyle = '#150f22';
          ctx.beginPath();
          ctx.ellipse(lm.x, lm.y + 18, 42, 16, 0, 0, Math.PI * 2);
          ctx.fill();

          // Physical Offerings at Base
          // Marigold petals
          ctx.fillStyle = '#f59e0b';
          for (let p = 0; p < 7; p++) {
            ctx.beginPath();
            ctx.arc(lm.x + Math.sin(p * 2.4) * 32, lm.y + 16 + Math.cos(p * 2.4) * 10, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }

          // Glowing Candle on grave
          ctx.fillStyle = '#fef3c7';
          ctx.fillRect(lm.x - 22, lm.y + 10, 4, 10);
          ctx.fillRect(lm.x + 22, lm.y + 10, 4, 10);
          ctx.fillStyle = '#ffaa00';
          ctx.beginPath();
          ctx.arc(lm.x - 20, lm.y - 4, 3.5, 0, Math.PI * 2);
          ctx.arc(lm.x + 24, lm.y - 4, 3.5, 0, Math.PI * 2);
          ctx.fill();

          // Tombstone Body
          ctx.fillStyle = isTargeted ? '#3b2854' : '#221932';
          ctx.strokeStyle = isTargeted ? '#f59e0b' : '#473663';
          ctx.lineWidth = isTargeted ? 2.5 : 1.5;

          ctx.beginPath();
          ctx.arc(lm.x, lm.y - 22, 24, Math.PI, 0);
          ctx.lineTo(lm.x + 24, lm.y + 14);
          ctx.lineTo(lm.x - 24, lm.y + 14);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Engraved Name & Year
          ctx.fillStyle = isTargeted ? '#fef3c7' : '#9ca3af';
          ctx.font = 'bold 11px Cinzel, serif';
          ctx.textAlign = 'center';
          ctx.fillText(lm.repo.name, lm.x, lm.y - 8);

          ctx.fillStyle = '#8b5cf6';
          ctx.font = '9px monospace';
          ctx.fillText(lm.repo.yearsActive, lm.x, lm.y + 6);

          if (dist < 90 && dist < minDistance) {
            minDistance = dist;
            nearestPrompt = {
              text: `[E] Commune with ${lm.repo.name}`,
              subtext: `Speak with the spirit via Gemma 2 or sign the Pact of Transmutation`,
              action: () => onOpenContract(lm.repo!, 'seance'),
              secondaryAction: () => onOpenContract(lm.repo!, 'resurrection'),
              secondaryText: '[R] Resurrect Code',
            };
          }
        }
      });

      setActivePrompt(nearestPrompt);

      // --- LAYER 3: Floating Soul Wisps ---
      let touchingWisp: SoulWisp | null = null;

      wispsRef.current.forEach((wisp) => {
        wisp.angle += wisp.speed;
        wisp.x = wisp.originX + Math.cos(wisp.angle) * wisp.radius;
        wisp.y = wisp.originY + Math.sin(wisp.angle) * (wisp.radius * 0.65);

        const wDist = Math.hypot(player.x - wisp.x, player.y - wisp.y);
        if (wDist < 35 && !touchingWisp) {
          touchingWisp = wisp;
        }

        const glow = ctx.createRadialGradient(wisp.x, wisp.y, 1, wisp.x, wisp.y, 18);
        glow.addColorStop(0, 'rgba(217, 70, 239, 0.95)');
        glow.addColorStop(0.5, 'rgba(168, 85, 247, 0.4)');
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(wisp.x, wisp.y, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(wisp.x, wisp.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      });

      if (touchingWisp) {
        const found = touchingWisp as SoulWisp;
        setActiveWhisper({
          text: found.prayer,
          author: found.author,
          repo: found.repoName,
        });
      }

      // --- LAYER 4: Player Necromancer with Lantern ---
      const bob = Math.sin(player.walkCycle) * 2.5;

      // Cloak Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.ellipse(player.x, player.y + 14, 15, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Robe
      ctx.fillStyle = '#2e1065';
      ctx.beginPath();
      ctx.moveTo(player.x - 13, player.y + 14);
      ctx.lineTo(player.x, player.y - 14 + bob);
      ctx.lineTo(player.x + 13, player.y + 14);
      ctx.closePath();
      ctx.fill();

      // Hood
      ctx.fillStyle = '#581c87';
      ctx.beginPath();
      ctx.arc(player.x, player.y - 14 + bob, 10, 0, Math.PI * 2);
      ctx.fill();

      // Glowing Amber Eyes in Hood
      ctx.fillStyle = '#f59e0b';
      if (player.facing === 'down') {
        ctx.fillRect(player.x - 3, player.y - 14 + bob, 2, 2);
        ctx.fillRect(player.x + 2, player.y - 14 + bob, 2, 2);
      } else if (player.facing === 'left') {
        ctx.fillRect(player.x - 6, player.y - 14 + bob, 2, 2);
      } else if (player.facing === 'right') {
        ctx.fillRect(player.x + 5, player.y - 14 + bob, 2, 2);
      }

      // Golden Lantern
      const lanternX = player.x + (player.facing === 'left' ? -18 : 18);
      const lanternY = player.y + 2 + bob;

      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(lanternX - 4, lanternY - 4, 8, 11);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(lanternX - 3, lanternY - 3, 6, 9);

      ctx.restore();

      // --- LAYER 5: Dynamic Darkness & Lantern Light Falloff ---
      const screenPlayerX = player.x - camX;
      const screenPlayerY = player.y - camY;

      const darkMask = ctx.createRadialGradient(
        screenPlayerX,
        screenPlayerY,
        45,
        screenPlayerX,
        screenPlayerY,
        360
      );
      darkMask.addColorStop(0, 'rgba(8, 6, 14, 0)');
      darkMask.addColorStop(0.5, 'rgba(8, 6, 14, 0.45)');
      darkMask.addColorStop(1, 'rgba(8, 6, 14, 0.96)');

      ctx.fillStyle = darkMask;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // --- LAYER 6: Drifting Midnight Fog Particles ---
      fogRef.current.forEach((fog) => {
        fog.x += fog.speedX;
        if (fog.x > WORLD_WIDTH + 150) fog.x = -150;

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
      window.removeEventListener('resize', resize);
    };
  }, [repos, offerings]);

  return (
    <div className="relative w-full h-screen overflow-hidden select-none bg-[#08060e]">
      
      {/* Fullscreen 2.5D Canvas Engine */}
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full h-full block cursor-crosshair"
      />

      {/* TOP LEFT: Gothic Altar Game Header */}
      <div className="absolute top-6 left-6 z-20 pointer-events-none flex items-center space-x-3">
        <div className="w-12 h-12 rounded-2xl bg-purple-950/90 border border-purple-500/40 flex items-center justify-center text-2xl shadow-[0_0_25px_rgba(168,85,247,0.4)] backdrop-blur-md">
          🕯️
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif-gothic text-calavera-bone tracking-wide drop-shadow-md">
            OFRENDA DE CÓDIGO
          </h1>
          <p className="text-xs font-mono text-purple-300/80">
            The Cemetery of Departed Repositories • Midnight of Día de los Muertos
          </p>
        </div>
      </div>

      {/* TOP RIGHT: Game Controls & Quick Navigator */}
      <div className="absolute top-6 right-6 z-20 flex items-center space-x-3 pointer-events-auto">
        
        {/* Ambient Sound Button */}
        <button
          onClick={onToggleSound}
          title={ambientSound ? 'Mute eerie cathedral drone' : 'Play eerie cathedral drone'}
          className="p-3 rounded-2xl bg-obsidian-950/90 border border-purple-500/40 text-purple-300 hover:bg-purple-900/40 shadow-xl backdrop-blur-md transition-all"
        >
          {ambientSound ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>

        {/* Summon Grave Button */}
        <button
          onClick={onOpenSummonModal}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-calavera-bone font-mono text-xs font-bold shadow-xl border border-purple-400/50 backdrop-blur-md transition-all transform active:scale-95"
        >
          <PlusCircle size={15} />
          <span>Summon Grave</span>
        </button>

        {/* Directory Button */}
        <button
          onClick={() => setDirectoryOpen(!directoryOpen)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-obsidian-950/90 hover:bg-purple-950/80 border border-purple-500/40 text-purple-200 font-mono text-xs font-bold shadow-xl backdrop-blur-md transition-all"
        >
          <Compass size={15} />
          <span>Graves Directory</span>
        </button>

      </div>

      {/* BOTTOM LEFT: Controls HUD */}
      <div className="absolute bottom-6 left-6 z-20 pointer-events-none hidden sm:flex flex-col space-y-1.5 bg-obsidian-950/80 backdrop-blur-md p-3.5 rounded-2xl border border-purple-900/50 text-[11px] font-mono text-purple-300/70 shadow-xl">
        <div>🎮 <strong>WASD / Arrow Keys</strong> or <strong>Click Ground</strong> to Move</div>
        <div>✨ <strong>Walk into Soul Wisps</strong> to hear real developer prayers</div>
        <div>🪦 <strong>Approach Landmarks</strong> to commune, resurrect, or light candles</div>
      </div>

      {/* BOTTOM CENTER: Dynamic In-World Interaction Action Bar */}
      {activePrompt && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 pointer-events-auto animate-fade-in w-full max-w-xl px-4">
          <div className="p-4 sm:p-5 rounded-3xl bg-obsidian-950/95 backdrop-blur-xl border-2 border-amber-500/70 shadow-[0_0_40px_rgba(245,158,11,0.5)] flex flex-col sm:flex-row items-center justify-between gap-4">
            
            <div className="text-center sm:text-left">
              <h3 className="text-base sm:text-lg font-bold font-serif-gothic text-calavera-bone">
                {activePrompt.text}
              </h3>
              <p className="text-xs text-amber-200/80 font-mono mt-0.5">
                {activePrompt.subtext}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={activePrompt.action}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-obsidian-950 font-mono font-bold text-xs uppercase tracking-wider shadow-lg transform active:scale-95 transition-all"
              >
                Enter
              </button>

              {activePrompt.secondaryAction && (
                <button
                  onClick={activePrompt.secondaryAction}
                  className="px-4 py-2.5 rounded-2xl bg-purple-900/80 hover:bg-purple-800 text-purple-200 font-mono text-xs border border-purple-500/40 transition-colors"
                >
                  {activePrompt.secondaryText || 'Resurrect'}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* FLOATING SOUL WISP PRAYER WHISPER NOTIFICATION */}
      {activeWhisper && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 max-w-lg w-full px-4 animate-fade-in pointer-events-auto">
          <div className="p-4 rounded-3xl bg-purple-950/95 backdrop-blur-xl border border-purple-500/60 shadow-[0_0_30px_rgba(168,85,247,0.5)] flex items-start space-x-3 text-left">
            <span className="text-2xl animate-pulse">✨</span>
            <div className="flex-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-purple-300 mb-1">
                <span>Soul Whisper at {activeWhisper.repo}'s Grave</span>
                <button
                  onClick={() => setActiveWhisper(null)}
                  className="text-purple-400/60 hover:text-purple-200 font-bold"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs font-serif italic text-purple-100 leading-relaxed">
                "{activeWhisper.text}"
              </p>
              <span className="block text-[10px] font-mono text-purple-400/70 mt-1.5">
                — Devotee {activeWhisper.author}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* QUICK TOMBSTONE DIRECTORY DRAWER */}
      {directoryOpen && (
        <div className="absolute top-20 right-6 z-40 w-80 rounded-3xl bg-obsidian-950/95 backdrop-blur-xl border border-purple-500/40 shadow-2xl p-4 animate-fade-in pointer-events-auto max-h-[75vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-purple-900/40">
            <span className="text-xs font-mono font-bold text-purple-300 uppercase tracking-wider">
              🪦 Cemetery Directory
            </span>
            <button
              onClick={() => setDirectoryOpen(false)}
              className="text-xs text-purple-400/60 hover:text-purple-200"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2">
            {repos.map((repo) => (
              <div
                key={repo.id}
                onClick={() => {
                  onOpenContract(repo);
                  setDirectoryOpen(false);
                }}
                className="p-3 rounded-2xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/20 hover:border-purple-500/60 cursor-pointer transition-all flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-bold font-serif-gothic text-calavera-bone">
                    {repo.name}
                  </h4>
                  <span className="text-[10px] font-mono text-purple-300/70">
                    {repo.yearsActive} • ★ {repo.starsAtSunset.toLocaleString()}
                  </span>
                </div>
                <span className="text-xs text-amber-400 font-mono">Commune →</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
