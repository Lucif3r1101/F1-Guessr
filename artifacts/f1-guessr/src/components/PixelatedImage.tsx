import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface PixelatedImageProps {
  src: string;
  pixelLevel: number;
  zoomPercent?: number;
  type: 'pixelated' | 'zoomed';
  revealed?: boolean;
  className?: string;
  alt?: string;
}

/**
 * CSS-based pixelation/zoom that works with cross-origin images.
 * Canvas approach fails with Reddit images due to CORS — CSS works fine.
 *
 * Pixelation technique: render at tiny size then scale up with image-rendering: pixelated
 * Zoom technique: object-fit cover + transform scale with overflow hidden
 */
export function PixelatedImage({
  src,
  pixelLevel,
  zoomPercent = 0,
  type,
  revealed = false,
  className,
  alt = 'F1 Challenge',
}: PixelatedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [sourceIndex, setSourceIndex] = useState(0);
  const zoomOrigin = useRef({
    x: 20 + Math.floor(Math.random() * 60),
    y: 20 + Math.floor(Math.random() * 60),
  });
  const imageSources = getImageSourceCandidates(src);

  useEffect(() => {
    setLoaded(false);
    setError(false);
    setSourceIndex(0);
  }, [src]);

  const activeSrc = imageSources[Math.min(sourceIndex, imageSources.length - 1)];

  const handleLoad = () => {
    setLoaded(true);
    setError(false);
  };

  const handleError = () => {
    if (sourceIndex < imageSources.length - 1) {
      setLoaded(false);
      setSourceIndex((current) => current + 1);
      return;
    }

    setError(true);
  };

  if (error) {
    return (
      <div className={cn('flex items-center justify-center bg-gray-900 text-gray-500', className)}>
        <div className="text-center p-4">
          <div className="text-5xl mb-3">🏎️</div>
          <div className="text-sm">Image unavailable</div>
          <div className="text-xs mt-1 text-gray-600">Try next question</div>
        </div>
      </div>
    );
  }

  if (revealed) {
    return (
      <div className={cn('relative overflow-hidden', className)}>
        {!loaded && <Shimmer />}
        <img
          src={activeSrc}
          alt={alt}
          className="w-full h-full object-cover"
          onLoad={handleLoad}
          onError={handleError}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  if (type === 'pixelated') {
    // Pixelation: render at low size then scale up with pixelated rendering
    // pixelLevel 4 → 64px wide, 48 → 8px wide. Clamped 8-80px.
    const renderSize = Math.max(8, Math.min(80, 80 - pixelLevel * 1.5));

    return (
      <div className={cn('relative overflow-hidden', className)}>
        {!loaded && <Shimmer />}
        <img
          src={activeSrc}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          referrerPolicy="no-referrer"
          style={{
            width: `${renderSize}px`,
            height: `${renderSize * 0.67}px`,
            objectFit: 'cover',
            transform: `scale(${Math.round(600 / renderSize)})`,
            transformOrigin: 'top left',
            imageRendering: 'pixelated',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        />
      </div>
    );
  }

  // Zoomed: scale image up from a fixed origin point
  const scale = 1 + (zoomPercent / 100) * 5;
  const ox = zoomOrigin.current.x;
  const oy = zoomOrigin.current.y;

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {!loaded && <Shimmer />}
      <img
        src={activeSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        referrerPolicy="no-referrer"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `scale(${scale})`,
          transformOrigin: `${ox}% ${oy}%`,
          transition: 'none',
        }}
      />
    </div>
  );
}

function getImageSourceCandidates(src: string): string[] {
  const normalized = src.trim();
  if (!normalized) {
    return [''];
  }

  const candidates = [normalized];

  try {
    const parsed = new URL(normalized);
    const withoutProtocol = `${parsed.host}${parsed.pathname}${parsed.search}`;

    // Remote media hosts, especially Reddit preview URLs, can reject direct embedding.
    // Retrying through image proxies makes the frontend-only app much more resilient.
    candidates.push(`https://images.weserv.nl/?url=${encodeURIComponent(withoutProtocol)}`);
    candidates.push(`https://wsrv.nl/?url=${encodeURIComponent(withoutProtocol)}&n=-1`);
  } catch {
    // Keep the original source only if URL parsing fails.
  }

  return [...new Set(candidates)];
}

function Shimmer() {
  return (
    <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
      <div className="w-10 h-10 rounded-full border-2 border-gray-700 border-t-red-500 animate-spin" />
    </div>
  );
}
