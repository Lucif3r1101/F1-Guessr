import cors from "cors";
import express from "express";

const app = express();

const PORT = Number(process.env.PORT || 8787);
const REFRESH_INTERVAL_MS = 60_000;
const FETCH_TIMEOUT_MS = 8_000;
const MAX_CACHE_SIZE = 80;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

const CORE_SUBREDDITS = ["formula1", "formuladank"];
const EXTRA_SUBREDDITS = ["MotorSport", "motorsports", "racing"];
const REDDIT_BASES = ["https://www.reddit.com", "https://old.reddit.com"];

const ALL_DRIVERS = [
  "Max Verstappen", "Lewis Hamilton", "Charles Leclerc", "Lando Norris",
  "Fernando Alonso", "Carlos Sainz", "Sergio Perez", "George Russell",
  "Oscar Piastri", "Valtteri Bottas", "Yuki Tsunoda", "Pierre Gasly",
  "Esteban Ocon", "Lance Stroll", "Alexander Albon", "Kevin Magnussen",
  "Nico Hulkenberg", "Guanyu Zhou", "Logan Sargeant", "Daniel Ricciardo",
  "Sebastian Vettel", "Michael Schumacher", "Ayrton Senna", "Nico Rosberg",
  "Jenson Button", "Kimi Raikkonen", "Felipe Massa", "Rubens Barrichello",
  "David Coulthard", "Mika Hakkinen", "Damon Hill", "Nigel Mansell",
  "Alain Prost", "Niki Lauda", "James Hunt", "Jackie Stewart",
  "Andrea Kimi Antonelli", "Oliver Bearman", "Franco Colapinto"
];

const ALL_TEAMS = [
  "Red Bull Racing", "Red Bull", "Ferrari", "Mercedes", "McLaren", "Aston Martin",
  "Alpine", "Williams", "AlphaTauri", "Haas", "Alfa Romeo", "Sauber",
  "Force India", "Racing Point", "Toro Rosso", "Lotus", "Benetton"
];

const ALL_CIRCUITS = [
  "Monza", "Silverstone", "Monaco", "Spa", "Suzuka", "Bahrain",
  "Melbourne", "Singapore", "Austin", "COTA", "Zandvoort", "Abu Dhabi",
  "Miami", "Las Vegas", "Imola", "Barcelona", "Budapest", "Hungary",
  "Montreal", "Baku", "Jeddah", "Shanghai", "Interlagos", "Sochi",
  "Portimao", "Mugello", "Nurburgring", "Hockenheim"
];

const mediaValidationCache = new Map();
const challengeCache = {
  items: [],
  lastUpdatedAt: 0,
  refreshInFlight: null,
};

app.use(cors({ origin: CORS_ORIGIN }));

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    cachedChallenges: challengeCache.items.length,
    lastUpdatedAt: challengeCache.lastUpdatedAt,
  });
});

