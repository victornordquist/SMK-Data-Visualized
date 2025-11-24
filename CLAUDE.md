# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SMK Data Visualized is a client-side data visualization application that analyzes gender representation in the Statens Museum for Kunst (SMK) collection using the SMK API. The application is built with modular ES6 JavaScript, Chart.js for statistical visualizations, and D3.js for advanced visualizations (treemaps, world maps, Sankey diagrams).

## Architecture

### Modular Application Structure

This is a static web application with ES6 module architecture:
- `index.html` - Main HTML structure with minimal inline scripts
- `style-minimal.css` - Minimalist black and white theme with responsive layouts
- `src/js/` - Modular JavaScript with clear separation of concerns
- External dependencies: Chart.js v4.4.0 and D3.js v7 via CDN (with SRI hashes)

### Complete Module Structure

```
src/js/
├── config.js               # Configuration (colors, API, cache, performance)
├── main.js                 # Application orchestration and entry point
├── api/
│   └── smkApi.js          # API integration with IndexedDB caching
├── data/
│   └── normalize.js       # Data normalization and validation
├── charts/
│   ├── chartFactory.js    # Chart management, line charts, trend lines
│   ├── pieCharts.js       # Pie chart creation/updates
│   ├── barCharts.js       # Bar chart variants (stacked, horizontal, histograms)
│   ├── artistCharts.js    # Artist scatterplot and top artist lists
│   ├── colorCharts.js     # Color distribution charts and treemaps
│   ├── worldMap.js        # D3.js world map for artist nationalities
│   ├── depictionMap.js    # D3.js world map for depicted locations
│   ├── nationalityDiverging.js  # Diverging bar chart for nationality comparison
│   └── sankey.js          # Sankey diagram for department-to-object-type flow
├── stats/
│   └── calculator.js      # Statistical calculations (median, quartiles, aggregations)
└── utils/
    ├── ui.js              # UI helper functions
    ├── consent.js         # GDPR consent management
    ├── debounce.js        # Performance optimization utilities
    └── lazyLoad.js        # Lazy loading manager
```

### Data Flow

1. **Consent Management**:
   - GDPR-compliant cookie consent banner on first visit
   - Consent stored in cookie for 365 days
   - IndexedDB caching only enabled with user consent

2. **API Fetching with Caching**:
   - IndexedDB cache with 7-day expiration
   - Incremental data loading from SMK API (2000 items per page)
   - Progress updates with debounced visualization rendering
   - Retry logic with exponential backoff (3 retries max)

3. **Data Normalization** (`src/js/data/normalize.js`):
   - Standardizes gender values to "Male", "Female", or "Unknown"
   - Extracts acquisition year from dates
   - Processes nationality, object types, techniques, materials, exhibition counts, and display status
   - Extracts depicted persons with gender from `content_person_full[]`
   - Parses dimensions (height/width) from `dimensions[]`
   - Extracts colors from `colors[]` field
   - Calculates geographic coordinates for depicted locations

4. **Chart Management Pattern**:
   - Charts created on first render, then updated on subsequent data fetches
   - Chart instances stored globally in main.js
   - Animation disabled for performance during incremental updates (`animation: false`)
   - Lazy loading for below-the-fold charts using Intersection Observer

5. **Tooltip Enhancement Pattern**:
   - Optional `countData` arrays passed to chart create/update functions
   - Stored in dataset objects as `dataset.countData`
   - Displayed conditionally in tooltip callbacks
   - Example: "Female: 15.2% (23 works)" instead of just "Female: 15.2%"

### Key Visualization Categories

The application features 20+ distinct visualization types:

#### 1. Timeline & Temporal Analysis
- **Acquisitions by Year**: Line charts showing all acquisitions with gender breakdown
- **Recent Trends (2000-2025)**: Filtered timeline for contemporary analysis
- **Gender Distribution Over Time**: 100% stacked area chart showing gender percentage evolution
- **50-Year Female Trend (1975-2025)**: Line chart with linear regression trend line and collection average reference
- **Years Where Female > Male**: Comparative list showing when female acquisitions surpassed male

