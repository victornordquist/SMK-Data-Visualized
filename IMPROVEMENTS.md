# SMK Data Visualized - Improvement Suggestions

## Overview
This document outlines suggested improvements for the SMK Data Visualized project, organized by priority and category.

---

## 1. Code Organization & Maintainability

### Priority: HIGH

**Current Issues:**
- 780+ lines of JavaScript embedded in HTML
- No modularization or separation of concerns
- Extensive global variable pollution (20+ global chart instances)
- Repetitive chart creation/update code

**Suggested Improvements:**

#### 1.1 Split JavaScript into Separate Modules
```javascript
// Suggested structure:
src/
  js/
    api/
      smkApi.js           // API fetching logic
    data/
      normalize.js        // Data normalization
      filters.js          // Data filtering utilities
    charts/
      chartFactory.js     // Chart creation abstraction
      lineCharts.js       // Line chart logic
      pieCharts.js        // Pie chart logic
      barCharts.js        // Bar chart logic
    insights/
      generator.js        // Insight generation
    stats/
      calculator.js       // Statistics calculations
    main.js               // Entry point
```

#### 1.2 Create Chart Manager Class
Reduce repetitive code with a unified chart management system:

```javascript
class ChartManager {
  constructor() {
    this.charts = new Map();
  }

  createOrUpdate(id, type, data, options) {
    if (this.charts.has(id)) {
      this.updateChart(id, data);
    } else {
      this.charts.set(id, this.createChart(id, type, data, options));
    }
  }

  // Centralized update logic
  updateChart(id, data) {
    const chart = this.charts.get(id);
    if (chart) {
      chart.data = data;
      chart.update('none');
    }
  }
}
```

#### 1.3 Extract Configuration
Move magic numbers and repeated values to constants:

```javascript
const CONFIG = {
  colors: {
    male: '#3e5c82',
    female: '#ed969d',
    unknown: '#cccccc'
  },
  api: {
    baseUrl: 'https://api.smk.dk/api/v1/art/search/',
    pageSize: 2000,
    language: 'en'
  },
  dateRanges: {
    recentStart: 2000,
    recentEnd: 2025
  },
  display: {
    topItemsLimit: 20
  }
};
```

---

## 2. Performance Optimization

### Priority: HIGH

**Current Issues:**
- All charts update on every data fetch (CPU intensive)
- No request caching
- No pagination UI (loads everything)
- Synchronous data processing blocks UI

**Suggested Improvements:**

#### 2.1 Implement Debounced Chart Updates
```javascript
// Only update charts after data fetching completes or at intervals
const DEBOUNCE_DELAY = 500; // ms
let updateTimeout;

function scheduleChartUpdate() {
  clearTimeout(updateTimeout);
  updateTimeout = setTimeout(() => {
    updateAllCharts();
  }, DEBOUNCE_DELAY);
}
```

#### 2.2 Add LocalStorage Caching
```javascript
const CACHE_KEY = 'smk_data_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function getCachedData() {
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_DURATION) {
      return data;
    }
  }
  return null;
}

function setCachedData(data) {
  localStorage.setItem(CACHE_KEY, JSON.stringify({
    data,
    timestamp: Date.now()
  }));
}
```

#### 2.3 Use Web Workers for Data Processing
```javascript
// worker.js
self.onmessage = function(e) {
  const { items } = e.data;
  const normalized = normalizeItems(items);
  const stats = calculateAllStats(normalized);
  self.postMessage({ normalized, stats });
};

// main.js
const worker = new Worker('worker.js');
worker.onmessage = (e) => {
  const { normalized, stats } = e.data;
  updateUI(normalized, stats);
};
```

#### 2.4 Lazy Load Charts
Only render charts when they're visible in viewport:

```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const chartId = entry.target.dataset.chartId;
      renderChart(chartId);
      observer.unobserve(entry.target);
    }
  });
});
```

---

## 3. Error Handling & Resilience

### Priority: HIGH

**Current Issues:**
- No try-catch blocks
- No network error handling
- No user feedback on failures
- No retry logic

**Suggested Improvements:**

