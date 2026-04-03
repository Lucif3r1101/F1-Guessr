import { FALLBACK_CHALLENGES, getFallbackChallengesForLevel } from './fallbackChallenges';
import type { F1Challenge } from './types';
export type { F1Challenge };

export interface RedditPost {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  permalink: string;
  media?: { reddit_video?: { fallback_url: string } };
  preview?: {
    images?: Array<{
      source: { url: string; width: number; height: number };
      resolutions: Array<{ url: string; width: number; height: number }>;
    }>;
    reddit_video_preview?: { fallback_url: string };
  };
  is_video: boolean;
  score: number;
  created_utc: number;
  secure_media?: { reddit_video?: { fallback_url: string } };
}

interface RedditResponse {
  data: { children: Array<{ data: RedditPost }>; after?: string };
}

// Verified working F1 subreddits
const CORE_SUBREDDITS = ['formula1', 'formuladank'];
const EXTRA_SUBREDDITS = ['MotorSport', 'motorsports', 'racing'];

// Proxy attempts in order — first one that works wins
const REDDIT_BASES = [
  'https://www.reddit.com',
  'https://old.reddit.com',
];

async function fetchRedditFeed(
  subreddit: string,
  sort: 'hot' | 'top' | 'new' = 'hot',
  timeFilter = 'year',
  limit = 100,
): Promise<RedditPost[]> {
  const params = new URLSearchParams({ limit: String(limit), t: timeFilter, raw_json: '1' });

  // Try each base URL
  for (const base of REDDIT_BASES) {
    try {
      const res = await fetch(`${base}/r/${subreddit}/${sort}.json?${params}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const data: RedditResponse = await res.json();
      if (data?.data?.children) return data.data.children.map(c => c.data);
    } catch {
      // try next base
    }
  }

  throw new Error(`Could not fetch r/${subreddit}`);
}

export function getImageFromPost(post: RedditPost): string | null {
  if (post.preview?.images?.[0]) {
    const img = post.preview.images[0];
    const resolutions = img.resolutions ?? [];
    const mid = resolutions.filter(r => r.width >= 320 && r.width <= 960).pop()
      ?? resolutions[resolutions.length - 1];
    if (mid?.url) return mid.url.replace(/&amp;/g, '&');
    if (img.source?.url) return img.source.url.replace(/&amp;/g, '&');
  }
  if (post.url && /i\.redd\.it/.test(post.url)) return post.url;
  if (post.url && /imgur\.com/.test(post.url) && /\.(jpg|jpeg|png|gif|webp)/i.test(post.url)) return post.url;
  return null;
}

export function getVideoFromPost(post: RedditPost): string | null {
  const v = post.media?.reddit_video?.fallback_url
    ?? post.secure_media?.reddit_video?.fallback_url
    ?? post.preview?.reddit_video_preview?.fallback_url;
  return v ? v.replace(/&amp;/g, '&') : null;
}

// ────────────────────────────────────────────────────────────────────────────
// Answer detection
// ────────────────────────────────────────────────────────────────────────────

const ALL_DRIVERS = [
  'Max Verstappen', 'Lewis Hamilton', 'Charles Leclerc', 'Lando Norris',
  'Fernando Alonso', 'Carlos Sainz', 'Sergio Perez', 'George Russell',
  'Oscar Piastri', 'Valtteri Bottas', 'Yuki Tsunoda', 'Pierre Gasly',
  'Esteban Ocon', 'Lance Stroll', 'Alexander Albon', 'Kevin Magnussen',
  'Nico Hulkenberg', 'Guanyu Zhou', 'Logan Sargeant', 'Daniel Ricciardo',
  'Sebastian Vettel', 'Michael Schumacher', 'Ayrton Senna', 'Nico Rosberg',
  'Jenson Button', 'Kimi Raikkonen', 'Felipe Massa', 'Rubens Barrichello',
  'David Coulthard', 'Mika Hakkinen', 'Damon Hill', 'Nigel Mansell',
  'Alain Prost', 'Niki Lauda', 'James Hunt', 'Jackie Stewart',
  'Andrea Kimi Antonelli', 'Oliver Bearman', 'Franco Colapinto',
];

const ALL_TEAMS = [
  'Red Bull Racing', 'Red Bull', 'Ferrari', 'Mercedes', 'McLaren', 'Aston Martin',
  'Alpine', 'Williams', 'AlphaTauri', 'Haas', 'Alfa Romeo', 'Sauber',
  'Force India', 'Racing Point', 'Toro Rosso', 'Lotus', 'Benetton',
];

const ALL_CIRCUITS = [
  'Monza', 'Silverstone', 'Monaco', 'Spa', 'Suzuka', 'Bahrain',
  'Melbourne', 'Singapore', 'Austin', 'COTA', 'Zandvoort', 'Abu Dhabi',
  'Miami', 'Las Vegas', 'Imola', 'Barcelona', 'Budapest', 'Hungary',
  'Montreal', 'Baku', 'Jeddah', 'Shanghai', 'Interlagos', 'Sochi',
  'Portimao', 'Mugello', 'Nurburgring', 'Hockenheim',
];

function generateOptions(correct: string, pool: string[]): string[] {
  const others = pool.filter(p => p.toLowerCase() !== correct.toLowerCase());
  return [correct, ...others.sort(() => Math.random() - 0.5).slice(0, 3)].sort(() => Math.random() - 0.5);
}

function detectAnswer(post: RedditPost): {
  answer: string;
  questionType: F1Challenge['questionType'];
  options: string[];
  hint: string;
} {
  const lc = post.title.toLowerCase();

  for (const driver of ALL_DRIVERS) {
    const surname = driver.split(' ').pop()!.toLowerCase();
    if (lc.includes(surname)) {
      return {
        answer: driver,
        questionType: 'driver',
        options: generateOptions(driver, ALL_DRIVERS),
        hint: 'A Formula 1 driver',
      };
    }
  }

  for (const team of ALL_TEAMS) {
    if (lc.includes(team.toLowerCase())) {
      return {
        answer: team,
        questionType: 'team',
        options: generateOptions(team, ALL_TEAMS),
        hint: 'An F1 constructor',
      };
    }
  }

  for (const circuit of ALL_CIRCUITS) {
    if (lc.includes(circuit.toLowerCase())) {
      return {
        answer: circuit,
        questionType: 'circuit',
        options: generateOptions(circuit, ALL_CIRCUITS),
        hint: 'A Formula 1 Grand Prix venue',
      };
    }
  }

  // Fallback: use a cleaned version of the post title
  const answer = post.title.replace(/[^\w\s\-]/g, '').trim().slice(0, 50);
  return {
    answer,
    questionType: 'general',
    options: [],
    hint: 'An F1 moment from Reddit',
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Main fetch logic with fallback
// ────────────────────────────────────────────────────────────────────────────

async function tryFetchRedditChallenges(count: number): Promise<F1Challenge[]> {
  const allPosts: RedditPost[] = [];

  // Fetch from core subreddits (guaranteed to exist) with multiple sorts
  const fetches = [
    ...CORE_SUBREDDITS.flatMap(sub => [
      fetchRedditFeed(sub, 'hot', 'month', 100),
      fetchRedditFeed(sub, 'top', 'year', 100),
      fetchRedditFeed(sub, 'top', 'month', 100),
    ]),
    ...EXTRA_SUBREDDITS.map(sub => fetchRedditFeed(sub, 'top', 'year', 50)),
  ].map(p => p.catch(() => [] as RedditPost[]));

  const results = await Promise.all(fetches);
  for (const batch of results) allPosts.push(...batch);

  // Deduplicate by post id
  const seen = new Set<string>();
  const unique = allPosts.filter(p => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  const shuffled = unique.sort(() => Math.random() - 0.5);
  const challenges: F1Challenge[] = [];

  for (const post of shuffled) {
    if (challenges.length >= count) break;
    const imageUrl = getImageFromPost(post);
    const videoUrl = getVideoFromPost(post);
    if (!imageUrl && !videoUrl) continue;

    const detected = detectAnswer(post);
    if (detected.questionType === 'general' && detected.answer.length < 5) continue;

    const hasVideo = !!videoUrl;
    const type: F1Challenge['type'] = hasVideo
      ? (Math.random() > 0.5 ? 'video' : 'clip')
      : (Math.random() > 0.5 ? 'pixelated' : 'zoomed');

    challenges.push({
      id: post.id,
      type,
      imageUrl: imageUrl || undefined,
      videoUrl: videoUrl || undefined,
      title: post.title,
      answer: detected.answer,
      options: detected.options,
      hint: detected.hint,
      redditPermalink: `https://reddit.com${post.permalink}`,
      difficulty: Math.ceil(Math.random() * 10),
      questionType: detected.questionType,
    });
  }

  return challenges;
}

