import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { DepartedRepo, AltarOffering } from '../types';
import {
  Flame,
  Scroll,
  PlusCircle,
  Volume2,
  VolumeX,
  Compass,
  Sparkles,
  BookOpen,
  MapPin,
  Footprints,
  Navigation,
  Crosshair,
  Shield,
  Zap,
  ZoomIn,
  ZoomOut,
  Eye,
} from 'lucide-react';

interface Cemetery3DProps {
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

interface Grave3D {
  repo: DepartedRepo;
  group: THREE.Group;
  x: number;
  z: number;
  runeRing: THREE.Mesh;
  candleLights: THREE.PointLight[];
  wisps: {
    mesh: THREE.Mesh;
    angle: number;
    radius: number;
    speed: number;
    prayer: string;
    author: string;
  }[];
}

// Shared singleton WebAudio context to prevent browser context exhaustion
let sharedAudioCtx: AudioContext | null = null;
const getSharedAudioCtx = (): AudioContext | null => {
  try {
    if (!sharedAudioCtx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch (_e) {
    return null;
  }
};

// Procedural Web Audio Sound Generator for zero-latency game SFX
const playProceduralSFX = (type: 'step' | 'candle' | 'petal' | 'gong' | 'dash') => {
  try {
    const ctx = getSharedAudioCtx();
    if (!ctx || ctx.state !== 'running') return;

    if (type === 'step') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(65 + Math.random() * 20, ctx.currentTime);
      gain.gain.setValueAtTime(0.015, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (type === 'candle') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'petal') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1040, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'gong') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(110, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 0.8);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.85);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.85);
    } else if (type === 'dash') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    }
  } catch (_e) {
    // Ignore audio permission errors
  }
};

// Helper: Shortest angular interpolation
const normalizeAngle = (angle: number): number => {
  let a = angle % (Math.PI * 2);
  if (a > Math.PI) a -= Math.PI * 2;
  if (a < -Math.PI) a += Math.PI * 2;
  return a;
};

const lerpShortestAngle = (from: number, to: number, factor: number): number => {
  let diff = to - from;
  while (diff < -Math.PI) diff += Math.PI * 2;
  while (diff > Math.PI) diff -= Math.PI * 2;
  return normalizeAngle(from + diff * factor);
};

const GRAVE_COORDS = [
  { x: -5.5, z: 2 },     // 0: request
  { x: 5.5, z: 2 },      // 1: moment
  { x: -7.5, z: -3.5 },  // 2: urllib2
  { x: 7.5, z: -3.5 },   // 3: coffeescript
  { x: -4.5, z: 9.5 },   // 4: bower
  { x: 4.5, z: 9.5 },    // 5: enzyme
  { x: -9.5, z: 3.5 },   // 6: summoned 1
  { x: 9.5, z: 3.5 },    // 7: summoned 2
  { x: -7.5, z: -8.0 },  // 8: summoned 3
  { x: 7.5, z: -8.0 },   // 9: summoned 4
  { x: -4.5, z: -12.5 }, // 10: summoned 5
  { x: 4.5, z: -12.5 },  // 11: summoned 6
  { x: -12.5, z: -2.5 }, // 12: summoned 7
  { x: 12.5, z: -2.5 },  // 13: summoned 8
  { x: -8.5, z: 9.5 },   // 14: summoned 9
  { x: 8.5, z: 9.5 },    // 15: summoned 10
];

