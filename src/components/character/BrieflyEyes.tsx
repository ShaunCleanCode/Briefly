'use client';

import { useRef, useMemo } from 'react';
import { Group, Shape, MathUtils } from 'three';
import { useFrame } from '@react-three/fiber';
import { type CharacterEmotion3D, useEmotionState } from './useEmotionState';

interface BrieflyEyesProps {
  emotion: CharacterEmotion3D;
  sphereRadius?: number;
  /** Normalized mouse X (-1 to 1) for eye gaze tracking */
  mouseX?: number;
  /** Normalized mouse Y (-1 to 1) for eye gaze tracking */
  mouseY?: number;
}

const EYE_GAZE_X = 0.04;
const EYE_GAZE_Y = 0.03;

function createRoundedRectShape(width: number, height: number, radius: number): Shape {
  const shape = new Shape();
  const x = -width / 2;
  const y = -height / 2;
  const r = Math.min(radius, width / 2, height / 2);

  shape.moveTo(x + r, y);
  shape.lineTo(x + width - r, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + r);
  shape.lineTo(x + width, y + height - r);
  shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  shape.lineTo(x + r, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);

  return shape;
}

function Eye({
  position,
  emotionState,
  side,
  gazeX,
  gazeY,
}: {
  position: [number, number, number];
  emotionState: ReturnType<typeof useEmotionState>;
  side: 'left' | 'right';
  gazeX: number;
  gazeY: number;
}) {
  const meshRef = useRef<Group>(null);
  const smoothGaze = useRef({ x: 0, y: 0 });

  const eyeShape = useMemo(() => createRoundedRectShape(0.12, 0.22, 0.06), []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const dt = Math.min(delta, 0.1);

    const eyeData = side === 'left' ? emotionState.leftEye : emotionState.rightEye;
    const blinkScale = MathUtils.lerp(1, 0.05, emotionState.blinkAmount);

    smoothGaze.current.x = MathUtils.lerp(smoothGaze.current.x, gazeX * EYE_GAZE_X, dt * 6);
    smoothGaze.current.y = MathUtils.lerp(smoothGaze.current.y, gazeY * EYE_GAZE_Y, dt * 6);

    meshRef.current.scale.y = eyeData.scaleY * blinkScale;
    meshRef.current.position.x = position[0] + smoothGaze.current.x;
    meshRef.current.position.y = position[1] + eyeData.positionY + smoothGaze.current.y;
    meshRef.current.rotation.z = eyeData.rotationZ;
  });

  return (
    <group ref={meshRef} position={position}>
      <mesh>
        <shapeGeometry args={[eyeShape]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={0.3}
          transparent
          opacity={0.92}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export function BrieflyEyes({
  emotion,
  sphereRadius = 1.2,
  mouseX = 0,
  mouseY = 0,
}: BrieflyEyesProps) {
  const emotionState = useEmotionState(emotion);

  const eyeZ = sphereRadius * 0.92;
  const eyeSpacing = 0.2;

  return (
    <group position={[0, 0, eyeZ]}>
      <Eye
        position={[-eyeSpacing, 0, 0]}
        emotionState={emotionState}
        side="left"
        gazeX={mouseX}
        gazeY={mouseY}
      />
      <Eye
        position={[eyeSpacing, 0, 0]}
        emotionState={emotionState}
        side="right"
        gazeX={mouseX}
        gazeY={mouseY}
      />
    </group>
  );
}
