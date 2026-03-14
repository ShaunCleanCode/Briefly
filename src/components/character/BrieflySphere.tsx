'use client';

import { useRef, useMemo } from 'react';
import { Mesh, Color, MathUtils } from 'three';
import { useFrame } from '@react-three/fiber';
import { MeshTransmissionMaterial } from '@react-three/drei';
import { type CharacterEmotion3D } from './useEmotionState';

const EMOTION_COLORS: Record<string, string> = {
  neutral:     '#b4a7d6',
  happy:       '#d4a7e8',
  wink:        '#c9b97a',
  angry:       '#d6785a',
  sad:         '#7ab4c9',
  curious:     '#d4c462',
  thinking:    '#6b5b95',
  celebrating: '#e8a7c8',
  puffed:      '#f5a0b8',
  concerned:   '#d6785a',
  waving:      '#c9b97a',
};

interface BrieflySphereProps {
  radius?: number;
  emotion?: CharacterEmotion3D;
  /** Animated sphere scale from useEmotionState (1 = normal, 1.08 = puffed) */
  sphereScale?: number;
}

export function BrieflySphere({ radius = 1.2, emotion = 'neutral', sphereScale = 1 }: BrieflySphereProps) {
  const meshRef = useRef<Mesh>(null);
  const targetColor = useMemo(
    () => new Color(EMOTION_COLORS[emotion] ?? EMOTION_COLORS.neutral),
    [emotion],
  );
  const currentColor = useRef(new Color(EMOTION_COLORS.neutral));
  const smoothScale = useRef(1);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.1;
    currentColor.current.lerp(targetColor, Math.min(delta * 4, 1));

    smoothScale.current = MathUtils.lerp(smoothScale.current, sphereScale, Math.min(delta * 6, 1));
    meshRef.current.scale.setScalar(smoothScale.current);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[radius, 64, 64]} />
      <MeshTransmissionMaterial
        transmission={1}
        thickness={0.8}
        roughness={0.1}
        chromaticAberration={0.05}
        ior={1.5}
        anisotropy={0.1}
        distortion={0.2}
        distortionScale={0.3}
        temporalDistortion={0.1}
        color={currentColor.current}
        attenuationColor={currentColor.current}
        attenuationDistance={0.6}
        resolution={512}
        samples={6}
        backside
      />
    </mesh>
  );
}
