'use client';

import { useRef, useMemo } from 'react';
import { Group, MathUtils } from 'three';
import { useFrame } from '@react-three/fiber';
import { Environment, ContactShadows, Sparkles } from '@react-three/drei';
import { BrieflySphere } from './BrieflySphere';
import { BrieflyEyes } from './BrieflyEyes';
import { BrieflyMouth } from './BrieflyMouth';
import { BrieflyParticles } from './BrieflyParticles';
import { type CharacterEmotion3D, useEmotionState, resolveEmotion } from './useEmotionState';
import { useInteraction } from './useInteraction';

interface BrieflySceneProps {
  emotion?: CharacterEmotion3D;
  reducedMotion?: boolean;
  onEmotionOverride?: (emotion: CharacterEmotion3D | null) => void;
}

export function BrieflyScene({
  emotion = 'neutral',
  reducedMotion = false,
  onEmotionOverride,
}: BrieflySceneProps) {
  const groupRef = useRef<Group>(null);
  const { state: interaction, handleClick } = useInteraction();

  const activeEmotion = useMemo(
    () => (interaction.isClickWink ? 'wink' : emotion) as CharacterEmotion3D,
    [interaction.isClickWink, emotion],
  );

  const isCelebrating = activeEmotion === 'celebrating';
  const emotionState = useEmotionState(activeEmotion);
  const emotionTarget = resolveEmotion(activeEmotion);

  useFrame((clock) => {
    if (!groupRef.current) return;

    if (reducedMotion) {
      groupRef.current.position.y = 0;
      groupRef.current.rotation.x = 0;
      groupRef.current.rotation.y = 0;
      groupRef.current.scale.setScalar(1);
      return;
    }

    const t = clock.clock.getElapsedTime();

    const idleY = Math.sin(t * 0.8) * 0.08;
    const scrollOffset = -interaction.scrollY;
    groupRef.current.position.y = idleY + scrollOffset;

    const tiltX = MathUtils.lerp(
      groupRef.current.rotation.x,
      -interaction.mouseY * 0.15,
      0.1,
    );
    const tiltY = MathUtils.lerp(
      groupRef.current.rotation.y,
      interaction.mouseX * 0.2,
      0.1,
    );
    groupRef.current.rotation.x = tiltX;
    groupRef.current.rotation.y = tiltY;

    groupRef.current.scale.setScalar(interaction.bounceScale);
  });

  const onPointerDown = () => {
    if (reducedMotion) return;
    handleClick();
    onEmotionOverride?.('wink');
  };

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1.5} />
      <pointLight position={[-10, -5, -10]} intensity={0.5} color="#b4a7d6" />
      <spotLight
        position={[0, 8, 4]}
        angle={0.4}
        penumbra={1}
        intensity={1}
        castShadow={false}
      />

      <group ref={groupRef} onPointerDown={onPointerDown}>
        <BrieflySphere emotion={activeEmotion} sphereScale={emotionTarget.sphereScale} />
        <BrieflyEyes
          emotion={activeEmotion}
          mouseX={interaction.mouseX}
          mouseY={interaction.mouseY}
        />
        <BrieflyMouth openAmount={emotionTarget.mouthOpen} />
        <BrieflyParticles active={isCelebrating && !reducedMotion} />

        {isCelebrating && !reducedMotion && (
          <Sparkles
            count={30}
            scale={3}
            size={3}
            speed={0.8}
            color="#f0c0e0"
            opacity={0.7}
          />
        )}
      </group>

      <ContactShadows
        position={[0, -1.5, 0]}
        opacity={0.3}
        scale={4}
        blur={2.5}
        far={3}
        frames={1}
      />

      <Environment preset="city" />
    </>
  );
}
