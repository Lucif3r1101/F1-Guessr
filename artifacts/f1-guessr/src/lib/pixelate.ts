export function getPixelationStyle(pixelLevel: number): React.CSSProperties {
  const size = Math.max(1, pixelLevel);
  return {
    imageRendering: 'pixelated',
    filter: `blur(${Math.max(0, size - 4)}px)`,
    transform: 'scale(1)',
    WebkitFilter: `blur(${Math.max(0, size - 4)}px)`,
  };
}

export function getZoomStyle(zoomPercent: number): React.CSSProperties {
  const scale = 1 + (zoomPercent / 100) * 3;
  const offset = (scale - 1) / 2 * 100;

  const positions = [
    { x: 0, y: 0 },
    { x: 100, y: 0 },
    { x: 50, y: 50 },
    { x: 0, y: 100 },
    { x: 100, y: 100 },
  ];

  const pos = positions[Math.floor(Math.random() * positions.length)];

  return {
    transform: `scale(${scale})`,
    transformOrigin: `${pos.x}% ${pos.y}%`,
    transition: 'none',
  };
}

export function getProgressiveRevealStyle(level: number, revealed: boolean): React.CSSProperties {
  if (revealed) {
    return {
      filter: 'none',
      imageRendering: 'auto',
    };
  }

  const blur = Math.max(0, (10 - level) * 2);
  const pixelSize = Math.max(1, (10 - level) * 4);

  return {
    imageRendering: pixelSize > 2 ? 'pixelated' : 'auto',
    filter: `blur(${blur}px)`,
    WebkitFilter: `blur(${blur}px)`,
  };
}

import React from 'react';

export interface ImageRevealProps {
  src: string;
  pixelLevel: number;
  zoomPercent: number;
  type: 'pixelated' | 'zoomed';
  revealed: boolean;
  className?: string;
}

export function getContainerStyle(type: 'pixelated' | 'zoomed'): React.CSSProperties {
  if (type === 'zoomed') {
    return {
      overflow: 'hidden',
      width: '100%',
      height: '100%',
    };
  }
  return {
    width: '100%',
    height: '100%',
  };
}
