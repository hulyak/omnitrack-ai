'use client';

import Image from 'next/image';

interface LogoProps {
  variant?: 'full' | 'icon' | 'horizontal';
  size?: number;
  className?: string;
}

export function Logo({ variant = 'icon', size = 64, className = '' }: LogoProps) {
  const logoSrc = {
    full: '/omnitrack-logo.svg',
    icon: '/omnitrack-icon.svg',
    horizontal: '/omnitrack-logo-horizontal.svg',
  }[variant];

  const dimensions = {
    full: { width: size, height: size },
    icon: { width: size, height: size },
    horizontal: { width: size * 4, height: size },
  }[variant];

  return (
    <Image
      src={logoSrc}
      alt="OmniTrack AI Logo"
      width={dimensions.width}
      height={dimensions.height}
      className={className}
      priority
    />
  );
}

// Inline SVG version for better performance
export function LogoInline({ size = 64, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: '#3B82F6', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#8B5CF6', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="12" fill="url(#iconGradient)" />
      <circle cx="32" cy="20" r="4" fill="white" opacity="0.95" />
      <circle cx="20" cy="32" r="4" fill="white" opacity="0.95" />
      <circle cx="44" cy="32" r="4" fill="white" opacity="0.95" />
      <circle cx="20" cy="44" r="4" fill="white" opacity="0.95" />
      <circle cx="32" cy="44" r="4" fill="white" opacity="0.95" />
      <circle cx="44" cy="44" r="4" fill="white" opacity="0.95" />
      <line x1="32" y1="20" x2="20" y2="32" stroke="white" strokeWidth="1.5" opacity="0.7" />
      <line x1="32" y1="20" x2="44" y2="32" stroke="white" strokeWidth="1.5" opacity="0.7" />
      <line x1="20" y1="32" x2="20" y2="44" stroke="white" strokeWidth="1.5" opacity="0.7" />
      <line x1="20" y1="32" x2="32" y2="44" stroke="white" strokeWidth="1.5" opacity="0.7" />
      <line x1="44" y1="32" x2="32" y2="44" stroke="white" strokeWidth="1.5" opacity="0.7" />
      <line x1="44" y1="32" x2="44" y2="44" stroke="white" strokeWidth="1.5" opacity="0.7" />
    </svg>
  );
}