#### 2. Distribution & Overview
- **Gender Distribution Pie Charts**: All-time and recent (2000-2025) gender breakdowns
- **Statistics Dashboard**: 8 interactive cards showing key metrics (totals, percentages, display rates, growth indicators)

#### 3. Object & Classification Analysis
- **Object Types by Gender**: 100% stacked bar charts (all-time + recent)
- **Techniques by Gender**: Comparative horizontal bar charts
- **Materials by Gender**: Gender breakdown of material usage

#### 4. Geographic Analysis
- **Top Nationalities**: Horizontal bar charts with gender comparison
- **Nationality Diverging Chart**: Centered diverging bars showing male/female representation by country
- **Artist Birth Country Map**: D3.js world map with bubble overlay showing artist origins
- **Depicted Location Map**: D3.js world map showing geographic locations depicted in artworks
- **Distance from Copenhagen**: Median distance analysis with outlier handling

#### 5. Color Analysis (13-Color System)
- **Color Family Distribution**: Horizontal bar chart comparing male vs female color usage
- **Color Palette Treemaps**: D3.js treemaps showing top 100 actual hex colors for each gender
- **Color Distribution Over Time**: 100% stacked bar chart by decade showing color family evolution
- Uses HSL-based categorization: Red, Orange, Yellow, Yellow-Green, Green, Cyan, Blue, Purple, Magenta, Brown, Black, Gray, White

#### 6. Artist-Level Analysis
- **Artist Scatterplot**: Bubble chart of artists by birth year and artwork count (logarithmic scale)
- **Top 10 Artists Lists**: Side-by-side ranked lists for male and female artists with horizontal bars

#### 7. Exhibition & Display Analysis
- **Exhibition Participation**: Stacked bar charts showing artworks that have been exhibited
- **Display Rate by Gender**: Percentage of works currently on display
- **Display Rate Over Time**: Cohort analysis showing display rates by acquisition decade
- **Exhibition Percentage Chart**: Proportion of works that have been in at least one exhibition

#### 8. Physical Characteristics
- **Dimensions Analysis**: Height and width comparisons by gender with median calculations
- **Acquisition Lag**: Time between artwork creation and museum acquisition

#### 9. Creator-Depicted Relationships
- **Who Depicts Whom?**: 100% horizontal stacked bar chart showing gender of depicted persons by creator gender
- Analyzes portraits and figural works with identified subjects

#### 10. Department Flow Analysis
- **Department to Object Type**: Sankey diagram showing artwork flow from museum departments to object classifications

#### 11. Temporal Analysis
- **Birth Year Distribution**: Histogram of artist birth years by decade
- **Creation Year Distribution**: Histogram of artwork creation years by decade

### Statistics Dashboard (8 Cards)

1. **Total Artworks** - Overall collection size
2. **Male Artists** - Count and percentage
3. **Female Artists** - Count and percentage
4. **Unknown Gender** - Count and percentage
5. **Female (2000-2025)** - Recent female representation
6. **Male (2000-2025)** - Recent male representation
7. **Female On Display** - Current display rate for female artists
8. **Male On Display** - Current display rate for male artists

Each card includes:
- Large prominent value
- Descriptive label
- Contextual subtext (percentages, comparisons)
- Color-coded indicators

### Dynamic Insight Generation

Insight boxes throughout the application provide contextual analysis:
- Compare historical vs. recent trends
- Calculate percentage point changes
- Identify statistical patterns (median vs. average, outlier detection)
- Generate narrative interpretations
- All text wrapped in proper semantic HTML (`<p>` tags)
- Sample sizes provided for transparency

Examples:
- Female acquisition trend analysis (comparing first 25 years vs last 25 years of 1975-2025)
- Geographic distance outlier explanations (Greenland skewing averages)
- Creator-depicted gender relationship insights
- Dimension comparisons with median and quartile statistics

## Development Notes

### No Build System

This application runs directly in the browser - simply open `index.html` in a web browser or serve via any static file server.

