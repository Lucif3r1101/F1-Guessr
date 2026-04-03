import { useState, useCallback, useRef } from 'react';
import { createInitialGameState, processAnswer, getLevelConfig } from '@/lib/gameEngine';
import type { GameState } from '@/lib/gameEngine';
import { fetchChallengesForLevel } from '@/lib/redditService';

export function useGameState() {
  const [state, setState] = useState<GameState>(createInitialGameState(1));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLevel = useCallback(async (level: number, preserveTotalScore: number = 0) => {
    setIsLoading(true);
    setError(null);

    const config = getLevelConfig(level);

    setState(prev => ({
      ...createInitialGameState(level),
      totalScore: preserveTotalScore || prev.totalScore,
      gamePhase: 'loading',
    }));

    try {
      const challenges = await fetchChallengesForLevel(level);

      if (challenges.length === 0) {
        throw new Error('No F1 content found from Reddit. Please check your internet connection and try again.');
      }

      const selected = challenges.slice(0, config.questionsCount);

      setState(prev => ({
        ...prev,
        challenges: selected,
        gamePhase: 'playing',
        startTime: Date.now(),
        questionStartTime: Date.now(),
        lives: config.lives,
        maxLives: config.lives,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load F1 challenges';
      setError(message);
      setState(prev => ({ ...prev, gamePhase: 'lobby' }));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startGame = useCallback(async (level: number = 1) => {
    await loadLevel(level, 0);
  }, [loadLevel]);

  const submitAnswer = useCallback((userAnswer: string, timeRemainingMs: number) => {
    setState(prev => {
      if (prev.gamePhase !== 'playing') return prev;
      const { newState } = processAnswer(prev, userAnswer, timeRemainingMs);
      return newState;
    });
  }, []);

  const useHint = useCallback(() => {
    setState(prev => ({ ...prev, hintUsed: true }));
  }, []);

  const advanceToNextLevel = useCallback(async () => {
    setState(prev => {
      const nextLevel = prev.currentLevel + 1;
      if (nextLevel > 10) {
        return { ...prev, gamePhase: 'victory' };
      }
      // We call loadLevel in the async wrapper outside
      return prev;
    });

    // Read current level from state via ref-like approach
    setState(prev => {
      const nextLevel = prev.currentLevel + 1;
      if (nextLevel > 10) return { ...prev, gamePhase: 'victory' };

      const savedTotal = prev.totalScore;
      // Kick off async load
      loadLevel(nextLevel, savedTotal);
      return { ...prev, gamePhase: 'loading' };
    });
  }, [loadLevel]);

  const resetGame = useCallback(() => {
    setState(createInitialGameState(1));
    setError(null);
    setIsLoading(false);
  }, []);

  const goToLobby = useCallback(() => {
    setState(createInitialGameState(1));
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    state,
    setState,
    isLoading,
    error,
    startGame,
    submitAnswer,
    useHint,
    advanceToNextLevel,
    resetGame,
    goToLobby,
  };
}
