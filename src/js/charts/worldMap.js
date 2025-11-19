/**
 * World Map visualization using D3.js
 * Shows geographic distribution of artists by gender using bubbles
 */
import { CONFIG } from '../config.js';

// Nationality to ISO 3166-1 alpha-3 country code mapping
const nationalityToCountry = {
  // Scandinavian
  'Danish': 'DNK',
  'Norwegian': 'NOR',
  'Swedish': 'SWE',
  'Finnish': 'FIN',
  'Icelandic': 'ISL',

  // Western Europe
  'German': 'DEU',
  'French': 'FRA',
  'Dutch': 'NLD',
  'Belgian': 'BEL',
  'Swiss': 'CHE',
  'Austrian': 'AUT',
  'Luxembourgish': 'LUX',

  // British Isles
  'British': 'GBR',
  'English': 'GBR',
  'Scottish': 'GBR',
  'Welsh': 'GBR',
  'Irish': 'IRL',

  // Southern Europe
  'Italian': 'ITA',
  'Spanish': 'ESP',
  'Portuguese': 'PRT',
  'Greek': 'GRC',

  // Eastern Europe
  'Polish': 'POL',
  'Russian': 'RUS',
  'Czech': 'CZE',
  'Czechoslovakian': 'CZE',
  'Hungarian': 'HUN',
  'Romanian': 'ROU',
  'Bulgarian': 'BGR',
  'Ukrainian': 'UKR',
  'Serbian': 'SRB',
  'Croatian': 'HRV',
  'Slovenian': 'SVN',
  'Slovak': 'SVK',
  'Latvian': 'LVA',
  'Lithuanian': 'LTU',
  'Estonian': 'EST',

  // Americas
  'American': 'USA',
  'Canadian': 'CAN',
  'Mexican': 'MEX',
  'Brazilian': 'BRA',
  'Argentine': 'ARG',
  'Argentinian': 'ARG',
  'Chilean': 'CHL',
  'Colombian': 'COL',
  'Peruvian': 'PER',
  'Venezuelan': 'VEN',
  'Cuban': 'CUB',

  // Asia
  'Japanese': 'JPN',
  'Chinese': 'CHN',
  'Korean': 'KOR',
  'South Korean': 'KOR',
  'Indian': 'IND',
  'Israeli': 'ISR',
  'Turkish': 'TUR',
  'Iranian': 'IRN',
  'Pakistani': 'PAK',
  'Thai': 'THA',
  'Vietnamese': 'VNM',
  'Indonesian': 'IDN',
  'Philippine': 'PHL',
  'Filipino': 'PHL',

  // Oceania
  'Australian': 'AUS',
  'New Zealand': 'NZL',
  'New Zealander': 'NZL',

  // Africa
  'South African': 'ZAF',
  'Egyptian': 'EGY',
  'Nigerian': 'NGA',
  'Kenyan': 'KEN',
  'Moroccan': 'MAR',
  'Algerian': 'DZA',
  'Tunisian': 'TUN',
  'Ethiopian': 'ETH',
  'Ghanaian': 'GHA',
  'Senegalese': 'SEN'
};

