import { useState, useEffect, useRef, useCallback } from 'react';

export function useCountdown(durationSeconds: number, onExpire?: () => void) {
  const [timeRemainingMs, setTimeRemainingMs] = useState(durationSeconds * 1000);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clearTimer();
    startTimeRef.current = Date.now();
    setTimeRemainingMs(durationSeconds * 1000);
    setIsRunning(true);

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, durationSeconds * 1000 - elapsed);
      setTimeRemainingMs(remaining);

      if (remaining <= 0) {
        clearTimer();
        setIsRunning(false);
        onExpireRef.current?.();
      }
    }, 50);
  }, [durationSeconds, clearTimer]);

  const pause = useCallback(() => {
    clearTimer();
    setIsRunning(false);
  }, [clearTimer]);

  const reset = useCallback(() => {
    clearTimer();
    setTimeRemainingMs(durationSeconds * 1000);
    setIsRunning(false);
  }, [durationSeconds, clearTimer]);

  const stop = useCallback(() => {
    clearTimer();
    setIsRunning(false);
    setTimeRemainingMs(0);
  }, [clearTimer]);

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  const percentageRemaining = (timeRemainingMs / (durationSeconds * 1000)) * 100;
  const secondsRemaining = Math.ceil(timeRemainingMs / 1000);

  return {
    timeRemainingMs,
    secondsRemaining,
    percentageRemaining,
    isRunning,
    start,
    pause,
    reset,
    stop,
  };
}
