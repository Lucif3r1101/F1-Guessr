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
    resetGame,
    goToLobby,
  } = useGameState();

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-red-400 mb-2">Failed to Load</h2>
          <p className="text-gray-400 text-sm mb-6">{error}</p>
          <button
            onClick={goToLobby}
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-colors"
            data-testid="button-retry"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (state.gamePhase === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-gray-800" />
            <div className="absolute inset-0 rounded-full border-4 border-red-600 border-t-transparent animate-spin" />
            <div className="absolute inset-3 rounded-full bg-red-600/20 flex items-center justify-center">
              <span className="text-red-400 text-xs font-bold">F1</span>
            </div>
          </div>
          <p className="text-gray-400 text-sm animate-pulse">Loading live F1 content from Reddit...</p>
          <p className="text-gray-600 text-xs mt-2">Level {state.currentLevel}: {state.currentLevel > 1 ? 'Fetching harder challenges...' : 'Gathering F1 moments...'}</p>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {state.gamePhase === 'lobby' && (
        <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <Lobby
            onStartGame={startGame}
            totalScore={state.totalScore}
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
