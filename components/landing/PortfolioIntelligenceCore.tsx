"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";

// ─── Custom GLSL Shaders for Machined Titanium & Molten Ember ───────────────

const chronolithVertexShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uWarp;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    
    vec3 pos = position;
    // Add a mechanical heat warp when chaotic (uWarp > 0)
    if (uWarp > 0.0) {
      pos.x += sin(pos.y * 5.0 + uTime * 3.0) * 0.05 * uWarp;
      pos.z += cos(pos.x * 5.0 + uTime * 3.0) * 0.05 * uWarp;
    }
    
    vPosition = pos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const chronolithFragmentShader = `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uAlignment; // 0.0 (chaotic) to 1.0 (perfectly aligned)
  uniform float uRingIndex;

  void main() {
    // Polar angle coordinate for segment divisions
    float angle = atan(vPosition.z, vPosition.x);
    
    // Procedural slots: creates machined cuts along the cylinder circumference
    // Shift frequency based on ring index for concentric complexity
    float slotFreq = 4.0 + uRingIndex * 2.0;
    
    // Animate phase shift based on time when unaligned (creates rotating gear indicators)
    float phaseShift = uTime * 0.25 * (1.0 - uAlignment) * (mod(uRingIndex, 2.0) == 0.0 ? 1.0 : -1.0);
    float slotPattern = sin(angle * slotFreq + phaseShift);
    
    // Fresnel reflection vector
    vec3 viewDir = normalize(vec3(0.0, 0.0, 1.0));
    float fresnel = 1.0 - max(0.0, dot(vNormal, viewDir));
    fresnel = pow(fresnel, 2.5);
    
    // Core brand colors: Dark Graphite (#1A1A1A) and intense molten Ember Orange (#FF4500)
    vec3 colorGraphite = vec3(0.08, 0.08, 0.09); // Industrial sandblasted graphite
    vec3 colorEmber = vec3(1.0, 0.27, 0.0);       // Molten blast furnace orange
    vec3 colorGold = vec3(0.81, 0.44, 0.12);      // Refined structural copper/gold
    
    // Mix materials based on slot patterns
    if (slotPattern > 0.5) {
      // Molten Glowing channels
      float pulse = sin(uTime * 4.0 + vPosition.y * 10.0) * 0.15 + 0.85;
      vec3 activeMolten = mix(colorEmber, colorGold, uAlignment);
      
      // Intense neon core emission
      gl_FragColor = vec4(activeMolten * pulse * 1.5, 0.95);
    } else {
      // Machined metal plates
      vec3 metalHighlight = vec3(0.35, 0.36, 0.38); // Titanium highlights
      vec3 finalMetal = mix(colorGraphite, metalHighlight, fresnel);
      
      // Add subtle orange caustics bleeding through edges as alignment completes
      float edgeGlow = smoothstep(0.4, 0.5, slotPattern) * uAlignment;
      vec3 causticColor = mix(finalMetal, colorEmber, edgeGlow * 0.4);
      
      gl_FragColor = vec4(causticColor, 1.0);
    }
  }
`;

// ─── Chronolith Concentric Ring Component ───────────────────────────────────

interface RingProps {
  index: number;
  radius: number;
  height: number;
  alignment: number;
  scrollProgress: number;
}

