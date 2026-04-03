import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { GameState } from '@/lib/gameEngine';
import { getScoreGrade, getLevelConfig } from '@/lib/gameEngine';

interface ScoreBoardProps {
  state: GameState;
  className?: string;
}

export function ScoreBoard({ state, className }: ScoreBoardProps) {
  const config = getLevelConfig(state.currentLevel);
  const maxPossible = config.basePoints * config.questionsCount * 2;
  const { grade, color, message } = getScoreGrade(state.score, maxPossible);

  return (
    <div className={cn('flex items-center gap-4', className)}>
      <div className="flex flex-col items-end">
        <div className="text-xs text-gray-400 uppercase tracking-wider">Score</div>
        <div data-testid="text-current-score" className="text-2xl font-bold text-white tabular-nums">
          {state.score.toLocaleString()}
        </div>
      </div>
      {state.streak >= 2 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex flex-col items-center"
        >
          <div className="text-xs text-orange-400 uppercase tracking-wider">Streak</div>
          <div data-testid="text-streak" className="text-xl font-bold text-orange-400">
            🔥 {state.streak}x
          </div>
        </motion.div>
      )}
      <div className="flex gap-1 items-center">
        {Array.from({ length: state.maxLives }, (_, i) => (
          <div
            key={i}
            data-testid={`icon-life-${i}`}
            className={cn(
              'w-4 h-4 rounded-full transition-all duration-300',
              i < state.lives ? 'bg-red-500' : 'bg-gray-700',
            )}
          />
        ))}
      </div>
    </div>
  );
}

interface QuestionProgressProps {
  current: number;
  total: number;
  className?: string;
}

export function QuestionProgress({ current, total, className }: QuestionProgressProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex gap-1">
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              i < current ? 'bg-emerald-500 w-4' : i === current ? 'bg-white w-4' : 'bg-gray-700 w-3',
            )}
          />
        ))}
      </div>
      <span className="text-gray-400 text-xs">
        {current}/{total}
      </span>
    </div>
  );
}

interface ResultsCardProps {
  state: GameState;
  onNextLevel: () => void;
  onRestart: () => void;
  className?: string;
}

export function ResultsCard({ state, onNextLevel, onRestart, className }: ResultsCardProps) {
  const config = getLevelConfig(state.currentLevel);
  const maxPossible = config.basePoints * config.questionsCount * 2;
  const { grade, color, message } = getScoreGrade(state.score, maxPossible);
  const correctCount = state.answers.filter(a => a.correct).length;
  const accuracy = state.answers.length > 0 ? Math.round((correctCount / state.answers.length) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn('bg-gray-900 rounded-2xl p-8 text-center border border-gray-700', className)}
    >
      <div className="text-6xl font-black mb-2" style={{ color }}>
        {grade}
      </div>
      <div className="text-xl font-bold text-white mb-1">{message}</div>
      <div className="text-gray-400 mb-6">Level {state.currentLevel} Complete</div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800 rounded-xl p-3">
          <div className="text-2xl font-bold text-white">{state.score.toLocaleString()}</div>
          <div className="text-xs text-gray-400">Score</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-3">
          <div className="text-2xl font-bold text-emerald-400">{accuracy}%</div>
          <div className="text-xs text-gray-400">Accuracy</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-3">
          <div className="text-2xl font-bold text-orange-400">{state.maxStreak}x</div>
          <div className="text-xs text-gray-400">Best Streak</div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {state.currentLevel < 10 && (
          <button
            onClick={onNextLevel}
            data-testid="button-next-level"
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-lg transition-colors"
          >
            Level {state.currentLevel + 1}: {getLevelConfig(state.currentLevel + 1).name} →
          </button>
        )}
        <button
          onClick={onRestart}
          data-testid="button-play-again"
          className="w-full py-2 rounded-xl border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white transition-colors"
        >
          Play Again from Level 1
        </button>
      </div>
    </motion.div>
  );
}
