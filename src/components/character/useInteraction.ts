'use client';

import { useRef, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { MathUtils } from 'three';

interface InteractionState {
  /** Smoothed mouse X (-1 to 1) */
  mouseX: number;
  /** Smoothed mouse Y (-1 to 1) */
  mouseY: number;
  /** Click bounce amount (0 = rest, peaks at ~1.15) */
  bounceScale: number;
  /** Whether a click wink is active */
  isClickWink: boolean;
  /** Scroll-based Y offset */
  scrollY: number;
}

const MOUSE_LERP = 4;
const BOUNCE_DECAY = 8;
const SCROLL_FACTOR = 0.0003;
const SCROLL_LERP = 5;

export function useInteraction() {
  const { pointer } = useThree();

  const state = useRef<InteractionState>({
    mouseX: 0,
    mouseY: 0,
    bounceScale: 1,
    isClickWink: false,
    scrollY: 0,
  });

  const bounce = useRef({
    active: false,
    startTime: 0,
    phase: 'idle' as 'idle' | 'up' | 'down',
  });

  const handleClick = useCallback(() => {
    const b = bounce.current;
    if (b.active) return;
    b.active = true;
    b.phase = 'up';
    b.startTime = performance.now() / 1000;
    state.current.isClickWink = true;
  }, []);

  useFrame((_, delta) => {
    const s = state.current;
    const dt = Math.min(delta, 0.1);

    // Mouse parallax — smooth follow
    s.mouseX = MathUtils.lerp(s.mouseX, pointer.x, dt * MOUSE_LERP);
    s.mouseY = MathUtils.lerp(s.mouseY, pointer.y, dt * MOUSE_LERP);

    // Scroll parallax
    const targetScrollY = (typeof window !== 'undefined' ? window.scrollY : 0) * SCROLL_FACTOR;
    s.scrollY = MathUtils.lerp(s.scrollY, targetScrollY, dt * SCROLL_LERP);

    // Click bounce animation
    const b = bounce.current;
    if (b.active) {
      const elapsed = performance.now() / 1000 - b.startTime;

      if (b.phase === 'up') {
        s.bounceScale = MathUtils.lerp(s.bounceScale, 1.18, dt * 18);
        if (elapsed > 0.1) b.phase = 'down';
      } else if (b.phase === 'down') {
        s.bounceScale = MathUtils.lerp(s.bounceScale, 1, dt * BOUNCE_DECAY);
        if (Math.abs(s.bounceScale - 1) < 0.005) {
          s.bounceScale = 1;
          b.active = false;
          b.phase = 'idle';
          s.isClickWink = false;
        }
      }
    }
  });

  return { state: state.current, handleClick };
}
