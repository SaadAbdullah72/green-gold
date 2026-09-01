import React from 'react';

/**
 * GreenGold OS - High-Impact Luxury Vector Brand Emblem
 * Features a bold, premium interlocking circular 'G' bio-monogram with emerald leaf flow & gold recycling core.
 * 100% transparent, large, crisp vector that pops on all backgrounds.
 */
export default function GreenGoldLogo({
  size = 58,
  variant = 'full', // 'full' | 'icon' | 'stacked'
  title = 'GreenGold',
  subtitle = 'CIRCULAR BIO-ECONOMY SYSTEM',
  textColor = '#0F172A',
  subtextColor = '#047857',
  style = {}
}) {
  const iconMarkup = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        filter: 'drop-shadow(0 6px 16px rgba(16, 185, 129, 0.25))'
      }}
    >
      <defs>
        {/* Emerald Bio-Leaf Gradient */}
        <linearGradient id="gg-emerald-glow" x1="10%" y1="10%" x2="90%" y2="90%">
          <stop offset="0%" stopColor="#6EE7B7" />
          <stop offset="35%" stopColor="#10B981" />
          <stop offset="85%" stopColor="#047857" />
          <stop offset="100%" stopColor="#064E3B" />
        </linearGradient>

        {/* Shimmering Solar Gold Gradient */}
        <linearGradient id="gg-gold-glow" x1="100%" y1="10%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="25%" stopColor="#FBBF24" />
          <stop offset="70%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>

        {/* Accent Platinum Highlight */}
        <linearGradient id="gg-plat-shine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* --- LAYER 1: OUTER EMERALD BIO-CREST 'G' SWOOP --- */}
      <path
        d="M60 10 C32 10 12 32 12 60 C12 88 32 110 60 110 C82 110 100 95 106 74 C107 70 104 66 100 66 L78 66 C75 66 72 68 71 71 C68 79 64 84 60 84 C47 84 38 73 38 60 C38 47 47 36 60 36 C68 36 75 41 78 47 L95 32 C87 19 74 10 60 10 Z"
        fill="url(#gg-emerald-glow)"
      />

      {/* --- LAYER 2: INTERLOCKING GOLD CIRCULAR RECOVERY FLUX --- */}
      <path
        d="M60 22 C78 22 93 35 97 52 C98 56 95 60 91 60 L70 60 C68 60 66 58 65 56 C63 48 58 44 52 44 C43 44 36 51 36 60 C36 65 38 70 42 74 L27 88 C18 78 14 69 14 60 C14 39 34 22 60 22 Z"
        fill="url(#gg-gold-glow)"
      />

      {/* --- LAYER 3: DYNAMIC ORGANIC LEAF VEIN WING --- */}
      <path
        d="M60 10 C75 24 82 42 78 64 C64 68 46 62 38 48 C42 32 50 18 60 10 Z"
        fill="url(#gg-plat-shine)"
      />

      {/* --- LAYER 4: CENTER GOLDEN TELEMETRY STAR / CORE BEACON --- */}
      <circle cx="68" cy="66" r="6" fill="url(#gg-gold-glow)" />
      <circle cx="68" cy="66" r="2.5" fill="#FFFFFF" />

      {/* Upper Satellite Arc Sensor Pulse */}
      <path
        d="M92 24 A 18 18 0 0 1 106 42"
        stroke="#F59E0B"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M98 14 A 30 30 0 0 1 114 38"
        stroke="#34D399"
        strokeWidth="3.5"
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

  const isLarge = size >= 60;

  if (variant === 'stacked') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', textDecoration: 'none', gap: '14px', ...style }}>
        {iconMarkup}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.1 }}>
          <div style={{
            fontSize: isLarge ? '32px' : '24px',
            fontWeight: 900,
            color: textColor,
            letterSpacing: '-0.03em',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>Green<span style={{ color: '#F59E0B' }}>Gold</span></span>
            <span style={{
              background: '#042F2E',
              color: '#A3E635',
              fontSize: isLarge ? '14px' : '12px',
              fontWeight: 900,
              padding: '3px 8px',
              borderRadius: '7px',
              letterSpacing: '0.04em',
              border: '1px solid rgba(163, 230, 53, 0.4)'
            }}>
              OS
            </span>
          </div>
          {subtitle && (
            <span style={{
              fontSize: isLarge ? '11px' : '9.5px',
              fontWeight: 800,
              color: subtextColor,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginTop: '6px',
              opacity: 0.95
            }}>
              {subtitle}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: isLarge ? '18px' : '14px', textDecoration: 'none', ...style }}>
      {iconMarkup}
      <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.05 }}>
        <div style={{
          fontSize: isLarge ? '26px' : '22px',
          fontWeight: 900,
          color: textColor,
          letterSpacing: '-0.03em',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span>Green<span style={{ color: '#F59E0B' }}>Gold</span></span>
          <span style={{
            background: '#042F2E',
            color: '#A3E635',
            fontSize: isLarge ? '13px' : '11px',
            fontWeight: 900,
            padding: '2px 7px',
            borderRadius: '6px',
            letterSpacing: '0.04em',
            border: '1px solid rgba(163, 230, 53, 0.3)'
          }}>
            OS
          </span>
        </div>
        {subtitle && (
          <span style={{
            fontSize: isLarge ? '11px' : '9.5px',
            fontWeight: 800,
            color: subtextColor,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginTop: '5px',
            opacity: 0.95
          }}>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