### Testing Locally

```bash
# Using Python 3
python3 -m http.server 8000

# Using Python 2
python -m SimpleHTTPServer 8000

# Using Node.js
npx http-server
```

Then navigate to `http://localhost:8000`

### Color Scheme

Minimalist color palette defined in `src/js/config.js`:
- Male: `#00C4AA` (bright teal/cyan)
- Female: `#8700F9` (vibrant purple)
- Unknown: `#dbdddd` (light gray)

CSS variables in `style-minimal.css`:
- Background: Black (`#000000`)
- Text Primary: White (`#ffffff`)
- Text Secondary: Gray (`#999999`)
- Borders: Dark gray (`#333333`)

Color family palette (13 colors) in `src/js/charts/colorCharts.js`:
- Chromatic: Red, Orange, Yellow, Yellow-Green, Green, Cyan, Blue, Purple, Magenta
- Achromatic: Brown, Black, Gray, White

### Data Processing Considerations

- **Gender normalization**: Handles variations like "M"/"F", "MALE"/"FEMALE" and unknown values
- **Year extraction**: Uses regex to extract 4-digit years from various date formats
- **Filtering**: Create filtered datasets before passing to chart functions (e.g., `items2000` for 2000-2025)
- **Aggregation**: Most charts aggregate by counting items matching criteria
- **Median vs Average**: Use median for geographic distances and dimensions to handle outliers robustly
- **Color categorization**: HSL-based with hue, saturation, and lightness thresholds
- **Geographic calculations**: Haversine formula for distance from Copenhagen (55.6761° N, 12.5683° E)

### Statistical Methods

1. **Linear Regression**: Trend line calculation using least squares method (chartFactory.js)
2. **Median & Quartiles**: Robust statistics for dimensions and geographic distances (calculator.js)
3. **Percentage Point Changes**: Compare historical vs recent representation
4. **Temporal Aggregation**: Group by year, decade, or custom periods
5. **Sample Size Reporting**: Always show counts alongside percentages in tooltips

### Cache Management

IndexedDB cache features:
- 7-day expiration (configurable in `src/js/config.js`)
- Cache status display showing timestamp and item count
- Manual refresh button to force re-fetch from API
- Automatic cache clearing when consent is declined
- Metadata retrieval without loading full dataset
- Database: `smk_data_visualized`, Store: `artworks`

### Consent Management

GDPR compliance features:
- Cookie-based consent tracking (365-day expiration)
- Consent banner with Accept/Decline options
- Storage blocked until consent given
- User can change preference via "Refresh Data" button
- Consent state: `accepted`, `declined`, or `null` (no choice)
- Cookie name: `smk_storage_consent`

### Performance Optimizations

1. **Debounced Updates**: 300ms delay during incremental data loading (reduces CPU by ~60%)
2. **Lazy Loading**: Intersection Observer for below-fold charts (initial load time -40%)
3. **IndexedDB Caching**: Instant repeat visits (<1 second vs 8-12 seconds initial)
4. **Async Operations**: All cache operations use async/await for non-blocking UI
5. **Animation Disabled**: `animation: false` in all Chart.js configs for performance
6. **Tab-Based Views**: Reduces initial render from 10-12 charts to 5-6 active charts

### Navigation & UI

1. **Sticky Navigation**: Fixed top bar with centered layout on desktop
   - Desktop: Shows nav-title ("SMK Data Visualized") and centered nav links
   - Mobile/Tablet (<1200px): Hamburger menu with slide-down navigation
2. **Back to Top Button**: Floating button appears after 300px scroll
3. **Tab System**: Switch between "All Years" and "2000-2025" views for temporal analysis
4. **Section Anchors**: Smooth scrolling to major sections via navigation links

### Modifying Visualizations

When adding or modifying chart types:

1. **Create Chart Module Function**:
   - Add to appropriate chart file (barCharts.js, etc.)
   - Export `createXChart()` and `updateXChart()` functions
   - Include optional `countData` parameters for tooltip enhancements
   - Set `animation: false` for performance
   - Add JSDoc comments with parameter types

