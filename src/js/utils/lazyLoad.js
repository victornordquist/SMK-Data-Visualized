/**
 * Lazy loading utilities for charts using Intersection Observer
 */

/**
 * Lazy load manager for charts
 */
export class LazyLoadManager {
  constructor() {
    this.observers = new Map();
    this.loadedCharts = new Set();
  }

  /**
   * Register a chart container for lazy loading
   * @param {string} containerId - ID of the container element
   * @param {Function} loadCallback - Function to call when container is visible
   * @param {Object} options - Intersection Observer options
   */
  observe(containerId, loadCallback, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`Container ${containerId} not found`);
      return;
    }

    // Skip if already loaded
    if (this.loadedCharts.has(containerId)) {
      return;
    }

    const observerOptions = {
      root: null,
      rootMargin: '50px', // Start loading 50px before entering viewport
      threshold: 0.1,
      ...options
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.loadedCharts.has(containerId)) {
          // Chart is visible, load it
          loadCallback();
          this.loadedCharts.add(containerId);
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    observer.observe(container);
    this.observers.set(containerId, observer);
  }

  /**
   * Force load a chart immediately
   * @param {string} containerId - ID of the container
   */
  forceLoad(containerId) {
    if (this.observers.has(containerId)) {
      const observer = this.observers.get(containerId);
      observer.disconnect();
      this.observers.delete(containerId);
    }
  }

  /**
   * Check if a chart has been loaded
   * @param {string} containerId - ID of the container
   * @returns {boolean} True if chart is loaded
   */
  isLoaded(containerId) {
    return this.loadedCharts.has(containerId);
  }

  /**
   * Disconnect all observers
   */
  disconnectAll() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
  }
}
