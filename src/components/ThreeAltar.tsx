import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { DepartedRepo } from '../types';
import { Flame, Sparkles, Volume2, Maximize2 } from 'lucide-react';

interface ThreeAltarProps {
  selectedRepo: DepartedRepo;
  candlesLit: number;
  onLightCandle: () => void;
}

export const ThreeAltar: React.FC<ThreeAltarProps> = ({
  selectedRepo,
  candlesLit,
  onLightCandle,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [igniteEffect, setIgniteEffect] = useState(false);

  // References to animate in render loop
  const sceneRef = useRef<THREE.Scene | null>(null);
  const lightsRef = useRef<THREE.PointLight[]>([]);
  const flamesRef = useRef<THREE.Mesh[]>([]);
  const petalsMeshRef = useRef<THREE.InstancedMesh | null>(null);
  const petalDataRef = useRef<{ pos: THREE.Vector3; rot: THREE.Euler; speed: number; rotSpeed: THREE.Vector3 }[]>([]);
  const sparksRef = useRef<{ mesh: THREE.Points; velocities: THREE.Vector3[]; life: number }[]>([]);

  useEffect(() => {
    if (!mountRef.current) return;

    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x07050d, 0.04);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.8, 5.2);
    camera.lookAt(0, 0.4, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    mountRef.current.appendChild(renderer.domElement);

    // 2. Ambient & Altar Lighting
    const ambientLight = new THREE.AmbientLight(0x1a1329, 1.5);
    scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(0x4a3d6e, 1.2);
    moonLight.position.set(5, 8, 4);
    scene.add(moonLight);

    // 3. Stone Pedestal / Altar Table
    const tableGeo = new THREE.BoxGeometry(6, 0.3, 3);
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0x120e1e,
      roughness: 0.85,
      metalness: 0.1,
    });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.position.set(0, -0.6, 0);
    table.receiveShadow = true;
    scene.add(table);

    // Stepped Tier 2
    const tier2Geo = new THREE.BoxGeometry(4.2, 0.25, 1.8);
    const tier2Mat = new THREE.MeshStandardMaterial({
      color: 0x1a1528,
      roughness: 0.8,
    });
    const tier2 = new THREE.Mesh(tier2Geo, tier2Mat);
    tier2.position.set(0, -0.35, -0.3);
    tier2.receiveShadow = true;
    scene.add(tier2);

    // 4. Candle Positions
    const candleConfigs = [
      { x: 0, y: -0.22, z: -0.3, h: 1.1, r: 0.16, hero: true }, // Main Hero Center
      { x: -0.85, y: -0.22, z: -0.25, h: 0.85, r: 0.13 },
      { x: 0.85, y: -0.22, z: -0.25, h: 0.85, r: 0.13 },
      { x: -1.7, y: -0.47, z: 0.2, h: 0.7, r: 0.11 },
      { x: 1.7, y: -0.47, z: 0.2, h: 0.7, r: 0.11 },
      { x: -0.5, y: -0.47, z: 0.45, h: 0.55, r: 0.1 },
      { x: 0.5, y: -0.47, z: 0.45, h: 0.6, r: 0.1 },
    ];

    const waxMaterial = new THREE.MeshStandardMaterial({
      color: 0xfdf7eb,
      roughness: 0.4,
      metalness: 0.05,
    });

    const flameGeo = new THREE.SphereGeometry(0.07, 16, 16);
    flameGeo.scale(1, 2.2, 1);

    const flameMat = new THREE.MeshBasicMaterial({
      color: 0xffaa11,
    });

    lightsRef.current = [];
    flamesRef.current = [];

    candleConfigs.forEach((cfg) => {
      // Candle Body
      const candleGeo = new THREE.CylinderGeometry(cfg.r * 0.95, cfg.r, cfg.h, 24);
      const candle = new THREE.Mesh(candleGeo, waxMaterial);
      candle.position.set(cfg.x, cfg.y + cfg.h / 2, cfg.z);
      candle.castShadow = true;
      candle.receiveShadow = true;
      scene.add(candle);

      // Wick
      const wickGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.08, 8);
      const wickMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
      const wick = new THREE.Mesh(wickGeo, wickMat);
      wick.position.set(cfg.x, cfg.y + cfg.h + 0.04, cfg.z);
      scene.add(wick);

      // Flame Mesh
      const flame = new THREE.Mesh(flameGeo, flameMat);
      flame.position.set(cfg.x, cfg.y + cfg.h + 0.16, cfg.z);
      scene.add(flame);
      flamesRef.current.push(flame);

      // Dynamic Flickering Point Light
      const pLight = new THREE.PointLight(0xff9922, cfg.hero ? 3.5 : 1.8, 4.5);
      pLight.position.set(cfg.x, cfg.y + cfg.h + 0.2, cfg.z);
      pLight.castShadow = true;
      scene.add(pLight);
      lightsRef.current.push(pLight);
    });

    // 5. 3D Floating Marigold Petals (Cempasúchil)
    const petalCount = 140;
    const petalGeo = new THREE.PlaneGeometry(0.08, 0.13);
    const petalMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      side: THREE.DoubleSide,
      roughness: 0.6,
      emissive: 0x5a2d04,
      emissiveIntensity: 0.3,
    });

    const instancedPetals = new THREE.InstancedMesh(petalGeo, petalMat, petalCount);
    const dummy = new THREE.Object3D();
    const petalData: { pos: THREE.Vector3; rot: THREE.Euler; speed: number; rotSpeed: THREE.Vector3 }[] = [];

    for (let i = 0; i < petalCount; i++) {
      const pos = new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        Math.random() * 4 - 0.5,
        (Math.random() - 0.5) * 4
      );
      const rot = new THREE.Euler(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );
      const speed = 0.004 + Math.random() * 0.008;
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

    // 6. Mouse Parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetCameraX = 0;
    let targetCameraY = 1.8;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = mountRef.current?.getBoundingClientRect();
      if (!rect) return;
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetCameraX = mouseX * 0.7;
      targetCameraY = 1.8 + mouseY * 0.4;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // 7. Animation Loop
    const startTime = performance.now();
    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const elapsedTime = (performance.now() - startTime) * 0.001;

      // Smooth camera interpolation
      camera.position.x += (targetCameraX - camera.position.x) * 0.05;
      camera.position.y += (targetCameraY - camera.position.y) * 0.05;
      camera.lookAt(0, 0.4, 0);

      // Flame flicker physics
      flamesRef.current.forEach((flame, idx) => {
        const noise = Math.sin(elapsedTime * 9 + idx * 2.3) * 0.15 + Math.cos(elapsedTime * 14 + idx) * 0.1;
        flame.scale.set(1 + noise * 0.4, 2.2 + noise * 0.8, 1 + noise * 0.4);
        flame.rotation.z = noise * 0.3;
      });

      // Point Light flicker
      lightsRef.current.forEach((light, idx) => {
        const baseIntensity = idx === 0 ? 3.5 : 1.8;
        const flicker = Math.sin(elapsedTime * 11 + idx * 3.7) * 0.3 + Math.sin(elapsedTime * 17) * 0.15;
        light.intensity = baseIntensity + flicker;
      });

      // Petal drifting physics
      if (petalsMeshRef.current && petalDataRef.current) {
        for (let i = 0; i < petalCount; i++) {
          const p = petalDataRef.current[i];
          p.pos.y -= p.speed;
          p.pos.x += Math.sin(elapsedTime * 2 + i) * 0.003;
          p.pos.z += Math.cos(elapsedTime * 1.5 + i) * 0.003;

          p.rot.x += p.rotSpeed.x;
          p.rot.y += p.rotSpeed.y;
          p.rot.z += p.rotSpeed.z;

          // Wrap around top
          if (p.pos.y < -0.8) {
            p.pos.y = 3.5;
            p.pos.x = (Math.random() - 0.5) * 6;
          }

          dummy.position.copy(p.pos);
          dummy.rotation.copy(p.rot);
          dummy.updateMatrix();
          petalsMeshRef.current.setMatrixAt(i, dummy.matrix);
        }
        petalsMeshRef.current.instanceMatrix.needsUpdate = true;
      }

      // Spark particles update
      for (let sIdx = sparksRef.current.length - 1; sIdx >= 0; sIdx--) {
        const sp = sparksRef.current[sIdx];
        const positions = sp.mesh.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < sp.velocities.length; i++) {
          positions[i * 3 + 0] += sp.velocities[i].x;
          positions[i * 3 + 1] += sp.velocities[i].y;
          positions[i * 3 + 2] += sp.velocities[i].z;
          sp.velocities[i].y -= 0.001; // Gravity
        }
        sp.mesh.geometry.attributes.position.needsUpdate = true;
        sp.life -= 0.02;
        (sp.mesh.material as THREE.PointsMaterial).opacity = Math.max(0, sp.life);

        if (sp.life <= 0) {
          scene.remove(sp.mesh);
          sparksRef.current.splice(sIdx, 1);
        }
      }

      renderer.render(scene, camera);
    };

    animate();

    // 8. Handle Resize
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
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      renderer.forceContextLoss();
    };
  }, []);

  // Ignite 3D Sparks Effect on Light Candle
  const trigger3DIgnition = () => {
    if (!sceneRef.current) return;
    setIgniteEffect(true);
    onLightCandle();

    // Spawn 3D golden ember sparks
    const sparkCount = 80;
    const sparkGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(sparkCount * 3);
    const velocities: THREE.Vector3[] = [];

    for (let i = 0; i < sparkCount; i++) {
      positions[i * 3 + 0] = 0;
      positions[i * 3 + 1] = 1.0;
      positions[i * 3 + 2] = -0.3;

      const angle = Math.random() * Math.PI * 2;
      const speed = 0.03 + Math.random() * 0.05;
      velocities.push(
        new THREE.Vector3(
          Math.cos(angle) * speed,
          0.04 + Math.random() * 0.06,
          Math.sin(angle) * speed
        )
      );
    }

    sparkGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const sparkMat = new THREE.PointsMaterial({
      color: 0xffaa22,
      size: 0.06,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
    });

    const sparkMesh = new THREE.Points(sparkGeo, sparkMat);
    sceneRef.current.add(sparkMesh);
    sparksRef.current.push({ mesh: sparkMesh, velocities, life: 1.0 });

    setTimeout(() => setIgniteEffect(false), 600);
  };

  return (
    <div
      className="relative w-full h-[450px] sm:h-[520px] rounded-3xl overflow-hidden border border-marigold-500/30 shadow-2xl bg-gradient-to-b from-obsidian-950 via-obsidian-900 to-obsidian-950"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 3D WebGL Canvas Mount */}
      <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />

      {/* Floating Occult Altar HUD Overlay */}
      <div className="absolute top-6 left-6 right-6 flex items-start justify-between pointer-events-none z-10">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-obsidian-950/80 backdrop-blur-md border border-marigold-500/40 text-marigold-400 text-xs font-mono mb-2 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-marigold-500 animate-ping" />
            <span>3D OFRENDA SHRINE • WEBGL SHADER ENGINE</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold font-serif-gothic text-calavera-bone drop-shadow-md">
            {selectedRepo.name}
          </h2>
          <p className="text-xs sm:text-sm text-marigold-300/80 font-mono">
            {selectedRepo.fullName} • Active {selectedRepo.yearsActive}
          </p>
        </div>

        {/* Live Candle Meter */}
        <div className="flex items-center space-x-3 bg-obsidian-950/80 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-marigold-500/30 shadow-xl pointer-events-auto">
          <Flame size={22} className="text-marigold-500 animate-pulse" />
          <div className="text-right">
            <div className="text-xl font-bold font-mono text-calavera-bone leading-none">
              {candlesLit.toLocaleString()}
            </div>
            <span className="text-[10px] text-calavera-aged/70 uppercase tracking-wider font-mono">
              Candles Glowing
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Bottom Control Bar */}
      <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row items-center justify-between gap-4 z-10 pointer-events-none">
        
        {/* Parallax Guidance */}
        <div className="hidden sm:flex items-center space-x-2 text-xs font-mono text-calavera-aged/50 bg-obsidian-950/60 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/5">
          <span>✨ Move mouse to orbit 3D altar & light candles</span>
        </div>

        {/* Action Button */}
        <button
          onClick={trigger3DIgnition}
          className={`pointer-events-auto flex items-center space-x-2 px-6 py-3 rounded-2xl font-mono text-xs uppercase tracking-wider font-bold transition-all transform active:scale-95 shadow-xl ${
            igniteEffect
              ? 'bg-amber-300 text-obsidian-950 scale-105 shadow-marigold-500/50'
              : 'bg-gradient-to-r from-marigold-500 to-amber-600 hover:from-marigold-400 hover:to-amber-500 text-obsidian-950 shadow-marigold-500/30'
          }`}
        >
          <Sparkles size={16} />
          <span>Light Candle on Altar</span>
        </button>

      </div>
    </div>
  );
};
