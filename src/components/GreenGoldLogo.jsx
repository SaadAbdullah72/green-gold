import React from 'react';

/**
 * GreenGold OS - Ultra-Modern Vector Brand Emblem & Typography
 * Monochromatic & duo-tone emerald/gold vector mark with 100% transparent background.
 * No box wrappers, no square clipping, crystal-clear across all resolutions.
 */
export default function GreenGoldLogo({
  size = 40,
  variant = 'full', // 'full' | 'icon' | 'badge'
  title = 'GreenGold',
  subtitle = 'CIRCULAR BIO-ECONOMY SYSTEM',
  textColor = '#FFFFFF',
  subtextColor = '#34D399',
  style = {}
}) {
  const iconMarkup = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <defs>
        {/* Emerald Eco Leaf Gradient */}
        <linearGradient id="gg-leaf-grad" x1="15%" y1="10%" x2="85%" y2="90%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="50%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>

        {/* Solar Gold Loop Gradient */}
        <linearGradient id="gg-gold-grad" x1="80%" y1="15%" x2="20%" y2="85%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="45%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>

        {/* Soft Ambient Vector Glow */}
        <filter id="gg-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Primary Emerald Bio-Leaf Curve */}
      <path
        d="M50 12 C30 12, 14 30, 14 54 C14 74, 29 88, 50 88 C44 76, 42 62, 47 48 C51 37, 59 26, 70 18 C64 14, 57 12, 50 12 Z"
        fill="url(#gg-leaf-grad)"
      />

      {/* Interlocking Solar Gold Recovery Loop */}
      <path
        d="M50 88 C70 88, 86 70, 86 46 C86 28, 73 14, 52 14 C58 26, 60 40, 55 54 C51 65, 43 76, 32 84 C38 87, 44 88, 50 88 Z"
        fill="url(#gg-gold-grad)"
      />

      {/* Center Bio-Sprout Leaflet */}
      <path
        d="M50 32 C43 42, 43 56, 50 68 C57 56, 57 42, 50 32 Z"
        fill="#FFFFFF"
        fillOpacity="0.92"
      />

      {/* IoT Smart Telemetry Pulse Node (Gold Beacon) */}
      <circle cx="50" cy="50" r="4.5" fill="#F59E0B" filter="url(#gg-glow)" />
      <circle cx="50" cy="50" r="2.2" fill="#FFFFFF" />

      {/* Dynamic Upper Smart Signal Arc */}
      <path
        d="M68 28 A 12 12 0 0 1 76 38"
        stroke="#F59E0B"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M74 20 A 20 20 0 0 1 86 36"
        stroke="#34D399"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );

  if (variant === 'icon') {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...style }}>
        {iconMarkup}
      </div>
    );
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: size >= 48 ? '14px' : '10px', textDecoration: 'none', ...style }}>
      {iconMarkup}
      <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.1 }}>
        <div style={{ fontSize: size >= 48 ? '22px' : '18px', fontWeight: 900, color: textColor, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>{title}</span>
          <span style={{ color: '#F59E0B', fontSize: size >= 48 ? '16px' : '13px', fontWeight: 800 }}>OS</span>
        </div>
        {subtitle && (
          <span style={{ fontSize: size >= 48 ? '10px' : '9px', fontWeight: 800, color: subtextColor, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '3px' }}>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