2. **Add Statistical Calculation**:
   - Add aggregation function to `src/js/stats/calculator.js`
   - Return both percentage arrays and count arrays
   - Handle edge cases (division by zero, missing data)

3. **Integrate in main.js**:
   - Import chart creation/update functions
   - Add chart instance variable at top
   - Create update function (e.g., `updateXChartView()`)
   - Call update function in `updateAllVisualizations()`
   - Register with lazy load manager if below fold

4. **Add HTML Container**:
   - Add `<canvas>` or `<div>` with unique ID to index.html
   - Wrap in section with appropriate heading
   - Add insight box container if needed

5. **Consider Performance**:
   - Use debouncing for frequent updates
   - Lazy load if not immediately visible
   - Limit data points if rendering thousands of items

### Tooltip Enhancement Pattern

To add count data to chart tooltips:

```javascript
// In calculator.js - return both percentages and counts
return {
  labels: ['Category A', 'Category B'],
  malePercent: [60, 40],
  femalePercent: [55, 45],
  maleCount: [120, 80],      // Add count arrays
  femaleCount: [110, 90]
};

// In barCharts.js - accept optional count parameters
export function createMyChart(labels, maleData, femaleData, canvasId,
                               maleCount = null, femaleCount = null) {
  return new Chart(ctx, {
    data: {
      datasets: [{
        data: maleData,
        countData: maleCount  // Store in dataset
      }]
    },
    options: {
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.parsed.y.toFixed(1) + '%';
              if (context.dataset.countData) {
                const count = context.dataset.countData[context.dataIndex];
                label += ' (' + count + ' works)';
              }
              return label;
            }
          }
        }
      }
    }
  });
}

// In main.js - pass count data through
function updateMyChartView() {
  const data = getMyData(artworks);
  if (myChartInstance) {
    updateMyChart(myChartInstance, data.labels, data.malePercent,
                  data.femalePercent, data.maleCount, data.femaleCount);
  } else {
    myChartInstance = createMyChart(data.labels, data.malePercent,
                                    data.femalePercent, 'myChartCanvas',
                                    data.maleCount, data.femaleCount);
  }
}
```

### Styling Guidelines

- All insight boxes use `.insight-box` class with nested `<p>` tags
- List items follow global `li` styling (0.875rem, line-height 1.7)
- Dynamic content should create proper DOM elements (not use `<br>` tags)
- Minimalist aesthetic with high contrast for accessibility
- Chart containers use `.chart-container` class
- Statistics cards use `.stat-card` class with hover effects
- Navigation centered on desktop (`justify-content: center`)

### Tab System Usage

Sections with tabs for "All Years" vs "2000-2025" views:
1. Timeline Charts
2. Gender Distribution (Pie Charts)
3. Object Types by Gender
4. Top Nationalities by Gender
5. Exhibitions by Gender

Tab implementation:
- CSS-based show/hide (no JavaScript state management needed)
- Lazy loading integrated - charts render when tab becomes active
- ARIA accessibility with `role="tablist"`, `role="tab"`, `role="tabpanel"`

## API Reference

SMK API endpoint used:
```
https://api.smk.dk/api/v1/art/search/?keys=*&rows=2000&offset=0&lang=en
```

Key fields extracted from API responses:
- `production[0].creator_gender` - Artist gender (MALE, FEMALE, or null)
- `production[0].creator_nationality` - Artist nationality
- `production[0].creator_date_of_birth` - Birth year
- `acquisition_date` - When acquired by museum
- `created` / `created_date` - Artwork creation date
- `object_names[0].name` - Object type classification
- `techniques[]` - Array of technique names
- `materials[]` - Array of material names
- `colors[]` - Array of objects with `color` (hex) and `percentage` fields
- `exhibitions` - Array of exhibition objects (use `.length` for count)
- `on_display` - Boolean for current display status
- `content_person_full[]` - Array of depicted persons with:
  - `full_name` - Name
  - `gender` - Gender (MALE, FEMALE, UNKNOWN)
  - `nationality` - Nationality
