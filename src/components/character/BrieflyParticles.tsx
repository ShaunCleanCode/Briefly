'use client';

import { useRef, useMemo } from 'react';
import { Points, BufferGeometry, Float32BufferAttribute, PointsMaterial, MathUtils } from 'three';
import { useFrame } from '@react-three/fiber';

interface BrieflyParticlesProps {
  active: boolean;
  count?: number;
  radius?: number;
}

export function BrieflyParticles({ active, count = 40, radius = 2.0 }: BrieflyParticlesProps) {
  const pointsRef = useRef<Points>(null);
  const opacityRef = useRef(0);

  const geometry = useMemo(() => {
    const geo = new BufferGeometry();
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = radius * (0.8 + Math.random() * 0.5);

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      speeds[i] = 0.3 + Math.random() * 0.7;
    }

    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geo.userData.speeds = speeds;
    return geo;
  }, [count, radius]);

  const material = useMemo(
    () =>
      new PointsMaterial({
        color: '#f0d0e8',
        size: 0.04,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    [],
  );

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    const dt = Math.min(delta, 0.1);

    const targetOpacity = active ? 0.8 : 0;
    opacityRef.current = MathUtils.lerp(opacityRef.current, targetOpacity, dt * 3);
    material.opacity = opacityRef.current;

    if (opacityRef.current < 0.01) return;

    const positions = geometry.attributes.position.array as Float32Array;
    const speeds = geometry.userData.speeds as Float32Array;
    const t = state.clock.getElapsedTime();

    for (let i = 0; i < count; i++) {
      const speed = speeds[i];
      const baseAngle = t * speed * 0.5;
      const idx = i * 3;

      positions[idx] += Math.sin(baseAngle + i) * dt * 0.15;
      positions[idx + 1] += Math.cos(baseAngle + i * 0.7) * dt * 0.2;
      positions[idx + 2] += Math.sin(baseAngle + i * 1.3) * dt * 0.15;

      const dist = Math.sqrt(
        positions[idx] ** 2 + positions[idx + 1] ** 2 + positions[idx + 2] ** 2,
      );
      if (dist > radius * 1.8 || dist < radius * 0.5) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = radius * (0.8 + Math.random() * 0.5);
        positions[idx] = r * Math.sin(phi) * Math.cos(theta);
        positions[idx + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[idx + 2] = r * Math.cos(phi);
      }
    }

    geometry.attributes.position.needsUpdate = true;
  });

  return <points ref={pointsRef} geometry={geometry} material={material} />;
}
