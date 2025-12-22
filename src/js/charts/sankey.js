/**
 * Sankey diagram visualization using D3.js
 * Shows flow from departments (left) to gender categories (right)
 */
import { CONFIG } from '../config.js';

let sankeyChartInstance = null;

/**
 * Creates a Sankey diagram showing department to gender flows
 * @param {Object} data - Data with nodes and links arrays
 * @param {string} containerId - ID of container element
 * @returns {Object} Chart instance reference
 */
export function createDepartmentSankeyChart(data, containerId) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container ${containerId} not found`);
    return null;
  }

  // Clear any existing SVG
  container.innerHTML = '';

  // Set up dimensions
  const margin = { top: 20, right: 250, bottom: 20, left: 100 };
  const width = container.clientWidth || 1000;
  const height = 600;
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Create tooltip div
  const tooltip = d3.select('body')
    .append('div')
    .attr('class', 'sankey-tooltip')
    .style('position', 'absolute')
    .style('visibility', 'hidden')
    .style('background-color', 'rgba(0, 0, 0, 0.85)')
    .style('color', 'white')
    .style('padding', '10px')
    .style('border-radius', '4px')
    .style('font-size', '14px')
    .style('pointer-events', 'none')
    .style('z-index', '1000')
    .style('box-shadow', '0 2px 4px rgba(0,0,0,0.2)');

  // Create SVG
  const svg = d3.select(`#${containerId}`)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('aria-label', 'Sankey diagram showing flow from departments to artist genders');

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Create Sankey layout
  const sankey = d3.sankey()
    .nodeId(d => d.id)
    .nodeWidth(15)
    .nodePadding(10)
    .extent([[0, 0], [innerWidth, innerHeight]]);

  // Prepare graph data
  const graph = sankey({
    nodes: data.nodes.map(d => ({ ...d })),
    links: data.links.map(d => ({ ...d }))
  });

  // Color scale for genders
  const genderColors = {
    'gender_male': CONFIG.colors.male,
    'gender_female': CONFIG.colors.female,
    'gender_unknown': CONFIG.colors.unknown
  };

  // Function to get link color based on source gender
  const getLinkColor = (link) => {
    const sourceId = link.source.id;
    const baseColor = genderColors[sourceId] || '#999999';
    return baseColor + '40'; // Add transparency
  };

  // Draw links
  g.append('g')
    .attr('class', 'links')
    .selectAll('path')
    .data(graph.links)
    .join('path')
    .attr('d', d3.sankeyLinkHorizontal())
    .attr('stroke', d => getLinkColor(d))
    .attr('stroke-width', d => Math.max(1, d.width))
    .attr('fill', 'none')
    .attr('opacity', 0.5)
    .style('cursor', 'pointer')
    .on('mouseover', function(event, d) {
      d3.select(this)
        .attr('opacity', 0.8)
        .attr('stroke-width', d => Math.max(2, d.width + 2));

      // Show tooltip
      const percentage = ((d.value / d.target.value) * 100).toFixed(1);
      tooltip
        .html(`
          <strong>${d.source.name}</strong> → <strong>${d.target.name}</strong><br/>
          <strong>${d.value.toLocaleString()}</strong> artworks (${percentage}% of department)
        `)
        .style('visibility', 'visible');
    })
    .on('mousemove', function(event) {
      tooltip
        .style('top', (event.pageY - 10) + 'px')
        .style('left', (event.pageX + 10) + 'px');
    })
    .on('mouseout', function(event, d) {
      d3.select(this)
        .attr('opacity', 0.5)
        .attr('stroke-width', d => Math.max(1, d.width));

      tooltip.style('visibility', 'hidden');
    });

  // Draw nodes
  const nodes = g.append('g')
    .attr('class', 'nodes')
    .selectAll('rect')
    .data(graph.nodes)
    .join('rect')
    .attr('x', d => d.x0)
    .attr('y', d => d.y0)
    .attr('height', d => d.y1 - d.y0)
    .attr('width', d => d.x1 - d.x0)
    .attr('fill', d => {
      // Color gender nodes with gender colors, departments with neutral gray
      if (d.id.startsWith('gender_')) {
        return genderColors[d.id] || '#666666';
      }
      return '#666666';
    })
    .attr('stroke', '#333')
    .attr('stroke-width', 1)
    .style('cursor', 'pointer')
    .on('mouseover', function(event, d) {
      d3.select(this)
        .attr('stroke-width', 3)
        .attr('stroke', '#000');

      // Show tooltip with node information
      const total = d.value;
      tooltip
        .html(`
          <strong>${d.name}</strong><br/>
          <strong>${total.toLocaleString()}</strong> artworks total
        `)
        .style('visibility', 'visible');
    })
    .on('mousemove', function(event) {
      tooltip
        .style('top', (event.pageY - 10) + 'px')
        .style('left', (event.pageX + 10) + 'px');
    })
    .on('mouseout', function(event, d) {
      d3.select(this)
        .attr('stroke-width', 1)
        .attr('stroke', '#333');

      tooltip.style('visibility', 'hidden');
    });

  // Add node labels with counts
  const labels = g.append('g')
    .attr('class', 'labels')
    .selectAll('g')
    .data(graph.nodes)
    .join('g');

  // Add department/gender name
  labels.append('text')
    .attr('x', d => {
      // Position labels: left for genders (on left side), right for departments (on right side)
      return d.id.startsWith('gender_') ? d.x0 - 8 : d.x1 + 8;
    })
    .attr('y', d => (d.y1 + d.y0) / 2 - 6)
    .attr('text-anchor', d => d.id.startsWith('gender_') ? 'end' : 'start')
    .attr('font-size', '13px')
    .attr('font-weight', 'bold')
    .attr('fill', '#333')
    .text(d => {
      // Don't truncate - we have more margin now
      return d.name;
    })
    .style('pointer-events', 'none');

  // Add count below the name
  labels.append('text')
    .attr('x', d => {
      return d.id.startsWith('gender_') ? d.x0 - 8 : d.x1 + 8;
    })
    .attr('y', d => (d.y1 + d.y0) / 2 + 8)
    .attr('text-anchor', d => d.id.startsWith('gender_') ? 'end' : 'start')
    .attr('font-size', '11px')
    .attr('font-weight', 'normal')
    .attr('fill', '#666')
    .text(d => `${d.value.toLocaleString()} artworks`)
    .style('pointer-events', 'none');

  sankeyChartInstance = { svg, container, data: graph };
  return sankeyChartInstance;
}

/**
 * Updates the Sankey diagram with new data
 * @param {Object} data - New data with nodes and links
 * @param {string} containerId - ID of container element
 */
export function updateDepartmentSankeyChart(data, containerId) {
  // Remove old tooltips before recreating
  d3.selectAll('.sankey-tooltip').remove();

  // For now, just recreate the chart
  // D3 Sankey updates can be complex, so recreation is simpler
  return createDepartmentSankeyChart(data, containerId);
}

/**
 * Destroys the Sankey chart instance
 */
export function destroySankeyChart() {
  if (sankeyChartInstance) {
    sankeyChartInstance.container.innerHTML = '';
    sankeyChartInstance = null;
  }
  // Remove any lingering tooltips
  d3.selectAll('.sankey-tooltip').remove();
}