// Country centroids (approximate lat/lng for bubble placement)
const countryCentroids = {
  'DNK': [9.5, 56.0],
  'NOR': [8.5, 61.0],
  'SWE': [15.0, 62.0],
  'FIN': [26.0, 64.0],
  'ISL': [-19.0, 65.0],
  'DEU': [10.0, 51.0],
  'FRA': [2.0, 46.5],
  'NLD': [5.5, 52.5],
  'BEL': [4.5, 50.5],
  'CHE': [8.0, 47.0],
  'AUT': [14.5, 47.5],
  'LUX': [6.1, 49.8],
  'GBR': [-2.0, 54.0],
  'IRL': [-8.0, 53.5],
  'ITA': [12.5, 42.5],
  'ESP': [-3.5, 40.0],
  'PRT': [-8.0, 39.5],
  'GRC': [22.0, 39.0],
  'POL': [19.5, 52.0],
  'RUS': [100.0, 60.0],
  'CZE': [15.0, 50.0],
  'HUN': [19.5, 47.0],
  'ROU': [25.0, 46.0],
  'BGR': [25.5, 42.5],
  'UKR': [32.0, 49.0],
  'SRB': [21.0, 44.0],
  'HRV': [16.0, 45.5],
  'SVN': [15.0, 46.0],
  'SVK': [19.5, 48.5],
  'LVA': [24.5, 57.0],
  'LTU': [24.0, 55.0],
  'EST': [25.0, 59.0],
  'USA': [-98.0, 39.0],
  'CAN': [-106.0, 56.0],
  'MEX': [-102.0, 23.5],
  'BRA': [-53.0, -10.0],
  'ARG': [-64.0, -34.0],
  'CHL': [-71.0, -33.0],
  'COL': [-74.0, 4.5],
  'PER': [-76.0, -10.0],
  'VEN': [-66.0, 8.0],
  'CUB': [-79.5, 22.0],
  'JPN': [138.0, 36.0],
  'CHN': [105.0, 35.0],
  'KOR': [127.5, 36.0],
  'IND': [79.0, 22.0],
  'ISR': [35.0, 31.5],
  'TUR': [35.0, 39.0],
  'IRN': [53.0, 32.0],
  'PAK': [69.0, 30.0],
  'THA': [101.0, 15.0],
  'VNM': [106.0, 16.0],
  'IDN': [120.0, -2.0],
  'PHL': [122.0, 12.0],
  'AUS': [134.0, -25.0],
  'NZL': [174.0, -41.0],
  'ZAF': [25.0, -29.0],
  'EGY': [30.0, 27.0],
  'NGA': [8.0, 10.0],
  'KEN': [38.0, 1.0],
  'MAR': [-6.0, 32.0],
  'DZA': [3.0, 28.0],
  'TUN': [9.5, 34.0],
  'ETH': [39.0, 9.0],
  'GHA': [-1.0, 8.0],
  'SEN': [-14.5, 14.5]
};

// Map state
let mapInstance = null;
let currentFilter = 'all';
let currentData = null;

/**
 * Get map data from artworks grouped by country
 */
export function getMapData(items) {
  const countryData = {};

  items.forEach(item => {
    if (!item.nationality) return;

    const countryCode = nationalityToCountry[item.nationality];
    if (!countryCode) return;

    if (!countryData[countryCode]) {
      countryData[countryCode] = {
        code: countryCode,
        nationality: item.nationality,
        total: 0,
        male: 0,
        female: 0,
        unknown: 0
      };
    }

    countryData[countryCode].total++;
    if (item.gender === 'Male') {
      countryData[countryCode].male++;
    } else if (item.gender === 'Female') {
      countryData[countryCode].female++;
    } else {
      countryData[countryCode].unknown++;
    }
  });

  return countryData;
}

/**
 * Create the world map visualization with bubbles
 */
