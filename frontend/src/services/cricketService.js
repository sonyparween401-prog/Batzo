import { normalizeMatches } from "../batzoMatchNormalizer.js";

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");

async function request(path) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { Accept: "application/json" }
  });

  if (!response.ok) {
    throw new Error(`Cricket API ${response.status}`);
  }

  return response.json();
}

export async function getMatches() {
  try {
    const result = await request("/api/cricket/matches");
    return normalizeMatches(result?.data || result?.matches || result || []);
  } catch (error) {
    console.warn("Batzo cricket API unavailable:", error.message);
    return [];
  }
}

export async function getLiveMatches() {
  try {
    const result = await request("/api/cricket/live");
    return normalizeMatches(result?.data || result?.matches || result || []);
  } catch (error) {
    console.warn("Batzo live cricket API unavailable:", error.message);
    return [];
  }
}