app.get("/api/challenges", async (req, res) => {
  const level = clampLevel(Number(req.query.level || 1));

  try {
    const challenges = await getChallengesForLevel(level);
    res.json({
      level,
      count: challenges.length,
      lastUpdatedAt: challengeCache.lastUpdatedAt,
      challenges,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to build live F1 challenges";
    res.status(503).json({ error: message });
  }
});

app.listen(PORT, async () => {
  console.log(`F1 Guessr API listening on http://localhost:${PORT}`);

  try {
    await refreshChallengeCache();
  } catch (error) {
    console.error("Initial cache warmup failed:", error);
  }

  setInterval(() => {
    void refreshChallengeCache();
  }, REFRESH_INTERVAL_MS);
});

async function getChallengesForLevel(level) {
  if (!challengeCache.lastUpdatedAt || isCacheStale()) {
    await refreshChallengeCache();
  } else if (challengeCache.refreshInFlight) {
    await challengeCache.refreshInFlight;
  }

  if (challengeCache.items.length === 0) {
    throw new Error("No live playable F1 Reddit media is currently available.");
  }

  const diffMin = Math.max(1, level - 2);
  const diffMax = Math.min(10, level + 2);
  const filtered = challengeCache.items.filter(
    (challenge) => challenge.difficulty >= diffMin && challenge.difficulty <= diffMax,
  );
  const pool = filtered.length >= 12 ? filtered : challengeCache.items;

  return shuffle(pool).map((challenge) => ({
    ...challenge,
    difficulty: level,
    type: resolveTypeForLevel(challenge.type, level),
  }));
}

function isCacheStale() {
  return (Date.now() - challengeCache.lastUpdatedAt) > REFRESH_INTERVAL_MS;
}

async function refreshChallengeCache() {
  if (challengeCache.refreshInFlight) {
    return challengeCache.refreshInFlight;
  }

  challengeCache.refreshInFlight = (async () => {
    const posts = await fetchCandidatePosts();
    const nextItems = [];
    const seenPostIds = new Set();

    for (const post of shuffle(posts)) {
      if (nextItems.length >= MAX_CACHE_SIZE) break;
      if (seenPostIds.has(post.id)) continue;
      seenPostIds.add(post.id);

      const challenge = await buildChallenge(post);
      if (!challenge) continue;
      nextItems.push(challenge);
    }

    challengeCache.items = nextItems;
    challengeCache.lastUpdatedAt = Date.now();
    console.log(`Challenge cache refreshed with ${nextItems.length} live items`);
  })();

  try {
    await challengeCache.refreshInFlight;
  } finally {
    challengeCache.refreshInFlight = null;
  }
}

async function fetchCandidatePosts() {
  const requests = [
    ...CORE_SUBREDDITS.flatMap((subreddit) => [
      fetchRedditFeed(subreddit, "hot", "month", 100),
      fetchRedditFeed(subreddit, "top", "year", 100),
      fetchRedditFeed(subreddit, "top", "month", 100),
    ]),
    ...EXTRA_SUBREDDITS.map((subreddit) => fetchRedditFeed(subreddit, "top", "year", 50)),
  ].map((request) => request.catch(() => []));

  const results = await Promise.all(requests);
  return results.flat();
}

async function fetchRedditFeed(subreddit, sort = "hot", timeFilter = "year", limit = 100) {
  const params = new URLSearchParams({
    limit: String(limit),
    t: timeFilter,
    raw_json: "1",
  });

  for (const base of REDDIT_BASES) {
    try {
      const response = await fetchWithTimeout(`${base}/r/${subreddit}/${sort}.json?${params}`, {
        headers: {
          Accept: "application/json",
          "User-Agent": "F1GuessrLiveCache/1.0",
        },
      });

      if (!response.ok) continue;

      const data = await response.json();
      if (data?.data?.children) {
        return data.data.children.map((child) => child.data);
      }
    } catch {
      // try next base
    }
  }

  throw new Error(`Could not fetch r/${subreddit}`);
}

async function buildChallenge(post) {
  const detected = detectAnswer(post);
  if (detected.questionType === "general" && detected.answer.length < 5) {
    return null;
  }

  const [imageUrl, videoUrl] = await Promise.all([
    resolveImageUrl(getImageFromPost(post)),
    resolveVideoUrl(getVideoFromPost(post)),
  ]);

  if (!imageUrl && !videoUrl) {
    return null;
  }

  const hasVideo = Boolean(videoUrl);

  return {
    id: post.id,
    type: hasVideo ? (Math.random() > 0.5 ? "video" : "clip") : (Math.random() > 0.5 ? "pixelated" : "zoomed"),
    imageUrl: imageUrl || undefined,
    videoUrl: videoUrl || undefined,
    title: post.title,
    answer: detected.answer,
    options: detected.options,
    hint: buildHint(post.title, detected.hint),
    redditPermalink: `https://reddit.com${post.permalink}`,
    difficulty: Math.ceil(Math.random() * 10),
    questionType: detected.questionType,
  };
}

function getImageFromPost(post) {
  if (post.preview?.images?.[0]) {
    const image = post.preview.images[0];
    const resolutions = image.resolutions ?? [];
    const preferred = resolutions.filter((item) => item.width >= 320 && item.width <= 960).pop()
      ?? resolutions[resolutions.length - 1];

    if (preferred?.url) return decodeHtmlUrl(preferred.url);
    if (image.source?.url) return decodeHtmlUrl(image.source.url);
  }

  if (post.url && /i\.redd\.it/i.test(post.url)) return post.url;
  if (post.url && /imgur\.com/i.test(post.url) && /\.(jpg|jpeg|png|gif|webp)$/i.test(post.url)) return post.url;
  return null;
}

function getVideoFromPost(post) {
  const videoUrl = post.media?.reddit_video?.fallback_url
    ?? post.secure_media?.reddit_video?.fallback_url
    ?? post.preview?.reddit_video_preview?.fallback_url;
  return videoUrl ? decodeHtmlUrl(videoUrl) : null;
}

function decodeHtmlUrl(value) {
  return value.replace(/&amp;/g, "&");
}

function detectAnswer(post) {
  const normalizedTitle = post.title.toLowerCase();

  for (const driver of ALL_DRIVERS) {
    const surname = driver.split(" ").pop().toLowerCase();
    if (normalizedTitle.includes(surname)) {
      return {
        answer: driver,
        questionType: "driver",
        options: generateOptions(driver, ALL_DRIVERS),
        hint: "A Formula 1 driver",
      };
    }
  }

  for (const team of ALL_TEAMS) {
    if (normalizedTitle.includes(team.toLowerCase())) {
      return {
        answer: team,
        questionType: "team",
        options: generateOptions(team, ALL_TEAMS),
        hint: "An F1 constructor",
      };
    }
  }

  for (const circuit of ALL_CIRCUITS) {
    if (normalizedTitle.includes(circuit.toLowerCase())) {
      return {
        answer: circuit,
        questionType: "circuit",
        options: generateOptions(circuit, ALL_CIRCUITS),
        hint: "A Formula 1 Grand Prix venue",
      };
    }
  }

  const answer = post.title.replace(/[^\w\s\-]/g, "").trim().slice(0, 50);
  return {
    answer,
    questionType: "general",
    options: [],
    hint: "",
  };
}

function buildHint(title, categoryHint) {
  const cleanTitle = title.replace(/\s+/g, " ").trim();
  if (!categoryHint) {
    return `Reddit title clue: ${cleanTitle}`;
  }

  return `${categoryHint} | Reddit title clue: ${cleanTitle}`;
}

function generateOptions(correct, pool) {
  const others = pool.filter((item) => item.toLowerCase() !== correct.toLowerCase());
  return shuffle([correct, ...shuffle(others).slice(0, 3)]);
}

function getImageSourceCandidates(url) {
  const candidates = [url];

  try {
    const parsed = new URL(url);
    const withoutProtocol = `${parsed.host}${parsed.pathname}${parsed.search}`;
    candidates.push(`https://images.weserv.nl/?url=${encodeURIComponent(withoutProtocol)}`);
    candidates.push(`https://wsrv.nl/?url=${encodeURIComponent(withoutProtocol)}&n=-1`);
  } catch {
    // keep the original source only
  }

  return [...new Set(candidates)];
}

async function resolveImageUrl(url) {
  if (!url) return null;

  for (const candidate of getImageSourceCandidates(url)) {
    if (await canLoadMedia(candidate, "image")) {
      return candidate;
    }
  }

  return null;
}

async function resolveVideoUrl(url) {
  if (!url) return null;
  return (await canLoadMedia(url, "video")) ? url : null;
}

async function canLoadMedia(url, kind) {
  const cacheKey = `${kind}:${url}`;
  if (mediaValidationCache.has(cacheKey)) {
    return mediaValidationCache.get(cacheKey);
  }

  const resultPromise = (async () => {
    try {
      const response = await fetchWithTimeout(url, {
        method: "GET",
        headers: kind === "video" ? { Range: "bytes=0-2048" } : undefined,
      });

      if (!response.ok) {
        return false;
      }

      const contentType = response.headers.get("content-type") || "";
      if (kind === "image") {
        return contentType.startsWith("image/");
      }

      return contentType.startsWith("video/") || contentType.includes("octet-stream");
    } catch {
      return false;
    }
  })();

  mediaValidationCache.set(cacheKey, resultPromise);
  return resultPromise;
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...options,
      redirect: "follow",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function resolveTypeForLevel(type, level) {
  if (type === "video" || type === "clip") {
    return type;
  }

  if (level >= 7) return "pixelated";
  if (level >= 4) return Math.random() > 0.5 ? "pixelated" : "zoomed";
  return "zoomed";
}

function clampLevel(value) {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(10, Math.floor(value)));
}

function shuffle(items) {
  const clone = [...items];

  for (let index = clone.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]];
  }

  return clone;
}
