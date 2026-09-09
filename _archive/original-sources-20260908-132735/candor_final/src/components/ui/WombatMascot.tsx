'use client';

import Image from 'next/image';
import type { CSSProperties } from 'react';

interface WombatMascotProps {
  size?: number;
  showBackground?: boolean;
  style?: CSSProperties;
  className?: string;
}

export default function WombatMascot({
  size = 32,
  showBackground = false,
  style,
  className,
}: WombatMascotProps) {
  // showBackground = true → used on login page hero; render as a white circle avatar
  if (showBackground) {
    return (
      <div
        className={className}
        style={{
          position: 'relative',
          width: size,
          height: size,
          borderRadius: '50%',
          background: '#ffffff',
          boxShadow: '0 4px 20px rgba(0,0,0,0.12), 0 0 0 1.5px rgba(94,92,230,0.2)',
          overflow: 'hidden',
          flexShrink: 0,
          ...style,
        }}
      >
        <Image
          src="/mascot.png"
          alt="Candor mascot"
          fill
          style={{ objectFit: 'cover' }}
          priority
        />
      </div>
    );
  }

  // Default → nav/inline usage on the light background.
  // mix-blend-mode: multiply blends the white PNG background into the light page bg.
  return (
    <Image
      src="/mascot.png"
      alt="Candor mascot"
      width={size}
      height={size}
      className={className}
      style={{
        objectFit: 'contain',
        flexShrink: 0,
        mixBlendMode: 'multiply',
        ...style,
      }}
      priority
    />
  );
}
