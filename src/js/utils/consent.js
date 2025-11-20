/**
 * GDPR-compliant consent management for IndexedDB storage
 */

const CONSENT_COOKIE_NAME = 'smk_storage_consent';
const CONSENT_COOKIE_DURATION = 365; // days

/**
 * Check if user has given consent for data storage
 * @returns {boolean|null} true if accepted, false if declined, null if no choice made
 */
export function hasStorageConsent() {
  const consent = getCookie(CONSENT_COOKIE_NAME);
  if (consent === 'accepted') return true;
  if (consent === 'declined') return false;
  return null;
}

/**
 * Save user's consent choice
 * @param {boolean} accepted - Whether user accepted storage
 */
export function saveConsent(accepted) {
  const value = accepted ? 'accepted' : 'declined';
  setCookie(CONSENT_COOKIE_NAME, value, CONSENT_COOKIE_DURATION);
}

/**
 * Clear consent choice (for testing or user reset)
 */
export function clearConsent() {
  deleteCookie(CONSENT_COOKIE_NAME);
}

/**
 * Show consent banner
 */
export function showConsentBanner() {
  const banner = document.getElementById('consentBanner');
  if (banner) {
    banner.style.display = 'block';
  }
}

/**
 * Hide consent banner
 */
export function hideConsentBanner() {
  const banner = document.getElementById('consentBanner');
  if (banner) {
    banner.style.display = 'none';
  }
}

/**
 * Initialize consent banner with event listeners
 * @param {Function} onAccept - Callback when user accepts
 * @param {Function} onDecline - Callback when user declines
 */
export function initConsentBanner(onAccept, onDecline) {
  const acceptBtn = document.getElementById('consentAccept');
  const declineBtn = document.getElementById('consentDecline');

  if (acceptBtn) {
    acceptBtn.addEventListener('click', () => {
      saveConsent(true);
      hideConsentBanner();
      if (onAccept) onAccept();
    });
  }

  if (declineBtn) {
    declineBtn.addEventListener('click', () => {
      saveConsent(false);
      hideConsentBanner();
      if (onDecline) onDecline();
    });
  }

  // Check if we need to show banner
  const consent = hasStorageConsent();
  if (consent === null) {
    // No choice made yet, show banner
    showConsentBanner();
  }
}

// Cookie utility functions
function setCookie(name, value, days) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

function getCookie(name) {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

function deleteCookie(name) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}
