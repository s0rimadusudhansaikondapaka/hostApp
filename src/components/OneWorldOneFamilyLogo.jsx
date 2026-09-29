import React from 'react';

export default function OneWorldOneFamilyLogo({
  size = 50,
  showText = false,
  variant = 'navbar', // 'navbar', 'hero', 'badge', 'compact'
  speed = 'normal' // 'slow', 'normal', 'fast'
}) {
  const globeSize = size;
  const isNavbar = variant === 'navbar';
  const isHero = variant === 'hero';

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: isHero ? '1rem' : '0.75rem' }}>
      {/* 360-Degree Continuously Rotating Emblem Logo */}
      <div
        className="owof-glow"
        style={{
          position: 'relative',
          width: `${globeSize}px`,
          height: `${globeSize}px`,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 16px rgba(252, 185, 0, 0.6), 0 4px 12px rgba(78, 8, 29, 0.4)',
          border: '2px solid #fcb900',
          cursor: 'pointer',
          flexShrink: 0,
          background: '#4e081d',
          padding: '2px',
          overflow: 'hidden'
        }}
        title="One World One Family - Vasudhaiva Kutumbakam"
      >
        {/* Continuous 360-degree Vertical Spinning Flat 2D Official Emblem */}
        <img
          src="/one_world_one_family_logo.jpg"
          alt="Sri Madhusudan Sai - One World One Family Logo"
          className="spin-360-vertical"
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            objectFit: 'cover',
            display: 'block',
            transformOrigin: 'center center'
          }}
        />

        {/* Outer Golden Glowing Counter-Rotating Orbital Ring */}
        <div
          className="spin-360-reverse-smooth"
          style={{
            position: 'absolute',
            top: '-3px',
            left: '-3px',
            right: '-3px',
            bottom: '-3px',
            borderRadius: '50%',
            border: '1.5px dashed #fcb900',
            pointerEvents: 'none',
            opacity: 0.85
          }}
        />
      </div>

      {/* Optional Branding Text */}
      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              fontSize: isHero ? '1.4rem' : '1.05rem',
              fontWeight: '900',
              color: isNavbar ? '#ffffff' : '#4e081d',
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              lineHeight: 1.1
            }}
          >
            <span>ONE WORLD ONE FAMILY</span>
            <span
              style={{
                fontSize: '0.65rem',
                background: '#df6f06',
                color: '#ffffff',
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
                fontWeight: 'bold',
                letterSpacing: '0.5px'
              }}
            >
              VASUDHAIVA KUTUMBAKAM
            </span>
          </div>
          <div
            style={{
              fontSize: isHero ? '0.85rem' : '0.7rem',
              color: isNavbar ? '#fcb900' : '#df6f06',
              fontWeight: '600',
              fontStyle: 'italic',
              marginTop: '2px'
            }}
          >
            Sathya Sai Grama
          </div>
        </div>
      )}
    </div>
  );
}
