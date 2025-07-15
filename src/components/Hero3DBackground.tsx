"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useState, useEffect, type ReactElement } from "react";
import * as THREE from "three";
import React from "react";

function getRandomColor() {
  const h = Math.floor(Math.random() * 360);
  const s = 60 + Math.floor(Math.random() * 40);
  const l = 40 + Math.floor(Math.random() * 40);
  return `hsl(${h},${s}%,${l}%)`;
}

function createGradientTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  // Random direction
  const x0 = Math.random() * size;
  const y0 = Math.random() * size;
  const x1 = Math.random() * size;
  const y1 = Math.random() * size;
  const grad = ctx.createLinearGradient(x0, y0, x1, y1);
  grad.addColorStop(0, getRandomColor());
  grad.addColorStop(1, getRandomColor());
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function createShadowTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  // Draw blurred circle
  const r = size / 2 * 0.8;
  const grad = ctx.createRadialGradient(size/2, size/2, r*0.2, size/2, size/2, r);
  grad.addColorStop(0, "rgba(30,30,40,0.28)");
  grad.addColorStop(0.6, "rgba(30,30,40,0.18)");
  grad.addColorStop(1, "rgba(30,30,40,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;
  return texture;
}

const SHAPE_DEFS = [
  { type: 'box', geometry: (s: number) => <boxGeometry args={[s, s, s]} /> },
  { type: 'sphere', geometry: (s: number) => <sphereGeometry args={[s * 0.75, 32, 32]} /> },
  { type: 'icosahedron', geometry: (s: number) => <icosahedronGeometry args={[s * 0.75, 2]} /> },
  { type: 'torus', geometry: (s: number) => <torusGeometry args={[s * 0.56, s * 0.22, 16, 100]} /> },
  { type: 'cone', geometry: (s: number) => <coneGeometry args={[s * 0.7, s * 1.2, 32]} /> },
  { type: 'cylinder', geometry: (s: number) => <cylinderGeometry args={[s * 0.5, s * 0.5, s * 1.2, 32]} /> },
  { type: 'torusKnot', geometry: (s: number) => <torusKnotGeometry args={[s * 0.44, s * 0.18, 100, 16]} /> },
  { type: 'octahedron', geometry: (s: number) => <octahedronGeometry args={[s * 0.75, 0]} /> },
  { type: 'dodecahedron', geometry: (s: number) => <dodecahedronGeometry args={[s * 0.75, 0]} /> },
  { type: 'tetrahedron', geometry: (s: number) => <tetrahedronGeometry args={[s * 0.75, 0]} /> },
];

function randomShape(size: number) {
  const idx = Math.floor(Math.random() * SHAPE_DEFS.length);
  return { idx, geometry: SHAPE_DEFS[idx].geometry(size) };
}

