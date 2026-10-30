import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { DepartedRepo, AltarOffering } from '../types';
import { Ghost, Flame, Sparkles, Scroll, PlusCircle, Volume2, VolumeX, Compass, Feather } from 'lucide-react';

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
  candleLights: THREE.PointLight[];
  wisps: { mesh: THREE.Mesh; angle: number; radius: number; speed: number; prayer: string; author: string }[];
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
  const [activePrompt, setActivePrompt] = useState<{
    text: string;
    subtext: string;
    action: () => void;
    secondaryAction?: () => void;
    secondaryText?: string;
  } | null>(null);

  const [activeWhisper, setActiveWhisper] = useState<{ text: string; author: string; repo: string } | null>(null);
  const [directoryOpen, setDirectoryOpen] = useState(false);

  // References to animate in render loop
  const sceneRef = useRef<THREE.Scene | null>(null);
  const playerMeshRef = useRef<THREE.Group | null>(null);
  const playerLightRef = useRef<THREE.PointLight | null>(null);
  const graves3DRef = useRef<Grave3D[]>([]);
  const petalsMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const petalDataRef = useRef<{ pos: THREE.Vector3; rot: THREE.Euler; speed: number; rotSpeed: THREE.Vector3 }[]>([]);

  // Player State in 3D Space (X, Z plane; Y is up)
  const playerState = useRef({
    x: 0,
    z: 6,
    vx: 0,
    vz: 0,
    speed: 0.16,
    targetX: 0,
    targetZ: 6,
    rotation: 0,
    walkCycle: 0,
    isWalking: false,
  });

  const keysPressed = useRef<{ [key: string]: boolean }>({});

  // Input Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true;

      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', ' '].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }

      if ((e.key.toLowerCase() === 'e' || e.key === 'Enter') && activePrompt) {
        activePrompt.action();
      }

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

  // Main Three.js 2.5D World Setup & Animation Loop
  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // 1. Scene & 2.5D Perspective Camera (Tilted ~48° Downward)
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x0a0714, 0.038);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 11, 11);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;

    mountRef.current.appendChild(renderer.domElement);

    // 2. Atmospheric Ambient & Directional Moonlight
    const ambientLight = new THREE.AmbientLight(0x1c132b, 1.4);
    scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(0x523880, 1.6);
    moonLight.position.set(12, 22, 10);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 2048;
    moonLight.shadow.mapSize.height = 2048;
    moonLight.shadow.camera.near = 0.5;
    moonLight.shadow.camera.far = 40;
    moonLight.shadow.camera.left = -20;
    moonLight.shadow.camera.right = 20;
    moonLight.shadow.camera.top = 20;
    moonLight.shadow.camera.bottom = -20;
    scene.add(moonLight);

    // 3. 3D Ground Terrain & Gothic Pathways
    // Base dark earth plane
    const groundGeo = new THREE.PlaneGeometry(60, 60, 32, 32);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0c0915,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Cobblestone Pathways (Crossroads intersecting at Central Altar)
    const pathMat = new THREE.MeshStandardMaterial({
      color: 0x181224,
      roughness: 0.8,
    });

    // Central circular plaza slab
    const plazaGeo = new THREE.CylinderGeometry(4.2, 4.2, 0.08, 32);
    const plaza = new THREE.Mesh(plazaGeo, pathMat);
    plaza.position.set(0, 0.04, 0);
    plaza.receiveShadow = true;
    scene.add(plaza);

    // North-South avenue
    const nsPathGeo = new THREE.BoxGeometry(2.4, 0.06, 45);
    const nsPath = new THREE.Mesh(nsPathGeo, pathMat);
    nsPath.position.set(0, 0.03, 0);
    nsPath.receiveShadow = true;
    scene.add(nsPath);

    // East-West avenue
    const ewPathGeo = new THREE.BoxGeometry(45, 0.06, 2.4);
    const ewPath = new THREE.Mesh(ewPathGeo, pathMat);
    ewPath.position.set(0, 0.03, 0);
    ewPath.receiveShadow = true;
    scene.add(ewPath);

    // 4. Perimeter Gothic Wrought Iron Fences
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0x1d142b, roughness: 0.7 });
    const fenceBarGeo = new THREE.BoxGeometry(50, 0.8, 0.1);
    
    // North, South, East, West fence walls
    const fNorth = new THREE.Mesh(fenceBarGeo, fenceMat);
    fNorth.position.set(0, 0.4, -25);
    scene.add(fNorth);

    const fSouth = new THREE.Mesh(fenceBarGeo, fenceMat);
    fSouth.position.set(0, 0.4, 25);
    scene.add(fSouth);

    const fEast = new THREE.Mesh(fenceBarGeo, fenceMat);
    fEast.rotation.y = Math.PI / 2;
    fEast.position.set(25, 0.4, 0);
    scene.add(fEast);

    const fWest = new THREE.Mesh(fenceBarGeo, fenceMat);
    fWest.rotation.y = Math.PI / 2;
    fWest.position.set(-25, 0.4, 0);
    scene.add(fWest);

    // 5. 3D Dead Gnarled Trees
    const treeMat = new THREE.MeshStandardMaterial({ color: 0x090610, roughness: 0.95 });
    const treePositions = [
      [-12, -12], [12, -12], [-14, 12], [14, 14], [-6, -18], [8, -18]
    ];

    treePositions.forEach(([tx, tz]) => {
      const trunkGeo = new THREE.CylinderGeometry(0.35, 0.6, 4.5, 8);
      const trunk = new THREE.Mesh(trunkGeo, treeMat);
      trunk.position.set(tx, 2.2, tz);
      trunk.castShadow = true;
      scene.add(trunk);

      // Twisted branches
      const branchGeo = new THREE.CylinderGeometry(0.12, 0.22, 2.8, 6);
      const b1 = new THREE.Mesh(branchGeo, treeMat);
      b1.position.set(tx - 0.7, 4, tz);
      b1.rotation.z = Math.PI / 3.8;
      b1.castShadow = true;
      scene.add(b1);

      const b2 = new THREE.Mesh(branchGeo, treeMat);
      b2.position.set(tx + 0.8, 4.2, tz + 0.2);
      b2.rotation.z = -Math.PI / 3.2;
      b2.castShadow = true;
      scene.add(b2);
    });

    // 6. 3D CENTRAL ALTR / MAUSOLEUM OF ETERNAL FLAME
    const altarGroup = new THREE.Group();
    altarGroup.position.set(0, 0, 0);

    // Tier 1 Base
    const aBaseGeo = new THREE.CylinderGeometry(2.6, 2.8, 0.4, 24);
    const aBaseMat = new THREE.MeshStandardMaterial({ color: 0x1f1730, roughness: 0.75 });
    const aBase = new THREE.Mesh(aBaseGeo, aBaseMat);
    aBase.position.y = 0.2;
    aBase.receiveShadow = true;
    altarGroup.add(aBase);

    // Tier 2 Stone Pedestal
    const aTier2Geo = new THREE.BoxGeometry(2.2, 0.6, 1.4);
    const aTier2 = new THREE.Mesh(aTier2Geo, aBaseMat);
    aTier2.position.y = 0.6;
    aTier2.castShadow = true;
    aTier2.receiveShadow = true;
    altarGroup.add(aTier2);

    // 3D Central Candelabra Candles
    const waxMat = new THREE.MeshStandardMaterial({ color: 0xfdf8ee, roughness: 0.3 });
    const flameGeo = new THREE.SphereGeometry(0.08, 12, 12);
    flameGeo.scale(1, 2, 1);
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa11 });

    const centerCandlePositions = [
      { x: 0, y: 0.9, z: 0, h: 0.7, r: 0.1 },
      { x: -0.5, y: 0.9, z: 0, h: 0.5, r: 0.08 },
      { x: 0.5, y: 0.9, z: 0, h: 0.5, r: 0.08 },
      { x: -0.8, y: 0.9, z: 0.3, h: 0.4, r: 0.07 },
      { x: 0.8, y: 0.9, z: 0.3, h: 0.4, r: 0.07 },
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

    // Central Warm Shrine Light
    const altarLight = new THREE.PointLight(0xff9922, 4.5, 9);
    altarLight.position.set(0, 2.2, 0);
    altarLight.castShadow = true;
    altarGroup.add(altarLight);

    scene.add(altarGroup);

    // 7. 3D MEMORIAL WEAPING WALL (North-West)
    const wallGroup = new THREE.Group();
    wallGroup.position.set(-10, 0, -8);

    const wGeo = new THREE.BoxGeometry(4.5, 2.4, 0.4);
    const wMat = new THREE.MeshStandardMaterial({ color: 0x221738, roughness: 0.8 });
    const wallMesh = new THREE.Mesh(wGeo, wMat);
    wallMesh.position.y = 1.2;
    wallMesh.castShadow = true;
    wallMesh.receiveShadow = true;
    wallGroup.add(wallMesh);

    // Purple shrine glow
    const wallLight = new THREE.PointLight(0xa855f7, 3.2, 7);
    wallLight.position.set(0, 1.8, 0.8);
    wallGroup.add(wallLight);
    scene.add(wallGroup);

    // 8. 3D SUMMONING OBELISK (North-East)
    const gateGroup = new THREE.Group();
    gateGroup.position.set(10, 0, -8);

    const obeliskGeo = new THREE.CylinderGeometry(0.2, 0.7, 3.8, 4);
    const obeliskMat = new THREE.MeshStandardMaterial({ color: 0x151b2e, roughness: 0.6 });
    const obelisk = new THREE.Mesh(obeliskGeo, obeliskMat);
    obelisk.position.y = 1.9;
    obelisk.rotation.y = Math.PI / 4;
    obelisk.castShadow = true;
    gateGroup.add(obelisk);

    // Blue summoning light
    const gateLight = new THREE.PointLight(0x38bdf8, 3.2, 7);
    gateLight.position.set(0, 2.2, 0);
    gateGroup.add(gateLight);
    scene.add(gateGroup);

    // 9. 3D TOMBSTONES FOR EACH REPO
    const graveCoords = [
      { x: -5.5, z: 2 },    // request
      { x: 5.5, z: 2 },     // moment
      { x: -7, z: -3 },     // urllib2
      { x: 7, z: -3 },      // coffeescript
      { x: -4, z: 9 },      // bower
      { x: 4, z: 9 },       // enzyme
    ];

    const graves3D: Grave3D[] = [];

    repos.forEach((repo, idx) => {
      const pos = graveCoords[idx] || {
        x: ((idx * 5) % 18) - 9,
        z: Math.floor(idx / 4) * 6 - 8,
      };

      const gGroup = new THREE.Group();
      gGroup.position.set(pos.x, 0, pos.z);

      // Grave Mound Earth
      const moundGeo = new THREE.CylinderGeometry(0.8, 1.1, 0.15, 16);
      const moundMat = new THREE.MeshStandardMaterial({ color: 0x140e1f, roughness: 0.9 });
      const mound = new THREE.Mesh(moundGeo, moundMat);
      mound.position.y = 0.08;
      mound.receiveShadow = true;
      gGroup.add(mound);

      // 3D Stone Tombstone with Depth
      const tombstoneGeo = new THREE.BoxGeometry(1.2, 1.5, 0.35);
      const tombstoneMat = new THREE.MeshStandardMaterial({
        color: 0x261b36,
        roughness: 0.8,
      });
      const tombstone = new THREE.Mesh(tombstoneGeo, tombstoneMat);
      tombstone.position.y = 0.85;
      tombstone.castShadow = true;
      tombstone.receiveShadow = true;
      gGroup.add(tombstone);

      // Arched Headstone Top
      const archGeo = new THREE.CylinderGeometry(0.6, 0.6, 0.35, 16);
      archGeo.rotateZ(Math.PI / 2);
      const arch = new THREE.Mesh(archGeo, tombstoneMat);
      arch.position.set(0, 1.6, 0);
      arch.castShadow = true;
      gGroup.add(arch);

      // 3D Candles at Base of Tombstone
      const candleLights: THREE.PointLight[] = [];

      [-0.45, 0.45].forEach((cx) => {
        const cGeo = new THREE.CylinderGeometry(0.06, 0.07, 0.35, 12);
        const candle = new THREE.Mesh(cGeo, waxMat);
        candle.position.set(cx, 0.25, 0.35);
        candle.castShadow = true;
        gGroup.add(candle);

        const fl = new THREE.Mesh(flameGeo, flameMat);
        fl.position.set(cx, 0.48, 0.35);
        gGroup.add(fl);

        const pLight = new THREE.PointLight(0xff9922, 1.2, 3.5);
        pLight.position.set(cx, 0.55, 0.35);
        gGroup.add(pLight);
        candleLights.push(pLight);
      });

      // 3D Floating Soul Wisps (Orbiting Grave)
      const wisps: Grave3D['wisps'] = [];
      const graveOfferings = offerings.filter((o) => o.repoId === repo.id);
      const prayerCount = Math.max(1, Math.min(3, graveOfferings.length || 1));

      const wispGeo = new THREE.SphereGeometry(0.12, 16, 16);
      const wispMat = new THREE.MeshStandardMaterial({
        color: 0xd946ef,
        emissive: 0xa855f7,
        emissiveIntensity: 0.9,
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
          radius: 1.1 + i * 0.35,
          speed: 0.018 + (i % 2 === 0 ? 0.005 : -0.005),
          prayer: off.message,
          author: off.authorName,
        });
      }

      scene.add(gGroup);

      graves3D.push({
        repo,
        group: gGroup,
        x: pos.x,
        z: pos.z,
        candleLights,
        wisps,
      });
    });

    graves3DRef.current = graves3D;

    // 10. 3D DRIFTING MARIGOLD PETALS (InstancedMesh)
    const petalCount = 180;
    const petalGeo = new THREE.PlaneGeometry(0.1, 0.16);
    const petalMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      roughness: 0.5,
      emissive: 0x7c2d12,
      emissiveIntensity: 0.4,
    });

    const instancedPetals = new THREE.InstancedMesh(petalGeo, petalMat, petalCount);
    const dummy = new THREE.Object3D();
    const petalData: { pos: THREE.Vector3; rot: THREE.Euler; speed: number; rotSpeed: THREE.Vector3 }[] = [];

    for (let i = 0; i < petalCount; i++) {
      const pos = new THREE.Vector3(
        (Math.random() - 0.5) * 40,
        Math.random() * 8,
        (Math.random() - 0.5) * 40
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

    // 11. 3D PLAYER CHARACTER (Necromancer Avatar with Lantern)
    const playerGroup = new THREE.Group();
    playerGroup.position.set(0, 0, 6);

    // Robe
    const robeGeo = new THREE.ConeGeometry(0.42, 1.4, 16);
    const robeMat = new THREE.MeshStandardMaterial({ color: 0x2e1065, roughness: 0.7 });
    const robe = new THREE.Mesh(robeGeo, robeMat);
    robe.position.y = 0.7;
    robe.castShadow = true;
    playerGroup.add(robe);

    // Hood / Head
    const hoodGeo = new THREE.SphereGeometry(0.24, 16, 16);
    const hoodMat = new THREE.MeshStandardMaterial({ color: 0x4c1d95, roughness: 0.6 });
    const hood = new THREE.Mesh(hoodGeo, hoodMat);
    hood.position.y = 1.35;
    hood.castShadow = true;
    playerGroup.add(hood);

    // Glowing Amber Eyes in Hood
    const eyeGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.08, 1.34, 0.2);
    playerGroup.add(eyeL);

    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.08, 1.34, 0.2);
    playerGroup.add(eyeR);

    // 3D Golden Lantern in Hand
    const lanternStaffGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.2, 8);
    const staffMat = new THREE.MeshStandardMaterial({ color: 0x3d2a14 });
    const staff = new THREE.Mesh(lanternStaffGeo, staffMat);
    staff.position.set(0.45, 0.8, 0.2);
    staff.rotation.z = -Math.PI / 12;
    playerGroup.add(staff);

    const lanternBoxGeo = new THREE.BoxGeometry(0.18, 0.24, 0.18);
    const lanternBoxMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.3 });
    const lanternBox = new THREE.Mesh(lanternBoxGeo, lanternBoxMat);
    lanternBox.position.set(0.55, 0.95, 0.2);
    playerGroup.add(lanternBox);

    // Dynamic Player Lantern Light (Casts real-time 3D shadow across cemetery)
    const playerLight = new THREE.PointLight(0xffaa33, 3.2, 11);
    playerLight.position.set(0.55, 1.1, 0.2);
    playerLight.castShadow = true;
    playerGroup.add(playerLight);
    playerLightRef.current = playerLight;

    scene.add(playerGroup);
    playerMeshRef.current = playerGroup;

    // 12. Mouse Click-to-Move Raycasting onto 3D Ground
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(ground);

      if (intersects.length > 0) {
        const point = intersects[0].point;
        playerState.current.targetX = point.x;
        playerState.current.targetZ = point.z;
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // 13. Game Animation & Physics Loop
    let clock = new THREE.Clock();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();
      const p = playerState.current;
      const keys = keysPressed.current;

      // Handle Keyboard Movement
      let dx = 0;
      let dz = 0;

      if (keys['w'] || keys['arrowup']) dz -= 1;
      if (keys['s'] || keys['arrowdown']) dz += 1;
      if (keys['a'] || keys['arrowleft']) dx -= 1;
      if (keys['d'] || keys['arrowright']) dx += 1;

      if (dx !== 0 || dz !== 0) {
        const len = Math.hypot(dx, dz);
        p.vx = (dx / len) * p.speed;
        p.vz = (dz / len) * p.speed;
        p.targetX = p.x;
        p.targetZ = p.z;
        p.rotation = Math.atan2(dx, dz);
        p.isWalking = true;
      } else {
        // Click-to-move interpolation
        const toX = p.targetX - p.x;
        const toZ = p.targetZ - p.z;
        const dist = Math.hypot(toX, toZ);

        if (dist > 0.15) {
          p.vx = (toX / dist) * p.speed;
          p.vz = (toZ / dist) * p.speed;
          p.rotation = Math.atan2(toX, toZ);
          p.isWalking = true;
        } else {
          p.vx = 0;
          p.vz = 0;
          p.isWalking = false;
        }
      }

      // Update Player position with cemetery boundary limit
      p.x = Math.max(-23, Math.min(23, p.x + p.vx));
      p.z = Math.max(-23, Math.min(23, p.z + p.vz));

      if (playerMeshRef.current) {
        playerMeshRef.current.position.set(p.x, 0, p.z);
        playerMeshRef.current.rotation.y = p.rotation;

        if (p.isWalking) {
          p.walkCycle += 0.2;
          playerMeshRef.current.position.y = Math.sin(p.walkCycle) * 0.08;
        } else {
          playerMeshRef.current.position.y = 0;
        }
      }

      // 2.5D Isometric Camera Tracking (Follows Player smoothly)
      camera.position.x += (p.x - camera.position.x) * 0.06;
      camera.position.z += (p.z + 10 - camera.position.z) * 0.06;
      camera.position.y = 10.5;
      camera.lookAt(p.x, 0.8, p.z);

      // Flickering Lantern Light Physics
      if (playerLightRef.current) {
        const flicker = Math.sin(elapsedTime * 14) * 0.25 + Math.cos(elapsedTime * 22) * 0.15;
        playerLightRef.current.intensity = 3.2 + flicker;
      }

      // Update 3D Graves, Candle Lights, and Orbiting Soul Wisps
      let touchingWispText: { text: string; author: string; repo: string } | null = null;
      let closestPrompt: typeof activePrompt = null;
      let minDistance = Infinity;

      graves3DRef.current.forEach((grave) => {
        const dist = Math.hypot(p.x - grave.x, p.z - grave.z);

        // Candle light flicker
        grave.candleLights.forEach((light, lIdx) => {
          light.intensity = 1.2 + Math.sin(elapsedTime * 9 + lIdx) * 0.2;
        });

        // Orbiting Soul Wisps in 3D
        grave.wisps.forEach((w) => {
          w.angle += w.speed;
          w.mesh.position.x = Math.cos(w.angle) * w.radius;
          w.mesh.position.z = Math.sin(w.angle) * w.radius;
          w.mesh.position.y = 1.2 + Math.sin(elapsedTime * 2 + w.angle) * 0.25;

          // Check if player walks into wisp
          const worldWispX = grave.x + w.mesh.position.x;
          const worldWispZ = grave.z + w.mesh.position.z;
          const wDist = Math.hypot(p.x - worldWispX, p.z - worldWispZ);

          if (wDist < 0.9 && !touchingWispText) {
            touchingWispText = {
              text: w.prayer,
              author: w.author,
              repo: grave.repo.name,
            };
          }
        });

        // Check Grave Proximity
        if (dist < 2.4 && dist < minDistance) {
          minDistance = dist;
          closestPrompt = {
            text: `[E] Commune with ${grave.repo.name}`,
            subtext: `Speak with the spirit via Gemma 2 or sign the Pact of Transmutation`,
            action: () => onOpenContract(grave.repo, 'seance'),
            secondaryAction: () => onOpenContract(grave.repo, 'resurrection'),
            secondaryText: '[R] Resurrect',
          };
        }
      });

      // Check Central Altar Proximity (0, 0)
      const distToAltar = Math.hypot(p.x - 0, p.z - 0);
      if (distToAltar < 3.2 && distToAltar < minDistance) {
        minDistance = distToAltar;
        closestPrompt = {
          text: `[E] Enter 3D Candle Sanctuary`,
          subtext: `Light 3D candles on the stone pedestal and listen to cathedral eulogies`,
          action: () => {
            if (repos.length > 0) onOpen3DAltar(repos[0]);
          },
        };
      }

      // Check Weeping Wall Proximity (-10, -8)
      const distToWall = Math.hypot(p.x - (-10), p.z - (-8));
      if (distToWall < 3.0 && distToWall < minDistance) {
        minDistance = distToWall;
        closestPrompt = {
          text: `[E] Inspect Devotee Memorial Wall`,
          subtext: `Read community prayers or place your offering into the cemetery`,
          action: onOpenOfferingsWall,
        };
      }

      // Check Summoning Gate Proximity (10, -8)
      const distToGate = Math.hypot(p.x - 10, p.z - (-8));
      if (distToGate < 3.0 && distToGate < minDistance) {
        minDistance = distToGate;
        closestPrompt = {
          text: `[E] Summon a Grave from GitHub`,
          subtext: `Paste any GitHub repo URL to erect a new 3D tombstone`,
          action: onOpenSummonModal,
        };
      }

      setActivePrompt(closestPrompt);
      if (touchingWispText) {
        setActiveWhisper(touchingWispText);
      }

      // 3D Drifting Marigold Petal Physics
      if (petalsMeshRef.current && petalDataRef.current) {
        for (let i = 0; i < petalCount; i++) {
          const pt = petalDataRef.current[i];
          pt.pos.y -= pt.speed;
          pt.pos.x += Math.sin(elapsedTime * 1.5 + i) * 0.006;
          pt.pos.z += Math.cos(elapsedTime * 1.2 + i) * 0.006;

          pt.rot.x += pt.rotSpeed.x;
          pt.rot.y += pt.rotSpeed.y;
          pt.rot.z += pt.rotSpeed.z;

          // Wrap around top
          if (pt.pos.y < 0.05) {
            pt.pos.y = 8;
            pt.pos.x = (Math.random() - 0.5) * 40;
            pt.pos.z = (Math.random() - 0.5) * 40;
          }

          dummy.position.copy(pt.pos);
          dummy.rotation.copy(pt.rot);
          dummy.updateMatrix();
          petalsMeshRef.current.setMatrixAt(i, dummy.matrix);
        }
        petalsMeshRef.current.instanceMatrix.needsUpdate = true;
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
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [repos, offerings]);

  return (
    <div className="relative w-full h-screen overflow-hidden select-none bg-[#0a0714]">
      
      {/* 2.5D WebGL Viewport */}
      <div ref={mountRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

      {/* TOP LEFT: Gothic Altar Game Emblem */}
      <div className="absolute top-6 left-6 z-20 pointer-events-none flex items-center space-x-3">
        <div className="w-12 h-12 rounded-2xl bg-purple-950/90 border border-purple-500/40 flex items-center justify-center text-2xl shadow-[0_0_25px_rgba(168,85,247,0.4)] backdrop-blur-md">
          🕯️
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif-gothic text-calavera-bone tracking-wide drop-shadow-md">
            OFRENDA DE CÓDIGO
          </h1>
          <p className="text-xs font-mono text-purple-300/80">
            2.5D WebGL Cemetery World • Día de los Muertos
          </p>
        </div>
      </div>

      {/* TOP RIGHT: Game Controls & Quick Navigator */}
      <div className="absolute top-6 right-6 z-20 flex items-center space-x-3 pointer-events-auto">
        <button
          onClick={onToggleSound}
          title={ambientSound ? 'Mute cathedral sound' : 'Play cathedral sound'}
          className="p-3 rounded-2xl bg-obsidian-950/90 border border-purple-500/40 text-purple-300 hover:bg-purple-900/40 shadow-xl backdrop-blur-md transition-all"
        >
          {ambientSound ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>

        <button
          onClick={onOpenSummonModal}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-calavera-bone font-mono text-xs font-bold shadow-xl border border-purple-400/50 backdrop-blur-md transition-all transform active:scale-95"
        >
          <PlusCircle size={15} />
          <span>Summon Grave</span>
        </button>

        <button
          onClick={() => setDirectoryOpen(!directoryOpen)}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-2xl bg-obsidian-950/90 hover:bg-purple-950/80 border border-purple-500/40 text-purple-200 font-mono text-xs font-bold shadow-xl backdrop-blur-md transition-all"
        >
          <Compass size={15} />
          <span>Directory</span>
        </button>
      </div>

      {/* BOTTOM LEFT: Controls HUD */}
      <div className="absolute bottom-6 left-6 z-20 pointer-events-none hidden sm:flex flex-col space-y-1.5 bg-obsidian-950/80 backdrop-blur-md p-3.5 rounded-2xl border border-purple-900/50 text-[11px] font-mono text-purple-300/70 shadow-xl">
        <div>🎮 <strong>WASD / Arrow Keys</strong> or <strong>Click on 3D Ground</strong> to Move</div>
        <div>✨ <strong>Walk through 3D Soul Wisps</strong> to hear real developer prayers</div>
        <div>🪦 <strong>Approach 3D Graves</strong> to commune with Gemma 2 or resurrect code</div>
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

      {/* FLOATING SOUL WISP PRAYER WHISPER */}
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

      {/* TOMBSTONE DIRECTORY DRAWER */}
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
