/**
 * Chart factory and management utilities
 */
import { CONFIG } from '../config.js';

/**
 * Safely get canvas context with null check
 * @param {string} canvasId - Canvas element ID
 * @returns {CanvasRenderingContext2D|null} Canvas context or null if not found
 */
function getCanvasContext(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    console.error(`Canvas element '${canvasId}' not found`);
    return null;
  }
  return canvas.getContext("2d");
}

/**
 * Update an existing line chart with new data
 * @param {Chart} chartInstance - Chart.js instance to update
 * @param {Object} groupedData - Object mapping years to counts
 * @param {string} color - Line color for the chart
 */
export function updateLineChart(chartInstance, groupedData, color) {
  const years = Object.keys(groupedData).sort((a, b) => a - b);
  const data = years.map(y => groupedData[y]);
  chartInstance.data.labels = years;
  chartInstance.data.datasets[0].data = data;
  chartInstance.update('none');
}

/**
 * Create a line chart
 * @param {string} canvasId - Canvas element ID
 * @param {Object} groupedData - Object mapping years to counts
 * @param {string} color - Line color for the chart
 * @returns {Chart} Chart.js instance
 */
export function createLineChart(canvasId, groupedData, color) {
  const ctx = getCanvasContext(canvasId);
  if (!ctx) return null;

  const years = Object.keys(groupedData).sort((a, b) => a - b);
  const data = years.map(y => groupedData[y]);
  return new Chart(ctx, {
    type: "line",
    data: { labels: years, datasets: [{ label: "Acquisitions", data: data, borderColor: color, fill: false, tension: 0.3 }] },
    options: { responsive: true, animation: false }
  });
}

/**
 * Get colors from config
 * @returns {Object} Color configuration
 */
export function getColors() {
  return CONFIG.colors;
}

/**
 * Update stacked area chart
 * @param {Chart} chartInstance - Chart.js instance
 * @param {Array} years - Year labels
 * @param {Array} malePercent - Male percentages
 * @param {Array} femalePercent - Female percentages
 * @param {Array} unknownPercent - Unknown percentages
 */
export function updateStackedAreaChart(chartInstance, years, malePercent, femalePercent, unknownPercent) {
  chartInstance.data.labels = years;
  chartInstance.data.datasets[0].data = malePercent;
  chartInstance.data.datasets[1].data = femalePercent;
  chartInstance.data.datasets[2].data = unknownPercent;
  chartInstance.update('none');
}

/**
 * Create 100% stacked area chart for gender distribution over time
 * @param {string} canvasId - Canvas element ID
 * @param {Array} years - Year labels
 * @param {Array} malePercent - Male percentages
 * @param {Array} femalePercent - Female percentages
 * @param {Array} unknownPercent - Unknown percentages
 * @returns {Chart} Chart.js instance
 */
export function createStackedAreaChart(canvasId, years, malePercent, femalePercent, unknownPercent) {
  const ctx = getCanvasContext(canvasId);
  if (!ctx) return null;

  return new Chart(ctx, {
    type: "line",
    data: {
      labels: years,
      datasets: [
        {
          label: "Male",
          data: malePercent,
          backgroundColor: CONFIG.colors.male + '80', // Add transparency
          borderColor: CONFIG.colors.male,
          borderWidth: 2,
          fill: true
        },
        {
          label: "Female",
          data: femalePercent,
          backgroundColor: CONFIG.colors.female + '80',
          borderColor: CONFIG.colors.female,
          borderWidth: 2,
          fill: true
        },
        {
          label: "Unknown",
          data: unknownPercent,
          backgroundColor: CONFIG.colors.unknown + '80',
          borderColor: CONFIG.colors.unknown,
          borderWidth: 2,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        x: {
          title: { display: true, text: 'Year' }
        },
        y: {
          stacked: true,
          max: 100,
          title: { display: true, text: 'Percentage (%)' },
          ticks: {
            callback: function(value) {
              return value + '%';
            }
          }
        }
      },
      plugins: {
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': ' + context.parsed.y.toFixed(1) + '%';
            }
          }
        },
        legend: {
          display: true,
          position: 'top'
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      },
      animation: false
    }
  });
}
