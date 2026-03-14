'use client';

import { useRef, useMemo } from 'react';
import { Group, Shape, MathUtils } from 'three';
import { useFrame } from '@react-three/fiber';

interface BrieflyMouthProps {
  sphereRadius?: number;
  /** 0 = fully closed (invisible), 1 = fully open */
  openAmount: number;
}

function createMouthShape(width: number, height: number): Shape {
  const shape = new Shape();
  const hw = width / 2;
  const hh = height / 2;

  shape.moveTo(-hw, 0);
  shape.quadraticCurveTo(-hw, -hh, 0, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, 0);
  shape.quadraticCurveTo(hw, hh, 0, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, 0);

  return shape;
}

export function BrieflyMouth({
  sphereRadius = 1.2,
  openAmount,
}: BrieflyMouthProps) {
  const groupRef = useRef<Group>(null);
  const smoothOpen = useRef(0);

  const mouthShape = useMemo(() => createMouthShape(0.14, 0.12), []);

  const mouthZ = sphereRadius * 0.93;
  const mouthY = -0.22;

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const dt = Math.min(delta, 0.1);

    smoothOpen.current = MathUtils.lerp(smoothOpen.current, openAmount, dt * 6);

    const scaleX = MathUtils.lerp(0.01, 1, smoothOpen.current);
    const scaleY = MathUtils.lerp(0.01, 1, smoothOpen.current);
    groupRef.current.scale.set(scaleX, scaleY, 1);

    const mat = groupRef.current.children[0]?.children[0] as
      | { material?: { opacity: number } }
      | undefined;
    if (mat?.material) {
      mat.material.opacity = MathUtils.lerp(0, 0.85, smoothOpen.current);
    }
  });

  return (
    <group ref={groupRef} position={[0, mouthY, mouthZ]} scale={[0.01, 0.01, 1]}>
      <mesh>
        <shapeGeometry args={[mouthShape]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={0.15}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
