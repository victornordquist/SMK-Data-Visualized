/**
 * Data normalization utilities for processing SMK API responses
 */

/**
 * Normalizes gender values from the API to standardized format
 * @param {string|null} rawGender - Raw gender value from API
 * @returns {string} Normalized gender: "Male", "Female", or "Unknown"
 */
export function normalizeGender(rawGender) {
  if (!rawGender) return "Unknown";

  const normalized = rawGender.toLowerCase().trim();

  // Map common gender variations to standardized values
  if (normalized === "male" || normalized === "m") return "Male";
  if (normalized === "female" || normalized === "f") return "Female";

  // Captures non-binary, missing, or unclear data
  return "Unknown";
}

/**
 * Extracts a 4-digit year from various date string formats
 * @param {string|null} dateString - Date string from API
 * @returns {number|null} Extracted year or null if not found
 */
export function extractYear(dateString) {
  if (!dateString) return null;

  const match = dateString.match(/\d{4}/);
  return match ? parseInt(match[0], 10) : null;
}

/**
 * Validates an artwork item from the API
 * @param {Object} item - Raw item from API
 * @returns {boolean} True if item has required fields, false otherwise
 */
export function validateArtwork(item) {
  if (!item || typeof item !== 'object') return false;
  // At minimum, we need some production data or object name
  if (!item.production && !item.object_names && !item.acquisition_date) return false;
  return true;
}

/**
 * Normalizes raw API items into a consistent data structure
 * @param {Array<Object>} items - Raw items from the SMK API
 * @returns {Array<Object>} Normalized artwork objects with standardized fields
 */
export function normalizeItems(items) {
  if (!Array.isArray(items)) {
    console.warn('normalizeItems received non-array input');
    return [];
  }

  return items
    .filter(validateArtwork)
    .map(item => {
      const production = item.production?.[0] || {};

      // Normalize gender using helper function
      const gender = normalizeGender(production.creator_gender);

      // Extract basic metadata with safe fallbacks
      const nationality = production.creator_nationality || "Unknown";
      const object_type = item.object_names?.[0]?.name || "Unknown";
      const techniques = Array.isArray(item.techniques) ? item.techniques : [];
      const materials = Array.isArray(item.materials) ? item.materials : [];

      // Parse dates using helper function
      const acquisitionYear = extractYear(item.acquisition_date);
      // production_date is an array with start/end dates
      const productionDateObj = Array.isArray(item.production_date) ? item.production_date[0] : null;
      const productionYear = productionDateObj?.start
        ? extractYear(productionDateObj.start)
        : null;

      // Extract exhibition and display information
      const exhibitions = Array.isArray(item.exhibitions) ? item.exhibitions.length : 0;
      const onDisplay = Boolean(item.on_display);

      // Validate credit line
      const creditLine = (typeof item.credit_line === 'string' && item.credit_line.trim())
        ? item.credit_line
        : "Unknown";

      // Extract depicted persons (content_person_full)
      const depictedPersons = [];
      if (Array.isArray(item.content_person_full) && item.content_person_full.length > 0) {
        item.content_person_full.forEach(person => {
          const depictedGender = normalizeGender(person.gender);
          depictedPersons.push({
            name: person.full_name || "Unknown",
            gender: depictedGender,
            nationality: person.nationality || null
          });
        });
      }

      // Extract dimensions (height, width, diameter) in mm
      const dimensions = {
        height: null,
        width: null,
        diameter: null,
        area: null
      };

      if (Array.isArray(item.dimensions)) {
        item.dimensions.forEach(dim => {
          if (dim.type && dim.value && dim.unit) {
            let value = parseFloat(dim.value);
            if (isNaN(value)) return;

            // Convert to mm for consistency
            if (dim.unit === 'cm') value *= 10;
            else if (dim.unit === 'm') value *= 1000;

            if (dim.type === 'height' && !dimensions.height) {
              dimensions.height = value;
            } else if (dim.type === 'width' && !dimensions.width) {
              dimensions.width = value;
            } else if (dim.type === 'diameter' && !dimensions.diameter) {
              dimensions.diameter = value;
            }
          }
        });

        // Calculate area if we have height and width
        if (dimensions.height && dimensions.width) {
          dimensions.area = dimensions.height * dimensions.width;
        }
      }

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
        creditLine,
        depictedPersons,
        dimensions
      };
    })
    .filter(item => item.acquisitionYear !== null);
}

/**
 * Groups artworks by acquisition year for a specific gender
 * @param {Array<Object>} items - Normalized artwork items
 * @param {string} gender - Gender to filter by ("Male", "Female", or "Unknown")
 * @returns {Object<number, number>} Object mapping year to count
 */
export function groupByYear(items, gender) {
  const grouped = {};
  items.filter(a => a.gender === gender)
    .forEach(a => { grouped[a.acquisitionYear] = (grouped[a.acquisitionYear] || 0) + 1; });
  return grouped;
}