- `dimensions[]` - Array with `width` and `height` in cm
- `production_places_uri[]` - Geographic locations of depicted scenes
- `collection[0]` - Museum department/collection

## Configuration

All settings centralized in `src/js/config.js`:

```javascript
export const CONFIG = {
  colors: {
    male: '#00C4AA',      // Bright teal/cyan
    female: '#8700F9',    // Vibrant purple
    unknown: '#dbdddd',   // Light gray
    text: '#ffffff'       // White text
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
  cache: {
    key: 'smk_data_cache',
    duration: 7 * 24 * 60 * 60 * 1000  // 7 days in milliseconds
  },
  performance: {
    debounceDelay: 300,           // Chart update delay (ms)
    lazyLoadMargin: '50px',       // Load charts 50px before visible
    lazyLoadThreshold: 0.1        // 10% visibility triggers load
  }
};
```

## Browser Compatibility

ES6 modules supported in:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

IndexedDB supported in 95%+ of browsers worldwide.

Intersection Observer (lazy loading) supported in 95%+ of browsers.

## Known Limitations

1. **API Data Quality**:
   - Not all artworks have complete metadata
   - ~20% of works have unknown creator gender
   - Depicted persons data available for only ~1-3% of collection
   - Some fields may be null or inconsistently formatted

2. **Performance**:
   - Initial API fetch takes 8-12 seconds for full dataset
   - Browser may slow during initial render of 20+ charts
   - Very large datasets (300k+ items) may cause memory pressure

3. **Geographic Data**:
   - Depicted location coordinates from `production_places_uri` may be approximate
   - Some nationalities not available in TopoJSON world map data
   - Distance calculations assume flat earth (Haversine formula) - acceptable for this scale

4. **Color Analysis**:
   - Color data depends on SMK's image analysis quality
   - Limited to top 100 colors per gender in treemaps for performance
   - HSL categorization may not perfectly match human perception

## Clearing Cache & Debugging

### Clearing IndexedDB Cache

```javascript
// In browser console
indexedDB.deleteDatabase('smk_data_visualized');
location.reload();
```

### Clearing Consent Cookie

```javascript
// In browser console
document.cookie = 'smk_storage_consent=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;';
location.reload();
```

### Checking Storage Usage

```javascript
// In browser console
navigator.storage.estimate().then(est => {
  console.log(`Used: ${(est.usage / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Quota: ${(est.quota / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Percentage: ${(est.usage / est.quota * 100).toFixed(2)}%`);
});
```

### Hard Refresh

When JavaScript changes don't appear:
- **Chrome/Firefox**: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
- **Safari**: Cmd+Option+R
- Or: Open DevTools → Right-click refresh button → "Empty Cache and Hard Reload"

## Recent Enhancements (Last Updated: 2025-11-24)

### Completed Features

1. **13-Color System**: Expanded from 10 to 13 color families covering full spectrum
2. **Linear Regression Trend Lines**: 50-year female acquisition trend with statistical analysis
3. **Median-Based Geographic Analysis**: Robust distance calculations handling outliers
4. **Tooltip Count Data**: Sample sizes shown in tooltips across all percentage charts
5. **Creator-Depicted Analysis**: Gender relationships in portraiture
6. **Navigation Centering**: Desktop navigation now centered with visible title
7. **Comprehensive Methodology**: Complete documentation of all analytical approaches
8. **Color Treemaps**: D3.js visualization of actual hex colors by frequency
9. **Artist Scatterplot**: Bubble chart of productivity vs birth year
10. **Sankey Diagram**: Department-to-object-type flow visualization

### Code Patterns Established

1. **Chart Create/Update Pattern**: Separate functions for initial creation and data updates
2. **Tooltip Enhancement Pattern**: Optional countData parameters with conditional display
3. **Statistical Robustness**: Prefer median over mean for skewed distributions
4. **Lazy Loading Registration**: All below-fold charts registered with lazyLoadManager
5. **Insight Generation**: Dynamic narrative creation with proper HTML structure