export async function createWorldMap(items, containerId = 'worldMap') {
  const container = document.getElementById(containerId);
  if (!container) return null;

  // Clear existing content
  container.innerHTML = '';

  // Get dimensions
  const width = container.clientWidth || 800;
  const height = Math.min(width * 0.5, 500);

  // Create SVG
  const svg = d3.select(`#${containerId}`)
    .append('svg')
    .attr('width', '100%')
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('preserveAspectRatio', 'xMidYMid meet');

  // Create projection
  const projection = d3.geoNaturalEarth1()
    .scale(width / 6)
    .translate([width / 2, height / 1.8]);

  const path = d3.geoPath().projection(projection);

  // Load world topology
  try {
    const world = await d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
    const countries = topojson.feature(world, world.objects.countries);

    // Process data
    currentData = getMapData(items);

    // Draw base map (countries as background)
    svg.selectAll('path.country-bg')
      .data(countries.features)
      .enter()
      .append('path')
      .attr('class', 'country-bg')
      .attr('d', path)
      .attr('fill', '#2a2a2a')
      .attr('stroke', '#333')
      .attr('stroke-width', 0.5);

    // Calculate max for scale
    const maxTotal = Math.max(...Object.values(currentData).map(d => d.total), 1);

    // Create size scale (using sqrt for area-proportional sizing)
    const sizeScale = d3.scaleSqrt()
      .domain([0, maxTotal])
      .range([3, Math.min(width, height) / 8]);

    // Create bubbles group
    const bubblesGroup = svg.append('g').attr('class', 'bubbles');

    // Convert country data to array and sort by total (largest first for proper layering)
    const bubbleData = Object.values(currentData)
      .filter(d => d.total > 0 && countryCentroids[d.code])
      .sort((a, b) => b.total - a.total);

    // Draw bubbles
    const bubbles = bubblesGroup.selectAll('circle')
      .data(bubbleData)
      .enter()
      .append('circle')
      .attr('class', 'bubble')
      .attr('cx', d => {
        const coords = countryCentroids[d.code];
        return projection(coords)[0];
      })
      .attr('cy', d => {
        const coords = countryCentroids[d.code];
        return projection(coords)[1];
      })
      .attr('r', d => getBubbleRadius(d, currentFilter, sizeScale))
      .attr('fill', d => getBubbleColor(d, currentFilter))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .attr('opacity', 0.85)
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('stroke-width', 2)
          .attr('opacity', 1);
        showBubbleTooltip(event, d);
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('stroke-width', 1)
          .attr('opacity', 0.85);
        hideTooltip();
      })
      .on('mousemove', function(event) {
        moveTooltip(event);
      });

    // Store instance
    mapInstance = {
      svg,
      bubbles,
      bubblesGroup,
      projection,
      path,
      sizeScale
    };

    // Create legend
    createBubbleLegend(maxTotal, sizeScale);

    // Setup filter buttons
    setupFilterButtons();

    return mapInstance;
  } catch (error) {
    console.error('Failed to load world map:', error);
    container.innerHTML = '<p class="error">Failed to load world map</p>';
    return null;
  }
}

/**
 * Update the world map with new data
 */
export function updateWorldMap(items) {
  if (!mapInstance) return;

  currentData = getMapData(items);
  const maxTotal = Math.max(...Object.values(currentData).map(d => d.total), 1);

  // Update size scale
  mapInstance.sizeScale.domain([0, maxTotal]);

  // Convert to array
  const bubbleData = Object.values(currentData)
    .filter(d => d.total > 0 && countryCentroids[d.code])
    .sort((a, b) => b.total - a.total);

  // Update existing bubbles
  const bubbles = mapInstance.bubblesGroup.selectAll('circle')
    .data(bubbleData, d => d.code);

  // Remove old
  bubbles.exit().remove();

  // Add new
  bubbles.enter()
    .append('circle')
    .attr('class', 'bubble')
    .attr('cx', d => {
      const coords = countryCentroids[d.code];
      return mapInstance.projection(coords)[0];
    })
    .attr('cy', d => {
      const coords = countryCentroids[d.code];
      return mapInstance.projection(coords)[1];
    })
    .attr('stroke', '#fff')
    .attr('stroke-width', 1)
    .attr('opacity', 0.85)
    .on('mouseover', function(event, d) {
      d3.select(this).attr('stroke-width', 2).attr('opacity', 1);
      showBubbleTooltip(event, d);
    })
    .on('mouseout', function() {
      d3.select(this).attr('stroke-width', 1).attr('opacity', 0.85);
      hideTooltip();
    })
    .on('mousemove', function(event) {
      moveTooltip(event);
    })
    .merge(bubbles)
    .transition()
    .duration(300)
    .attr('r', d => getBubbleRadius(d, currentFilter, mapInstance.sizeScale))
    .attr('fill', d => getBubbleColor(d, currentFilter));

  // Update legend
  createBubbleLegend(maxTotal, mapInstance.sizeScale);
}

/**
 * Get bubble radius based on filter
 */
function getBubbleRadius(data, filter, sizeScale) {
  if (filter === 'female') {
    return sizeScale(data.female);
  } else if (filter === 'male') {
    return sizeScale(data.male);
  } else {
    return sizeScale(data.total);
  }
}

/**
 * Get bubble color based on female percentage
 */
