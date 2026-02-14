import Constants from "expo-constants";

const API_KEY = process.env.EXPO_PUBLIC_MOVIE_API_KEY;

// In dev mode, route through local proxy since the phone may not reach external APIs directly
const getBaseUrl = (): string => {
  if (__DEV__) {
    const hostUri = Constants.expoConfig?.hostUri; // e.g. "192.168.1.5:8081"
    if (hostUri) {
      const hostIp = hostUri.split(":")[0];
      const proxyUrl = `http://${hostIp}:3001`;
      console.log("Using local proxy:", proxyUrl);
      return proxyUrl;
    }
  }
  return "https://api.themoviedb.org/3";
};

const BASE_URL = getBaseUrl();

export const TMDB_CONFIG = {
  BASE_URL,
  API_KEY: API_KEY,
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
};

const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeoutMs = 15000,
): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error(
        `Request timed out after ${timeoutMs / 1000}s. Check your internet connection.`,
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const fetchMovies = async ({
  query,
}: {
  query: string;
}): Promise<Movie[]> => {
  const endpoint = query
    ? `${TMDB_CONFIG.BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
    : `${TMDB_CONFIG.BASE_URL}/discover/movie?sort_by=popularity.desc`;

  console.log("Fetching movies from:", endpoint);

  const response = await fetchWithTimeout(endpoint, {
    method: "GET",
    headers: __DEV__
      ? { accept: "application/json" } // Proxy handles auth
      : TMDB_CONFIG.headers,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("TMDB API error:", response.status, errorBody);
    throw new Error(
      `Failed to fetch movies: ${response.status} ${response.statusText}`,
    );
  }

  const data = await response.json();
  return data.results;
};

export const fetchMovieDetails = async (
  movieId: string,
): Promise<MovieDetails> => {
  const detailUrl = __DEV__
    ? `${TMDB_CONFIG.BASE_URL}/movie/${movieId}`
    : `${TMDB_CONFIG.BASE_URL}/movie/${movieId}?api_key=${TMDB_CONFIG.API_KEY}`;

  try {
    const response = await fetchWithTimeout(detailUrl, {
      method: "GET",
      headers: __DEV__ ? { accept: "application/json" } : TMDB_CONFIG.headers,
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch movie details: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching movie details:", error);
    throw error;
  }
};
