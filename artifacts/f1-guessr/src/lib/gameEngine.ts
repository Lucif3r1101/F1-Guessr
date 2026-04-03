import type { F1Challenge } from './redditService';

export interface GameState {
  currentLevel: number;
  currentQuestionIndex: number;
  score: number;
  totalScore: number;
  streak: number;
  maxStreak: number;
  lives: number;
  maxLives: number;
  challenges: F1Challenge[];
  answers: PlayerAnswer[];
  gamePhase: 'lobby' | 'loading' | 'playing' | 'results' | 'levelComplete' | 'gameOver' | 'victory';
  hintUsed: boolean;
  timeBonus: number;
  startTime: number;
  questionStartTime: number;
}

export interface PlayerAnswer {
  challengeId: string;
  answer: string;
  correct: boolean;
  timeMs: number;
  pointsEarned: number;
  hintUsed: boolean;
}

export interface LevelConfig {
  level: number;
  name: string;
  description: string;
  questionsCount: number;
  timePerQuestion: number;
  basePoints: number;
  streakMultiplier: number;
  pixelationLevel: number;
  zoomLevel: number;
  lives: number;
}

export const LEVEL_CONFIGS: LevelConfig[] = [
  {
    level: 1,
    name: 'Rookie',
    description: 'Wide angle, clear images. Multiple choice with 4 options.',
    questionsCount: 5,
    timePerQuestion: 30,
    basePoints: 100,
    streakMultiplier: 1.1,
    pixelationLevel: 4,
    zoomLevel: 50,
    lives: 5,
  },
  {
    level: 2,
    name: 'Racing Fan',
    description: 'Slightly tighter crops. 30 seconds per question.',
    questionsCount: 5,
    timePerQuestion: 28,
    basePoints: 150,
    streakMultiplier: 1.15,
    pixelationLevel: 6,
    zoomLevel: 60,
    lives: 4,
  },
  {
    level: 3,
    name: 'Paddock Pass',
    description: 'More pixelation. Video clips included. 25 seconds.',
    questionsCount: 6,
    timePerQuestion: 25,
    basePoints: 200,
    streakMultiplier: 1.2,
    pixelationLevel: 8,
    zoomLevel: 70,
    lives: 4,
  },
  {
    level: 4,
    name: 'Pit Crew',
    description: 'Heavy pixelation. Mix of types. 22 seconds.',
    questionsCount: 6,
    timePerQuestion: 22,
    basePoints: 250,
    streakMultiplier: 1.25,
    pixelationLevel: 12,
    zoomLevel: 80,
    lives: 3,
  },
  {
    level: 5,
    name: 'Team Principal',
    description: 'Extreme zoom. Fill in the blank included. 20 seconds.',
    questionsCount: 7,
    timePerQuestion: 20,
    basePoints: 300,
    streakMultiplier: 1.3,
    pixelationLevel: 16,
    zoomLevel: 85,
    lives: 3,
  },
  {
    level: 6,
    name: 'Race Engineer',
    description: 'Extreme pixelation. Short clips. 18 seconds.',
    questionsCount: 7,
    timePerQuestion: 18,
    basePoints: 400,
    streakMultiplier: 1.35,
    pixelationLevel: 20,
    zoomLevel: 90,
    lives: 3,
  },
  {
    level: 7,
    name: 'Technical Director',
    description: 'Micro clips. Ultra zoom. 15 seconds.',
    questionsCount: 8,
    timePerQuestion: 15,
    basePoints: 500,
    streakMultiplier: 1.4,
    pixelationLevel: 24,
    zoomLevel: 92,
    lives: 2,
  },
  {
    level: 8,
    name: 'Championship Contender',
    description: 'Blurred stills, partial clips. 12 seconds.',
    questionsCount: 8,
    timePerQuestion: 12,
    basePoints: 650,
    streakMultiplier: 1.5,
    pixelationLevel: 30,
    zoomLevel: 95,
    lives: 2,
  },
  {
    level: 9,
    name: 'World Champion',
    description: 'One frame clips. Extreme blur. 10 seconds.',
    questionsCount: 9,
    timePerQuestion: 10,
    basePoints: 800,
    streakMultiplier: 1.6,
    pixelationLevel: 36,
    zoomLevel: 97,
    lives: 2,
  },
  {
    level: 10,
    name: 'F1 Legend',
    description: 'Impossible mode. Max blur. 8 seconds. One life.',
    questionsCount: 10,
    timePerQuestion: 8,
    basePoints: 1000,
    streakMultiplier: 2.0,
    pixelationLevel: 48,
    zoomLevel: 99,
    lives: 1,
  },
];

