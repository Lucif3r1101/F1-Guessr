import { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface VideoChallengeProps {
  src?: string;
  youtubeVideoId?: string;
  audioOnly?: boolean;
  revealed?: boolean;
  clipDurationSeconds?: number;
  className?: string;
}

export function VideoChallenge({
  src,
  youtubeVideoId,
  audioOnly = false,
  revealed = false,
  clipDurationSeconds = 3,
  className,
}: VideoChallengeProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [error, setError] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setError(false);
    setPlaying(false);
    setReady(false);
  }, [src, youtubeVideoId, audioOnly]);

  useEffect(() => {
    return () => {
      if (stopTimerRef.current) {
        clearTimeout(stopTimerRef.current);
        stopTimerRef.current = null;
      }
    };
  }, []);

  const schedulePause = () => {
    if (stopTimerRef.current) {
      clearTimeout(stopTimerRef.current);
    }

    stopTimerRef.current = setTimeout(() => {
      const video = videoRef.current;
      if (!video) return;
      video.pause();
      setPlaying(false);
    }, clipDurationSeconds * 1000);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !ready) return;

    video.muted = true;
    video.loop = revealed;

    if (!revealed) {
      video.currentTime = 0;
      void video.play().then(() => {
        setPlaying(true);
        schedulePause();
      }).catch(() => setError(true));
      return undefined;
    } else {
      void video.play().then(() => setPlaying(true)).catch(() => {});
      return undefined;
    }
  }, [src, revealed, clipDurationSeconds, ready]);

  const handleReplay = () => {
    const video = videoRef.current;
    if (!video || revealed || !ready) return;
    video.currentTime = 0;
    void video.play().then(() => {
      setPlaying(true);
      schedulePause();
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

  if (youtubeVideoId) {
    const autoplay = revealed ? 1 : audioOnly ? 0 : 1;
    const mute = audioOnly ? 0 : 1;
    const embedUrl = `https://www.youtube.com/embed/${youtubeVideoId}?autoplay=${autoplay}&mute=${mute}&controls=0&playsinline=1&rel=0&modestbranding=1&start=0&end=${Math.max(2, clipDurationSeconds)}`;

    return (
      <div className={cn('relative overflow-hidden group bg-black', className)}>
        {audioOnly ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-gray-950 via-gray-900 to-red-950 text-white z-10 pointer-events-none">
            <div className="text-5xl">🎧</div>
            <div className="text-sm font-semibold tracking-wide uppercase text-red-300">Audio Clue</div>
            <div className="text-xs text-gray-400">Use the sound and then pick the right answer.</div>
          </div>
        ) : null}
        <iframe
          key={`${youtubeVideoId}-${revealed}-${audioOnly}-${clipDurationSeconds}`}
          src={embedUrl}
          className={cn('w-full h-full border-0', audioOnly && 'opacity-0')}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={() => setReady(true)}
        />
        {!revealed && (
          <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
            {audioOnly ? `${clipDurationSeconds}s audio` : `${clipDurationSeconds}s clip`}
          </div>
        )}
        {!ready && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full border-2 border-gray-700 border-t-red-500 animate-spin" />
          </div>
        )}
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
        preload="metadata"
        onLoadedData={() => setReady(true)}
        onError={() => setError(true)}
      />
      {!revealed && ready && !playing && (
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
      {!revealed && !ready && !error && (
        <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-gray-700 border-t-red-500 animate-spin" />
        </div>
      )}
    </div>
  );
}