function getBubbleColor(data, filter) {
  if (filter === 'female') {
    return CONFIG.colors.female;
  } else if (filter === 'male') {
    return CONFIG.colors.male;
  } else {
    // Color by female percentage (gradient from blue to pink)
    const knownTotal = data.male + data.female;
    if (knownTotal === 0) return CONFIG.colors.unknown;

    const femaleRatio = data.female / knownTotal;

    // Create gradient: 0% female = blue, 50% = purple, 100% = pink
    if (femaleRatio < 0.5) {
      // Blue to purple
      const t = femaleRatio * 2;
      return d3.interpolate(CONFIG.colors.male, '#8b5a9d')(t);
    } else {
      // Purple to pink
      const t = (femaleRatio - 0.5) * 2;
      return d3.interpolate('#8b5a9d', CONFIG.colors.female)(t);
    }
  }
}

/**
 * Show tooltip for bubble
 */
function showBubbleTooltip(event, data) {
  const tooltip = document.getElementById('mapTooltip');
  if (!tooltip) return;

  const femalePercent = data.total > 0 ? ((data.female / data.total) * 100).toFixed(1) : 0;
  const malePercent = data.total > 0 ? ((data.male / data.total) * 100).toFixed(1) : 0;

  let content = `<strong>${data.nationality}</strong>`;
  content += `
    <br>Total: ${data.total.toLocaleString()}
    <br><span style="color:${CONFIG.colors.male}">Male: ${data.male.toLocaleString()} (${malePercent}%)</span>
    <br><span style="color:${CONFIG.colors.female}">Female: ${data.female.toLocaleString()} (${femalePercent}%)</span>
    ${data.unknown > 0 ? `<br><span style="color:${CONFIG.colors.unknown}">Unknown: ${data.unknown.toLocaleString()}</span>` : ''}
  `;

  tooltip.innerHTML = content;
  tooltip.style.display = 'block';
  moveTooltip(event);
}

/**
 * Move tooltip to follow cursor
 */
function moveTooltip(event) {
  const tooltip = document.getElementById('mapTooltip');
  if (!tooltip) return;

  const x = event.pageX + 10;
  const y = event.pageY - 10;

  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
}

/**
 * Hide tooltip
 */
function hideTooltip() {
  const tooltip = document.getElementById('mapTooltip');
  if (tooltip) {
    tooltip.style.display = 'none';
  }
}

/**
 * Create legend for bubble map
 */
function createBubbleLegend(maxTotal, sizeScale) {
  const legend = document.getElementById('mapLegend');
  if (!legend) return;

  // Size examples
  const sizes = [100, 1000, 10000].filter(s => s <= maxTotal);
  if (sizes.length === 0) sizes.push(maxTotal);

  let sizeLegendHTML = '<div class="legend-sizes">';
  sizes.forEach(size => {
    const radius = sizeScale(size);
    sizeLegendHTML += `
      <div class="legend-size-item">
        <svg width="${radius * 2 + 4}" height="${radius * 2 + 4}">
          <circle cx="${radius + 2}" cy="${radius + 2}" r="${radius}" fill="none" stroke="var(--text-muted)" stroke-width="1"/>
        </svg>
        <span>${size.toLocaleString()}</span>
      </div>
    `;
  });
  sizeLegendHTML += '</div>';

  legend.innerHTML = `
    <div class="legend-section">
      <div class="legend-title">Color = Female %</div>
      <div class="legend-gradient">
        <span class="legend-color-bar"></span>
        <div class="legend-labels">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
    <div class="legend-section">
      <div class="legend-title">Size = Artworks</div>
      ${sizeLegendHTML}
    </div>
  `;
}

/**
 * Setup filter button functionality
 */
function setupFilterButtons() {
  const buttons = document.querySelectorAll('.map-filter-btn');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active state
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update filter and redraw
      currentFilter = btn.getAttribute('data-filter');

      if (mapInstance && currentData) {
        mapInstance.bubblesGroup.selectAll('circle')
          .transition()
          .duration(300)
          .attr('r', d => getBubbleRadius(d, currentFilter, mapInstance.sizeScale))
          .attr('fill', d => getBubbleColor(d, currentFilter));
      }
    });
  });
}
