import { useState, useCallback, useEffect, useMemo } from 'react';
import { createInitialGameState, processAnswer, getLevelConfig, hasPassedLevel } from '@/lib/gameEngine';
import type { GameState } from '@/lib/gameEngine';
import { fetchChallengesForLevel } from '@/lib/redditService';

const STORAGE_KEY = 'f1-guessr-daily-progress-v1';

interface DailyProgress {
  date: string;
  dailyBestScore: number;
  highestUnlockedLevel: number;
}

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getDefaultDailyProgress(): DailyProgress {
  return {
    date: getTodayKey(),
    dailyBestScore: 0,
    highestUnlockedLevel: 1,
  };
}

function loadDailyProgress(): DailyProgress {
  if (typeof window === 'undefined') return getDefaultDailyProgress();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultDailyProgress();

    const parsed = JSON.parse(raw) as Partial<DailyProgress>;
    const today = getTodayKey();

    if (parsed.date !== today) {
      return getDefaultDailyProgress();
    }

    return {
      date: today,
      dailyBestScore: Math.max(0, parsed.dailyBestScore ?? 0),
      highestUnlockedLevel: Math.max(1, Math.min(10, parsed.highestUnlockedLevel ?? 1)),
    };
  } catch {
    return getDefaultDailyProgress();
  }
}

export function useGameState() {
  const [state, setState] = useState<GameState>(createInitialGameState(1));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dailyProgress, setDailyProgress] = useState<DailyProgress>(() => loadDailyProgress());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dailyProgress));
  }, [dailyProgress]);

  useEffect(() => {
    const today = getTodayKey();
    if (dailyProgress.date !== today) {
      setDailyProgress(getDefaultDailyProgress());
    }
  }, [dailyProgress.date]);

  useEffect(() => {
    setDailyProgress(prev => ({
      ...prev,
      dailyBestScore: Math.max(prev.dailyBestScore, state.totalScore),
    }));
  }, [state.totalScore]);

  useEffect(() => {
    if (state.gamePhase === 'levelComplete' || state.gamePhase === 'victory') {
      const config = getLevelConfig(state.currentLevel);
      const maxPossible = config.basePoints * config.questionsCount * 2;
      const passedLevel = state.gamePhase === 'victory' || hasPassedLevel(state.score, maxPossible);
      if (!passedLevel) return;

      const unlockedLevel = Math.min(10, state.currentLevel + 1);
      setDailyProgress(prev => ({
        ...prev,
        highestUnlockedLevel: Math.max(prev.highestUnlockedLevel, unlockedLevel),
      }));
    }
  }, [state.currentLevel, state.gamePhase, state.score]);

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

  const startGame = useCallback(async (level: number = dailyProgress.highestUnlockedLevel) => {
    await loadLevel(level, 0);
  }, [dailyProgress.highestUnlockedLevel, loadLevel]);

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
      const config = getLevelConfig(prev.currentLevel);
      const maxPossible = config.basePoints * config.questionsCount * 2;
      if (!hasPassedLevel(prev.score, maxPossible)) {
        return prev;
      }

      const nextLevel = prev.currentLevel + 1;
      if (nextLevel > 10) {
        return { ...prev, gamePhase: 'victory' };
      }
      // We call loadLevel in the async wrapper outside
      return prev;
    });

    // Read current level from state via ref-like approach
    setState(prev => {
      const config = getLevelConfig(prev.currentLevel);
      const maxPossible = config.basePoints * config.questionsCount * 2;
      if (!hasPassedLevel(prev.score, maxPossible)) {
        return prev;
      }

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

  const canContinueFromLevel = useMemo(
    () => Math.max(1, Math.min(10, dailyProgress.highestUnlockedLevel)),
    [dailyProgress.highestUnlockedLevel],
  );

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
    dailyProgress,
    canContinueFromLevel,
  };
}
