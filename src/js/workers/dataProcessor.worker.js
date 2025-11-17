/**
 * Web Worker for data processing
 * Handles heavy data normalization and statistical calculations off the main thread
 */

// Inline the normalization functions since workers can't import ES6 modules easily
function normalizeGender(rawGender) {
  if (!rawGender) return "Unknown";
  const normalized = rawGender.toLowerCase().trim();
  if (normalized === "male" || normalized === "m") return "Male";
  if (normalized === "female" || normalized === "f") return "Female";
  return "Unknown";
}

function extractYear(dateString) {
  if (!dateString) return null;
  const match = dateString.match(/\d{4}/);
  return match ? parseInt(match[0], 10) : null;
}

function validateArtwork(item) {
  if (!item || typeof item !== 'object') return false;
  if (!item.production && !item.object_names && !item.acquisition_date) return false;
  return true;
}

function normalizeItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter(validateArtwork)
    .map(item => {
      const production = item.production?.[0] || {};
      const gender = normalizeGender(production.creator_gender);
      const nationality = production.creator_nationality || "Unknown";
      const object_type = item.object_names?.[0]?.name || "Unknown";
      const techniques = Array.isArray(item.techniques) ? item.techniques : [];
      const materials = Array.isArray(item.materials) ? item.materials : [];
      const acquisitionYear = extractYear(item.acquisition_date);
      const productionYear = item.production_date?.start
        ? parseInt(item.production_date.start, 10)
        : null;
      const exhibitions = Array.isArray(item.exhibitions) ? item.exhibitions.length : 0;
      const onDisplay = Boolean(item.on_display);
      const creditLine = (typeof item.credit_line === 'string' && item.credit_line.trim())
        ? item.credit_line
        : "Unknown";

      return {
        gender,
        nationality,
        object_type,
        techniques,
        materials,
        acquisitionYear,
        productionYear,
        exhibitions,
        onDisplay,
        creditLine
      };
    })
    .filter(item => item.acquisitionYear !== null);
}

// Listen for messages from main thread
self.onmessage = function(e) {
  const { type, data } = e.data;

  switch (type) {
    case 'normalize':
      try {
        const normalized = normalizeItems(data);
        self.postMessage({
          type: 'normalized',
          data: normalized,
          success: true
        });
      } catch (error) {
        self.postMessage({
          type: 'error',
          error: error.message,
          success: false
        });
      }
      break;

    default:
      self.postMessage({
        type: 'error',
        error: 'Unknown command type',
        success: false
      });
  }
};
