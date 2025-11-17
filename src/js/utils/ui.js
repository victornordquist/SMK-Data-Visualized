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
  errorDiv.innerHTML = `
    <strong>Error:</strong> ${message}
    <button onclick="this.parentElement.remove()" style="margin-left: 1rem; padding: 0.25rem 0.5rem;">Dismiss</button>
  `;
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
