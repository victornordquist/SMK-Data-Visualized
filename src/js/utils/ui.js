/**
 * UI utility functions for displaying messages and managing DOM elements
 */

/**
 * Show error message to user
 * @param {string} message - Error message to display
 */
export function showErrorMessage(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';

  const strong = document.createElement('strong');
  strong.textContent = 'Error: ';

  const messageSpan = document.createElement('span');
  messageSpan.textContent = message;

  const button = document.createElement('button');
  button.textContent = 'Dismiss';
  button.style.cssText = 'margin-left: 1rem; padding: 0.25rem 0.5rem;';
  button.addEventListener('click', () => errorDiv.remove());

  errorDiv.appendChild(strong);
  errorDiv.appendChild(messageSpan);
  errorDiv.appendChild(button);

  document.body.insertBefore(errorDiv, document.body.firstChild);
}

/**
 * Show success message to user
 * @param {string} message - Success message to display
 */
export function showSuccessMessage(message) {
  const loading = document.getElementById('loading');
  loading.textContent = message;
  loading.style.color = '#28a745';
}

/**
 * Update loading indicator
 * @param {number} count - Number of items processed
 */
export function updateLoadingIndicator(count) {
  const loading = document.getElementById('loading');
  loading.textContent = `Loading SMK data... ${count} items processed`;
}

/**
 * Hide loading indicator
 */
export function hideLoadingIndicator() {
  const loading = document.getElementById('loading');
  loading.style.display = 'none';
}

/**
 * Show loading indicator
 */
export function showLoadingIndicator() {
  const loading = document.getElementById('loading');
  loading.style.display = 'block';
  loading.textContent = 'Loading SMK data...';
  loading.style.color = '';
}

/**
 * Show cache status information
 * @param {number} timestamp - Timestamp when data was cached
 * @param {number} itemCount - Number of items in cache
 */
export function showCacheStatus(timestamp, itemCount) {
  const cacheStatus = document.getElementById('cacheStatus');
  const cacheInfo = document.getElementById('cacheInfo');

  if (!cacheStatus || !cacheInfo) return;

  const date = new Date(timestamp);
  const now = new Date();
  const daysAgo = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  let timeText;
  if (daysAgo === 0) {
    const hoursAgo = Math.floor((now - date) / (1000 * 60 * 60));
    if (hoursAgo === 0) {
      timeText = 'just now';
    } else if (hoursAgo === 1) {
      timeText = '1 hour ago';
    } else {
      timeText = `${hoursAgo} hours ago`;
    }
  } else if (daysAgo === 1) {
    timeText = 'yesterday';
  } else {
    timeText = `${daysAgo} days ago`;
  }

  cacheInfo.innerHTML = `Using cached data from <strong>${date.toLocaleDateString()}</strong> (${timeText}) • ${itemCount.toLocaleString()} artworks`;
  cacheStatus.style.display = 'flex';
}

/**
 * Hide cache status
 */
export function hideCacheStatus() {
  const cacheStatus = document.getElementById('cacheStatus');
  if (cacheStatus) {
    cacheStatus.style.display = 'none';
  }
}
