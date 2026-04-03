import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Lightbulb, Home } from 'lucide-react';
import { TimerBar } from '@/components/TimerBar';
import { PixelatedImage } from '@/components/PixelatedImage';
import { VideoChallenge } from '@/components/VideoChallenge';
import { AnswerOptions, FillInTheBlank } from '@/components/AnswerOptions';
import { ScoreBoard, QuestionProgress } from '@/components/ScoreBoard';
import { useCountdown } from '@/hooks/useCountdown';
import { getLevelConfig } from '@/lib/gameEngine';
import type { GameState } from '@/lib/gameEngine';
import type { F1Challenge } from '@/lib/redditService';
import { cn } from '@/lib/utils';

interface GameScreenProps {
  state: GameState;
  onAnswer: (answer: string, timeRemainingMs: number) => void;
  onHint: () => void;
  onGoHome: () => void;
}

export function GameScreen({ state, onAnswer, onHint, onGoHome }: GameScreenProps) {
  const config = getLevelConfig(state.currentLevel);
  const challenge: F1Challenge | undefined = state.challenges[state.currentQuestionIndex];
  const [answered, setAnswered] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [lastResult, setLastResult] = useState<{ correct: boolean; points: number } | null>(null);
  const [showHint, setShowHint] = useState(false);

  const handleExpire = useCallback(() => {
    if (!answered) {
      setAnswered(true);
      setRevealed(true);
      onAnswer('', 0);
    }
  }, [answered, onAnswer]);

  const { timeRemainingMs, secondsRemaining, percentageRemaining, start, stop } = useCountdown(
    config.timePerQuestion,
    handleExpire,
  );

  useEffect(() => {
    setAnswered(false);
    setRevealed(false);
    setLastResult(null);
    setShowHint(false);
    start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentQuestionIndex, state.currentLevel]);

  const handleAnswer = useCallback((answer: string) => {
    if (answered) return;
    stop();
    const correct = answer.toLowerCase().trim() === challenge?.answer.toLowerCase().trim();
    setAnswered(true);
    setRevealed(true);
    setLastResult({
      correct,
      points: correct ? Math.floor((timeRemainingMs / (config.timePerQuestion * 1000)) * config.basePoints + config.basePoints) : 0,
    });
    onAnswer(answer, timeRemainingMs);
  }, [answered, challenge, timeRemainingMs, config, stop, onAnswer]);

  const handleHint = () => {
    if (!showHint) {
      setShowHint(true);
      onHint();
    }
  };

  if (!challenge) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500" />
      </div>
    );
  }

  const useFillInBlank = challenge.options.length === 0 || (config.level >= 5 && Math.random() > 0.6);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <button
          onClick={onGoHome}
          className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-sm"
          data-testid="button-go-home"
        >
          <Home className="w-4 h-4" />
          <span className="hidden sm:inline">Exit</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="text-xs font-bold text-red-500 uppercase tracking-wider">
            Level {state.currentLevel}: {config.name}
          </div>
          <QuestionProgress
            current={state.currentQuestionIndex}
            total={state.challenges.length}
          />
        </div>
        <ScoreBoard state={state} />
      </header>

      <main className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-4 gap-4">
        <TimerBar
          percentageRemaining={percentageRemaining}
          secondsRemaining={secondsRemaining}
          isRunning={!answered}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={`${state.currentQuestionIndex}-${state.currentLevel}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col gap-4"
          >
            <div className="aspect-video rounded-2xl overflow-hidden bg-gray-900 border border-gray-800 relative">
              {(challenge.type === 'video' || challenge.type === 'clip') && challenge.videoUrl ? (
                <VideoChallenge
                  src={challenge.videoUrl}
                  revealed={revealed}
                  clipDurationSeconds={Math.max(2, 6 - state.currentLevel * 0.5)}
                  className="w-full h-full"
                />
              ) : challenge.imageUrl ? (
                <PixelatedImage
                  src={challenge.imageUrl}
                  pixelLevel={revealed ? 0 : config.pixelationLevel}
                  zoomPercent={revealed ? 0 : config.zoomLevel}
                  type={challenge.type === 'zoomed' ? 'zoomed' : 'pixelated'}
                  revealed={revealed}
                  className="w-full h-full"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🏎️</div>
                    <div>No media available</div>
                  </div>
                </div>
              )}

              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-xs px-2 py-1 rounded-md text-gray-300">
                {challenge.type === 'pixelated' && '🔲 Pixelated'}
                {challenge.type === 'zoomed' && '🔍 Zoomed In'}
                {challenge.type === 'video' && '🎬 Video Clip'}
                {challenge.type === 'clip' && '🎬 Short Clip'}
              </div>

              {revealed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={cn(
                    'absolute inset-0 flex items-end p-3',
                    'bg-gradient-to-t from-black/80 to-transparent',
                  )}
                >
                  <div className="w-full">
                    <div className={cn(
                      'text-sm font-bold px-3 py-1 rounded-lg inline-block',
                      lastResult?.correct ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white',
                    )}>
                      {lastResult?.correct ? `+${lastResult.points} pts` : 'Time up!'}
                    </div>
                    {!lastResult?.correct && (
                      <div className="text-gray-300 text-xs mt-1 ml-1">
                        Answer: <span className="text-white font-semibold">{challenge.answer}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
              <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider">
                Identify the {challenge.questionType}:
              </div>
              {showHint && (
                <div className="text-xs text-yellow-400 mt-1 bg-yellow-900/20 border border-yellow-700/30 rounded px-2 py-1">
                  Hint: {challenge.hint}
                </div>
              )}
            </div>

            {useFillInBlank ? (
              <FillInTheBlank
                answer={challenge.answer}
                hint={challenge.hint}
                onAnswer={handleAnswer}
                revealed={revealed}
                disabled={answered}
              />
            ) : (
              <AnswerOptions
                options={challenge.options}
                correctAnswer={challenge.answer}
                onAnswer={handleAnswer}
                revealed={revealed}
                disabled={answered}
              />
            )}

            <div className="flex gap-2 justify-between items-center">
              {!showHint && !answered && (
                <button
                  onClick={handleHint}
                  className="flex items-center gap-1.5 text-xs text-yellow-400 hover:text-yellow-300 border border-yellow-700/40 hover:border-yellow-500/60 px-3 py-2 rounded-lg transition-all"
                  data-testid="button-use-hint"
                >
                  <Lightbulb className="w-3 h-3" />
                  Use Hint (-40% points)
                </button>
              )}
              {answered && (
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <a
                    href={challenge.redditPermalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-gray-200 transition-colors"
                    data-testid="link-reddit-source"
                  >
                    View on Reddit
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
