/**
 * Color visualization charts
 * Handles color distribution and timeline visualizations
 */

import { CONFIG } from '../config.js';
import { getCanvasContext } from './lineCharts.js';

// Color palette for traditional color wheel (12 chromatic + 3 achromatic)
const COLOR_PALETTE = {
  // Primary colors
  'Red': '#dc2626',
  'Yellow': '#eab308',
  'Blue': '#3b82f6',
  // Secondary colors
  'Orange': '#ea580c',
  'Green': '#22c55e',
  'Purple': '#8b5cf6',
  // Tertiary colors
  'Red-Orange': '#f97316',
  'Yellow-Orange': '#fb923c',
  'Yellow-Green': '#84cc16',
  'Blue-Green': '#14b8a6',
  'Blue-Violet': '#6366f1',
  'Red-Violet': '#a855f7',
  // Achromatic colors
  'Black': '#171717',
  'Gray': '#737373',
  'White': '#f5f5f5'
};

/**
 * Create horizontal bar chart showing color family distribution by gender
 * Shows percentage of each color family for male vs female artists
 */
export function createColorDistributionChart(labels, maleData, femaleData, unknownData, maleCounts, femaleCounts, canvasId) {
  const ctx = getCanvasContext(canvasId);
  if (!ctx) return null;

  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Male artists',
          data: maleData,
          counts: maleCounts, // Store counts in dataset for tooltip access
          backgroundColor: CONFIG.colors.male,
          borderColor: CONFIG.colors.male,
          borderWidth: 1
        },
        {
          label: 'Female artists',
          data: femaleData,
          counts: femaleCounts, // Store counts in dataset for tooltip access
          backgroundColor: CONFIG.colors.female,
          borderColor: CONFIG.colors.female,
          borderWidth: 1
        }
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        x: {
          beginAtZero: true,
          max: Math.max(...maleData, ...femaleData) * 1.1,
          title: {
            display: true,
            text: 'Percentage of Artworks (%)',
            color: CONFIG.colors.text || '#fff'
          },
          ticks: {
            color: CONFIG.colors.text || '#fff',
            callback: function(value) {
              return value.toFixed(1) + '%';
            }
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        },
        y: {
          ticks: {
            color: CONFIG.colors.text || '#fff',
            font: {
              size: 12
            }
          },
          grid: {
            display: false
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: CONFIG.colors.text || '#fff',
            boxWidth: 15,
            padding: 15
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.dataset.label || '';
              const value = context.parsed.x;
              const count = context.dataset.counts[context.dataIndex];
              return `${label}: ${value.toFixed(1)}% (n=${count})`;
            }
          }
        }
      },
      animation: false
    }
  });
}

/**
 * Update color distribution chart
 */
export function updateColorDistributionChart(chartInstance, labels, maleData, femaleData, unknownData, maleCounts, femaleCounts) {
  chartInstance.data.labels = labels;
  chartInstance.data.datasets[0].data = maleData;
  chartInstance.data.datasets[0].counts = maleCounts; // Update counts for tooltips
  chartInstance.data.datasets[1].data = femaleData;
  chartInstance.data.datasets[1].counts = femaleCounts; // Update counts for tooltips

  // Update max scale
  chartInstance.options.scales.x.max = Math.max(...maleData, ...femaleData) * 1.1;

  chartInstance.update('none');
}

/**
 * Create stacked area chart showing color family usage over time by gender
 * Shows how color palette preferences changed historically
 */
