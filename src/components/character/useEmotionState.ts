'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { MathUtils } from 'three';

/**
 * Spec-defined 8 emotions + legacy aliases from BrieflyCharacter.tsx.
 * Legacy mapping: concerned → angry, waving → wink
 */
export type CharacterEmotion3D =
  | 'neutral'
  | 'happy'
  | 'wink'
  | 'angry'
  | 'sad'
  | 'curious'
  | 'thinking'
  | 'celebrating'
  | 'puffed'
  | 'concerned'   // legacy → angry
  | 'waving';     // legacy → wink

interface EyeTransform {
  scaleY: number;
  positionY: number;
  rotationZ: number;
}

interface EmotionVisuals {
  leftEye: EyeTransform;
  rightEye: EyeTransform;
  color: string;
  mouthOpen: number;
  sphereScale: number;
}

const EMOTION_MAP: Record<string, EmotionVisuals> = {
  // --- Spec 8 emotions ---
  neutral: {
    leftEye:  { scaleY: 1,    positionY: 0.15, rotationZ: 0 },
    rightEye: { scaleY: 1,    positionY: 0.15, rotationZ: 0 },
    color: '#b4a7d6',
    mouthOpen: 0,
    sphereScale: 1,
  },
  happy: {
    leftEye:  { scaleY: 0.6,  positionY: 0.22, rotationZ: 0.06 },
    rightEye: { scaleY: 0.6,  positionY: 0.22, rotationZ: -0.06 },
    color: '#d4a7e8',
    mouthOpen: 0,
    sphereScale: 1,
  },
  wink: {
    leftEye:  { scaleY: 1,    positionY: 0.15, rotationZ: 0 },
    rightEye: { scaleY: 0.05, positionY: 0.15, rotationZ: 0 },
    color: '#c9b97a',
    mouthOpen: 0,
    sphereScale: 1,
  },
  angry: {
    leftEye:  { scaleY: 0.75, positionY: 0.08, rotationZ: 0.25 },
    rightEye: { scaleY: 0.75, positionY: 0.08, rotationZ: -0.25 },
    color: '#d6785a',
    mouthOpen: 0,
    sphereScale: 1,
  },
  sad: {
    leftEye:  { scaleY: 0.85, positionY: 0.05, rotationZ: -0.1 },
    rightEye: { scaleY: 0.85, positionY: 0.05, rotationZ: 0.1 },
    color: '#7ab4c9',
    mouthOpen: 0,
    sphereScale: 1,
  },
  curious: {
    leftEye:  { scaleY: 1.15, positionY: 0.18, rotationZ: -0.08 },
    rightEye: { scaleY: 1.15, positionY: 0.2,  rotationZ: 0.08 },
    color: '#d4c462',
    mouthOpen: 0,
    sphereScale: 1,
  },
  thinking: {
    leftEye:  { scaleY: 1,    positionY: 0.15, rotationZ: 0 },
    rightEye: { scaleY: 0.8,  positionY: 0.25, rotationZ: 0.22 },
    color: '#6b5b95',
    mouthOpen: 0,
    sphereScale: 1,
  },
  celebrating: {
    leftEye:  { scaleY: 0.5,  positionY: 0.26, rotationZ: 0.1 },
    rightEye: { scaleY: 0.5,  positionY: 0.26, rotationZ: -0.1 },
    color: '#e8a7c8',
    mouthOpen: 0,
    sphereScale: 1,
  },
  // --- W-405: Kirby puffed cheeks (flying Kirby reference) ---
  puffed: {
    leftEye:  { scaleY: 0.4,  positionY: 0.25, rotationZ: 0 },
    rightEye: { scaleY: 0.4,  positionY: 0.25, rotationZ: 0 },
    color: '#f5a0b8',
    mouthOpen: 1,
    sphereScale: 1.3,
  },
};

// Legacy aliases
EMOTION_MAP.concerned = EMOTION_MAP.angry;
EMOTION_MAP.waving = EMOTION_MAP.wink;

export function resolveEmotion(emotion: CharacterEmotion3D): EmotionVisuals {
  return EMOTION_MAP[emotion] ?? EMOTION_MAP.neutral;
}

interface AnimatedEmotionState {
  leftEye: EyeTransform;
  rightEye: EyeTransform;
  color: string;
  blinkAmount: number;
  mouthOpen: number;
  sphereScale: number;
}

const LERP_SPEED = 6;
const BLINK_INTERVAL_MIN = 2.5;
const BLINK_INTERVAL_MAX = 5.0;
const BLINK_DURATION = 0.12;

export function useEmotionState(emotion: CharacterEmotion3D): AnimatedEmotionState {
  const target = useMemo(() => resolveEmotion(emotion), [emotion]);

  const state = useRef<AnimatedEmotionState>({
    leftEye: { ...target.leftEye },
    rightEye: { ...target.rightEye },
    color: target.color,
    blinkAmount: 0,
    mouthOpen: target.mouthOpen,
    sphereScale: target.sphereScale,
  });

  const blink = useRef({
    nextBlinkAt: Math.random() * 2 + 1,
    isBlinking: false,
    blinkStart: 0,
  });

  useFrame((_, delta) => {
    const s = state.current;
    const dt = Math.min(delta, 0.1);
    const lerpFactor = 1 - Math.pow(1 - dt * LERP_SPEED, 1);

    s.leftEye.scaleY = MathUtils.lerp(s.leftEye.scaleY, target.leftEye.scaleY, lerpFactor);
    s.leftEye.positionY = MathUtils.lerp(s.leftEye.positionY, target.leftEye.positionY, lerpFactor);
    s.leftEye.rotationZ = MathUtils.lerp(s.leftEye.rotationZ, target.leftEye.rotationZ, lerpFactor);

    s.rightEye.scaleY = MathUtils.lerp(s.rightEye.scaleY, target.rightEye.scaleY, lerpFactor);
    s.rightEye.positionY = MathUtils.lerp(s.rightEye.positionY, target.rightEye.positionY, lerpFactor);
    s.rightEye.rotationZ = MathUtils.lerp(s.rightEye.rotationZ, target.rightEye.rotationZ, lerpFactor);

    s.mouthOpen = MathUtils.lerp(s.mouthOpen, target.mouthOpen, lerpFactor);
    s.sphereScale = MathUtils.lerp(s.sphereScale, target.sphereScale, lerpFactor);

    const b = blink.current;
    const now = performance.now() / 1000;

    if (!b.isBlinking && now >= b.nextBlinkAt) {
      b.isBlinking = true;
      b.blinkStart = now;
    }

    if (b.isBlinking) {
      const elapsed = now - b.blinkStart;
      const halfDuration = BLINK_DURATION;
      if (elapsed < halfDuration) {
        s.blinkAmount = elapsed / halfDuration;
      } else if (elapsed < halfDuration * 2) {
        s.blinkAmount = 1 - (elapsed - halfDuration) / halfDuration;
      } else {
        s.blinkAmount = 0;
        b.isBlinking = false;
        b.nextBlinkAt = now + BLINK_INTERVAL_MIN + Math.random() * (BLINK_INTERVAL_MAX - BLINK_INTERVAL_MIN);
      }
    } else {
      s.blinkAmount = MathUtils.lerp(s.blinkAmount, 0, lerpFactor);
    }
  });

  return state.current;
}