// Helper: Generates a procedural high-res stone texture with the repository's name deeply engraved
function createEngravedHeadstoneTexture(repo: DepartedRepo): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 640;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Weathered dark granite slab background
  ctx.fillStyle = '#1c1428';
  ctx.fillRect(0, 0, 512, 640);

  // Stone grain & chisel texture noise
  for (let i = 0; i < 3500; i++) {
    const nx = Math.random() * 512;
    const ny = Math.random() * 640;
    const alpha = Math.random() * 0.09;
    ctx.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha})`;
    ctx.fillRect(nx, ny, Math.random() * 2 + 1, Math.random() * 2 + 1);
  }

  // Chiseled border filigree
  ctx.strokeStyle = '#4a3366';
  ctx.lineWidth = 6;
  ctx.strokeRect(20, 20, 472, 600);

  ctx.strokeStyle = '#120b1c';
  ctx.lineWidth = 2;
  ctx.strokeRect(26, 26, 460, 588);

  // Occult Cross / Epitaph Header
  ctx.textAlign = 'center';
  ctx.font = '32px serif';
  ctx.fillStyle = '#0f0917';
  ctx.fillText('†  🪦  †', 256 + 2, 75 + 2);
  ctx.fillStyle = '#e9d5ff';
  ctx.fillText('†  🪦  †', 256, 75);

  // ENGRAVED REPOSITORY NAME (Deep carved weathered stone effect)
  const nameToRender = repo.name.toUpperCase();
  let nameFontSize = 40;
  if (nameToRender.length > 22) {
    nameFontSize = 22;
  } else if (nameToRender.length > 15) {
    nameFontSize = 28;
  } else if (nameToRender.length > 10) {
    nameFontSize = 34;
  }
  ctx.font = `bold ${nameFontSize}px "Cinzel", "Times New Roman", Georgia, serif`;

  // Carved inner shadow
  ctx.fillStyle = '#0a0510';
  ctx.fillText(nameToRender, 256 + 2, 150 + 2);
  ctx.fillText(nameToRender, 256 - 1, 150 - 1);

  // Bevel stone highlight
  ctx.fillStyle = '#ffffff';
  ctx.fillText(nameToRender, 256, 150);

  // Active Years
  ctx.font = '22px "Courier New", monospace';
  ctx.fillStyle = '#0a0510';
  ctx.fillText(`A.D. ${repo.yearsActive}`, 256 + 1, 205 + 1);
  ctx.fillStyle = '#fbbf24';
  ctx.fillText(`A.D. ${repo.yearsActive}`, 256, 205);

  // Stars count
  ctx.font = 'italic 20px Georgia, serif';
  ctx.fillStyle = '#d8b4fe';
  const starCount = repo.starsAtSunset ? repo.starsAtSunset.toLocaleString() : '1,000+';
  ctx.fillText(`★ ${starCount} Stargazers`, 256, 265);

  // Short carved excerpt
  ctx.font = 'italic 16px Georgia, serif';
  ctx.fillStyle = '#e9d5ff';
  const cleanEpitaph = repo.epitaph 
    ? (repo.epitaph.length > 48 ? repo.epitaph.slice(0, 45) + '...' : repo.epitaph) 
    : 'Resting in open source glory';
  ctx.fillText(`"${cleanEpitaph}"`, 256, 320);

  // Bottom Latin Dedication
  ctx.font = 'bold 18px monospace';
  ctx.fillStyle = '#f59e0b';
  ctx.fillText('• REQUIESCAT IN PACE •', 256, 400);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Helper: Constructs a complete 3D grave group with headstone, engraved plaque, candles, and wisps
function buildGrave3D(
  repo: DepartedRepo,
  pos: { x: number; z: number },
  offerings: AltarOffering[],
  waxMat: THREE.Material,
  flameGeo: THREE.BufferGeometry,
  flameMat: THREE.Material,
  tombstoneMat: THREE.Material,
  moundMat: THREE.Material
): Grave3D {
  const gGroup = new THREE.Group();
  gGroup.position.set(pos.x, 0, pos.z);

  // 1. Ethereal Rune Ring on Ground
  const runeRingGeo = new THREE.RingGeometry(1.3, 1.48, 32);
  runeRingGeo.rotateX(-Math.PI / 2);
  const runeRingMat = new THREE.MeshBasicMaterial({
    color: 0xa855f7,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.25,
  });
  const runeRing = new THREE.Mesh(runeRingGeo, runeRingMat);
  runeRing.position.y = 0.05;
  gGroup.add(runeRing);

  // 2. Grave Mound Earth
  const moundGeo = new THREE.CylinderGeometry(0.85, 1.15, 0.16, 16);
  const mound = new THREE.Mesh(moundGeo, moundMat);
  mound.position.y = 0.08;
  mound.receiveShadow = true;
  gGroup.add(mound);

  // 3. 3D Stone Tombstone Group (Tilted gently towards 2.5D camera for clear engraving visibility)
  const headstoneGroup = new THREE.Group();
  headstoneGroup.position.set(0, 0, 0);
  headstoneGroup.rotation.x = -0.16;

  const tombstoneGeo = new THREE.BoxGeometry(1.25, 1.55, 0.38);
  const tombstone = new THREE.Mesh(tombstoneGeo, tombstoneMat);
  tombstone.position.y = 0.88;
  tombstone.castShadow = true;
  tombstone.receiveShadow = true;
  headstoneGroup.add(tombstone);

  // 4. Arched Headstone Top
  const archGeo = new THREE.CylinderGeometry(0.625, 0.625, 0.38, 16);
  archGeo.rotateZ(Math.PI / 2);
  const arch = new THREE.Mesh(archGeo, tombstoneMat);
  arch.position.set(0, 1.65, 0);
  arch.castShadow = true;
  headstoneGroup.add(arch);

  // 5. THE ENGRAVED HEADSTONE PLAQUE (High-resolution carved stone texture with repo name)
  const plaqueGeo = new THREE.PlaneGeometry(1.18, 1.48);
  const plaqueTexture = createEngravedHeadstoneTexture(repo);
  const plaqueMat = new THREE.MeshStandardMaterial({
    map: plaqueTexture,
    emissiveMap: plaqueTexture,
    emissive: 0x554466,
    emissiveIntensity: 0.35,
    roughness: 0.6,
    metalness: 0.05,
  });
  const plaque = new THREE.Mesh(plaqueGeo, plaqueMat);
  plaque.position.set(0, 0.88, 0.20);
  plaque.receiveShadow = true;
  headstoneGroup.add(plaque);

  gGroup.add(headstoneGroup);

  // 6. 3D Candles at Base of Tombstone
  const candleLights: THREE.PointLight[] = [];
  [-0.48, 0.48].forEach((cx) => {
    const cGeo = new THREE.CylinderGeometry(0.065, 0.075, 0.38, 12);
    const candle = new THREE.Mesh(cGeo, waxMat);
    candle.position.set(cx, 0.27, 0.38);
    candle.castShadow = true;
    gGroup.add(candle);

    const fl = new THREE.Mesh(flameGeo, flameMat);
    fl.position.set(cx, 0.52, 0.38);
    gGroup.add(fl);

    const pLight = new THREE.PointLight(0xff9922, 1.25, 3.8);
    pLight.position.set(cx, 0.6, 0.38);
    gGroup.add(pLight);
    candleLights.push(pLight);
  });

  // 7. 3D Floating Soul Wisps (Orbiting Grave)
  const wisps: Grave3D['wisps'] = [];
  const graveOfferings = offerings.filter((o) => o.repoId === repo.id);
  const prayerCount = Math.max(1, Math.min(3, graveOfferings.length || 1));

  const wispGeo = new THREE.SphereGeometry(0.12, 16, 16);
  const wispMat = new THREE.MeshStandardMaterial({
    color: 0xd946ef,
    emissive: 0xa855f7,
    emissiveIntensity: 0.95,
  });

  for (let i = 0; i < prayerCount; i++) {
    const off = graveOfferings[i] || {
      message: `In memory of ${repo.name}. Rest well.`,
      authorName: 'Graveyard Devotee',
    };

    const wispMesh = new THREE.Mesh(wispGeo, wispMat);
    wispMesh.position.set(0, 1.4, 0);
    gGroup.add(wispMesh);

    wisps.push({
      mesh: wispMesh,
      angle: (i * Math.PI * 2) / prayerCount,
      radius: 1.15 + i * 0.35,
      speed: 0.018 + (i % 2 === 0 ? 0.005 : -0.005),
      prayer: off.message,
      author: off.authorName,
    });
  }

  return {
    repo,
    group: gGroup,
    x: pos.x,
    z: pos.z,
    runeRing,
    candleLights,
    wisps,
  };
}

export const Cemetery3D: React.FC<Cemetery3DProps> = ({
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
  const mountRef = useRef<HTMLDivElement>(null);
  const miniMapCanvasRef = useRef<HTMLCanvasElement>(null);

  // In-World Action Prompts & State
  const [activePrompt, setActivePrompt] = useState<{
    type: 'grave' | 'altar' | 'wall' | 'gate';
    targetRepo?: DepartedRepo;
    text: string;
    subtext: string;
    action: () => void;
    secondaryAction?: () => void;
    secondaryText?: string;
    tertiaryAction?: () => void;
    tertiaryText?: string;
  } | null>(null);

  const [activeWhisper, setActiveWhisper] = useState<{ text: string; author: string; repo: string } | null>(null);
  const activeWhisperRef = useRef<{ text: string; author: string; repo: string } | null>(null);
  const wispDialogueRef = useRef<HTMLDivElement>(null);
  const [codexOpen, setCodexOpen] = useState(false);
  const [miniMapExpanded, setMiniMapExpanded] = useState(false);
  const [hudMessage, setHudMessage] = useState<string | null>('Explore the Cemetery of Departed Code. Honor the fallen.');
  const [totalCandles, setTotalCandles] = useState<number>(0);
  const [inspectingGrave, setInspectingGrave] = useState<DepartedRepo | null>(null);
  const [currentZoomLevel, setCurrentZoomLevel] = useState<number>(1.0);

  // Dynamic Camera Zoom & Tombstone Inspection State
  const cameraState = useRef({
    currentZoom: 1.0,
    targetZoom: 1.0,
    isInspecting: false,
    inspectGrave: null as Grave3D | null,
  });

  // References to props and callbacks for single-mount WebGL stability
  const reposRef = useRef(repos);
  reposRef.current = repos;
  const offeringsRef = useRef(offerings);
  offeringsRef.current = offerings;

  const callbacksRef = useRef({
    onOpenContract,
    onOpen3DAltar,
    onOpenOfferingsWall,
    onOpenSummonModal,
    onOpenOfferingModal,
  });
  callbacksRef.current = {
    onOpenContract,
    onOpen3DAltar,
    onOpenOfferingsWall,
    onOpenSummonModal,
    onOpenOfferingModal,
  };

  // Three.js Scene References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const playerMeshRef = useRef<THREE.Group | null>(null);
  const playerLightRef = useRef<THREE.PointLight | null>(null);
  const lanternSwingRef = useRef<THREE.Group | null>(null);
  const targetRingRef = useRef<THREE.Mesh | null>(null);
  const graves3DRef = useRef<Grave3D[]>([]);
  const graveAssetsRef = useRef<{
    waxMat: THREE.Material;
    flameGeo: THREE.BufferGeometry;
    flameMat: THREE.Material;
    tombstoneMat: THREE.Material;
    moundMat: THREE.Material;
  } | null>(null);
  const petalsMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const petalDataRef = useRef<{ pos: THREE.Vector3; rot: THREE.Euler; speed: number; rotSpeed: THREE.Vector3 }[]>([]);

  // Ground Footstep Trail Particles
  const footstepTrailRef = useRef<{
    mesh: THREE.Mesh;
    life: number;
    maxLife: number;
  }[]>([]);

  // Player Physics & Smooth Natural Movement
  const playerState = useRef({
    x: 0,
    z: 6,
    vx: 0,
    vz: 0,
    maxSpeed: 0.165,
    accel: 0.14,
    friction: 0.82,
    targetX: 0,
    targetZ: 6,
    hasTarget: false,
    currentRotation: Math.PI,
    targetRotation: Math.PI,
    isMoving: false,
    walkCycle: 0,
    lastStepTime: 0,
    dashCooldown: 0,
  });

  const keysPressed = useRef<{ [key: string]: boolean }>({});

  // Compute total candles lit across pantheon
  useEffect(() => {
    const total = repos.reduce((sum, r) => sum + (r.candlesLit || 0), 0);
    setTotalCandles(total);
  }, [repos]);

  // Dash / Spectral Flash Forward
  const performDash = useCallback(() => {
    const p = playerState.current;
    if (Date.now() - p.dashCooldown < 700) return;
    p.dashCooldown = Date.now();

    playProceduralSFX('dash');
    const dashDist = 2.8;
    const facingAngle = p.currentRotation;
    // Facing direction: x = sin(angle), z = cos(angle)
    p.x = Math.max(-23, Math.min(23, p.x + Math.sin(facingAngle) * dashDist));
    p.z = Math.max(-23, Math.min(23, p.z + Math.cos(facingAngle) * dashDist));
    p.targetX = p.x;
    p.targetZ = p.z;
    p.hasTarget = false;

    setHudMessage('⚡ Spectral Dash performed through the mist');
    setTimeout(() => setHudMessage(null), 2500);
  }, []);

  // Hotbar Action 1: Scatter Petals
  const handleScatterPetals = useCallback(() => {
    playProceduralSFX('petal');
    setHudMessage('🌼 Golden Cempasúchil petals scattered to guide the spirits');
    setTimeout(() => setHudMessage(null), 3000);
  }, []);

  // Hotbar Action 2: Kindle Candle
  const handleKindleAction = useCallback(() => {
    if (activePrompt?.targetRepo) {
      playProceduralSFX('candle');
      onOpenOfferingModal(activePrompt.targetRepo);
    } else {
      if (repos.length > 0) onOpen3DAltar(repos[0]);
    }
  }, [activePrompt, repos, onOpenOfferingModal, onOpen3DAltar]);

  // Dynamic Camera Zoom Controls
  const handleZoomIn = useCallback(() => {
    cameraState.current.targetZoom = Math.min(1.85, cameraState.current.targetZoom + 0.25);
    setCurrentZoomLevel(cameraState.current.targetZoom);
    playProceduralSFX('petal');
  }, []);

  const handleZoomOut = useCallback(() => {
    cameraState.current.targetZoom = Math.max(0.55, cameraState.current.targetZoom - 0.25);
    setCurrentZoomLevel(cameraState.current.targetZoom);
    playProceduralSFX('petal');
  }, []);

  // 3D Tombstone Inspection Mode Toggle
  const toggleInspectGrave = useCallback((repo?: DepartedRepo) => {
    const cam = cameraState.current;
    if (cam.isInspecting) {
      cam.isInspecting = false;
      cam.inspectGrave = null;
      setInspectingGrave(null);
      setHudMessage('Exited tombstone inspection view.');
      setTimeout(() => setHudMessage(null), 2500);
    } else {
      let target = repo || activePrompt?.targetRepo;
      let grave3D = target ? graves3DRef.current.find((g) => g.repo.id === target.id) : null;

      // If no target specified, inspect the nearest grave within 4.5 units
      if (!grave3D) {
        const p = playerState.current;
        let minDist = 4.5;
        for (const g of graves3DRef.current) {
          const dist = Math.hypot(p.x - g.x, p.z - g.z);
          if (dist < minDist) {
            minDist = dist;
            grave3D = g;
            target = g.repo;
          }
        }
      }

      if (grave3D && target) {
        cam.isInspecting = true;
        cam.inspectGrave = grave3D;
        setInspectingGrave(target);
        playProceduralSFX('gong');
        setHudMessage(`Inspecting sacred tombstone of ${target.name} [Z / Esc to step back]`);
        setTimeout(() => setHudMessage(null), 3500);
      }
    }
  }, [activePrompt]);

  // Keyboard Event Handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current[key] = true;

      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', ' '].includes(key)) {
        e.preventDefault();
      }

      // Spacebar Dash
      if (e.code === 'Space') {
        performDash();
      }

      // [E] / Enter: Primary In-World Action
      if ((key === 'e' || e.key === 'Enter') && activePrompt) {
        activePrompt.action();
      }

      // [R]: Secondary In-World Action (Resurrection)
      if (key === 'r' && activePrompt?.secondaryAction) {
        activePrompt.secondaryAction();
      }

      // [Z]: Tombstone Inspection Mode
      if (key === 'z') {
        if (cameraState.current.isInspecting) {
          toggleInspectGrave();
        } else if (activePrompt?.tertiaryAction) {
          activePrompt.tertiaryAction();
        } else if (activePrompt?.targetRepo) {
          toggleInspectGrave(activePrompt.targetRepo);
        }
      }

      // [+] / [-]: Zoom shortcuts
      if (key === '=' || key === '+') handleZoomIn();
      if (key === '-' || key === '_') handleZoomOut();

      // Hotbar Number Keys: 1 - 5
      if (key === '1') handleScatterPetals();
      if (key === '2') handleKindleAction();
      if (key === '3') {
        if (activePrompt?.targetRepo) onOpenContract(activePrompt.targetRepo, 'seance');
        else if (repos.length > 0) onOpenContract(repos[0], 'seance');
      }
      if (key === '4') {
        if (activePrompt?.targetRepo) onOpenContract(activePrompt.targetRepo, 'resurrection');
        else if (repos.length > 0) onOpenContract(repos[0], 'resurrection');
      }
      if (key === '5') onOpenOfferingsWall();
      if (key === 'g') onOpenSummonModal();

      // [C] or [Tab]: Codex of the Dead
      if (key === 'c') {
        setCodexOpen((prev) => !prev);
      }

      // [M]: Mini-map expand
      if (key === 'm') {
        setMiniMapExpanded((prev) => !prev);
      }

      if (key === 'escape') {
        if (cameraState.current.isInspecting) {
          toggleInspectGrave();
        }
        setCodexOpen(false);
        setMiniMapExpanded(false);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    const handleBlur = () => {
      keysPressed.current = {};
      const p = playerState.current;
      p.vx = 0;
      p.vz = 0;
      p.isMoving = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [activePrompt, repos, onOpenContract, onOpen3DAltar, onOpenOfferingsWall, performDash, handleScatterPetals, handleKindleAction, toggleInspectGrave, handleZoomIn, handleZoomOut]);

  // Pathfind / Walk to specific grave coordinates from Codex
  const handleWalkToGrave = (graveX: number, graveZ: number) => {
    const p = playerState.current;
    p.targetX = graveX;
    p.targetZ = graveZ + 1.8; // Stand respectfully right in front of the tombstone
    p.hasTarget = true;
    setCodexOpen(false);
    setHudMessage(`Navigating through misty cemetery...`);
    setTimeout(() => setHudMessage(null), 3000);
  };

  // Main Three.js Scene Setup & Loop
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // 1. Scene, Atmospheric Deep Fog, & 2.5D Isometric Camera
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x080512, 0.036);

    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 100);
    camera.position.set(0, 11.5, 11.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;

    mountRef.current.appendChild(renderer.domElement);

    // 2. Atmospheric Ambient & Directional Moonlight
    const ambientLight = new THREE.AmbientLight(0x22163b, 1.5);
    scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(0x5a3f8c, 1.7);
    moonLight.position.set(15, 24, 12);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 2048;
    moonLight.shadow.mapSize.height = 2048;
    moonLight.shadow.camera.near = 0.5;
    moonLight.shadow.camera.far = 45;
    moonLight.shadow.camera.left = -22;
    moonLight.shadow.camera.right = 22;
    moonLight.shadow.camera.top = 22;
    moonLight.shadow.camera.bottom = -22;
    scene.add(moonLight);

    // 3. Ground & Ancient Cobblestone Crossroads
    const groundGeo = new THREE.PlaneGeometry(65, 65, 32, 32);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0a0714,
      roughness: 0.95,
      metalness: 0.05,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const pathMat = new THREE.MeshStandardMaterial({ color: 0x161124, roughness: 0.85 });

    // Central circular plaza slab
    const plazaGeo = new THREE.CylinderGeometry(4.4, 4.4, 0.08, 32);
    const plaza = new THREE.Mesh(plazaGeo, pathMat);
    plaza.position.set(0, 0.04, 0);
    plaza.receiveShadow = true;
    scene.add(plaza);

    // North-South stone avenue
    const nsPathGeo = new THREE.BoxGeometry(2.6, 0.06, 50);
    const nsPath = new THREE.Mesh(nsPathGeo, pathMat);
    nsPath.position.set(0, 0.03, 0);
    nsPath.receiveShadow = true;
    scene.add(nsPath);

    // East-West stone avenue
    const ewPathGeo = new THREE.BoxGeometry(50, 0.06, 2.6);
    const ewPath = new THREE.Mesh(ewPathGeo, pathMat);
    ewPath.position.set(0, 0.03, 0);
    ewPath.receiveShadow = true;
    scene.add(ewPath);

    // 4. Click-to-Move Target Indicator Ring
    const targetRingGeo = new THREE.RingGeometry(0.3, 0.42, 24);
    targetRingGeo.rotateX(-Math.PI / 2);
    const targetRingMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    const targetRing = new THREE.Mesh(targetRingGeo, targetRingMat);
    targetRing.position.set(0, 0.08, 0);
    scene.add(targetRing);
    targetRingRef.current = targetRing;

    // 5. Perimeter Gothic Wrought Iron Fences
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0x1c1328, roughness: 0.7 });
    const fenceBarGeo = new THREE.BoxGeometry(52, 0.9, 0.12);

    [-26, 26].forEach((pos) => {
      const fH = new THREE.Mesh(fenceBarGeo, fenceMat);
      fH.position.set(0, 0.45, pos);
      scene.add(fH);

      const fV = new THREE.Mesh(fenceBarGeo, fenceMat);
      fV.rotation.y = Math.PI / 2;
      fV.position.set(pos, 0.45, 0);
      scene.add(fV);
    });

    // 6. 3D Dead Gnarled Cemetery Trees
    const treeMat = new THREE.MeshStandardMaterial({ color: 0x08050e, roughness: 0.95 });
    const treePositions = [
      [-13, -13], [13, -13], [-15, 13], [15, 15], [-7, -19], [9, -19],
    ];

    treePositions.forEach(([tx, tz]) => {
      const trunkGeo = new THREE.CylinderGeometry(0.38, 0.65, 4.8, 8);
      const trunk = new THREE.Mesh(trunkGeo, treeMat);
      trunk.position.set(tx, 2.4, tz);
      trunk.castShadow = true;
      scene.add(trunk);

      const branchGeo = new THREE.CylinderGeometry(0.12, 0.24, 3.0, 6);
      const b1 = new THREE.Mesh(branchGeo, treeMat);
      b1.position.set(tx - 0.75, 4.2, tz);
      b1.rotation.z = Math.PI / 3.6;
      b1.castShadow = true;
      scene.add(b1);

      const b2 = new THREE.Mesh(branchGeo, treeMat);
      b2.position.set(tx + 0.85, 4.4, tz + 0.2);
      b2.rotation.z = -Math.PI / 3.0;
      b2.castShadow = true;
      scene.add(b2);
    });

    // 7. 3D CENTRAL ALTR / MAUSOLEUM OF ETERNAL FLAME (0, 0)
    const altarGroup = new THREE.Group();
    altarGroup.position.set(0, 0, 0);

    const aBaseGeo = new THREE.CylinderGeometry(2.7, 2.9, 0.4, 28);
    const aBaseMat = new THREE.MeshStandardMaterial({ color: 0x1f1632, roughness: 0.75 });
    const aBase = new THREE.Mesh(aBaseGeo, aBaseMat);
    aBase.position.y = 0.2;
    aBase.receiveShadow = true;
    altarGroup.add(aBase);

    const aTier2Geo = new THREE.BoxGeometry(2.4, 0.65, 1.5);
    const aTier2 = new THREE.Mesh(aTier2Geo, aBaseMat);
    aTier2.position.y = 0.65;
    aTier2.castShadow = true;
    aTier2.receiveShadow = true;
    altarGroup.add(aTier2);

    // Flame & Candles on Altar
    const waxMat = new THREE.MeshStandardMaterial({ color: 0xfdf7eb, roughness: 0.3 });
    const flameGeo = new THREE.SphereGeometry(0.08, 12, 12);
    flameGeo.scale(1, 2.2, 1);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa11 });

    const centerCandlePositions = [
      { x: 0, y: 0.98, z: 0, h: 0.75, r: 0.11 },
      { x: -0.55, y: 0.98, z: 0, h: 0.52, r: 0.085 },
      { x: 0.55, y: 0.98, z: 0, h: 0.52, r: 0.085 },
      { x: -0.9, y: 0.98, z: 0.35, h: 0.42, r: 0.075 },
      { x: 0.9, y: 0.98, z: 0.35, h: 0.42, r: 0.075 },
    ];

    centerCandlePositions.forEach((cfg) => {
      const cGeo = new THREE.CylinderGeometry(cfg.r * 0.95, cfg.r, cfg.h, 16);
      const cMesh = new THREE.Mesh(cGeo, waxMat);
      cMesh.position.set(cfg.x, cfg.y + cfg.h / 2, cfg.z);
      cMesh.castShadow = true;
      altarGroup.add(cMesh);

      const fl = new THREE.Mesh(flameGeo, flameMat);
      fl.position.set(cfg.x, cfg.y + cfg.h + 0.1, cfg.z);
      altarGroup.add(fl);
    });

    const altarLight = new THREE.PointLight(0xff9922, 4.6, 9.5);
    altarLight.position.set(0, 2.3, 0);
    altarLight.castShadow = true;
    altarGroup.add(altarLight);
    scene.add(altarGroup);

    // 8. 3D MEMORIAL WEAPING WALL (-11, -9)
    const wallGroup = new THREE.Group();
    wallGroup.position.set(-11, 0, -9);
    const wGeo = new THREE.BoxGeometry(4.8, 2.5, 0.45);
    const wMat = new THREE.MeshStandardMaterial({ color: 0x22163b, roughness: 0.8 });
    const wallMesh = new THREE.Mesh(wGeo, wMat);
    wallMesh.position.y = 1.25;
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;
    wallGroup.add(wallMesh);

    const wallLight = new THREE.PointLight(0xa855f7, 3.4, 7.5);
    wallLight.position.set(0, 1.8, 0.9);
    wallGroup.add(wallLight);
    scene.add(wallGroup);

    // 9. 3D SUMMONING OBELISK (11, -9)
    const gateGroup = new THREE.Group();
    gateGroup.position.set(11, 0, -9);
    const obeliskGeo = new THREE.CylinderGeometry(0.2, 0.75, 4.0, 4);
    const obeliskMat = new THREE.MeshStandardMaterial({ color: 0x141a2e, roughness: 0.6 });
    const obelisk = new THREE.Mesh(obeliskGeo, obeliskMat);
    obelisk.position.y = 2.0;
    obelisk.rotation.y = Math.PI / 4;
    obelisk.castShadow = true;
    gateGroup.add(obelisk);

    const gateLight = new THREE.PointLight(0x38bdf8, 3.4, 7.5);
    gateLight.position.set(0, 2.3, 0);
    gateGroup.add(gateLight);
    scene.add(gateGroup);

    // 10. 3D TOMBSTONES & ETHEREAL RUNE RINGS FOR EACH REPO
    const tombstoneMat = new THREE.MeshStandardMaterial({ color: 0x241934, roughness: 0.8 });
    const moundMat = new THREE.MeshStandardMaterial({ color: 0x130e1d, roughness: 0.95 });

    graveAssetsRef.current = {
      waxMat,
      flameGeo,
      flameMat,
      tombstoneMat,
      moundMat,
    };

    const graves3D: Grave3D[] = [];
    const initialRepos = reposRef.current.length > 0 ? reposRef.current : [
      { id: 'request', name: 'request', yearsActive: '2011 – 2020', candlesLit: 1428, starsAtSunset: 25485 } as DepartedRepo,
      { id: 'moment', name: 'moment.js', yearsActive: '2011 – 2020', candlesLit: 2154, starsAtSunset: 47885 } as DepartedRepo,
      { id: 'urllib2', name: 'urllib2 (Python 2)', yearsActive: '2001 – 2020', candlesLit: 1890, starsAtSunset: 77707 } as DepartedRepo,
      { id: 'coffeescript', name: 'CoffeeScript', yearsActive: '2009 – 2018', candlesLit: 3120, starsAtSunset: 16597 } as DepartedRepo,
      { id: 'bower', name: 'bower', yearsActive: '2012 – 2017', candlesLit: 984, starsAtSunset: 14896 } as DepartedRepo,
      { id: 'enzyme', name: 'enzyme', yearsActive: '2015 – 2021', candlesLit: 875, starsAtSunset: 19803 } as DepartedRepo,
    ];

    initialRepos.forEach((repo, idx) => {
      const pos = GRAVE_COORDS[idx] || {
        x: ((idx * 6) % 26) - 13,
        z: Math.floor(idx / 4) * 5 - 10,
      };

      const grave = buildGrave3D(
        repo,
        pos,
        offeringsRef.current,
        waxMat,
        flameGeo,
        flameMat,
        tombstoneMat,
        moundMat
      );

      scene.add(grave.group);
      graves3D.push(grave);
    });

    graves3DRef.current = graves3D;

    // 11. 3D DRIFTING MARIGOLD PETALS (InstancedMesh)
    const petalCount = 180;
    const petalGeo = new THREE.PlaneGeometry(0.1, 0.16);
    const petalMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      roughness: 0.5,
      emissive: 0x7c2d12,
      emissiveIntensity: 0.45,
    });

    const instancedPetals = new THREE.InstancedMesh(petalGeo, petalMat, petalCount);
    const dummy = new THREE.Object3D();
    const petalData: { pos: THREE.Vector3; rot: THREE.Euler; speed: number; rotSpeed: THREE.Vector3 }[] = [];

    for (let i = 0; i < petalCount; i++) {
      const pos = new THREE.Vector3(
        (Math.random() - 0.5) * 44,
        Math.random() * 8,
        (Math.random() - 0.5) * 44
      );
      const rot = new THREE.Euler(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      const speed = 0.006 + Math.random() * 0.012;
      const rotSpeed = new THREE.Vector3(
        (Math.random() - 0.5) * 0.03,
        (Math.random() - 0.5) * 0.03,
        (Math.random() - 0.5) * 0.03
      );

      dummy.position.copy(pos);
      dummy.rotation.copy(rot);
      dummy.updateMatrix();
      instancedPetals.setMatrixAt(i, dummy.matrix);

      petalData.push({ pos, rot, speed, rotSpeed });
    }

    instancedPetals.instanceMatrix.needsUpdate = true;
    scene.add(instancedPetals);
    petalsMeshRef.current = instancedPetals;
    petalDataRef.current = petalData;

    // 12. HIGH-POLISH 3D PLAYER CHARACTER (Necromancer Avatar with Dynamic Lantern & Robe)
    const playerGroup = new THREE.Group();
    playerGroup.position.set(0, 0, 6);

    // Inner Velvet Robe
    const robeGeo = new THREE.ConeGeometry(0.44, 1.45, 16);
    const robeMat = new THREE.MeshStandardMaterial({ color: 0x26104f, roughness: 0.75 });
    const robe = new THREE.Mesh(robeGeo, robeMat);
    robe.position.y = 0.72;
    robe.castShadow = true;
    playerGroup.add(robe);

    // Shoulder Mantle / Cowl
    const mantleGeo = new THREE.CylinderGeometry(0.3, 0.48, 0.45, 16);
    const mantleMat = new THREE.MeshStandardMaterial({ color: 0x3d176b, roughness: 0.7 });
    const mantle = new THREE.Mesh(mantleGeo, mantleMat);
    mantle.position.y = 1.15;
    mantle.castShadow = true;
    playerGroup.add(mantle);

    // Sculpted Hood
    const hoodGeo = new THREE.SphereGeometry(0.25, 16, 16);
    const hoodMat = new THREE.MeshStandardMaterial({ color: 0x1d0b38, roughness: 0.65 });
    const hood = new THREE.Mesh(hoodGeo, hoodMat);
    hood.position.y = 1.38;
    hood.castShadow = true;
    playerGroup.add(hood);

    // Piercing Glowing Amber Eyes
    const eyeGeo = new THREE.SphereGeometry(0.045, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.08, 1.37, 0.22);
    playerGroup.add(eyeL);

    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.08, 1.37, 0.22);
    playerGroup.add(eyeR);

    // Gnarled Wooden Staff
    const staffGeo = new THREE.CylinderGeometry(0.022, 0.025, 1.3, 8);
    const staffMat = new THREE.MeshStandardMaterial({ color: 0x3a2512 });
    const staff = new THREE.Mesh(staffGeo, staffMat);
    staff.position.set(0.46, 0.85, 0.2);
    staff.rotation.z = -Math.PI / 14;
    staff.castShadow = true;
    playerGroup.add(staff);

    // Dynamic Lantern Swing Group (Joint for momentum physics)
    const lanternSwingGroup = new THREE.Group();
    lanternSwingGroup.position.set(0.55, 1.25, 0.22);
    lanternSwingRef.current = lanternSwingGroup;

    // Small suspension chain
    const chainGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.2, 6);
    const chainMat = new THREE.MeshStandardMaterial({ color: 0x554433 });
    const chain = new THREE.Mesh(chainGeo, chainMat);
    chain.position.y = -0.1;
    lanternSwingGroup.add(chain);

    // Brass Lantern Box
    const lanternBoxGeo = new THREE.BoxGeometry(0.18, 0.25, 0.18);
    const lanternBoxMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.25 });
    const lanternBox = new THREE.Mesh(lanternBoxGeo, lanternBoxMat);
    lanternBox.position.y = -0.3;
    lanternBox.castShadow = true;
    lanternSwingGroup.add(lanternBox);

    // Dynamic Player Lantern PointLight (Casting 3D moving shadows)
    const playerLight = new THREE.PointLight(0xffaa33, 3.4, 11.5);
    playerLight.position.set(0, -0.3, 0);
    playerLight.castShadow = true;
    lanternSwingGroup.add(playerLight);
    playerLightRef.current = playerLight;

    playerGroup.add(lanternSwingGroup);

    // Ground Shadow Blob
    const shadowBlobGeo = new THREE.CircleGeometry(0.45, 16);
    shadowBlobGeo.rotateX(-Math.PI / 2);
    const shadowBlobMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
    });
    const shadowBlob = new THREE.Mesh(shadowBlobGeo, shadowBlobMat);
    shadowBlob.position.y = 0.02;
    playerGroup.add(shadowBlob);

    scene.add(playerGroup);
    playerMeshRef.current = playerGroup;

    // 13. Footstep Trail Particle Pool (20 small fading ground embers)
    const trailPoolSize = 20;
    const trailGeo = new THREE.CircleGeometry(0.08, 8);
    trailGeo.rotateX(-Math.PI / 2);
    const trailMat = new THREE.MeshBasicMaterial({
      color: 0xa855f7,
      transparent: true,
      opacity: 0,
    });

    const footstepTrail: { mesh: THREE.Mesh; life: number; maxLife: number }[] = [];
    for (let i = 0; i < trailPoolSize; i++) {
      const mesh = new THREE.Mesh(trailGeo, trailMat.clone());
      mesh.position.set(0, 0.03, 0);
      mesh.visible = false;
      scene.add(mesh);
      footstepTrail.push({ mesh, life: 0, maxLife: 45 });
    }
    footstepTrailRef.current = footstepTrail;

    // 14. Mouse Raycasting for Smooth Click-to-Pathfind
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (e: MouseEvent) => {
      // Ignore clicks on UI overlays
      if ((e.target as HTMLElement).tagName !== 'CANVAS') return;

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(ground);

      if (intersects.length > 0) {
        const point = intersects[0].point;
        playerState.current.targetX = point.x;
        playerState.current.targetZ = point.z;
        playerState.current.hasTarget = true;

        if (targetRingRef.current) {
          targetRingRef.current.position.set(point.x, 0.08, point.z);
          (targetRingRef.current.material as THREE.MeshBasicMaterial).opacity = 0.85;
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // Dynamic Camera Zoom via Mouse Wheel
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomDelta = e.deltaY < 0 ? 0.15 : -0.15;
      cameraState.current.targetZoom = Math.max(0.55, Math.min(1.85, cameraState.current.targetZoom + zoomDelta));
      setCurrentZoomLevel(cameraState.current.targetZoom);
    };

    renderer.domElement.addEventListener('wheel', handleWheel, { passive: false });

    // 15. Game Loop & Natural Kinematics Physics
    const startTime = performance.now();
    let animId: number;
    let trailIndex = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = (performance.now() - startTime) * 0.001;
      const p = playerState.current;
      const keys = keysPressed.current;

      // Handle Input Direction
      let inputX = 0;
      let inputZ = 0;

      if (keys['w'] || keys['arrowup']) inputZ -= 1;
      if (keys['s'] || keys['arrowdown']) inputZ += 1;
      if (keys['a'] || keys['arrowleft']) inputX -= 1;
      if (keys['d'] || keys['arrowright']) inputX += 1;

      // Natural Movement & Momentum Physics
      if (inputX !== 0 || inputZ !== 0) {
        const len = Math.hypot(inputX, inputZ);
        const normX = inputX / len;
        const normZ = inputZ / len;

        const desiredVx = normX * p.maxSpeed;
        const desiredVz = normZ * p.maxSpeed;

        p.vx += (desiredVx - p.vx) * p.accel;
        p.vz += (desiredVz - p.vz) * p.accel;

        // Smooth target rotation while moving
        // THREE.js orientation: +Z is forward (south, angle 0), +X is east (angle PI/2), -Z is north (angle PI)
        p.targetRotation = Math.atan2(normX, normZ);
        p.isMoving = true;
        p.hasTarget = false; // Keyboard overrides click-to-move
        if (targetRingRef.current) {
          (targetRingRef.current.material as THREE.MeshBasicMaterial).opacity = 0;
        }
      } else if (p.hasTarget) {
        // Click-to-move interpolation
        const toX = p.targetX - p.x;
        const toZ = p.targetZ - p.z;
        const dist = Math.hypot(toX, toZ);

        if (dist > 0.2) {
          const desiredVx = (toX / dist) * p.maxSpeed;
          const desiredVz = (toZ / dist) * p.maxSpeed;
          p.vx += (desiredVx - p.vx) * p.accel;
          p.vz += (desiredVz - p.vz) * p.accel;
          p.targetRotation = Math.atan2(toX, toZ);
          p.isMoving = true;
        } else {
          p.hasTarget = false;
          if (targetRingRef.current) {
            (targetRingRef.current.material as THREE.MeshBasicMaterial).opacity = 0;
          }
        }
      } else {
        // Smooth gliding friction deceleration
        p.vx *= p.friction;
        p.vz *= p.friction;
        if (Math.hypot(p.vx, p.vz) < 0.004) {
          p.vx = 0;
          p.vz = 0;
          p.isMoving = false;
        }
      }

      // CRITICAL FIX: The character's targetRotation is PRESERVED when stopped!
      // Interpolate rotation smoothly with shortest arc, eliminating all sharp snaps
      p.currentRotation = lerpShortestAngle(p.currentRotation, p.targetRotation, 0.16);

      // Apply Cemetery boundary bounds
      p.x = Math.max(-24, Math.min(24, p.x + p.vx));
      p.z = Math.max(-24, Math.min(24, p.z + p.vz));

      // Update Player Mesh Position & Rotation
      if (playerMeshRef.current) {
        playerMeshRef.current.position.set(p.x, 0, p.z);
        playerMeshRef.current.rotation.y = p.currentRotation;

        const currentSpeed = Math.hypot(p.vx, p.vz);

        if (currentSpeed > 0.01) {
          p.walkCycle += currentSpeed * 1.8;
          playerMeshRef.current.position.y = Math.sin(p.walkCycle) * 0.08;

          // Dynamic Banking / Leaning into Turns
          const leanZ = -p.vx * 0.35;
          const leanX = p.vz * 0.35;
          playerMeshRef.current.rotation.z = THREE.MathUtils.lerp(playerMeshRef.current.rotation.z, leanZ, 0.18);
          playerMeshRef.current.rotation.x = THREE.MathUtils.lerp(playerMeshRef.current.rotation.x, leanX, 0.18);

          // Footstep audio cadence & ground trail embers
          if (Date.now() - p.lastStepTime > 340) {
            p.lastStepTime = Date.now();
            playProceduralSFX('step');

            // Spawn footstep trail ember
            const t = footstepTrail[trailIndex % footstepTrail.length];
            trailIndex++;
            t.mesh.position.set(p.x, 0.03, p.z);
            t.mesh.visible = true;
            t.life = t.maxLife;
          }
        } else {
          // Smooth return to rest stance
          playerMeshRef.current.position.y = THREE.MathUtils.lerp(playerMeshRef.current.position.y, 0, 0.15);
          playerMeshRef.current.rotation.z = THREE.MathUtils.lerp(playerMeshRef.current.rotation.z, 0, 0.15);
          playerMeshRef.current.rotation.x = THREE.MathUtils.lerp(playerMeshRef.current.rotation.x, 0, 0.15);
        }
      }

      // Dynamic Lantern Sway based on velocity & momentum
      if (lanternSwingRef.current) {
        const swayZ = -p.vx * 2.2 + Math.sin(p.walkCycle) * 0.12;
        const swayX = p.vz * 2.2;
        lanternSwingRef.current.rotation.z = THREE.MathUtils.lerp(lanternSwingRef.current.rotation.z, swayZ, 0.15);
        lanternSwingRef.current.rotation.x = THREE.MathUtils.lerp(lanternSwingRef.current.rotation.x, swayX, 0.15);
      }

      // Update footstep trail life
      footstepTrail.forEach((t) => {
        if (t.mesh.visible && t.life > 0) {
          t.life--;
          const ratio = t.life / t.maxLife;
          (t.mesh.material as THREE.MeshBasicMaterial).opacity = ratio * 0.45;
          t.mesh.scale.setScalar(1 + (1 - ratio) * 0.5);
          if (t.life <= 0) t.mesh.visible = false;
        }
      });

      // Camera Smooth Tracking (Dynamic Zoom & Inspection Mode)
      const cam = cameraState.current;
      cam.currentZoom = THREE.MathUtils.lerp(cam.currentZoom, cam.targetZoom, 0.08);

      if (cam.isInspecting && cam.inspectGrave) {
        // Freeze player movement during stone inspection
        p.vx = 0;
        p.vz = 0;
        p.isMoving = false;
        const gx = cam.inspectGrave.x;
        const gz = cam.inspectGrave.z;
        // Position camera directly in front of the carved headstone facing south (+Z)
        camera.position.x = THREE.MathUtils.lerp(camera.position.x, gx, 0.08);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, 1.40, 0.08);
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, gz + 2.35, 0.08);
        camera.lookAt(gx, 1.15, gz);
      } else {
        const zoomInv = 1 / cam.currentZoom;
        const targetCamX = p.x;
        const targetCamY = 11.0 * zoomInv;
        const targetCamZ = p.z + 10.5 * zoomInv;
        camera.position.x += (targetCamX - camera.position.x) * 0.06;
        camera.position.y += (targetCamY - camera.position.y) * 0.06;
        camera.position.z += (targetCamZ - camera.position.z) * 0.06;
        camera.lookAt(p.x, 0.8, p.z);
      }

      // Flickering Lantern Point Light
      if (playerLightRef.current) {
        const flicker = Math.sin(elapsedTime * 14) * 0.25 + Math.cos(elapsedTime * 22) * 0.15;
        playerLightRef.current.intensity = 3.4 + flicker;
      }

      // Update Graves, Rune Rings, and Orbiting Soul Wisps
      let touchingWispText: {
        text: string;
        author: string;
        repo: string;
        worldX: number;
        worldY: number;
        worldZ: number;
      } | null = null;
      let minWispDist = activeWhisperRef.current ? 4.2 : 2.8;
      let closestPrompt: typeof activePrompt = null;
      let minDistance = Infinity;

      for (const grave of graves3DRef.current) {
        const dist = Math.hypot(p.x - grave.x, p.z - grave.z);

        // Rune Ring Glow when near
        const runeMat = grave.runeRing.material as THREE.MeshBasicMaterial;
        if (dist < 3.2) {
          runeMat.opacity = THREE.MathUtils.lerp(runeMat.opacity, 0.85, 0.1);
          grave.runeRing.rotation.z += 0.015;
        } else {
          runeMat.opacity = THREE.MathUtils.lerp(runeMat.opacity, 0.2, 0.1);
        }

        // Candle light flicker
        grave.candleLights.forEach((light, lIdx) => {
          light.intensity = 1.25 + Math.sin(elapsedTime * 9 + lIdx) * 0.2;
        });

        // 3D Soul Wisps Orbiting
        for (const w of grave.wisps) {
          w.angle += w.speed;
          w.mesh.position.x = Math.cos(w.angle) * w.radius;
          w.mesh.position.z = Math.sin(w.angle) * w.radius;
          w.mesh.position.y = 1.25 + Math.sin(elapsedTime * 2 + w.angle) * 0.25;

          const worldWispX = grave.x + w.mesh.position.x;
          const worldWispY = w.mesh.position.y;
          const worldWispZ = grave.z + w.mesh.position.z;
          const wDist = Math.hypot(p.x - worldWispX, p.z - worldWispZ);

          const isCurrentGrave = activeWhisperRef.current && activeWhisperRef.current.repo === grave.repo.name;
          const maxAllowed = isCurrentGrave ? 4.2 : 2.8;

          if (wDist < maxAllowed && wDist < minWispDist) {
            minWispDist = wDist;
            touchingWispText = {
              text: w.prayer,
              author: w.author,
              repo: grave.repo.name,
              worldX: worldWispX,
              worldY: worldWispY + 0.35,
              worldZ: worldWispZ,
            };
            (w.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 2.0;
            w.mesh.scale.setScalar(1.25);
          } else {
            (w.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.95;
            w.mesh.scale.setScalar(1.0);
          }
        }

        // Check Grave Proximity for RPG Action Banner
        if (dist < 2.8 && dist < minDistance) {
          minDistance = dist;
          closestPrompt = {
            type: 'grave',
            targetRepo: grave.repo,
            text: `[E] Commune with ${grave.repo.name}`,
            subtext: `Speak with the spirit via Gemma 2 or sign the Pact of Transmutation`,
            action: () => {
              keysPressed.current = {};
              p.vx = 0; p.vz = 0; p.isMoving = false;
              p.targetRotation = Math.atan2(grave.x - p.x, grave.z - p.z);
              callbacksRef.current.onOpenContract(grave.repo, 'seance');
            },
            secondaryAction: () => {
              keysPressed.current = {};
              p.vx = 0; p.vz = 0; p.isMoving = false;
              p.targetRotation = Math.atan2(grave.x - p.x, grave.z - p.z);
              callbacksRef.current.onOpenContract(grave.repo, 'resurrection');
            },
            secondaryText: '[R] Resurrect',
            tertiaryAction: () => toggleInspectGrave(grave.repo),
            tertiaryText: '[Z] Inspect Stone',
          };
        }
      }

      // Check Central Altar Proximity (0, 0)
      const distToAltar = Math.hypot(p.x - 0, p.z - 0);
      if (distToAltar < 3.5 && distToAltar < minDistance) {
        minDistance = distToAltar;
        closestPrompt = {
          type: 'altar',
          targetRepo: reposRef.current[0],
          text: `[E] Enter 3D Candle Sanctuary`,
          subtext: `Light candles on the stone pedestal and listen to cathedral eulogies`,
          action: () => {
            keysPressed.current = {};
            p.vx = 0; p.vz = 0; p.isMoving = false;
            p.targetRotation = Math.atan2(0 - p.x, 0 - p.z);
            if (reposRef.current.length > 0) callbacksRef.current.onOpen3DAltar(reposRef.current[0]);
          },
        };
      }

      // Check Memorial Weaping Wall Proximity (-11, -9)
      const distToWall = Math.hypot(p.x - (-11), p.z - (-9));
      if (distToWall < 3.2 && distToWall < minDistance) {
        minDistance = distToWall;
        closestPrompt = {
          type: 'wall',
          text: `[E] Inspect Devotee Memorial Wall`,
          subtext: `Read community developer prayers or place your offering into the cemetery`,
          action: () => callbacksRef.current.onOpenOfferingsWall(),
        };
      }

      // Check Summoning Gate Proximity (11, -9)
      const distToGate = Math.hypot(p.x - 11, p.z - (-9));
      if (distToGate < 3.2 && distToGate < minDistance) {
        minDistance = distToGate;
        closestPrompt = {
          type: 'gate',
          text: `[E] Summon a Grave from GitHub`,
          subtext: `Paste any GitHub repo URL to erect a new 3D tombstone in the cemetery`,
          action: () => callbacksRef.current.onOpenSummonModal(),
        };
      }

      setActivePrompt(closestPrompt);

      // Track & project Soul Whisper dialogue balloon directly above the soul wisp in 3D
      if (touchingWispText) {
        if (!activeWhisperRef.current || activeWhisperRef.current.text !== touchingWispText.text) {
          activeWhisperRef.current = {
            text: touchingWispText.text,
            author: touchingWispText.author,
            repo: touchingWispText.repo,
          };
          setActiveWhisper(activeWhisperRef.current);
        }

        if (wispDialogueRef.current && mountRef.current) {
          const w = mountRef.current.clientWidth;
          const h = mountRef.current.clientHeight;

          const wispVec = new THREE.Vector3(
            touchingWispText.worldX,
            touchingWispText.worldY,
            touchingWispText.worldZ
          );
          wispVec.project(camera);

          // Only display if in front of camera
          if (wispVec.z < 1) {
            const screenX = ((wispVec.x + 1) * w) / 2;
            const screenY = ((-wispVec.y + 1) * h) / 2;

            wispDialogueRef.current.style.transform = `translate3d(${screenX}px, ${screenY}px, 0)`;
            wispDialogueRef.current.style.opacity = '1';
          }
        }
      } else {
        if (activeWhisperRef.current) {
          activeWhisperRef.current = null;
          setActiveWhisper(null);
        }
        if (wispDialogueRef.current) {
          wispDialogueRef.current.style.opacity = '0';
        }
      }

      // 3D Drifting Marigold Petals Physics
      if (petalsMeshRef.current && petalDataRef.current) {
        for (let i = 0; i < petalCount; i++) {
          const pt = petalDataRef.current[i];
          pt.pos.y -= pt.speed;
          pt.pos.x += Math.sin(elapsedTime * 1.5 + i) * 0.006;
          pt.pos.z += Math.cos(elapsedTime * 1.2 + i) * 0.006;

          pt.rot.x += pt.rotSpeed.x;
          pt.rot.y += pt.rotSpeed.y;
          pt.rot.z += pt.rotSpeed.z;

          if (pt.pos.y < 0.05) {
            pt.pos.y = 8;
            pt.pos.x = (Math.random() - 0.5) * 44;
            pt.pos.z = (Math.random() - 0.5) * 44;
          }

          dummy.position.copy(pt.pos);
          dummy.rotation.copy(pt.rot);
          dummy.updateMatrix();
          petalsMeshRef.current.setMatrixAt(i, dummy.matrix);
        }
        petalsMeshRef.current.instanceMatrix.needsUpdate = true;
      }

      // 16. Draw Antique Astral Mini-Map Radar on 2D Canvas
      if (miniMapCanvasRef.current) {
        const mc = miniMapCanvasRef.current;
        const ctx = mc.getContext('2d');
        if (ctx) {
          const size = mc.width;
          const center = size / 2;
          const scale = size / 54; // Map 54 units to canvas size

          ctx.clearRect(0, 0, size, size);

          // Dark Parchment Circular Fill
          ctx.beginPath();
          ctx.arc(center, center, center - 2, 0, Math.PI * 2);
          ctx.fillStyle = '#0a0715';
          ctx.fill();
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 3;
          ctx.stroke();

          // Stone paths
          ctx.strokeStyle = '#221738';
          ctx.lineWidth = 14 * scale;
          // NS
          ctx.beginPath();
          ctx.moveTo(center, 4);
          ctx.lineTo(center, size - 4);
          ctx.stroke();
          // EW
          ctx.beginPath();
          ctx.moveTo(4, center);
          ctx.lineTo(size - 4, center);
          ctx.stroke();

          // Central Altar icon (Golden flame dot)
          ctx.beginPath();
          ctx.arc(center, center, 5, 0, Math.PI * 2);
          ctx.fillStyle = '#f59e0b';
          ctx.fill();
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Weaping wall (-11, -9) & Summon Gate (11, -9)
          const wallCx = center + -11 * scale;
          const wallCz = center + -9 * scale;
          ctx.fillStyle = '#a855f7';
          ctx.fillRect(wallCx - 4, wallCz - 2, 8, 4);

          const gateCx = center + 11 * scale;
          const gateCz = center + -9 * scale;
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(gateCx - 4, gateCz - 2, 8, 4);

          // Graves markers
          graves3DRef.current.forEach((g) => {
            const gx = center + g.x * scale;
            const gz = center + g.z * scale;

            ctx.beginPath();
            ctx.arc(gx, gz, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#c084fc';
            ctx.fill();
            ctx.strokeStyle = '#6b21a8';
            ctx.lineWidth = 1;
            ctx.stroke();
          });

          // Player indicator (Golden glowing arrowhead with rotation)
          const px = center + p.x * scale;
          const pz = center + p.z * scale;

          ctx.save();
          ctx.translate(px, pz);
          // Angle on radar canvas: screen X is right (+X), screen Y is down (+Z)
          // player currentRotation: 0 is +Z (down), PI/2 is +X (right)
          ctx.rotate(-p.currentRotation + Math.PI);

          // Field of vision cone
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.arc(0, 0, 16, -Math.PI / 3, Math.PI / 3);
          ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
          ctx.fill();

          // Arrowhead
          ctx.beginPath();
          ctx.moveTo(0, -6);
          ctx.lineTo(4, 5);
          ctx.lineTo(0, 3);
          ctx.lineTo(-4, 5);
          ctx.closePath();
          ctx.fillStyle = '#fbbf24';
          ctx.fill();
          ctx.strokeStyle = '#b45309';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.restore();
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      renderer.forceContextLoss();
    };
  }, []);

  // Synchronize live repository stats and dynamically erect new graves when repos are summoned
  useEffect(() => {
    const assets = graveAssetsRef.current;
    if (repos.length === 0 || !sceneRef.current || !assets) return;

    repos.forEach((repo, idx) => {
      const existing = graves3DRef.current.find((g) => g.repo.id === repo.id);
      if (existing) {
        existing.repo = repo;
      } else {
        // Erect a new 3D tombstone for the summoned repo!
        const pos = GRAVE_COORDS[idx] || {
          x: ((idx * 6) % 26) - 13,
          z: Math.floor(idx / 4) * 5 - 10,
        };

        const newGrave = buildGrave3D(
          repo,
          pos,
          offeringsRef.current,
          assets.waxMat,
          assets.flameGeo,
          assets.flameMat,
          assets.tombstoneMat,
          assets.moundMat
        );

        sceneRef.current?.add(newGrave.group);
        graves3DRef.current.push(newGrave);

        // Mystical Summoning Pillar / Beacon of Light
        const beaconGeo = new THREE.CylinderGeometry(0.5, 0.5, 14, 16);
        const beaconMat = new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.85,
          side: THREE.DoubleSide,
        });
        const beacon = new THREE.Mesh(beaconGeo, beaconMat);
        beacon.position.set(pos.x, 7, pos.z);
        sceneRef.current?.add(beacon);

        let fadeCount = 0;
        const fadeInterval = setInterval(() => {
          fadeCount++;
          beaconMat.opacity -= 0.025;
          if (fadeCount > 35 || beaconMat.opacity <= 0) {
            clearInterval(fadeInterval);
            sceneRef.current?.remove(beacon);
            beaconGeo.dispose();
            beaconMat.dispose();
          }
        }, 80);

        playProceduralSFX('gong');
        setHudMessage(`🪦 New Tombstone erected for "${repo.name}" with engraved stone epitaph!`);
        setTimeout(() => setHudMessage(null), 5500);

        // Pathfind player towards the newly summoned grave
        playerState.current.targetX = pos.x;
        playerState.current.targetZ = pos.z + 2.2;
        playerState.current.hasTarget = true;
        if (targetRingRef.current) {
          targetRingRef.current.position.set(pos.x, 0.08, pos.z + 2.2);
          (targetRingRef.current.material as THREE.MeshBasicMaterial).opacity = 0.9;
        }
      }
    });
  }, [repos, offerings]);

  return (
    <div className="relative w-full h-screen overflow-hidden select-none bg-[#080512]">
      
      {/* 2.5D WebGL Game Canvas Viewport */}
      <div ref={mountRef} className="w-full h-full block cursor-crosshair active:cursor-grabbing" />

      {/* ATMOSPHERIC CINEMATIC VIGNETTE & GOTHIC CORNER FILIGREE */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_45%,rgba(5,3,10,0.85)_100%)] z-10" />

      {/* TOP LEFT: RPG SOUL WANDERER GLOBE & PANTHEON STATUS */}
      <div className="absolute top-6 left-6 z-20 pointer-events-auto flex items-center space-x-3.5 animate-fade-in">
        {/* Burning Necromantic Orb */}
        <div className="relative group cursor-pointer" onClick={() => onOpenOfferingsWall()}>
          <div className="w-16 h-16 rounded-full bg-gradient-to-b from-amber-600/30 to-purple-950/80 border-2 border-amber-500/80 shadow-[0_0_30px_rgba(245,158,11,0.5)] flex items-center justify-center backdrop-blur-md overflow-hidden transition-transform duration-300 group-hover:scale-105">
            <span className="text-3xl animate-bounce drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]">🕯️</span>
            <div className="absolute inset-0 bg-gradient-to-t from-purple-900/60 via-transparent to-transparent pointer-events-none" />
          </div>
          <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-obsidian-950 font-mono text-[10px] font-bold shadow-md">
            LV.6
          </span>
        </div>

        {/* Player & World Stats Badge */}
        <div className="flex flex-col">
          <div className="flex items-center space-x-2">
            <h1 className="text-lg sm:text-xl font-bold font-serif-gothic text-amber-100 tracking-wider drop-shadow-md">
              OFRENDA DE CÓDIGO
            </h1>
            <span className="px-2 py-0.5 rounded-md bg-purple-900/80 border border-purple-500/50 text-[10px] font-mono text-purple-200">
              2.5D WORLD
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono text-amber-200/80 mt-1">
            <span className="flex items-center space-x-1">
              <Flame size={12} className="text-amber-400 fill-amber-400 animate-pulse" />
              <span>{totalCandles.toLocaleString()} Candles</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1">
              <span className="text-purple-400">🪦</span>
              <span>{repos.length} Tombs</span>
            </span>
            <span>•</span>
            <span className="flex items-center space-x-1 text-emerald-400">
              <Zap size={11} />
              <span>Gemma 2 Telepathic</span>
            </span>
          </div>
        </div>
      </div>

      {/* TOP RIGHT: ANTIQUE ASTRAL MINI-MAP (RADAR) & CONTROLS */}
      <div className="absolute top-6 right-6 z-20 pointer-events-auto flex flex-col items-end space-y-3 animate-fade-in">
        
        {/* The Astral Radar Canvas */}
        <div className="relative group">
          <div
            onClick={() => setMiniMapExpanded(!miniMapExpanded)}
            className={`rounded-full p-1 bg-obsidian-950/90 border-2 border-amber-600/60 shadow-[0_0_25px_rgba(217,119,6,0.35)] backdrop-blur-xl transition-all duration-300 cursor-pointer ${
              miniMapExpanded ? 'scale-125 origin-top-right' : 'hover:scale-105'
            }`}
            title="Astral Radar (M to expand)"
          >
            <canvas
              ref={miniMapCanvasRef}
              width={miniMapExpanded ? 190 : 130}
              height={miniMapExpanded ? 190 : 130}
              className="rounded-full block"
            />
          </div>

          {/* Compass Rose Coordinates Indicator */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-amber-400 bg-obsidian-950/90 px-1 rounded border border-amber-500/40">
            N
          </div>
        </div>

        {/* Quick Game Action Pills */}
        <div className="flex items-center space-x-2">
          {/* Dynamic Camera Zoom Controls */}
          <div className="flex items-center space-x-1 bg-obsidian-950/90 border border-amber-600/40 rounded-2xl p-1 shadow-xl backdrop-blur-md">
            <button
              onClick={handleZoomOut}
              title="Zoom Camera Out [- or Wheel Down]"
              className="p-1.5 rounded-xl hover:bg-amber-950/60 text-amber-300 transition-all active:scale-90"
            >
              <ZoomOut size={14} />
            </button>
            <span className="text-[10px] font-mono font-bold text-amber-200/90 px-1">
              {Math.round(currentZoomLevel * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              title="Zoom Camera In [+ or Wheel Up]"
              className="p-1.5 rounded-xl hover:bg-amber-950/60 text-amber-300 transition-all active:scale-90"
            >
              <ZoomIn size={14} />
            </button>
          </div>

          {/* Cathedral Sound Toggle */}
          <button
            onClick={onToggleSound}
            title={ambientSound ? 'Mute Cathedral Drone' : 'Play Cathedral Drone'}
            className="p-2.5 rounded-2xl bg-obsidian-950/90 border border-amber-600/40 text-amber-300 hover:bg-amber-950/60 shadow-xl backdrop-blur-md transition-all active:scale-95"
          >
            {ambientSound ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Codex of the Dead (Grimoire) */}
          <button
            onClick={() => setCodexOpen(!codexOpen)}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-amber-700/80 to-purple-800/80 hover:from-amber-600 hover:to-purple-700 text-amber-100 font-mono text-xs font-bold shadow-xl border border-amber-500/40 backdrop-blur-md transition-all active:scale-95"
          >
            <BookOpen size={14} className="text-amber-300" />
            <span>Codex [C]</span>
          </button>

          {/* Summon New Grave */}
          <button
            onClick={onOpenSummonModal}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-purple-800/90 to-indigo-900/90 hover:from-purple-700 hover:to-indigo-800 text-calavera-bone font-mono text-xs font-bold shadow-xl border border-purple-400/40 backdrop-blur-md transition-all active:scale-95"
          >
            <PlusCircle size={14} className="text-purple-300" />
            <span>Summon</span>
          </button>
        </div>
      </div>

      {/* TOP NOTIFICATION / LORE BROADCAST BANNER */}
      {hudMessage && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none animate-fade-in">
          <div className="px-5 py-2 rounded-full bg-obsidian-950/85 backdrop-blur-md border border-amber-500/40 text-amber-200 font-mono text-xs shadow-[0_0_20px_rgba(245,158,11,0.3)] flex items-center space-x-2">
            <Sparkles size={13} className="text-amber-400 animate-spin" />
            <span>{hudMessage}</span>
          </div>
        </div>
      )}

      {/* IN-WORLD SOUL SPEECH BALLOON POPPING UP DIRECTLY FROM THE SOUL WISP */}
      <div
        ref={wispDialogueRef}
        className="absolute top-0 left-0 pointer-events-none z-30 transition-opacity duration-200 will-change-transform opacity-0"
      >
        {activeWhisper && (
          <div className="relative -translate-x-1/2 -translate-y-full mb-3.5 pointer-events-auto">
            {/* Ethereal Dialogue Speech Bubble */}
            <div className="relative max-w-xs sm:max-w-sm px-4 py-3 rounded-2xl bg-[#18092e]/95 backdrop-blur-xl border border-purple-400/70 shadow-[0_0_35px_rgba(168,85,247,0.65),0_12px_24px_rgba(0,0,0,0.85)] text-left select-none animate-in fade-in zoom-in-95 duration-200">
              
              {/* Glow Ambient Accent */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-purple-500/10 via-transparent to-pink-500/10 pointer-events-none" />

              {/* Header */}
              <div className="flex items-center justify-between text-[10px] font-mono text-purple-300 mb-1 border-b border-purple-800/40 pb-1">
                <span className="flex items-center space-x-1">
                  <span className="text-amber-400 text-xs animate-pulse">✨</span>
                  <span className="font-bold text-amber-200 uppercase tracking-wider">{activeWhisper.repo}</span>
                </span>
                <span className="text-[9px] text-purple-400/80 font-mono">Soul Whisper</span>
              </div>

              {/* Devotee Prayer Message */}
              <p className="text-xs font-serif italic text-purple-100 leading-relaxed my-1 drop-shadow-sm">
                "{activeWhisper.text}"
              </p>

              {/* Devotee Author */}
              <div className="flex items-center justify-between text-[10px] font-mono text-purple-300/80 mt-1.5 pt-1 border-t border-purple-800/30">
                <span className="text-purple-300 font-semibold">— {activeWhisper.author}</span>
                <span className="text-[9px] text-purple-400/60 font-mono">Devotee Prayer</span>
              </div>

              {/* Speech Bubble Downward Caret Tail pointing straight down to the soul orb */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-[#18092e]" />
              <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-t-[9px] border-t-purple-400/70 -z-10" />
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM CENTER: SOULS-LIKE IN-WORLD ACTION BANNER */}
      {activePrompt && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-30 pointer-events-auto animate-fade-in w-full max-w-lg px-4">
          <div className="p-4 rounded-2xl bg-obsidian-950/95 backdrop-blur-xl border-2 border-amber-500/70 shadow-[0_0_40px_rgba(245,158,11,0.5)] flex items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-500/40 flex items-center justify-center text-xl">
                {activePrompt.type === 'altar' ? '🕯️' : activePrompt.type === 'wall' ? '📜' : activePrompt.type === 'gate' ? '⚡' : '🪦'}
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold font-serif-gothic text-amber-100">
                  {activePrompt.text}
                </h3>
                <p className="text-[11px] text-amber-200/70 font-mono">
                  {activePrompt.subtext}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={activePrompt.action}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-obsidian-950 font-mono font-bold text-xs uppercase tracking-wider shadow-lg transform active:scale-95 transition-all"
              >
                Enter [E]
              </button>

              {activePrompt.secondaryAction && (
                <button
                  onClick={activePrompt.secondaryAction}
                  className="px-3.5 py-2 rounded-xl bg-purple-900/80 hover:bg-purple-800 text-purple-200 font-mono text-xs border border-purple-500/40 transition-colors"
                >
                  {activePrompt.secondaryText || '[R]'}
                </button>
              )}

              {activePrompt.tertiaryAction && (
                <button
                  onClick={activePrompt.tertiaryAction}
                  className="px-3 py-2 rounded-xl bg-amber-900/80 hover:bg-amber-800 text-amber-200 font-mono text-xs border border-amber-500/40 flex items-center space-x-1 transition-colors"
                >
                  <Eye size={12} className="text-amber-300" />
                  <span>{activePrompt.tertiaryText || '[Z] Inspect'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM CENTER: DIABLO / ELDEN RING ACTION HOTBAR */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-auto flex items-center space-x-2 p-2 rounded-2xl bg-obsidian-950/90 border-2 border-purple-900/60 shadow-[0_0_35px_rgba(0,0,0,0.8)] backdrop-blur-xl">
        
        {/* Slot 1: Scatter Petals */}
        <button
          onClick={handleScatterPetals}
          title="Scatter Cempasúchil Petals [Key 1]"
          className="relative group w-12 h-12 rounded-xl bg-gradient-to-b from-amber-950/60 to-obsidian-900 border border-amber-600/40 hover:border-amber-400 flex flex-col items-center justify-center transition-all active:scale-95"
        >
          <span className="text-lg">🌼</span>
          <span className="absolute top-1 left-1.5 text-[9px] font-mono font-bold text-amber-400/80">1</span>
        </button>

        {/* Slot 2: Kindle Candle */}
        <button
          onClick={handleKindleAction}
          title="Kindle Sacred Candle [Key 2]"
          className={`relative group w-12 h-12 rounded-xl bg-gradient-to-b from-amber-950/60 to-obsidian-900 border flex flex-col items-center justify-center transition-all active:scale-95 ${
            activePrompt?.type === 'grave' || activePrompt?.type === 'altar'
              ? 'border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
              : 'border-amber-600/40 hover:border-amber-400'
          }`}
        >
          <span className="text-lg">🕯️</span>
          <span className="absolute top-1 left-1.5 text-[9px] font-mono font-bold text-amber-400/80">2</span>
        </button>

        {/* Slot 3: Séance / Commune with Spirit */}
        <button
          onClick={() => {
            if (activePrompt?.targetRepo) onOpenContract(activePrompt.targetRepo, 'seance');
            else if (repos.length > 0) onOpenContract(repos[0], 'seance');
          }}
          title="Séance with Ghost [Key 3 or E]"
          className={`relative group w-12 h-12 rounded-xl bg-gradient-to-b from-purple-950/60 to-obsidian-900 border flex flex-col items-center justify-center transition-all active:scale-95 ${
            activePrompt?.type === 'grave'
              ? 'border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.5)]'
              : 'border-purple-600/40 hover:border-purple-400'
          }`}
        >
          <span className="text-lg">🔮</span>
          <span className="absolute top-1 left-1.5 text-[9px] font-mono font-bold text-purple-300/80">3</span>
        </button>

        {/* Slot 4: Pact of Transmutation (Resurrection) */}
        <button
          onClick={() => {
            if (activePrompt?.targetRepo) onOpenContract(activePrompt.targetRepo, 'resurrection');
            else if (repos.length > 0) onOpenContract(repos[0], 'resurrection');
          }}
          title="Pact of Transmutation [Key 4 or R]"
          className="relative group w-12 h-12 rounded-xl bg-gradient-to-b from-rose-950/60 to-obsidian-900 border border-rose-600/40 hover:border-rose-400 flex flex-col items-center justify-center transition-all active:scale-95"
        >
          <span className="text-lg">📜</span>
          <span className="absolute top-1 left-1.5 text-[9px] font-mono font-bold text-rose-300/80">4</span>
        </button>

        {/* Slot 5: Devotee Memorial Wall */}
        <button
          onClick={onOpenOfferingsWall}
          title="Devotee Memorial Wall [Key 5]"
          className="relative group w-12 h-12 rounded-xl bg-gradient-to-b from-indigo-950/60 to-obsidian-900 border border-indigo-600/40 hover:border-indigo-400 flex flex-col items-center justify-center transition-all active:scale-95"
        >
          <span className="text-lg">🪦</span>
          <span className="absolute top-1 left-1.5 text-[9px] font-mono font-bold text-indigo-300/80">5</span>
        </button>

        {/* Slot 6: Summon Repository Grave */}
        <button
          onClick={onOpenSummonModal}
          title="Summon Departed Repository Grave [Key G]"
          className="relative group w-12 h-12 rounded-xl bg-gradient-to-b from-sky-950/60 to-obsidian-900 border border-sky-600/40 hover:border-sky-400 flex flex-col items-center justify-center transition-all active:scale-95"
        >
          <span className="text-lg">⚡</span>
          <span className="absolute top-1 left-1.5 text-[9px] font-mono font-bold text-sky-300/80">G</span>
        </button>

        <div className="w-[1px] h-8 bg-purple-900/60 mx-1" />

        {/* Slot Space: Spectral Dash */}
        <button
          onClick={performDash}
          title="Spectral Dash [Spacebar]"
          className="relative group px-3 h-12 rounded-xl bg-gradient-to-r from-amber-600/80 to-purple-700/80 hover:from-amber-500 hover:to-purple-600 border border-amber-400/50 flex items-center space-x-1.5 text-calavera-bone text-xs font-mono font-bold shadow-lg active:scale-95 transition-all"
        >
          <Zap size={14} className="text-amber-300 animate-pulse" />
          <span>Dash [Space]</span>
        </button>

      </div>

      {/* BOTTOM LEFT: CONTROLS & PATHFINDING GUIDE */}
      <div className="absolute bottom-6 left-6 z-20 pointer-events-none hidden md:flex flex-col space-y-1 bg-obsidian-950/85 backdrop-blur-md p-3 rounded-2xl border border-purple-900/40 text-[11px] font-mono text-purple-300/70 shadow-xl">
        <div className="flex items-center space-x-2 text-amber-300/90 font-bold">
          <Footprints size={12} />
          <span>Smooth Kinematics Active</span>
        </div>
        <div>🎮 <strong>WASD / Arrows</strong>: Smooth glide & persistent facing</div>
        <div>🎯 <strong>Click Ground</strong>: Raycasted pathfinding target</div>
        <div>⚡ <strong>Spacebar</strong>: Instant spectral dash</div>
      </div>

      {/* ANCIENT CODEX OF THE DEAD (GRIMOIRE MODAL) */}
      {codexOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-obsidian-950/80 backdrop-blur-md animate-fade-in pointer-events-auto">
          <div className="relative w-full max-w-3xl rounded-3xl bg-gradient-to-b from-[#181126] to-[#0c0915] border-2 border-amber-600/60 shadow-[0_0_50px_rgba(217,119,6,0.4)] p-6 sm:p-8 max-h-[88vh] overflow-y-auto">
            
            {/* Grimoire Header */}
            <div className="flex items-center justify-between pb-4 border-b border-amber-600/30">
              <div className="flex items-center space-x-3">
                <BookOpen size={24} className="text-amber-400" />
                <div>
                  <h3 className="text-xl font-bold font-serif-gothic text-amber-100">
                    CODEX OF THE DEPARTED REPOSITORIES
                  </h3>
                  <p className="text-xs font-mono text-amber-300/70">
                    Tome of Open Source Spirits Resting in this Cemetery
                  </p>
                </div>
              </div>

              <button
                onClick={() => setCodexOpen(false)}
                className="p-2 rounded-full bg-obsidian-900 hover:bg-obsidian-800 text-amber-300 border border-amber-600/30"
              >
                ✕
              </button>
            </div>

            {/* List of Graves in Codex */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {repos.map((repo, idx) => {
                const coords = GRAVE_COORDS[idx] || { x: 0, z: 0 };
                return (
                  <div
                    key={repo.id}
                    className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/20 hover:border-amber-500/60 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="text-base font-bold font-serif-gothic text-calavera-bone">
                          {repo.name}
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-900/60 text-purple-300">
                          {repo.yearsActive}
                        </span>
                      </div>
                      <p className="text-xs font-mono text-purple-300/80 mt-1 line-clamp-2">
                        {repo.epitaph}
                      </p>
                      <div className="mt-2 text-[11px] font-mono text-amber-300/80">
                        ★ {repo.starsAtSunset.toLocaleString()} Stars • 🕯️ {repo.candlesLit} Candles
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-purple-900/40 flex items-center space-x-2">
                      <button
                        onClick={() => handleWalkToGrave(coords.x, coords.z)}
                        className="flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-xl bg-amber-600/80 hover:bg-amber-500 text-obsidian-950 text-xs font-mono font-bold transition-all"
                      >
                        <Navigation size={13} />
                        <span>Walk to Grave</span>
                      </button>

                      <button
                        onClick={() => {
                          onOpenContract(repo, 'seance');
                          setCodexOpen(false);
                        }}
                        className="px-3 py-2 rounded-xl bg-purple-900/80 hover:bg-purple-800 text-purple-200 text-xs font-mono transition-all"
                      >
                        Commune
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}

      {/* 3D TOMBSTONE INSPECTION MODE CINEMATIC OVERLAY */}
      {inspectingGrave && (
        <div className="fixed inset-0 z-40 pointer-events-none flex flex-col justify-between animate-fade-in">
          {/* Top Cinematic Letterbox Bar */}
          <div className="w-full h-16 sm:h-20 bg-gradient-to-b from-black/90 via-black/60 to-transparent flex items-center justify-between px-6 pointer-events-auto">
            <div className="flex items-center space-x-3">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span className="text-xs font-mono uppercase tracking-widest text-amber-200/90 font-bold">
                TOMBSTONE INSPECTION MODE
              </span>
            </div>

            <button
              onClick={() => toggleInspectGrave()}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-obsidian-950/80 hover:bg-obsidian-900 border border-amber-500/40 text-amber-200 font-mono text-xs transition-all active:scale-95"
            >
              <span>Step Back [Z / Esc]</span>
              <span className="text-amber-400 font-bold">✕</span>
            </button>
          </div>

          {/* Bottom Cinematic Relic Inspection Card */}
          <div className="w-full bg-gradient-to-t from-black/95 via-obsidian-950/90 to-transparent pt-12 pb-8 px-6 flex justify-center pointer-events-auto">
            <div className="w-full max-w-2xl rounded-3xl bg-[#130b24]/90 backdrop-blur-xl border-2 border-amber-500/50 p-6 shadow-[0_0_60px_rgba(245,158,11,0.35)] flex flex-col space-y-4">
              
              {/* Header */}
              <div className="flex items-start justify-between border-b border-amber-500/20 pb-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">🪦</span>
                    <h3 className="text-2xl font-bold font-serif-gothic text-amber-100 tracking-wider">
                      {inspectingGrave.name}
                    </h3>
                  </div>
                  <p className="text-xs font-mono text-purple-300 mt-0.5">
                    Resting since {inspectingGrave.yearsActive} • Chiseled Stone Epitaph
                  </p>
                </div>

                <div className="flex items-center space-x-2 font-mono text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300">
                    ★ {inspectingGrave.starsAtSunset.toLocaleString()} Stars
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-500/40 text-purple-200">
                    🕯️ {inspectingGrave.candlesLit} Candles
                  </span>
                </div>
              </div>

              {/* Stone Carved Inscription */}
              <div className="p-3.5 rounded-xl bg-obsidian-950/60 border border-purple-800/30">
                <p className="text-xs sm:text-sm font-serif italic text-purple-100 leading-relaxed text-center">
                  "{inspectingGrave.epitaph}"
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-1 gap-3">
                <button
                  onClick={() => {
                    toggleInspectGrave();
                    onOpenContract(inspectingGrave, 'seance');
                  }}
                  className="flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-700 hover:to-indigo-700 text-purple-100 font-mono text-xs font-bold shadow-lg transition-all active:scale-95"
                >
                  <span>🔮 Commune [E]</span>
                </button>

                <button
                  onClick={() => {
                    toggleInspectGrave();
                    onOpenContract(inspectingGrave, 'resurrection');
                  }}
                  className="flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-gradient-to-r from-rose-800 to-amber-800 hover:from-rose-700 hover:to-amber-700 text-rose-100 font-mono text-xs font-bold shadow-lg transition-all active:scale-95"
                >
                  <span>📜 Resurrect [R]</span>
                </button>

                <button
                  onClick={() => toggleInspectGrave()}
                  className="px-4 py-2.5 rounded-xl bg-obsidian-900 hover:bg-obsidian-800 border border-amber-600/40 text-amber-300 font-mono text-xs transition-all active:scale-95"
                >
                  <span>Back [Z]</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