#### 3.1 Comprehensive Error Handling
```javascript
async function fetchAllDataIncremental() {
  try {
    let offset = 0;
    let keepFetching = true;
    let retryCount = 0;
    const MAX_RETRIES = 3;

    while (keepFetching) {
      try {
        const url = `${CONFIG.api.baseUrl}?keys=*&rows=${CONFIG.api.pageSize}&offset=${offset}&lang=${CONFIG.api.language}`;
        const res = await fetch(url);

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const json = await res.json();

        if (!json.items || !Array.isArray(json.items)) {
          throw new Error('Invalid API response format');
        }

        const items = json.items;
        if (!items.length) break;

        artworks = artworks.concat(normalizeItems(items));
        updateAllVisualizations();

        offset += CONFIG.api.pageSize;
        updateLoadingIndicator(offset);

        if (items.length < CONFIG.api.pageSize) keepFetching = false;
        retryCount = 0; // Reset on success

      } catch (fetchError) {
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          continue;
        } else {
          throw fetchError;
        }
      }
    }

    hideLoadingIndicator();
    showSuccessMessage(`Successfully loaded ${artworks.length} artworks`);

  } catch (error) {
    console.error('Data fetch failed:', error);
    showErrorMessage(`Failed to load data: ${error.message}. Please try refreshing the page.`);
    hideLoadingIndicator();
  }
}
```

#### 3.2 Add User-Friendly Error Messages
```javascript
function showErrorMessage(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.innerHTML = `
    <strong>Error:</strong> ${message}
    <button onclick="this.parentElement.remove()">Dismiss</button>
  `;
  document.body.insertBefore(errorDiv, document.body.firstChild);
}
```

#### 3.3 Validate API Data
```javascript
function validateArtwork(item) {
  // Ensure critical fields exist
  if (!item || typeof item !== 'object') return false;

  // Add more specific validations
  return true;
}

function normalizeItems(items) {
  return items
    .filter(validateArtwork)
    .map(item => {
      // ... normalization logic
    })
    .filter(item => item.acquisitionYear !== null);
}
```

---

## 4. User Experience Enhancements

### Priority: MEDIUM

**Current Issues:**
- No interactivity (filtering, sorting)
- Basic loading indicator
- No data export
- No customization options

**Suggested Improvements:**

#### 4.1 Add Interactive Filters
```html
<div id="filters">
  <label>
    Date Range:
    <input type="number" id="startYear" placeholder="Start Year">
    <input type="number" id="endYear" placeholder="End Year">
  </label>

  <label>
    Gender:
    <select id="genderFilter">
      <option value="all">All</option>
      <option value="Male">Male</option>
      <option value="Female">Female</option>
      <option value="Unknown">Unknown</option>
    </select>
  </label>

  <label>
    Nationality:
    <select id="nationalityFilter">
      <option value="all">All</option>
      <!-- Populated dynamically -->
    </select>
  </label>

  <button onclick="applyFilters()">Apply Filters</button>
  <button onclick="resetFilters()">Reset</button>
</div>
```

#### 4.2 Enhanced Loading Experience
```javascript
// Progress bar instead of simple text
function updateLoadingIndicator(current, total = 'unknown') {
  const loading = document.getElementById('loading');
  const percentage = total !== 'unknown' ? Math.round((current / total) * 100) : null;

  loading.innerHTML = `
    <div class="loading-spinner"></div>
    <p>Loading SMK data...</p>
    <p>${current.toLocaleString()} items processed</p>
    ${percentage ? `<progress value="${percentage}" max="100"></progress>` : ''}
  `;
}
```

#### 4.3 Data Export Functionality
```javascript
function exportToCSV() {
  const headers = ['Gender', 'Nationality', 'Object Type', 'Acquisition Year', 'Exhibitions', 'On Display'];
  const rows = artworks.map(a => [
    a.gender,
    a.nationality,
    a.object_type,
    a.acquisitionYear,
    a.exhibitions,
    a.onDisplay
  ]);

  const csv = [headers, ...rows]
    .map(row => row.join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `smk-data-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
}

function exportChartAsImage(chartId) {
  const canvas = document.getElementById(chartId);
  const url = canvas.toCanvas().toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = `${chartId}.png`;
  a.click();
}
```

#### 4.4 Add Chart Interactivity
```javascript
// Click on chart to see detailed breakdown
const chartOptions = {
  onClick: (event, elements) => {
    if (elements.length > 0) {
      const element = elements[0];
      const year = chart.data.labels[element.index];
      showDetailModal(year);
    }
  },
  plugins: {
    tooltip: {
      callbacks: {
        footer: (tooltipItems) => {
          return 'Click for details';
        }
      }
    }
  }
};
```

#### 4.5 Add Comparison Mode
```javascript
// Allow users to compare different time periods
function compareTimePeriods(period1, period2) {
  const data1 = artworks.filter(a =>
    a.acquisitionYear >= period1.start &&
    a.acquisitionYear <= period1.end
  );
  const data2 = artworks.filter(a =>
    a.acquisitionYear >= period2.start &&
    a.acquisitionYear <= period2.end
  );

  displayComparisonView(data1, data2);
}
```

---

## 5. Accessibility Improvements

### Priority: HIGH

**Current Issues:**
- Missing CSS link in HTML
- No ARIA labels
- No keyboard navigation
- Color scheme may not work for colorblind users
- No screen reader support for charts

**Suggested Improvements:**

#### 5.1 Fix CSS Link
```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SMK Data Visualized</title>
  <link rel="stylesheet" href="style.css">
