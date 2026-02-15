const API_KEY = process.env.EXPO_PUBLIC_MOVIE_API_KEY;

const BASE_URL = "https://api.themoviedb.org/3";

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
    headers: TMDB_CONFIG.headers,
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
  const detailUrl = `${TMDB_CONFIG.BASE_URL}/movie/${movieId}`;

  try {
    const response = await fetchWithTimeout(detailUrl, {
      method: "GET",
      headers: TMDB_CONFIG.headers,
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
