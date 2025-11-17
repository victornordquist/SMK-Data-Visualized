# Modular JavaScript Structure

This document describes the new modular JavaScript architecture for SMK Data Visualized.

## Directory Structure

```
src/
└── js/
    ├── config.js              # Application configuration constants
    ├── main.js                # Application entry point
    ├── api/
    │   └── smkApi.js          # SMK API integration with caching
    ├── data/
    │   └── normalize.js       # Data normalization and validation
    ├── charts/
    │   ├── chartFactory.js    # Chart management utilities
    │   ├── pieCharts.js       # Pie chart functions
    │   └── barCharts.js       # Bar chart functions (stacked, horizontal, regular)
    ├── stats/
    │   └── calculator.js      # Statistics calculations
    ├── utils/
    │   ├── ui.js              # UI helper functions (messages, loading indicators)
    │   ├── debounce.js        # Debounce and throttle utilities
    │   └── lazyLoad.js        # Lazy loading manager for charts
    └── workers/
        └── dataProcessor.worker.js  # Web Worker for data processing (optional)
```

## Module Descriptions

### `config.js`
**Purpose:** Centralized configuration
- Color schemes for charts
- API endpoint configuration
- Date range settings
- Cache settings

**Exports:**
- `CONFIG` - Configuration object

### `main.js`
**Purpose:** Application entry point and orchestration
- Initializes the application
- Coordinates between modules
- Manages chart instances
- Handles data loading and visualization updates

**Key Functions:**
- `init()` - Application initialization
- `updateAllVisualizations()` - Updates all charts with current data
- Various helper functions for specific chart types

### `api/smkApi.js`
**Purpose:** API integration with caching and error handling
- Fetches data from SMK API
- Implements retry logic with exponential backoff
- Manages localStorage caching

**Exports:**
- `fetchAllDataIncremental(onProgress, onError)` - Main fetch function with callbacks
- `getCachedData()` - Retrieve cached data
- `setCachedData(data)` - Store data in cache

### `data/normalize.js`
**Purpose:** Data normalization and validation
- Normalizes gender values
- Extracts dates and years
- Validates artwork items
- Groups data by year and gender

**Exports:**
- `normalizeGender(rawGender)` - Standardizes gender values
- `extractYear(dateString)` - Extracts year from date strings
- `validateArtwork(item)` - Validates API response items
- `normalizeItems(items)` - Normalizes array of artworks
- `groupByYear(items, gender)` - Groups artworks by year

### `charts/chartFactory.js`
**Purpose:** Chart creation utilities and management
- Chart manager class for handling chart instances
- Line chart creation and updates
- Color configuration access

**Exports:**
- `ChartManager` - Class for managing chart instances
- `createLineChart(canvasId, groupedData, color)` - Creates line charts
- `updateLineChart(chartInstance, groupedData, color)` - Updates line charts
- `getColors()` - Returns color configuration

### `charts/pieCharts.js`
**Purpose:** Pie chart specific functions
- Gender distribution pie charts

**Exports:**
- `createGenderPie(items, canvasId)` - Creates gender pie chart
- `updateGenderPie(chartInstance, items)` - Updates gender pie chart

### `charts/barCharts.js`
**Purpose:** Bar chart functions (all variations)
- Stacked bar charts
- Horizontal bar charts
- Regular bar charts

**Exports:**
- `createBarStackChart(labels, maleData, femaleData, unknownData, canvasId)`
- `updateBarStackChart(chartInstance, ...)`
- `createHorizontalBarChart(...)`
- `updateHorizontalBarChart(...)`
- `createBarChart(...)`
- `updateBarChart(...)`

### `stats/calculator.js`
**Purpose:** Statistical calculations and data aggregation
- Gender statistics
- Object type analysis
- Nationality data
- Exhibition statistics
- Display statistics

**Exports:**
- `calculateStats(items)` - Calculates gender distribution statistics
- `getObjectTypeData(items)` - Aggregates object types by gender
- `getNationalityData(items)` - Aggregates nationalities (top 20)
- `getTopAttributeData(items, attr)` - Aggregates any attribute (techniques, materials)
- `getExhibitionData(items)` - Calculates exhibition statistics
- `getOnDisplayData(items)` - Calculates display statistics

### `utils/ui.js`
**Purpose:** User interface helper functions
- Error messages
- Success messages
- Loading indicators

**Exports:**
- `showErrorMessage(message)` - Displays error notification
- `showSuccessMessage(message)` - Displays success message
- `updateLoadingIndicator(count)` - Updates loading text
- `hideLoadingIndicator()` - Hides loading indicator
- `showLoadingIndicator()` - Shows loading indicator

### `utils/debounce.js`
**Purpose:** Performance optimization utilities
- Debounce function execution
- Throttle function execution

**Exports:**
- `debounce(func, wait)` - Creates a debounced function that delays execution
- `throttle(func, wait)` - Creates a throttled function that limits execution rate

**Usage:**
```javascript
// Debounce - waits for silence before executing
const debouncedUpdate = debounce(updateCharts, 300);

// Throttle - executes at most once per interval
const throttledScroll = throttle(handleScroll, 100);
```

