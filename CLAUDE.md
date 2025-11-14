# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SMK Data Visualized is a client-side data visualization application that analyzes gender representation in the Statens Museum for Kunst (SMK) collection using the SMK API. The application is built as a single-page HTML application with vanilla JavaScript and Chart.js for visualizations.

## Architecture

### Single-File Application Structure

This is a static web application with no build process:
- `index.html` - Complete application logic with embedded JavaScript
- `style.css` - All styling including responsive layouts and themed stat cards
- External dependency: Chart.js via CDN

### Data Flow

1. **API Fetching**: Incremental data loading from SMK API (`https://api.smk.dk/api/v1/art/search/`)
   - Fetches 2000 items per page
   - Updates visualizations progressively as data loads
   - All data processing happens client-side

2. **Data Normalization** (`normalizeItems` function at index.html:128):
   - Standardizes gender values to "Male", "Female", or "Unknown"
   - Extracts acquisition year from dates
   - Processes nationality, object types, techniques, materials, exhibition counts, and display status

3. **Chart Management Pattern**:
   - Charts are created on first render, then updated on subsequent data fetches
   - All chart instances stored globally (e.g., `femaleChartInstance`, `maleChartInstance`)
   - Update functions check if instance exists before creating new charts
   - Animation disabled (`animation: false`) for performance during incremental updates

### Key Visualization Categories

The application generates multiple visualization types comparing gender representation:

1. **Timeline Charts**: Line charts showing acquisitions by year (all years + 2000-2025 filtered)
2. **Pie Charts**: Gender distribution overview (all years + recent)
3. **Bar Charts**: Stacked and horizontal bars for object types, nationalities, techniques, materials
4. **Exhibition Analysis**: Exhibition counts and display statistics
5. **Comparative Lists**: Years/categories where female acquisitions surpass male

### Statistics Dashboard

The stats grid (index.html:16-57) displays 8 key metrics with color-coded cards:
- Total artworks, gender breakdowns (all time)
- Recent trends (2000-2025)
- Current display statistics
- Percentage calculations for context

### Insight Generation

The `generateInsights()` function (index.html:510) creates contextual analysis boxes that:
- Compare historical vs. recent trends
- Calculate percentage point changes
- Generate narrative interpretations of the data
- Display dynamically when data is available

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

### Modifying Visualizations

When adding or modifying chart types:
1. Declare chart instance variable globally (index.html:120-126)
2. Create helper functions following the pattern: `createXChart()` and `updateXChart()`
3. Add update logic in `fetchAllDataIncremental()` loop (index.html:637-737)
4. Consider performance - use `animation: false` and `update('none')` for incremental rendering

### Data Processing Considerations

- **Gender normalization** (index.html:132-139): Handles variations like "M"/"F" and unknown values
- **Year extraction**: Uses regex to extract 4-digit years from various date formats
- **Filtering**: Create filtered datasets before passing to chart functions (e.g., `items2000`)
- **Aggregation**: Most charts aggregate by counting items matching criteria

### Color Scheme

Consistent colors used throughout:
- Male: `#3e5c82` (blue)
- Female: `#ed969d` (pink)
- Unknown: `#cccccc` (gray)

These are defined inline in chart configurations and CSS classes.

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