export async function fetchF1Challenges(count: number = 40): Promise<F1Challenge[]> {
  try {
    const redditChallenges = await tryFetchRedditChallenges(count);

    if (redditChallenges.length >= 5) {
      // Mix in some fallback challenges for variety if Reddit has enough
      const shuffledFallback = [...FALLBACK_CHALLENGES].sort(() => Math.random() - 0.5).slice(0, 10);
      return [...redditChallenges, ...shuffledFallback].sort(() => Math.random() - 0.5);
    }

    // Not enough from Reddit — use fallback
    console.warn('Reddit returned insufficient content, using fallback challenges');
    return [...FALLBACK_CHALLENGES].sort(() => Math.random() - 0.5);
  } catch {
    // Complete failure — use fallback
    console.warn('Reddit fetch failed completely, using fallback challenges');
    return [...FALLBACK_CHALLENGES].sort(() => Math.random() - 0.5);
  }
}

export async function fetchChallengesForLevel(level: number): Promise<F1Challenge[]> {
  const all = await fetchF1Challenges(50);

  const diffMin = Math.max(1, level - 2);
  const diffMax = Math.min(10, level + 2);
  const filtered = all.filter(c => c.difficulty >= diffMin && c.difficulty <= diffMax);

  // Re-assign difficulty for fallbacks to match the level
  const base = filtered.length >= 5 ? filtered : all;
  return base.map(c => ({
    ...c,
    difficulty: level,
    // Harder levels = more pixelation
    type: (c.type === 'video' || c.type === 'clip')
      ? c.type
      : level >= 7 ? 'pixelated'
      : level >= 4 ? (Math.random() > 0.5 ? 'pixelated' : 'zoomed')
      : 'zoomed',
  }));
}

// Re-export for direct use
export { getFallbackChallengesForLevel };
