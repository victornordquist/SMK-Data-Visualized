/**
 * Pie chart creation and update functions
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
 * Update gender pie chart
 * @param {Chart} chartInstance - Chart instance
 * @param {Array} items - Artwork items
 */
export function updateGenderPie(chartInstance, items) {
  const counts = { Male: 0, Female: 0, Unknown: 0 };
  items.forEach(a => {
    counts[a.gender] = (counts[a.gender] || 0) + 1;
  });
  chartInstance.data.labels = ["Male", "Female", "Unknown"];
  chartInstance.data.datasets[0].data = [counts.Male, counts.Female, counts.Unknown];
  chartInstance.update('none');
}

/**
 * Create gender pie chart
 * @param {Array} items - Artwork items
 * @param {string} canvasId - Canvas element ID
 * @returns {Chart} Chart instance
 */
export function createGenderPie(items, canvasId) {
  const ctx = getCanvasContext(canvasId);
  if (!ctx) return null;

  const counts = { Male: 0, Female: 0, Unknown: 0 };
  items.forEach(a => {
    counts[a.gender] = (counts[a.gender] || 0) + 1;
  });
  return new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Male", "Female", "Unknown"],
      datasets: [{
        data: [counts.Male, counts.Female, counts.Unknown],
        backgroundColor: [CONFIG.colors.male, CONFIG.colors.female, CONFIG.colors.unknown]
      }]
    },
    options: { animation: false }
  });
}