</head>
```

#### 5.2 Add ARIA Labels and Semantic HTML
```html
<main role="main">
  <h1>SMK Data Visualized</h1>
  <p>Exploring gender representation in the SMK collection using the SMK API.</p>

  <div id="loading" role="status" aria-live="polite">Loading SMK data...</div>

  <section aria-labelledby="stats-heading">
    <h2 id="stats-heading">Collection Overview</h2>
    <div class="stats-grid" role="list">
      <div class="stat-card" role="listitem" aria-label="Total Artworks: 10,000">
        <!-- ... -->
      </div>
    </div>
  </section>

  <section aria-labelledby="timeline-heading">
    <h2 id="timeline-heading">Acquisitions of artworks by gender (all years)</h2>
    <canvas id="femaleChart" role="img" aria-label="Line chart showing female artist acquisitions over time"></canvas>
  </section>
</main>
```

#### 5.3 Add Alternative Color Schemes
```javascript
const COLOR_SCHEMES = {
  default: {
    male: '#3e5c82',
    female: '#ed969d',
    unknown: '#cccccc'
  },
  colorblind: {
    male: '#0077bb',    // Blue
    female: '#ee7733',  // Orange
    unknown: '#cccccc'  // Gray
  },
  highContrast: {
    male: '#000000',
    female: '#ffffff',
    unknown: '#808080'
  }
};

