import { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface VideoChallengeProps {
  src: string;
  revealed?: boolean;
  clipDurationSeconds?: number;
  className?: string;
}

export function VideoChallenge({
  src,
  revealed = false,
  clipDurationSeconds = 3,
  className,
}: VideoChallengeProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState(false);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.loop = true;

    if (!revealed) {
      video.currentTime = 0;
      void video.play().then(() => setPlaying(true)).catch(() => setError(true));

      const timer = setTimeout(() => {
        video.pause();
        setPlaying(false);
      }, clipDurationSeconds * 1000);

      return () => clearTimeout(timer);
    } else {
      void video.play().then(() => setPlaying(true)).catch(() => {});
      return undefined;
    }
  }, [src, revealed, clipDurationSeconds]);

  const handleReplay = () => {
    const video = videoRef.current;
    if (!video || revealed) return;
    video.currentTime = 0;
    void video.play().then(() => {
      setPlaying(true);
      setTimeout(() => {
        video.pause();
        setPlaying(false);
      }, clipDurationSeconds * 1000);
    });
  };

  if (error) {
    return (
      <div className={cn('flex items-center justify-center bg-gray-900 text-gray-400', className)}>
        <div className="text-center p-4">
          <div className="text-4xl mb-2">🎬</div>
          <div className="text-sm">Video unavailable</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden group', className)}>
      <video
        ref={videoRef}
        src={src}
        className="w-full h-full object-cover"
        playsInline
        muted
        crossOrigin="anonymous"
        onError={() => setError(true)}
      />
      {!revealed && !playing && (
        <button
          onClick={handleReplay}
          className="absolute inset-0 flex items-center justify-center bg-black/50 hover:bg-black/40 transition-colors"
          data-testid="button-replay-clip"
        >
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center">
              <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </div>
            <span className="text-white text-sm font-medium">Replay Clip</span>
          </div>
        </button>
      )}
      {!revealed && (
        <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
          {clipDurationSeconds}s clip
        </div>
      )}
    </div>
  );
}
