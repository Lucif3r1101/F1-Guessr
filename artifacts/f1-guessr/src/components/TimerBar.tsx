import { cn } from '@/lib/utils';
import { useEffect } from 'react';

interface TimerBarProps {
  percentageRemaining: number;
  secondsRemaining: number;
  isRunning: boolean;
  className?: string;
}

export function TimerBar({ percentageRemaining, secondsRemaining, isRunning, className }: TimerBarProps) {
  const urgent = secondsRemaining <= 5;
  const warning = secondsRemaining <= 10;

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        data-testid="text-timer-seconds"
        className={cn(
          'text-2xl font-bold tabular-nums min-w-[2.5rem] text-center',
          urgent ? 'text-red-500 animate-pulse' : warning ? 'text-orange-400' : 'text-white',
        )}
      >
        {secondsRemaining}
      </div>
      <div className="flex-1 h-3 bg-gray-800 rounded-full overflow-hidden">
        <div
          data-testid="bar-timer-progress"
          className={cn(
            'h-full rounded-full transition-all',
            urgent ? 'bg-red-500' : warning ? 'bg-orange-400' : 'bg-emerald-500',
            isRunning && 'transition-none',
          )}
          style={{ width: `${percentageRemaining}%` }}
        />
      </div>
    </div>
  );
}
