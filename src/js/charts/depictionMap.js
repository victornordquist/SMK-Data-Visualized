/**
 * Depiction location map visualization using D3.js
 * Shows geographic locations depicted in artworks, grouped by artist gender
 */
import { CONFIG } from '../config.js';

let depictionMapInstance = null;
let currentDepictionGender = 'all'; // 'all', 'male', 'female'

/**
 * Creates a world map showing depicted locations by artist gender
 * @param {Object} data - Location data from getDepictedLocationData()
 * @param {string} containerId - ID of container element
 * @returns {Object} Map instance reference
 */
export function createDepictionMap(data, containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container ${containerId} not found`);
    return null;
  }

  // Clear previous map and show loading state
  container.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-muted);">Loading map...</div>';

  // Get dimensions
  const width = container.clientWidth || 800;
  const height = Math.min(width * 0.5, 500);

  // Load world topology
  d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
    .then(world => {
      const countries = topojson.feature(world, world.objects.countries);

      // Clear loading message before adding SVG
      container.innerHTML = '';

      // Create SVG with responsive sizing
      const svg = d3.select(`#${containerId}`)
        .append('svg')
        .attr('width', '100%')
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .attr('aria-label', 'World map showing depicted locations by artist gender');

      const g = svg.append('g');

      // Create projection centered on Europe/North Atlantic to show Denmark and Greenland
      const projection = d3.geoNaturalEarth1()
        .scale(width / 2)  // Slightly more zoomed out than worldMap
        .center([-10, 60])  // Center between Greenland and Denmark
        .translate([width / 2, height / 2]);

      const path = d3.geoPath().projection(projection);

      // Draw base map (countries as background)
      g.selectAll('path.country-bg')
        .data(countries.features)
        .enter()
        .append('path')
        .attr('class', 'country-bg')
        .attr('d', path)
        .attr('fill', '#2a2a2a')
        .attr('stroke', '#333')
        .attr('stroke-width', 0.5);

      // Create bubbles group
      const bubblesGroup = g.append('g').attr('class', 'bubbles');

      // Draw location bubbles
      updateDepictionBubbles(bubblesGroup, data, projection);

      depictionMapInstance = { svg, g, bubblesGroup, projection, data, container };

      // Setup filter buttons
      setupDepictionFilterButtons();
    })
    .catch(error => {
      console.error('Error loading map data:', error);
      container.innerHTML = `<p style="text-align: center; padding: 2rem; color: var(--text-muted);">Failed to load map: ${error.message}</p>`;
    });

  return depictionMapInstance;
}

/**
 * Update the bubbles on the map based on current gender filter
 */
function updateDepictionBubbles(bubblesGroup, data, projection) {
  // Determine which locations to show based on current gender filter
  let locations = [];

  if (currentDepictionGender === 'male') {
    locations = data.maleLocations.map(loc => ({ ...loc, filterGender: 'male' }));
  } else if (currentDepictionGender === 'female') {
    locations = data.femaleLocations.map(loc => ({ ...loc, filterGender: 'female' }));
  } else {
    // 'all' - show all locations with color based on dominant gender
    locations = data.allLocations.map(loc => {
      const total = loc.Male + loc.Female + loc.Unknown;
      const knownTotal = loc.Male + loc.Female;
      let dominant = 'unknown';
      if (knownTotal > 0) {
        dominant = loc.Female >= loc.Male ? 'female' : 'male';
      }
      return {
        ...loc,
        count: total,
        dominant,
        filterGender: 'all'
      };
    });
  }

  // Remove existing bubbles
  bubblesGroup.selectAll('.location-bubble').remove();

  // Calculate max for size scale
  const maxCount = Math.max(...locations.map(loc => loc.count), 1);
  const radiusScale = d3.scaleSqrt()
    .domain([0, maxCount])
    .range([3, Math.min(projection([0, 0])[0] * 0.05, 30)]);

  // Sort by size (largest first for proper layering)
  locations.sort((a, b) => b.count - a.count);

  // Add new bubbles
  bubblesGroup.selectAll('.location-bubble')
    .data(locations)
    .enter()
    .append('circle')
    .attr('class', 'location-bubble')
    .attr('cx', d => projection([d.longitude, d.latitude])[0])
    .attr('cy', d => projection([d.longitude, d.latitude])[1])
    .attr('r', d => radiusScale(d.count))
    .attr('fill', d => getBubbleColor(d))
    .attr('stroke', '#fff')
    .attr('stroke-width', 1)
    .attr('opacity', 0.40)
    .style('cursor', 'pointer')
    .on('mouseover', function(event, d) {
      d3.select(this)
        .attr('stroke-width', 2)
        .attr('opacity', .60);
      showDepictionTooltip(event, d);
    })
    .on('mouseout', function() {
      d3.select(this)
        .attr('stroke-width', 1)
        .attr('opacity', 0.40);
      hideDepictionTooltip();
    })
    .on('mousemove', function(event) {
      moveDepictionTooltip(event);
    });
}

