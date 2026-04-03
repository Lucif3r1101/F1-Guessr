import { motion } from 'framer-motion';
import { Trophy, ChevronRight, RotateCcw } from 'lucide-react';
import { getLevelConfig, getScoreGrade, getLevelUnlockMessage } from '@/lib/gameEngine';
import type { GameState } from '@/lib/gameEngine';

interface LevelCompleteProps {
  state: GameState;
  onNextLevel: () => void;
  onRestart: () => void;
  onGoHome: () => void;
}

export function LevelComplete({ state, onNextLevel, onRestart, onGoHome }: LevelCompleteProps) {
  const config = getLevelConfig(state.currentLevel);
  const maxPossible = config.basePoints * config.questionsCount * 2;
  const { grade, color, message } = getScoreGrade(state.score, maxPossible);
  const correctCount = state.answers.filter(a => a.correct).length;
  const accuracy = state.answers.length > 0 ? Math.round((correctCount / state.answers.length) * 100) : 0;
  const nextConfig = getLevelConfig(state.currentLevel + 1);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', bounce: 0.3 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="text-8xl font-black mb-3"
            style={{ color }}
          >
            {grade}
          </motion.div>
          <h1 className="text-2xl font-bold">{message}</h1>
          <p className="text-gray-400 mt-1">Level {state.currentLevel} Complete!</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-3 gap-3 mb-6"
        >
          {[
            { label: 'Score', value: state.score.toLocaleString(), color: 'text-white' },
            { label: 'Accuracy', value: `${accuracy}%`, color: 'text-emerald-400' },
            { label: 'Best Streak', value: `${state.maxStreak}x`, color: 'text-orange-400' },
          ].map(({ label, value, color: c }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
              <div className={`text-2xl font-bold ${c}`}>{value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          {state.currentLevel < 10 && (
            <>
              <div className="bg-gray-900 border border-red-800/40 rounded-xl p-4 mb-4">
                <div className="text-xs text-red-400 uppercase tracking-wider mb-1">Unlocked</div>
                <div className="font-bold text-white">Level {state.currentLevel + 1}: {nextConfig.name}</div>
                <div className="text-xs text-gray-400 mt-1">{getLevelUnlockMessage(state.currentLevel + 1)}</div>
                <div className="text-xs text-gray-500 mt-1">{nextConfig.timePerQuestion}s per Q · {nextConfig.lives} lives</div>
              </div>
              <button
                onClick={onNextLevel}
                data-testid="button-next-level"
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-lg transition-colors"
              >
                Continue to Level {state.currentLevel + 1}
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
          <button
            onClick={onRestart}
            data-testid="button-restart-game"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Play Again
          </button>
          <button
            onClick={onGoHome}
            data-testid="button-go-home"
            className="w-full py-2 text-gray-500 hover:text-gray-400 text-sm transition-colors"
          >
            Back to Menu
          </button>
        </motion.div>
      </div>
    </div>
  );
}

interface GameOverProps {
  state: GameState;
  onRestart: () => void;
  onGoHome: () => void;
}

export function GameOver({ state, onRestart, onGoHome }: GameOverProps) {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring' }}
        >
          <div className="text-7xl mb-4">💥</div>
          <h1 className="text-4xl font-black text-red-500 mb-2">RACE OVER</h1>
          <p className="text-gray-400 mb-6">You ran out of lives on Level {state.currentLevel}</p>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-6">
            <div className="text-3xl font-bold text-white mb-1">{state.totalScore.toLocaleString()}</div>
            <div className="text-gray-500 text-sm">Total Score</div>
            <div className="mt-4 text-sm text-gray-400">
              Reached Level <span className="text-white font-bold">{state.currentLevel}</span>
              {' · '}{state.answers.filter(a => a.correct).length}/{state.answers.length} correct
            </div>
          </div>

          <button
            onClick={onRestart}
            data-testid="button-try-again"
            className="w-full py-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-lg mb-3 transition-colors"
          >
            Try Again
          </button>
          <button
            onClick={onGoHome}
            data-testid="button-go-home"
            className="w-full py-2 text-gray-500 hover:text-gray-400 text-sm transition-colors"
          >
            Back to Menu
          </button>
        </motion.div>
      </div>
    </div>
  );
}

interface VictoryProps {
  state: GameState;
  onRestart: () => void;
  onGoHome: () => void;
}

export function Victory({ state, onRestart, onGoHome }: VictoryProps) {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 20 }, (_, i) => (
          <motion.div
            key={i}
            initial={{ y: -20, x: Math.random() * window.innerWidth, opacity: 0 }}
            animate={{ y: window.innerHeight + 20, opacity: [0, 1, 0] }}
            transition={{ duration: 2 + Math.random() * 2, delay: Math.random() * 2, repeat: Infinity }}
            className="absolute w-2 h-2 rounded-full"
            style={{ backgroundColor: ['#FF0000', '#FFD700', '#00FF00', '#0000FF', '#FF00FF'][i % 5] }}
          />
        ))}
      </div>

      <div className="max-w-md w-full text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', bounce: 0.4 }}
        >
          <Trophy className="w-20 h-20 text-yellow-400 mx-auto mb-4" />
          <h1 className="text-5xl font-black text-yellow-400 mb-2">F1 LEGEND!</h1>
          <p className="text-gray-300 mb-2">You've conquered all 10 levels!</p>
          <p className="text-gray-500 text-sm mb-8">Only the true fans make it this far.</p>

          <div className="bg-gray-900 border border-yellow-700/40 rounded-xl p-6 mb-6">
            <div className="text-4xl font-black text-yellow-400 mb-1">{state.totalScore.toLocaleString()}</div>
            <div className="text-gray-400 text-sm">Legendary Score</div>
          </div>

          <button
            onClick={onRestart}
            data-testid="button-play-again"
            className="w-full py-4 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-black font-black text-lg mb-3 transition-colors"
          >
            Play Again
          </button>
          <button
            onClick={onGoHome}
            data-testid="button-go-home"
            className="w-full py-2 text-gray-500 hover:text-gray-400 text-sm transition-colors"
          >
            Back to Menu
          </button>
        </motion.div>
      </div>
    </div>
  );
}
