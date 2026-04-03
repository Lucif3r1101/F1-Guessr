import { Switch, Route, Router as WouterRouter } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useGameState } from '@/hooks/useGameState';
import { Lobby } from '@/pages/Lobby';
import { GameScreen } from '@/pages/GameScreen';
import { LevelComplete, GameOver, Victory } from '@/pages/LevelComplete';
import { motion, AnimatePresence } from 'framer-motion';

const queryClient = new QueryClient();

function GameApp() {
  const {
    state,
    isLoading,
    error,
    startGame,
    submitAnswer,
    useHint,
    advanceToNextLevel,
    goToLobby,
    dailyProgress,
    canContinueFromLevel,
  } = useGameState();

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="race-panel max-w-md w-full rounded-[2rem] border border-red-500/20 p-8 text-center">
          <div className="mx-auto mb-5 flex h-18 w-18 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10 text-4xl">!</div>
          <h2 className="mb-2 text-2xl font-black text-red-300">Grid Feed Interrupted</h2>
          <p className="mb-6 text-sm leading-6 text-gray-400">{error}</p>
          <button
            onClick={goToLobby}
            className="w-full rounded-2xl bg-gradient-to-r from-red-600 to-orange-500 py-3 font-black tracking-[0.16em] text-white transition-transform hover:scale-[1.01] active:scale-[0.99]"
            data-testid="button-retry"
          >
            TRY AGAIN
          </button>
        </div>
      </div>
    );
  }

  if (state.gamePhase === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="race-panel race-grid w-full max-w-lg rounded-[2rem] border border-white/10 p-8 text-center">
          <div className="relative mx-auto mb-6 h-24 w-24">
            <div className="absolute inset-0 rounded-full border-4 border-white/5" />
            <div className="absolute inset-0 rounded-full border-4 border-red-600 border-t-transparent animate-spin" />
            <div className="absolute inset-4 flex items-center justify-center rounded-full bg-gradient-to-br from-red-500/25 to-yellow-400/10">
              <span className="text-sm font-black tracking-[0.2em] text-red-300">F1</span>
            </div>
          </div>
          <div className="text-xs uppercase tracking-[0.35em] text-red-400">Building Race Pack</div>
          <p className="mt-3 text-2xl font-black text-white">Loading live F1 content</p>
          <p className="mt-2 animate-pulse text-sm text-gray-400">Refreshing the live challenge cache and lining up your next session.</p>
          <p className="mt-4 text-xs text-gray-600">
            Level {state.currentLevel}: {state.currentLevel > 1 ? 'Fetching harder challenges...' : 'Gathering fresh F1 moments...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {state.gamePhase === 'lobby' && (
        <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <Lobby
            onStartGame={() => startGame(canContinueFromLevel)}
            totalScore={state.totalScore}
            dailyBestScore={dailyProgress.dailyBestScore}
            highestUnlockedLevel={canContinueFromLevel}
          />
        </motion.div>
      )}

      {state.gamePhase === 'playing' && (
        <motion.div key="game" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <GameScreen
            state={state}
            onAnswer={(answer, time) => submitAnswer(answer, time)}
            onHint={useHint}
            onGoHome={goToLobby}
          />
        </motion.div>
      )}

      {state.gamePhase === 'levelComplete' && (
        <motion.div key="levelComplete" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <LevelComplete
            state={state}
            onNextLevel={advanceToNextLevel}
            onRestart={() => startGame(1)}
            onGoHome={goToLobby}
          />
        </motion.div>
      )}

      {state.gamePhase === 'gameOver' && (
        <motion.div key="gameOver" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <GameOver
            state={state}
            onRestart={() => startGame(1)}
            onGoHome={goToLobby}
          />
        </motion.div>
      )}

      {state.gamePhase === 'victory' && (
        <motion.div key="victory" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <Victory
            state={state}
            onRestart={() => startGame(1)}
            onGoHome={goToLobby}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Switch>
            <Route path="/" component={GameApp} />
          </Switch>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
