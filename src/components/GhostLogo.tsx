
'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';

export function GhostLogo({
  className = "w-8 h-8",
  floating = true,
  eyeSpeed = 1.5,
}: {
  className?: string;
  floating?: boolean;
  eyeSpeed?: number;
}) {
  // Eye movement state: -1 (links), 0 (zentriert), 1 (rechts)
  const [eyeDir, setEyeDir] = useState(0);
  const [phase, setPhase] = useState(0);
  const controls = useAnimation();
  // Animation loop: alle 2-3 Sekunden Richtung wechseln
  useEffect(() => {
    let mounted = true;
    let dir = 1;
    function loop() {
      setTimeout(() => {
        if (!mounted) return;
        setEyeDir((d) => (d === 1 ? -1 : d === -1 ? 0 : 1));
        setPhase((p) => p + 1);
        loop();
      }, 1200 + Math.random() * 1200);
    }
    loop();
    return () => { mounted = false; };
  }, []);

  // Augenpositionen
  // Basis: cx=38/66 (links/rechts Pupille), cy=54
  // Offset: -2 (links), 0 (zentriert), +2 (rechts)
  const eyeOffset = eyeDir * 2.2;

  // Schwebe-Animation
  const floatAnim = floating
    ? {
        animate: {
          y: [0, -6, 0, 6, 0],
        },
        transition: {
          duration: 3.6,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      }
    : {};

  return (
    <motion.svg
      className={className}
      viewBox="0 0 100 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...floatAnim}
      style={{ display: 'block' }}
    >
      <path
        d="M50 8C24 8 10 28 10 52V110L25 96L40 110L50 100L60 110L75 96L90 110V52C90 28 76 8 50 8Z"
        fill="currentColor"
        className="text-indigo-500 dark:text-indigo-400"
      />
      {/* Augenweiß */}
      <circle cx="36" cy="52" r="9" fill="white" />
      <circle cx="64" cy="52" r="9" fill="white" />
      {/* Pupillen */}
      <motion.circle
        cx={38 + eyeOffset}
        cy={54}
        r={5}
        fill="#1e1b4b"
        animate={{ cx: 38 + eyeOffset }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      />
      <motion.circle
        cx={66 + eyeOffset}
        cy={54}
        r={5}
        fill="#1e1b4b"
        animate={{ cx: 66 + eyeOffset }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      />
      {/* Lichtreflex */}
      <motion.circle
        cx={40 + eyeOffset * 0.5}
        cy={52}
        r={2}
        fill="white"
        animate={{ cx: 40 + eyeOffset * 0.5 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      />
      <motion.circle
        cx={68 + eyeOffset * 0.5}
        cy={52}
        r={2}
        fill="white"
        animate={{ cx: 68 + eyeOffset * 0.5 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      />
    </motion.svg>
  );
}
