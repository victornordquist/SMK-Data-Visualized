/**
 * SMK API integration with caching and error handling
 */
import { CONFIG } from '../config.js';
import { normalizeItems } from '../data/normalize.js';

// Active AbortController for cancelling ongoing requests
let activeController = null;

/**
 * Cancel any ongoing data fetch operation
 */
export function cancelFetch() {
  if (activeController) {
    activeController.abort();
    activeController = null;
    console.log('Fetch operation cancelled');
  }
}

/**
 * Get cached data from localStorage if available and not expired
 * @returns {Array|null} Cached artworks data or null if cache is invalid/expired
 */
export function getCachedData() {
  try {
    const cached = localStorage.getItem(CONFIG.cache.key);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CONFIG.cache.duration) {
        console.log('Using cached data from', new Date(timestamp).toLocaleString());
        return data;
      } else {
        console.log('Cache expired, fetching fresh data');
        localStorage.removeItem(CONFIG.cache.key);
      }
    }
  } catch (error) {
    console.warn('Error reading cache:', error);
    localStorage.removeItem(CONFIG.cache.key);
  }
  return null;
}

/**
 * Save data to localStorage with timestamp
 * @param {Array} data - Artworks data to cache
 */
export function setCachedData(data) {
  try {
    localStorage.setItem(CONFIG.cache.key, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
    console.log('Data cached successfully');
  } catch (error) {
    console.warn('Error saving to cache:', error);
    // Handle quota exceeded or other localStorage errors gracefully
  }
}

/**
 * Fetch all data from SMK API with incremental updates and error handling
 * @param {Function} onProgress - Callback for progress updates (offset, items)
 * @param {Function} onError - Callback for errors
 * @returns {Promise<Array>} Array of normalized artwork objects
 */
export async function fetchAllDataIncremental(onProgress, onError) {
  // Check cache first
  const cachedData = getCachedData();
  if (cachedData && cachedData.length > 0) {
    return cachedData;
  }

  // Cancel any previous fetch operation
  cancelFetch();

  // Create new AbortController for this fetch operation
  activeController = new AbortController();
  const signal = activeController.signal;

  const pageSize = CONFIG.api.pageSize;
  const MAX_RETRIES = 3;
  let offset = 0;
  let keepFetching = true;
  let artworks = [];

  try {
    while (keepFetching) {
      let retryCount = 0;
      let success = false;

      while (!success && retryCount <= MAX_RETRIES) {
        try {
          const url = `${CONFIG.api.baseUrl}?keys=*&rows=${pageSize}&offset=${offset}&lang=${CONFIG.api.language}`;
          const res = await fetch(url, { signal });

          if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
          }

          const json = await res.json();

          if (!json.items || !Array.isArray(json.items)) {
            throw new Error('Invalid API response format');
          }

          const items = json.items || [];
          if (!items.length) {
            keepFetching = false;
            break;
          }

          const normalized = normalizeItems(items);
          artworks = artworks.concat(normalized);
          success = true;
          retryCount = 0; // Reset retry count on success

          // Notify progress
          if (onProgress) {
            onProgress(offset + items.length, artworks);
          }

        } catch (fetchError) {
          // If aborted, stop immediately
          if (fetchError.name === 'AbortError') {
            throw fetchError;
          }

          retryCount++;
          console.warn(`Fetch attempt ${retryCount} failed:`, fetchError.message);

          if (retryCount > MAX_RETRIES) {
            throw new Error(`Failed after ${MAX_RETRIES} retries: ${fetchError.message}`);
          }

          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }

      if (!success) {
        break;
      }

      offset += pageSize;
    }

    // Cache the data for future use
    setCachedData(artworks);

    // Clear the controller on success
    activeController = null;

    return artworks;

  } catch (error) {
    // Clear the controller
    activeController = null;

    // Don't report abort errors as failures
    if (error.name === 'AbortError') {
      console.log('Fetch was cancelled');
      return artworks; // Return whatever we have so far
    }

    console.error('Data fetch failed:', error);
    if (onError) {
      onError(error);
    }
    throw error;
  }
}