function ChronolithRing({ index, radius, height, alignment, scrollProgress }: RingProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Define custom shader uniforms
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uAlignment: { value: 0 },
    uWarp: { value: 0 },
    uRingIndex: { value: index }
  }), [index]);

  // Initial chaotic position offsets (milled blocks separated on Y axis and rotated)
  const initialYOffset = useMemo(() => {
    const offsets = [1.8, -1.4, 0.9, -2.2];
    return offsets[index % offsets.length];
  }, [index]);

  const initialRotation = useMemo(() => {
    return (index + 1) * Math.PI * 0.35;
  }, [index]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = time;
      materialRef.current.uniforms.uAlignment.value = alignment;
      // Warp vertices when unaligned to represent unrefined "chaotic" data
      materialRef.current.uniforms.uWarp.value = 1.0 - alignment;
    }

    if (meshRef.current) {
      // 1. Y-axis mechanical snap: interpolates Y from chaotic offset to 0 as alignment finishes
      const targetY = THREE.MathUtils.lerp(initialYOffset, 0, alignment);
      meshRef.current.position.y = targetY;

      // 2. Rotation alignment: spins rings towards a locked 0-degree state
      const targetRot = THREE.MathUtils.lerp(initialRotation, 0, alignment);
      // Add subtle continuous spin once aligned
      meshRef.current.rotation.y = targetRot + (alignment * time * 0.08 * (index % 2 === 0 ? 1 : -1));

      // 3. Scroll Behavior: split the rings vertically apart as user scrolls past hero fold
      if (scrollProgress > 0) {
        // Rings split along Y axis (even go up, odd go down) representing core explosion
        const splitDirection = index % 2 === 0 ? 1.0 : -1.0;
        meshRef.current.position.y += scrollProgress * 3.5 * splitDirection;
        // Fade opacity/scale down
        meshRef.current.scale.setScalar(1.0 - scrollProgress * 0.35);
      } else {
        meshRef.current.scale.setScalar(1.0);
      }
    }
  });

  return (
    <mesh ref={meshRef}>
      <cylinderGeometry args={[radius, radius, height, 48, 1, true]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={chronolithVertexShader}
        fragmentShader={chronolithFragmentShader}
        uniforms={uniforms}
        transparent={true}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ─── Laser Caliper Connectors (Chaos Vectors) ───────────────────────────────

function CaliperVectors({ alignment, scrollProgress }: { alignment: number; scrollProgress: number }) {
  const lineRef = useRef<THREE.LineSegments>(null);

  // Instantiates vectors connecting the unaligned rings to simulate "calibrating fields"
  const [positions, colors] = useMemo(() => {
    const count = 48;
    const pos = new Float32Array(count * 2 * 3);
    const col = new Float32Array(count * 2 * 3);

    const emberColor = new THREE.Color("#FF4500");
    const copperColor = new THREE.Color("#CFA430");

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radiusInner = 1.0 + Math.random() * 0.5;
      const radiusOuter = 1.6 + Math.random() * 1.5;

      // Start position (Inner ring zone)
      pos[i * 6] = Math.cos(angle) * radiusInner;
      pos[i * 6 + 1] = (Math.random() - 0.5) * 3.0;
      pos[i * 6 + 2] = Math.sin(angle) * radiusInner;

      // End position (Outer ring zone)
      pos[i * 6 + 3] = Math.cos(angle + 0.5) * radiusOuter;
      pos[i * 6 + 4] = (Math.random() - 0.5) * 3.0;
      pos[i * 6 + 5] = Math.sin(angle + 0.5) * radiusOuter;

      // Color maps
      col[i * 6] = emberColor.r;
      col[i * 6 + 1] = emberColor.g;
      col[i * 6 + 2] = emberColor.b;

      col[i * 6 + 3] = copperColor.r;
      col[i * 6 + 4] = copperColor.g;
      col[i * 6 + 5] = copperColor.b;
    }

    return [pos, col];
  }, []);

  useFrame((state) => {
    if (lineRef.current) {
      const time = state.clock.getElapsedTime();
      lineRef.current.rotation.y = time * 0.1;
      const mat = lineRef.current.material as THREE.LineBasicMaterial;
      mat.opacity = (1.0 - alignment) * 0.12 * (1.0 - scrollProgress);
    }
  });

  return (
    <lineSegments ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <lineBasicMaterial
        vertexColors={true}
        transparent={true}
        opacity={0.12}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
}

// ─── Camera Controller (Telemetry Parallax) ─────────────────────────────────

function TelemetryCameraController({ mouse, scrollProgress }: { mouse: { x: number; y: number }; scrollProgress: number }) {
  useFrame((state) => {
    // 1. Precision micro-damped hover parallax (simulating operator coordinate tilt)
    const targetX = mouse.x * 1.6;
    const targetY = mouse.y * 1.2;
    state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, targetX, 0.035);
    state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, targetY, 0.035);

    // 2. Camera push/pull tied strictly to scrollProgress
    const targetZ = 7.5 - scrollProgress * 3.0;
    state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, targetZ, 0.04);

    state.camera.lookAt(0, 0.25, 0);
  });

  return null;
}

// ─── Master Canvas Core Component ───────────────────────────────────────────

interface CoreSceneProps {
  pointerCoords: { x: number; y: number };
  alignmentProgress: number; // Forged state variable (0 to 1)
  scrollProgress: number;     // Scroll Trigger variable
}

export default function PortfolioIntelligenceCore({ pointerCoords, alignmentProgress, scrollProgress }: CoreSceneProps) {
  return (
    <div className="w-full h-full absolute inset-0 z-0 pointer-events-none bg-transparent overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 7.5], fov: 55 }}
        dpr={[1, 1.5]}
      >
        <ambientLight intensity={0.25} />
        {/* Intense directional blast furnace spotlight representing industrial foundry forge */}
        <pointLight position={[5, 4, 3]} intensity={2.0} color="#FF4500" />
        <pointLight position={[-5, -4, -3]} intensity={1.5} color="#CFA430" />
        
        <Float speed={1.2} rotationIntensity={0.35} floatIntensity={0.5} position={[0, 0.75, 0]}>
          {/* Concentric Chronolith Rings */}
          <ChronolithRing index={0} radius={1.2} height={0.5} alignment={alignmentProgress} scrollProgress={scrollProgress} />
          <ChronolithRing index={1} radius={1.8} height={0.6} alignment={alignmentProgress} scrollProgress={scrollProgress} />
          <ChronolithRing index={2} radius={2.4} height={0.7} alignment={alignmentProgress} scrollProgress={scrollProgress} />
          <ChronolithRing index={3} radius={3.0} height={0.8} alignment={alignmentProgress} scrollProgress={scrollProgress} />
          
          {/* Connecting chaos wireframe vectors */}
          <CaliperVectors alignment={alignmentProgress} scrollProgress={scrollProgress} />
        </Float>

        <TelemetryCameraController mouse={pointerCoords} scrollProgress={scrollProgress} />
      </Canvas>
    </div>
  );
}
