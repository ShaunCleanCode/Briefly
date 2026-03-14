'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr } from '@react-three/drei';
import { BrieflyScene } from './BrieflyScene';
import { type CharacterEmotion3D } from './useEmotionState';

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return reduced;
}

function useInViewport(ref: React.RefObject<HTMLElement | null>): boolean {
  const [inView, setInView] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return inView;
}

function WebGLFallback({ children }: { children: React.ReactNode }) {
  const [supported, setSupported] = useState(true);
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) setSupported(false);
    } catch {
      setSupported(false);
    }
  }, []);
  if (!supported) return null;
  return <>{children}</>;
}

interface BrieflyCharacter3DProps {
  emotion?: CharacterEmotion3D;
}

export default function BrieflyCharacter3D({ emotion = 'neutral' }: BrieflyCharacter3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const inView = useInViewport(containerRef);

  return (
    <WebGLFallback>
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', minHeight: 200, cursor: 'pointer' }}
      >
        <Canvas
          camera={{ position: [0, 0, 4], fov: 45 }}
          dpr={[1, 1.5]}
          frameloop={inView ? 'always' : 'never'}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          style={{ background: 'transparent' }}
          eventSource={containerRef.current ?? undefined}
          eventPrefix="client"
        >
          <AdaptiveDpr pixelated />
          <Suspense fallback={null}>
            <BrieflyScene emotion={emotion} reducedMotion={reducedMotion} />
          </Suspense>
        </Canvas>
      </div>
    </WebGLFallback>
  );
}