function setColorScheme(scheme) {
  const colors = COLOR_SCHEMES[scheme];
  // Update all charts
}
```

#### 5.4 Add Keyboard Navigation
```javascript
// Add tab-able data table view
function createAccessibleDataTable() {
  const table = document.createElement('table');
  table.setAttribute('role', 'table');
  table.setAttribute('aria-label', 'SMK Collection Data');

  // Add headers with scope
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th scope="col">Year</th>
      <th scope="col">Male</th>
      <th scope="col">Female</th>
      <th scope="col">Unknown</th>
    </tr>
  `;

  // Add data rows
  const tbody = document.createElement('tbody');
  // ... populate with data

  table.appendChild(thead);
  table.appendChild(tbody);
  return table;
}
```

#### 5.5 Add Text Descriptions for Charts
```html
<div class="chart-container">
  <h2>Women</h2>
  <canvas id="femaleChart" height="400" aria-labelledby="femaleChartDesc"></canvas>
  <div id="femaleChartDesc" class="visually-hidden">
    This line chart shows the number of artworks by female artists acquired by SMK each year.
    The data spans from [earliest year] to [latest year], with peaks in [notable years].
  </div>
</div>
```

---

## 6. Code Quality Improvements

### Priority: MEDIUM

**Current Issues:**
- No JSDoc comments
- Inconsistent code style
- Magic numbers
- Some functions too long

**Suggested Improvements:**

#### 6.1 Add JSDoc Comments
```javascript
/**
 * Normalizes gender values from the API to standardized format
 * @param {string|null} rawGender - Raw gender value from API
 * @returns {string} Normalized gender: "Male", "Female", or "Unknown"
 * @example
 * normalizeGender("M") // returns "Male"
 * normalizeGender("female") // returns "Female"
 * normalizeGender(null) // returns "Unknown"
 */
function normalizeGender(rawGender) {
  if (!rawGender) return "Unknown";

  const normalized = rawGender.toLowerCase().trim();

  if (normalized === "male" || normalized === "m") return "Male";
  if (normalized === "female" || normalized === "f") return "Female";

  return "Unknown";
}

/**
 * Groups artworks by acquisition year for a specific gender
 * @param {Array<Object>} items - Normalized artwork items
 * @param {string} gender - Gender to filter by ("Male", "Female", or "Unknown")
 * @returns {Object<number, number>} Object mapping year to count
 */
function groupByYear(items, gender) {
  const grouped = {};
  items
    .filter(a => a.gender === gender)
    .forEach(a => {
      grouped[a.acquisitionYear] = (grouped[a.acquisitionYear] || 0) + 1;
    });
  return grouped;
}
```

#### 6.2 Refactor Long Functions
```javascript
// Current: fetchAllDataIncremental is 100+ lines
// Split into smaller functions:

async function fetchPage(offset) {
  const url = buildApiUrl(offset);
  const response = await fetch(url);
  const json = await response.json();
  return json.items || [];
}

function buildApiUrl(offset) {
  return `${CONFIG.api.baseUrl}?keys=*&rows=${CONFIG.api.pageSize}&offset=${offset}&lang=${CONFIG.api.language}`;
}

function processNewItems(items) {
  const normalized = normalizeItems(items);
  artworks = artworks.concat(normalized);
  return normalized;
}

async function fetchAllDataIncremental() {
  const pageSize = CONFIG.api.pageSize;
  let offset = 0;
  let keepFetching = true;

  while (keepFetching) {
    const items = await fetchPage(offset);
    if (!items.length) break;

    processNewItems(items);
    updateAllCharts();

    offset += pageSize;
    updateLoadingIndicator(offset);

    if (items.length < pageSize) keepFetching = false;
  }

  hideLoadingIndicator();
}
```

#### 6.3 Use Modern JavaScript Features
```javascript
// Use destructuring
function normalizeItems(items) {
  return items
    .map(item => {
      const { production = [{}], object_names = [], techniques = [], materials = [] } = item;
      const { creator_gender, creator_nationality = "Unknown" } = production[0];

      return {
        gender: normalizeGender(creator_gender),
        nationality: creator_nationality,
        object_type: object_names[0]?.name || "Unknown",
        techniques: Array.isArray(techniques) ? techniques : [],
        materials: Array.isArray(materials) ? materials : [],
        acquisitionYear: extractYear(item.acquisition_date),
        exhibitions: item.exhibitions?.length || 0,
        onDisplay: Boolean(item.on_display)
      };
    })
    .filter(item => item.acquisitionYear !== null);
}

// Use optional chaining and nullish coalescing
const objectType = item.object_names?.[0]?.name ?? "Unknown";
const exhibitions = item.exhibitions?.length ?? 0;
```

---

## 7. Security Enhancements

### Priority: MEDIUM

**Current Issues:**
- External CDN without Subresource Integrity (SRI)
- No Content Security Policy
- Potential XSS in innerHTML usage

**Suggested Improvements:**

#### 7.1 Add SRI to External Resources
```html
<script
  src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0"
  integrity="sha384-..."
  crossorigin="anonymous">
</script>
```

#### 7.2 Add Content Security Policy
```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self' https://cdn.jsdelivr.net;
               style-src 'self' 'unsafe-inline';
               connect-src https://api.smk.dk;">
```

#### 7.3 Sanitize Dynamic Content
```javascript
// Use textContent instead of innerHTML where possible
function updateLoadingIndicator(count) {
  const loading = document.getElementById('loading');
  loading.textContent = `Loading SMK data... ${count} items processed`;
}

// Or use a sanitization library for complex HTML
function sanitizeHTML(html) {
  const temp = document.createElement('div');
  temp.textContent = html;
  return temp.innerHTML;
}
```

---

## 8. Additional Features

### Priority: LOW

**Suggested Enhancements:**

#### 8.1 Add Search Functionality
```javascript
function searchArtworks(query) {
  const results = artworks.filter(a =>
    a.nationality.toLowerCase().includes(query.toLowerCase()) ||
    a.object_type.toLowerCase().includes(query.toLowerCase()) ||
    a.techniques.some(t => t.toLowerCase().includes(query.toLowerCase()))
  );
  displaySearchResults(results);
}
```

#### 8.2 Add Bookmark/Share Functionality
```javascript
function shareCurrentView() {
  const state = {
    filters: getCurrentFilters(),
    dateRange: getCurrentDateRange()
  };
  const url = `${window.location.origin}${window.location.pathname}?state=${btoa(JSON.stringify(state))}`;
  navigator.clipboard.writeText(url);
  showNotification('Link copied to clipboard!');
}
```

#### 8.3 Add Print Stylesheet
```css
@media print {
  .no-print {
    display: none;
  }

  .chart-container {
    page-break-inside: avoid;
  }

  @page {
    margin: 2cm;
  }
}
```

#### 8.4 Add Dark Mode
```css
@media (prefers-color-scheme: dark) {
  body {
    background-color: #1e1e1e;
    color: #e0e0e0;
  }

  .stat-card {
    background: linear-gradient(135deg, #2a2a2a 0%, #333 100%);
  }
}
```

#### 8.5 Add Trend Analysis
```javascript
function calculateTrends(items, years = 10) {
  const recent = items.filter(a => a.acquisitionYear >= new Date().getFullYear() - years);
  const historical = items.filter(a => a.acquisitionYear < new Date().getFullYear() - years);

  const recentFemalePercent = calculateGenderPercent(recent, 'Female');
  const historicalFemalePercent = calculateGenderPercent(historical, 'Female');

  return {
    trend: recentFemalePercent > historicalFemalePercent ? 'increasing' : 'decreasing',
    change: Math.abs(recentFemalePercent - historicalFemalePercent),
    slope: calculateLinearRegression(items, 'Female')
  };
}
```

---

## 9. Testing Strategy

### Priority: MEDIUM

**Suggested Approach:**

#### 9.1 Add Unit Tests
```javascript
// tests/normalize.test.js
describe('normalizeGender', () => {
  test('handles male variations', () => {
    expect(normalizeGender('Male')).toBe('Male');
    expect(normalizeGender('male')).toBe('Male');
    expect(normalizeGender('M')).toBe('Male');
  });

  test('handles female variations', () => {
    expect(normalizeGender('Female')).toBe('Female');
    expect(normalizeGender('female')).toBe('Female');
    expect(normalizeGender('F')).toBe('Female');
  });

  test('handles unknown values', () => {
    expect(normalizeGender(null)).toBe('Unknown');
    expect(normalizeGender('')).toBe('Unknown');
    expect(normalizeGender('X')).toBe('Unknown');
  });
});
```

#### 9.2 Add Integration Tests
```javascript
// tests/api.test.js
describe('API Integration', () => {
  test('fetches data successfully', async () => {
    const items = await fetchPage(0);
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
  });

  test('handles API errors gracefully', async () => {
    // Mock failed response
    global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));

    await expect(fetchAllDataIncremental()).rejects.toThrow();
  });
});
```

#### 9.3 Add Visual Regression Tests
```javascript
// Use tools like Percy or Chromatic for visual testing
describe('Visual Regression', () => {
  test('charts render correctly', async () => {
    await page.goto('http://localhost:8000');
    await page.waitForSelector('#femaleChart');
    const screenshot = await page.screenshot();
    expect(screenshot).toMatchImageSnapshot();
  });
});
```

---

## 10. Documentation Improvements

### Priority: MEDIUM

**Suggested Additions:**

#### 10.1 Add API Documentation
```markdown
## API Reference

### Data Structure

The SMK API returns items with the following structure:

\`\`\`json
{
  "production": [{
    "creator_gender": "Female",
    "creator_nationality": "Danish"
  }],
  "acquisition_date": "2023-01-15",
  "object_names": [{"name": "Painting"}],
  "techniques": ["Oil on canvas"],
  "materials": ["Canvas", "Oil paint"],
  "exhibitions": [...],
  "on_display": true
}
\`\`\`
```

#### 10.2 Add Contributing Guidelines
```markdown
## Contributing

### Setup
1. Clone the repository
2. No build step needed - open index.html in browser

### Code Style
- Use 2 spaces for indentation
- Add JSDoc comments for all functions
- Follow existing naming conventions

### Testing
- Run tests with `npm test`
- Ensure all tests pass before submitting PR
```

#### 10.3 Add Changelog
```markdown
## Changelog

### [Unreleased]
- Added error handling for API failures
- Implemented caching mechanism
- Added accessibility improvements

### [1.0.0] - 2024-01-15
- Initial release
```

---

## Implementation Priority

### Phase 1 (Critical - Week 1)
1. Fix CSS link in HTML
2. Add comprehensive error handling
3. Add ARIA labels and accessibility features
4. Implement LocalStorage caching

### Phase 2 (Important - Week 2-3)
1. Split JavaScript into modules
2. Create ChartManager class
3. Add interactive filters
4. Add data export functionality

### Phase 3 (Enhancement - Week 4+)
1. Implement Web Workers for performance
2. Add unit and integration tests
3. Add advanced features (search, comparison mode)
4. Implement dark mode and alternative color schemes

---

## Estimated Impact

| Improvement | Impact | Effort | Priority |
|-------------|--------|--------|----------|
| Error handling | High | Low | HIGH |
| CSS link fix | High | Very Low | HIGH |
| Accessibility | High | Medium | HIGH |
| Code modularization | Medium | High | MEDIUM |
| Performance optimization | Medium | Medium | MEDIUM |
| Interactive filters | High | Medium | MEDIUM |
| Data export | Medium | Low | LOW |
| Testing | Medium | High | MEDIUM |
| Advanced features | Low | High | LOW |

---

## Conclusion

These improvements will significantly enhance the maintainability, performance, accessibility, and user experience of the SMK Data Visualized project. The suggested changes are designed to be implemented incrementally, starting with critical fixes and moving toward advanced features.

For questions or discussions about these improvements, please open an issue in the repository.