export function createColorTimelineChart(labels, colorFamilies, genderData, canvasId, genderLabel = 'Male') {
  const ctx = getCanvasContext(canvasId);
  if (!ctx) return null;

  // Create datasets for each color family
  const datasets = colorFamilies.map(family => ({
    label: family,
    data: genderData[family] || [],
    backgroundColor: COLOR_PALETTE[family] || '#999999',
    borderColor: COLOR_PALETTE[family] || '#999999',
    borderWidth: 1,
    fill: true,
    tension: 0.3
  }));

  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      interaction: {
        mode: 'index',
        intersect: false
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Production Year (Decade)',
            color: CONFIG.colors.text || '#fff'
          },
          ticks: {
            color: CONFIG.colors.text || '#fff',
            maxRotation: 45,
            minRotation: 45,
            autoSkip: true,
            maxTicksLimit: 20
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        },
        y: {
          stacked: true,
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: 'Percentage of Artworks (%)',
            color: CONFIG.colors.text || '#fff'
          },
          ticks: {
            color: CONFIG.colors.text || '#fff',
            callback: function(value) {
              return value + '%';
            }
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: CONFIG.colors.text || '#fff',
            boxWidth: 15,
            padding: 10,
            font: {
              size: 11
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              return `${label}: ${value.toFixed(1)}%`;
            },
            footer: function(tooltipItems) {
              const total = tooltipItems.reduce((sum, item) => sum + item.parsed.y, 0);
              return `Total: ${total.toFixed(1)}%`;
            }
          }
        }
      },
      animation: false
    }
  });
}

/**
 * Update color timeline chart
 */
export function updateColorTimelineChart(chartInstance, labels, colorFamilies, genderData) {
  chartInstance.data.labels = labels;

  // Update each color family dataset
  colorFamilies.forEach((family, index) => {
    if (chartInstance.data.datasets[index]) {
      chartInstance.data.datasets[index].data = genderData[family] || [];
    }
  });

  chartInstance.update('none');
}

/**
 * Create color treemap visualization using D3.js
 * Shows actual hex colors sized by frequency
 * @param {Array} colorData - Array of {hex, count} objects
 * @param {string} containerId - Container element ID
 * @param {string} title - Chart title (e.g., "Male Artists" or "Female Artists")
 */
export function createColorTreemap(colorData, containerId, title) {
  const container = document.getElementById(containerId);
  if (!container || colorData.length === 0) return;

  // Clear existing content
  container.innerHTML = '';

  // Set dimensions
  const width = container.clientWidth || 600;
  const height = 500;

  // Create SVG
  const svg = d3.select(`#${containerId}`)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .style('font-family', 'Inter');

  // Add title
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', 20)
    .attr('text-anchor', 'middle')
    .attr('fill', '#fff')
    .attr('font-size', '16px')
    .text(title);

  // Prepare data for treemap - limit to top colors for performance
  const topColors = colorData.slice(0, 100); // Show top 100 colors
  const total = topColors.reduce((sum, d) => sum + d.count, 0);

  // Create hierarchical data structure
  const root = d3.hierarchy({
    children: topColors.map(d => ({
      hex: d.hex,
      count: d.count,
      percentage: ((d.count / total) * 100).toFixed(2)
    }))
  })
  .sum(d => d.count)
  .sort((a, b) => b.value - a.value);

  // Create treemap layout
  const treemap = d3.treemap()
    .size([width, height - 40]) // Leave space for title
    .padding(1)
    .round(true);

  treemap(root);

  // Create cells
  const cells = svg.selectAll('g')
    .data(root.leaves())
    .join('g')
    .attr('transform', d => `translate(${d.x0},${d.y0 + 30})`); // Offset for title

  // Add rectangles
  cells.append('rect')
    .attr('width', d => d.x1 - d.x0)
    .attr('height', d => d.y1 - d.y0)
    .attr('fill', d => d.data.hex)
    .attr('stroke', '#333')
    .attr('stroke-width', 0.5)
    .style('cursor', 'pointer')
    .on('mouseover', function(event, d) {
      d3.select(this)
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);

      // Show tooltip
      d3.select('body').append('div')
        .attr('class', 'color-treemap-tooltip')
        .style('position', 'absolute')
        .style('background', 'rgba(0, 0, 0, 0.9)')
        .style('color', '#fff')
        .style('padding', '8px 12px')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('z-index', '10000')
        .html(`
          <div><strong>Color:</strong> ${d.data.hex}</div>
          <div><strong>Count:</strong> ${d.data.count.toLocaleString()}</div>
          <div><strong>Percentage:</strong> ${d.data.percentage}%</div>
        `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
    })
    .on('mouseout', function() {
      d3.select(this)
        .attr('stroke', '#333')
        .attr('stroke-width', 0.5);

      d3.selectAll('.color-treemap-tooltip').remove();
    });

  // Add text labels for larger cells
  cells.append('text')
    .attr('x', d => (d.x1 - d.x0) / 2)
    .attr('y', d => (d.y1 - d.y0) / 2)
    .attr('text-anchor', 'middle')
    .attr('dominant-baseline', 'middle')
    .attr('fill', d => getContrastColor(d.data.hex))
    .attr('font-family', 'monospace')
    .attr('font-weight', 'bold')
    .attr('font-size', d => {
      const width = d.x1 - d.x0;
      const height = d.y1 - d.y0;
      const minDim = Math.min(width, height);
      return minDim > 40 ? '10px' : minDim > 25 ? '8px' : '0px';
    })
    .attr('stroke', d => {
      // Add stroke that's opposite of fill color for better contrast
      const fillColor = getContrastColor(d.data.hex);
      return fillColor === '#000' ? '#fff' : '#000';
    })
    .attr('stroke-width', '0.25px')
    .attr('paint-order', 'stroke')
    .text(d => {
      const width = d.x1 - d.x0;
      const height = d.y1 - d.y0;
      // Show hex code for cells large enough to fit it
      return (width > 60 && height > 25) ? d.data.hex : '';
    })
    .style('pointer-events', 'none');
}

