// Motion configuration for onboarding animations

export const motionConfig = {
  // Spring presets
  spring: {
    gentle: { type: 'spring' as const, stiffness: 120, damping: 14 },
    snappy: { type: 'spring' as const, stiffness: 300, damping: 24 },
    bouncy: { type: 'spring' as const, stiffness: 400, damping: 10 },
  },

  // Duration presets
  duration: {
    instant: 0.1,
    fast: 0.2,
    normal: 0.3,
    slow: 0.5,
    deliberate: 0.8,
  },

  // Easing curves
  easing: {
    easeOut: [0.0, 0.0, 0.2, 1] as const,
    easeInOut: [0.4, 0.0, 0.2, 1] as const,
    anticipate: [0.68, -0.55, 0.265, 1.55] as const,
  },
};

// Page transition variants
export const pageVariants = {
  initial: {
    opacity: 0,
    x: 50,
  },
  enter: {
    opacity: 1,
    x: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
      staggerChildren: 0.07,
    },
  },
  exit: {
    opacity: 0,
    x: -50,
    transition: {
      duration: 0.2,
    },
  },
};

// For back navigation (reverse direction)
export const pageVariantsBack = {
  initial: { opacity: 0, x: -50 },
  enter: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 50 },
};

// Choice selection variants
export const choiceVariants = {
  idle: {
    scale: 1,
    boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
  },
  hover: {
    scale: 1.02,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    transition: { type: 'spring' as const, stiffness: 400, damping: 17 },
  },
  tap: {
    scale: 0.98,
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  },
  selected: {
    scale: 1,
    boxShadow: '0 0 0 2px var(--brand-primary)',
    backgroundColor: 'var(--brand-primary-light)',
    transition: { type: 'spring' as const, stiffness: 500, damping: 25 },
  },
};

// Checkmark animation variants
export const checkmarkVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { type: 'spring' as const, stiffness: 400, damping: 25 },
      opacity: { duration: 0.1 },
    },
  },
};

// Progress bar variants
export const progressBarVariants = {
  initial: { scaleX: 0 },
  animate: (percentComplete: number) => ({
    scaleX: percentComplete / 100,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 20,
    },
  }),
};

// Chat bubble variants
export const bubbleVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 260,
      damping: 20,
    },
  },
};

// Typing indicator dots
export const typingDotVariants = {
  animate: (i: number) => ({
    y: [0, -6, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      repeatType: 'loop' as const,
      delay: i * 0.15,
    },
  }),
};

// Error shake animation
export const shakeVariants = {
  shake: {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.4 },
  },
};

// Success celebration variants
export const celebrationVariants = {
  initial: { scale: 0, rotate: -180 },
  animate: {
    scale: 1,
    rotate: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 200,
      damping: 15,
    },
  },
};

// Child stagger animation
export const childVariants = {
  initial: { opacity: 0, y: 20 },
  enter: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 260, damping: 20 },
  },
};

// Confetti configuration
export const confettiConfig = {
  particleCount: 100,
  spread: 70,
  origin: { y: 0.6 },
  colors: ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'],
};