export function getLevelConfig(level: number): LevelConfig {
  return LEVEL_CONFIGS[Math.min(level - 1, LEVEL_CONFIGS.length - 1)];
}

export function calculatePoints(
  config: LevelConfig,
  timeRemainingMs: number,
  streak: number,
  hintUsed: boolean,
): number {
  const timeFactor = Math.max(0, timeRemainingMs / (config.timePerQuestion * 1000));
  const timeBonus = Math.floor(timeFactor * config.basePoints * 0.5);
  const streakBonus = Math.pow(config.streakMultiplier, Math.min(streak, 10));
  const hintPenalty = hintUsed ? 0.6 : 1;

  return Math.floor((config.basePoints + timeBonus) * streakBonus * hintPenalty);
}

export function createInitialGameState(level: number = 1): GameState {
  const config = getLevelConfig(level);
  return {
    currentLevel: level,
    currentQuestionIndex: 0,
    score: 0,
    totalScore: 0,
    streak: 0,
    maxStreak: 0,
    lives: config.lives,
    maxLives: config.lives,
    challenges: [],
    answers: [],
    gamePhase: 'lobby',
    hintUsed: false,
    timeBonus: 0,
    startTime: 0,
    questionStartTime: 0,
  };
}

export function processAnswer(
  state: GameState,
  userAnswer: string,
  timeRemainingMs: number,
): { newState: GameState; pointsEarned: number; correct: boolean } {
  const config = getLevelConfig(state.currentLevel);
  const challenge = state.challenges[state.currentQuestionIndex];
  const correct = userAnswer.toLowerCase().trim() === challenge.answer.toLowerCase().trim();

  const pointsEarned = correct
    ? calculatePoints(config, timeRemainingMs, state.streak, state.hintUsed)
    : 0;

  const newAnswer: PlayerAnswer = {
    challengeId: challenge.id,
    answer: userAnswer,
    correct,
    timeMs: config.timePerQuestion * 1000 - timeRemainingMs,
    pointsEarned,
    hintUsed: state.hintUsed,
  };

  const newStreak = correct ? state.streak + 1 : 0;
  const newLives = correct ? state.lives : state.lives - 1;

  const newState: GameState = {
    ...state,
    score: state.score + pointsEarned,
    totalScore: state.totalScore + pointsEarned,
    streak: newStreak,
    maxStreak: Math.max(state.maxStreak, newStreak),
    lives: newLives,
    answers: [...state.answers, newAnswer],
    hintUsed: false,
    questionStartTime: Date.now(),
  };

  if (newLives <= 0) {
    newState.gamePhase = 'gameOver';
  } else if (state.currentQuestionIndex + 1 >= state.challenges.length) {
    newState.gamePhase = state.currentLevel >= 10 ? 'victory' : 'levelComplete';
    newState.currentQuestionIndex = state.currentQuestionIndex + 1;
  } else {
    newState.currentQuestionIndex = state.currentQuestionIndex + 1;
  }

  return { newState, pointsEarned, correct };
}

export function getScoreGrade(score: number, maxPossible: number): { grade: string; color: string; message: string } {
  const pct = score / maxPossible;
  if (pct >= 0.95) return { grade: 'S+', color: '#FFD700', message: 'Absolute Legend!' };
  if (pct >= 0.85) return { grade: 'S', color: '#FF6B35', message: 'World Champion Material' };
  if (pct >= 0.75) return { grade: 'A', color: '#4CAF50', message: 'Podium Finish!' };
  if (pct >= 0.60) return { grade: 'B', color: '#2196F3', message: 'Points Scorer' };
  if (pct >= 0.45) return { grade: 'C', color: '#FF9800', message: 'Just About Made It' };
  return { grade: 'D', color: '#F44336', message: 'Back to the Simulator' };
}

export function getPassingScore(maxPossible: number): number {
  return Math.ceil(maxPossible * 0.45);
}

export function hasPassedLevel(score: number, maxPossible: number): boolean {
  return score >= getPassingScore(maxPossible);
}

export function formatTime(ms: number): string {
  const s = Math.ceil(ms / 1000);
  return `${s}s`;
}

export function getLevelUnlockMessage(level: number): string {
  const messages: Record<number, string> = {
    2: 'You survived the rookie class!',
    3: 'Paddock access granted!',
    4: 'The pit crew respects you.',
    5: 'Team Principal approves.',
    6: 'The engineers are impressed.',
    7: 'Technical Director is watching.',
    8: 'Championship battle begins.',
    9: 'World Champion territory!',
    10: 'Enter the Hall of Legends...',
  };
  return messages[level] || 'Level unlocked!';
}
