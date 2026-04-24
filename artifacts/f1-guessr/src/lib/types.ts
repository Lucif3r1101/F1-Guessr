export type ChallengeMode = 'pixelated' | 'zoomed' | 'video' | 'clip' | 'audio';

export interface F1Challenge {
  id: string;
  type: ChallengeMode;
  imageUrl?: string;
  videoUrl?: string;
  youtubeVideoId?: string;
  title: string;
  answer: string;
  options: string[];
  hint: string;
  redditPermalink: string;
  difficulty: number;
  questionType: 'driver' | 'team' | 'circuit' | 'event' | 'general';
}
