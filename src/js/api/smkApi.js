/**
 * SMK API integration with caching and error handling
 */
import { CONFIG } from '../config.js';
import { normalizeItems } from '../data/normalize.js';
import { hasStorageConsent } from '../utils/consent.js';

// Active AbortController for cancelling ongoing requests
let activeController = null;

// IndexedDB configuration
const DB_NAME = 'smk_data_visualized';
const DB_VERSION = 1;
const STORE_NAME = 'artworks';

/**
 * Open IndexedDB connection
 * @returns {Promise<IDBDatabase>}
 */
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

/**
 * Cancel any ongoing data fetch operation
 */
export function cancelFetch() {
  if (activeController) {
    activeController.abort();
    activeController = null;
  }
}

/**
 * Get cached data from IndexedDB if available and not expired
 * @returns {Promise<Array|null>} Cached artworks data or null if cache is invalid/expired
 */
export async function getCachedData() {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.get(CONFIG.cache.key);

      request.onsuccess = () => {
        const cached = request.result;
        if (cached && cached.data && cached.timestamp) {
          // Check if cache version matches current version
          const cacheVersion = cached.version || 1;
          const currentVersion = CONFIG.cache.version || 1;

          if (cacheVersion !== currentVersion) {
            // Cache version mismatch - clear and return null
            clearCachedData();
            resolve(null);
          } else if (Date.now() - cached.timestamp < CONFIG.cache.duration) {
            resolve(cached.data);
          } else {
            clearCachedData();
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        console.warn('Error reading cache:', request.error);
        resolve(null);
      };
    });
  } catch (error) {
    console.warn('Error opening IndexedDB:', error);
    return null;
  }
}

/**
 * Save data to IndexedDB with timestamp
 * @param {Array} data - Artworks data to cache
 */
export async function setCachedData(data) {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const cacheObject = {
      data,
      timestamp: Date.now(),
      version: CONFIG.cache.version || 1
    };

    return new Promise((resolve, reject) => {
      const request = store.put(cacheObject, CONFIG.cache.key);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.warn('Error saving to cache:', request.error);
        resolve(); // Don't reject, just log
      };
    });
  } catch (error) {
    console.warn('Error saving to IndexedDB:', error);
  }
}

/**
 * Clear cached data from IndexedDB
 */
export async function clearCachedData() {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve) => {
      const request = store.delete(CONFIG.cache.key);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        console.warn('Error clearing cache:', request.error);
        resolve();
      };
    });
  } catch (error) {
    console.warn('Error clearing IndexedDB:', error);
  }
}

/**
 * Get cache metadata (timestamp and item count) without loading full data
 * @returns {Promise<Object|null>} Cache metadata or null if no cache exists
 */
export async function getCacheMetadata() {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve) => {
      const request = store.get(CONFIG.cache.key);

      request.onsuccess = () => {
        const cached = request.result;
        if (cached && cached.timestamp) {
          resolve({
            timestamp: cached.timestamp,
            itemCount: cached.data ? cached.data.length : 0,
            isExpired: Date.now() - cached.timestamp >= CONFIG.cache.duration
          });
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        console.warn('Error reading cache metadata:', request.error);
        resolve(null);
      };
    });
  } catch (error) {
    console.warn('Error reading IndexedDB metadata:', error);
    return null;
  }
}

/**
 * Fetch all data from SMK API with incremental updates and error handling
 * @param {Function} onProgress - Callback for progress updates (offset, items)
 * @param {Function} onError - Callback for errors
 * @returns {Promise<Array>} Array of normalized artwork objects
 */
export async function fetchAllDataIncremental(onProgress, onError) {
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

    // Cache the data for future use (only if user consented)
    if (hasStorageConsent() === true) {
      await setCachedData(artworks);
    }

    // Clear the controller on success
    activeController = null;

    return artworks;

  } catch (error) {
    // Clear the controller
    activeController = null;

    // Don't report abort errors as failures
    if (error.name === 'AbortError') {
      return artworks; // Return whatever we have so far
    }

    console.error('Data fetch failed:', error);
    if (onError) {
      onError(error);
    }
    throw error;
  }
}

/**
 * Load data from local JSON file (for development/testing)
 * @param {Function} onProgress - Callback for progress updates
 * @returns {Promise<Array>} Array of normalized artwork objects
 */
export async function loadFromLocalJSON(onProgress) {
  try {
    const response = await fetch('/smk_all_data.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const rawData = await response.json();

    // Normalize the data
    const normalizedData = normalizeItems(rawData);

    // Notify progress
    if (onProgress) {
      onProgress(normalizedData.length, normalizedData);
    }

    // Cache the data
    await setCachedData(normalizedData);

    return normalizedData;
  } catch (error) {
    console.error('Error loading local JSON:', error);
    throw error;
  }
}