### `utils/lazyLoad.js`
**Purpose:** Lazy loading manager for charts
- Uses Intersection Observer API
- Loads charts when they enter viewport
- Reduces initial page load time

**Exports:**
- `LazyLoadManager` - Class for managing multiple lazy-loaded elements
- `lazyLoad(elementId, callback, options)` - Simple lazy load function

**Usage:**
```javascript
const lazyLoader = new LazyLoadManager();

// Register a chart for lazy loading
lazyLoader.observe('chartContainer', () => {
  createChart();
});

// Check if loaded
if (lazyLoader.isLoaded('chartContainer')) {
  updateChart();
}
```

### `workers/dataProcessor.worker.js`
**Purpose:** Web Worker for background data processing
- Offloads heavy computation from main thread
- Prevents UI blocking during data normalization
- Currently disabled by default

**Usage:**
```javascript
// To enable (requires additional setup):
// 1. Set CONFIG.performance.useWebWorkers = true
// 2. Create worker instance
const worker = new Worker('src/js/workers/dataProcessor.worker.js');

// 3. Send data for processing
worker.postMessage({
  type: 'normalize',
  data: rawItems
});

// 4. Receive processed data
worker.onmessage = (e) => {
  const { data, success } = e.data;
  if (success) {
    // Use normalized data
  }
};
```

**Note:** Web Workers are ready but disabled by default. Current dataset size doesn't warrant the added complexity. Enable when processing >50,000 items.

## Usage

### Original Version
The original monolithic version is in `index.html` with all JavaScript embedded.

### Modular Version
The new modular version is in `index-modular.html` and uses ES6 modules:

```html
<!-- Chart.js library -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js"></script>

<!-- Application entry point (ES6 modules) -->
<script type="module" src="src/js/main.js"></script>
```

### Running Locally
Because the code uses ES6 modules, you must serve the files through a web server:

```bash
# Using Python 3
python3 -m http.server 8000

# Using Python 2
python -m SimpleHTTPServer 8000

# Using Node.js
npx http-server
```

Then navigate to:
- Original: `http://localhost:8000/index.html`
- Modular: `http://localhost:8000/index-modular.html`

## Benefits of Modular Structure

### 1. **Maintainability**
- Each module has a single, clear responsibility
- Easier to locate and fix bugs
- Changes are isolated to specific modules

### 2. **Reusability**
- Functions can be imported and reused across files
- No global variable pollution
- Clear dependencies between modules

### 3. **Testability**
- Individual modules can be tested in isolation
- Easy to mock dependencies
- Clear function contracts with JSDoc comments

### 4. **Scalability**
- Easy to add new chart types
- Simple to extend with new features
- Clear structure for team collaboration

### 5. **Code Organization**
- Related code grouped together
- Logical directory structure
- Easier onboarding for new developers

## Adding New Features

### Adding a New Chart Type

1. Create chart functions in appropriate chart file or new file in `charts/`
2. Import in `main.js`
3. Add chart instance variable
4. Call create/update functions in `updateAllVisualizations()`

Example:
```javascript
// In charts/newChartType.js
export function createMyChart(data, canvasId) {
  // Implementation
}

export function updateMyChart(chartInstance, data) {
  // Implementation
}

// In main.js
import { createMyChart, updateMyChart } from './charts/newChartType.js';

let myChartInstance;

function updateAllVisualizations() {
  // ... existing code ...

  if (myChartInstance) {
    updateMyChart(myChartInstance, artworks);
  } else {
    myChartInstance = createMyChart(artworks, 'myCanvas');
  }
}
```

### Adding New Statistics

1. Add calculation function to `stats/calculator.js`
2. Export the function
3. Import and use in `main.js`

### Adding New Data Processing

1. Add function to `data/normalize.js`
2. Export and document with JSDoc
3. Import where needed

## Migration Path

To fully migrate to the modular version:

1. ✅ Test `index-modular.html` thoroughly
2. Back up original `index.html`
3. Rename `index-modular.html` to `index.html`
4. Update documentation and links

## Performance Considerations

- ES6 modules are loaded asynchronously
- Browser caching improves subsequent page loads
- No change to runtime performance
- Slightly larger initial payload due to multiple files (mitigated by HTTP/2)

## Browser Compatibility

ES6 modules are supported in:
- Chrome 61+
- Firefox 60+
- Safari 11+
- Edge 16+

For older browsers, consider using a bundler like Webpack or Rollup to create a single bundled file.

## Future Improvements

Potential enhancements to the modular structure:

1. **Build System**: Add Webpack/Rollup for:
   - Module bundling
   - Minification
   - Tree shaking
   - Development server with hot reload

2. **TypeScript**: Convert to TypeScript for:
   - Type safety
   - Better IDE support
   - Compile-time error checking

3. **Testing**: Add test framework:
   - Unit tests for each module
   - Integration tests
   - E2E tests with Playwright/Cypress

4. **Module Bundling**: Create separate bundles for:
   - Core functionality
   - Chart rendering
   - Data processing
   - Lazy load non-critical features

5. **State Management**: Consider adding:
   - Redux/Zustand for complex state
   - Reactive data binding
   - Event bus for module communication