/**
 * Get bubble color based on filter and data
 */
function getBubbleColor(d) {
  if (currentDepictionGender === 'female') {
    return CONFIG.colors.female;
  } else if (currentDepictionGender === 'male') {
    return CONFIG.colors.male;
  } else {
    // Color by dominant gender
    if (d.dominant === 'female') return CONFIG.colors.female;
    if (d.dominant === 'male') return CONFIG.colors.male;
    return CONFIG.colors.unknown;
  }
}

/**
 * Show tooltip for depiction bubble
 */
function showDepictionTooltip(event, d) {
  const tooltip = document.getElementById('depictionMapTooltip');
  if (!tooltip) return;

  let content = `<strong>${d.name}</strong>`;

  if (currentDepictionGender === 'all') {
    const femalePercent = d.count > 0 ? ((d.Female / d.count) * 100).toFixed(1) : 0;
    const malePercent = d.count > 0 ? ((d.Male / d.count) * 100).toFixed(1) : 0;

    content += `
      <br>Total: ${d.count.toLocaleString()} artworks
      <br><span style="color:${CONFIG.colors.male}">Male: ${d.Male.toLocaleString()} (${malePercent}%)</span>
      <br><span style="color:${CONFIG.colors.female}">Female: ${d.Female.toLocaleString()} (${femalePercent}%)</span>
      ${d.Unknown > 0 ? `<br><span style="color:${CONFIG.colors.unknown}">Unknown: ${d.Unknown.toLocaleString()}</span>` : ''}
    `;
  } else {
    content += `<br><strong>${d.count.toLocaleString()} artworks</strong>`;
  }

  content += `<br>Distance from Copenhagen: ${d.distance.toFixed(0)} km`;

  tooltip.innerHTML = content;
  tooltip.style.display = 'block';
  moveDepictionTooltip(event);
}

/**
 * Move tooltip to follow cursor
 */
function moveDepictionTooltip(event) {
  const tooltip = document.getElementById('depictionMapTooltip');
  if (!tooltip) return;

  const x = event.pageX + 10;
  const y = event.pageY - 10;

  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
}

/**
 * Hide tooltip
 */
function hideDepictionTooltip() {
  const tooltip = document.getElementById('depictionMapTooltip');
  if (tooltip) {
    tooltip.style.display = 'none';
  }
}

/**
 * Setup filter button functionality
 */
function setupDepictionFilterButtons() {
  const buttons = document.querySelectorAll('#depictionGeographyContainer .map-filter-btn');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active state
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update filter
      const filter = btn.getAttribute('data-filter');
      currentDepictionGender = filter;

      // Redraw bubbles
      if (depictionMapInstance) {
        updateDepictionBubbles(
          depictionMapInstance.bubblesGroup,
          depictionMapInstance.data,
          depictionMapInstance.projection
        );
      }
    });
  });
}

/**
 * Update the depiction map with new gender filter
 * @param {string} gender - 'all', 'male', or 'female'
 */
export function updateDepictionMapGender(gender) {
  if (!depictionMapInstance) return;

  currentDepictionGender = gender;
  updateDepictionBubbles(
    depictionMapInstance.bubblesGroup,
    depictionMapInstance.data,
    depictionMapInstance.projection
  );
}

/**
 * Update the depiction map with new data
 * @param {Object} data - New location data
 * @param {string} containerId - ID of container element
 */
export function updateDepictionMap(data, containerId) {
  if (depictionMapInstance) {
    depictionMapInstance.data = data;
    updateDepictionBubbles(
      depictionMapInstance.bubblesGroup,
      data,
      depictionMapInstance.projection
    );
  } else {
    return createDepictionMap(data, containerId);
  }
}

/**
 * Destroys the depiction map instance
 */
export function destroyDepictionMap() {
  if (depictionMapInstance) {
    depictionMapInstance.container.innerHTML = '';
    depictionMapInstance = null;
  }
  // Hide tooltip
  hideDepictionTooltip();
  currentDepictionGender = 'all';
}