function distance(a: {x: number, y: number}, b: {x: number, y: number}) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function MorphingBlobs() {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
    scrollY: typeof window !== 'undefined' ? window.scrollY : 0,
  });
  useEffect(() => {
    function handleResize() {
      setViewport(v => ({ ...v, width: window.innerWidth, height: window.innerHeight }));
    }
    function handleScroll() {
      setViewport(v => ({ ...v, scrollY: window.scrollY }));
    }
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // SHAPE STATE
  const baseSize = 0.3;
  type ShapeState = {
    pos: { x: number; y: number };
    vel: { x: number; y: number };
    idx: number;
    geometry: ReactElement;
    gradient: THREE.Texture | null;
  };
  const [shapes, setShapes] = useState<ShapeState[]>(() =>
    Array.from({ length: 2 }, () => ({
      pos: { x: (Math.random() - 0.5) * 3, y: (Math.random() - 0.5) * 2 },
      vel: { x: (Math.random() > 0.5 ? 1 : -1) * 0.015 * 0.15, y: (Math.random() > 0.5 ? 1 : -1) * 0.012 * 0.15 },
      ...randomShape(baseSize),
      gradient: createGradientTexture(),
    }))
  );

  // Add rotation refs for each shape
  const rotationRefs = useRef([
    { x: Math.random() * Math.PI * 2, y: Math.random() * Math.PI * 2 },
    { x: Math.random() * Math.PI * 2, y: Math.random() * Math.PI * 2 },
  ]);

  // Create shadow textures for each shape
  const shadowTextures = React.useMemo(() => [createShadowTexture(), createShadowTexture()], []);

  useFrame(({ camera }) => {
    setShapes(prevShapes => {
      const next = prevShapes.map(s => ({ ...s }));
      // Move shapes and bounce off edges
      for (let i = 0; i < next.length; ++i) {
        next[i].pos.x += next[i].vel.x;
        next[i].pos.y += next[i].vel.y;
        const aspect = viewport.width / viewport.height;
        const limitX = aspect * 2.2;
        const limitY = 2.2;
        if (next[i].pos.x > limitX || next[i].pos.x < -limitX) next[i].vel.x *= -1;
        if (next[i].pos.y > limitY || next[i].pos.y < -limitY) next[i].vel.y *= -1;
      }
      // Handle collision between the two shapes
      if (distance(next[0].pos, next[1].pos) < baseSize * 1.2) {
        // Reverse velocities
        next[0].vel.x *= -1;
        next[0].vel.y *= -1;
        next[1].vel.x *= -1;
        next[1].vel.y *= -1;
        // Change to new random shapes and gradients
        const s0 = randomShape(baseSize);
        const s1 = randomShape(baseSize);
        if (next[0].gradient) next[0].gradient.dispose();
        if (next[1].gradient) next[1].gradient.dispose();
        next[0].idx = s0.idx;
        next[0].geometry = s0.geometry;
        next[0].gradient = createGradientTexture();
        next[1].idx = s1.idx;
        next[1].geometry = s1.geometry;
        next[1].gradient = createGradientTexture();
      }
      // Update rotation for each shape
      for (let i = 0; i < rotationRefs.current.length; ++i) {
        rotationRefs.current[i].x += (0.01 + 0.01 * i) * 0.75;
        rotationRefs.current[i].y += (0.008 + 0.008 * i) * 0.75;
      }
      return next;
    });
    // Camera follows scroll
    camera.position.y = -((viewport.scrollY + viewport.height / 2) / viewport.height) * 4.4 + 2.2;
    camera.updateProjectionMatrix();
  });

  // Clean up textures
  useEffect(() => {
    return () => {
      shapes.forEach(s => { if (s.gradient && typeof s.gradient.dispose === 'function') s.gradient.dispose(); });
    };
    // eslint-disable-next-line
  }, []);

  // Render
  return (
    <>
      {shapes.map((s, i) => {
        const geometry = SHAPE_DEFS[s.idx].geometry(baseSize);
        // Shadow offset for 45-degree light (from top right)
        const shadowOffset = 0.015; // almost directly under the shape
        const shadowX = s.pos.x + shadowOffset;
        const shadowY = s.pos.y + (-((viewport.scrollY + viewport.height / 2) / viewport.height) * 4.4 + 2.2) - 0.35 - shadowOffset;
        // Get the current rotation for this shape
        const rot = rotationRefs.current[i];
        return (
          <React.Fragment key={`shape-frag-${i}-${s.idx}`}>
            <mesh
              key={`shadow-${i}`}
              position={[shadowX, shadowY, -0.21]}
              rotation={[-Math.PI/2, 0, rot.y]}
              receiveShadow={false}
            >
              <planeGeometry args={[0.7, 0.28]} />
              <meshBasicMaterial
                map={shadowTextures[i]}
                transparent
                opacity={0.7}
                depthWrite={false}
              />
            </mesh>
            <mesh
              key={i}
              position={[s.pos.x, s.pos.y + (-((viewport.scrollY + viewport.height / 2) / viewport.height) * 4.4 + 2.2), 0]}
              rotation={[rot.x, rot.y, 0]}
              castShadow={true}
              receiveShadow={true}
            >
              {geometry}
              <meshStandardMaterial
                color="#50505a"
                roughness={0.5}
                metalness={0.3}
                transparent={true}
                opacity={0.3}
                map={s.gradient ?? undefined}
              />
            </mesh>
          </React.Fragment>
        );
      })}
    </>
  );
}

export default function Hero3DBackground() {
  return (
    <div className="fixed inset-0 z-[1000] pointer-events-none">
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }} shadows>
        <ambientLight intensity={0.7} />
        <directionalLight
          position={[5, 5, 5]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-bias={-0.0005}
          shadow-camera-left={-6}
          shadow-camera-right={6}
          shadow-camera-top={6}
          shadow-camera-bottom={-6}
          shadow-camera-near={1}
          shadow-camera-far={20}
        />
        <MorphingBlobs />
      </Canvas>
    </div>
  );
} 