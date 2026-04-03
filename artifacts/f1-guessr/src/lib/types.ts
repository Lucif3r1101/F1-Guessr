export type ChallengeMode = 'pixelated' | 'zoomed' | 'video' | 'clip';

export interface F1Challenge {
  id: string;
  type: ChallengeMode;
  imageUrl?: string;
  videoUrl?: string;
  title: string;
  answer: string;
  options: string[];
  hint: string;
  redditPermalink: string;
  difficulty: number;
  questionType: 'driver' | 'team' | 'circuit' | 'event' | 'general';
}
