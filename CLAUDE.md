# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SMK Data Visualized is a client-side data visualization application that analyzes gender representation in the Statens Museum for Kunst (SMK) collection using the SMK API. The application is built with modular ES6 JavaScript and Chart.js for visualizations.

## Architecture

### Modular Application Structure

This is a static web application with ES6 module architecture:
- `index.html` - Main HTML structure with minimal inline scripts
- `style-minimal.css` - Minimalist black and white theme with responsive layouts
- `src/js/` - Modular JavaScript with clear separation of concerns
- External dependencies: Chart.js and D3.js via CDN

### Module Structure

```
src/js/
├── config.js               # Configuration (colors, API, cache, performance)
├── main.js                 # Application orchestration and entry point
├── api/
│   └── smkApi.js          # API integration with IndexedDB caching
├── data/
│   └── normalize.js       # Data normalization and validation
├── charts/
│   ├── chartFactory.js    # Chart management and line charts
│   ├── pieCharts.js       # Pie chart creation/updates
│   └── barCharts.js       # Bar chart variants
├── stats/
│   └── calculator.js      # Statistical calculations
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
   - Retry logic with exponential backoff

3. **Data Normalization** (`src/js/data/normalize.js`):
   - Standardizes gender values to "Male", "Female", or "Unknown"
   - Extracts acquisition year from dates
   - Processes nationality, object types, techniques, materials, exhibition counts, and display status

4. **Chart Management Pattern**:
   - Charts created on first render, then updated on subsequent data fetches
   - Chart instances stored globally
   - Animation disabled for performance during incremental updates
   - Lazy loading for below-the-fold charts

### Key Visualization Categories

The application generates multiple visualization types comparing gender representation:

1. **Timeline Charts**: Line charts showing acquisitions by year (all years + 2000-2025 filtered)
2. **Pie Charts**: Gender distribution overview (all years + recent)
3. **Bar Charts**: Stacked and horizontal bars for object types, nationalities, techniques, materials
4. **Exhibition Analysis**: Exhibition counts and display statistics
5. **Acquisition Lag**: Time between creation and acquisition
6. **Dimensions Analysis**: Physical size comparisons
7. **Creator vs Depicted**: Gender relationships in portraits
8. **Comparative Lists**: Years where female acquisitions surpass male

### Statistics Dashboard

The stats grid displays 8 key metrics with color-coded cards:
- Total artworks, gender breakdowns (all time)
- Recent trends (2000-2025)
- Current display statistics
- Percentage calculations for context

### Dynamic Insight Generation

Insight boxes throughout the application provide contextual analysis:
- Compare historical vs. recent trends
- Calculate percentage point changes
- Generate narrative interpretations
- All text wrapped in proper semantic HTML (`<p>` tags)

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

### Data Processing Considerations

- **Gender normalization**: Handles variations like "M"/"F" and unknown values
- **Year extraction**: Uses regex to extract 4-digit years from various date formats
- **Filtering**: Create filtered datasets before passing to chart functions (e.g., `items2000`)
- **Aggregation**: Most charts aggregate by counting items matching criteria

### Cache Management

IndexedDB cache features:
- 7-day expiration (configurable in `src/js/config.js`)
- Cache status display showing timestamp and item count
- Manual refresh button to force re-fetch from API
- Automatic cache clearing when consent is declined
- Metadata retrieval without loading full dataset

### Consent Management

GDPR compliance features:
- Cookie-based consent tracking (365-day expiration)
- Consent banner with Accept/Decline options
- Storage blocked until consent given
- User can change preference via "Refresh Data" button
- Consent state: `accepted`, `declined`, or `null` (no choice)

### Performance Optimizations

1. **Debounced Updates**: 300ms delay during incremental data loading
2. **Lazy Loading**: Intersection Observer for below-fold charts
3. **IndexedDB Caching**: Instant repeat visits (<1 second)
4. **Async Operations**: All cache operations use async/await

### Modifying Visualizations

When adding or modifying chart types:
1. Import chart creation/update functions in `src/js/main.js`
2. Create helper functions in appropriate chart module
3. Add update logic in `updateAllVisualizations()` function
4. Consider performance - use `animation: false` and debouncing
5. Register with lazy load manager if below fold

### Styling Guidelines

- All insight boxes use `.insight-box` class with nested `<p>` tags
- List items follow `.methodology-content li` styling
- Dynamic content should create proper DOM elements (not use `<br>` tags)
- Minimalist aesthetic with high contrast for accessibility

## API Reference

SMK API endpoint used:
```
https://api.smk.dk/api/v1/art/search/?keys=*&rows=2000&offset=0&lang=en
```

Key fields extracted from API responses:
- `production[0].creator_gender`
- `production[0].creator_nationality`
- `acquisition_date`
- `object_names[0].name`
- `techniques[]`
- `materials[]`
- `exhibitions` (array length)
- `on_display` (boolean)
- `content_person_full[]` (depicted persons with gender)
- `dimensions` (height/width in cm)

## Configuration

All settings centralized in `src/js/config.js`:

```javascript
export const CONFIG = {
  colors: {
    male: '#00C4AA',
    female: '#8700F9',
    unknown: '#dbdddd'
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
    duration: 7 * 24 * 60 * 60 * 1000 // 7 days
  },
  performance: {
    debounceDelay: 300,
    lazyLoadMargin: '50px',
    lazyLoadThreshold: 0.1
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
