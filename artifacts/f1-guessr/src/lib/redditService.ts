import type { F1Challenge } from "./types";

export type { F1Challenge };

const DEFAULT_API_BASE_URL = "http://localhost:8787";
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/$/, "");
const API_REQUEST_TIMEOUT_MS = 15000;

interface ChallengesApiResponse {
  challenges: F1Challenge[];
  count: number;
  level: number;
  lastUpdatedAt: number;
  error?: string;
}

export async function fetchChallengesForLevel(level: number): Promise<F1Challenge[]> {
  const url = new URL(`${API_BASE_URL}/api/challenges`);
  url.searchParams.set("level", String(level));
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Challenge load timed out. Please try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const message = await safeReadError(response);
    throw new Error(message || "Failed to load live F1 challenges from the API.");
  }

  const payload = await response.json() as ChallengesApiResponse;
  if (!Array.isArray(payload.challenges) || payload.challenges.length === 0) {
    throw new Error("The live challenge API returned no playable F1 media.");
  }

  const playableChallenges = payload.challenges.filter(isPlayableChallenge);
  if (playableChallenges.length === 0) {
    throw new Error("The live challenge API returned no 4-option playable F1 media.");
  }

  return playableChallenges;
}

async function safeReadError(response: Response): Promise<string | null> {
  try {
    const payload = await response.json() as { error?: string };
    return payload.error ?? null;
  } catch {
    return null;
  }
}

function isPlayableChallenge(challenge: F1Challenge): boolean {
  const uniqueOptions = [...new Set((challenge.options || []).map((option) => option.trim()).filter(Boolean))];
  const hasMedia = Boolean(challenge.imageUrl || challenge.videoUrl || challenge.youtubeVideoId);
  return hasMedia && uniqueOptions.length === 4 && uniqueOptions.includes(challenge.answer);
}