/**
 * Update color treemap
 */
export function updateColorTreemap(colorData, containerId, title) {
  createColorTreemap(colorData, containerId, title);
}

/**
 * Create 100% stacked bar chart showing color family distribution over time
 * @param {Array} labels - Decade labels (e.g., ["1500s", "1600s", ...])
 * @param {Array} colorFamilies - Array of color family names
 * @param {Object} colorData - Object with color family names as keys, percentage arrays as values
 * @param {string} canvasId - Canvas element ID
 */
export function createColorFamilyTimelineChart(labels, colorFamilies, colorData, canvasId) {
  const ctx = getCanvasContext(canvasId);
  if (!ctx) return null;

  // Create datasets for each color family
  // Add subtle borders between segments for better visual separation
  const datasets = colorFamilies.map(family => ({
    label: family,
    data: colorData[family] || [],
    backgroundColor: COLOR_PALETTE[family] || '#999999',
    borderColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 1
  }));

  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        x: {
          stacked: true,
          title: {
            display: true,
            text: 'Production Year (Decade)',
            color: CONFIG.colors.text || '#fff'
          },
          ticks: {
            color: CONFIG.colors.text || '#fff',
            maxRotation: 45,
            minRotation: 45,
            autoSkip: true,
            maxTicksLimit: 20
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        },
        y: {
          stacked: true,
          beginAtZero: true,
          max: 100,
          title: {
            display: true,
            text: 'Percentage of Artworks (%)',
            color: CONFIG.colors.text || '#fff'
          },
          ticks: {
            color: CONFIG.colors.text || '#fff',
            callback: function(value) {
              return value + '%';
            }
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: CONFIG.colors.text || '#fff',
            boxWidth: 20,
            padding: 12,
            font: {
              size: 12
            },
            // Sort legend in color wheel order (already ordered in datasets)
            sort: (a, b) => {
              const order = colorFamilies;
              return order.indexOf(a.text) - order.indexOf(b.text);
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              return `${label}: ${value.toFixed(1)}%`;
            },
            footer: function(tooltipItems) {
              // Show total percentage (should always be ~100%)
              const total = tooltipItems.reduce((sum, item) => sum + item.parsed.y, 0);
              return `Total chromatic: ${total.toFixed(1)}%`;
            }
          }
        },
        title: {
          display: false
        }
      },
      animation: false
    }
  });
}

/**
 * Update color family timeline chart
 */
export function updateColorFamilyTimelineChart(chartInstance, labels, colorFamilies, colorData) {
  chartInstance.data.labels = labels;

  // Update each color family dataset
  colorFamilies.forEach((family, index) => {
    if (chartInstance.data.datasets[index]) {
      chartInstance.data.datasets[index].data = colorData[family] || [];
    }
  });

  chartInstance.update('none');
}

/**
 * Helper function to determine contrast color for text
 * @param {string} hexColor - Hex color code
 * @returns {string} '#000' or '#fff' for contrast
 */
function getContrastColor(hexColor) {
  // Convert hex to RGB
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? '#000' : '#fff';
}
