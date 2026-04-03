export interface F1Challenge {
  id: string;
  type: 'pixelated' | 'zoomed' | 'video' | 'clip';
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
