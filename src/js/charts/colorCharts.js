/**
 * Color visualization charts
 * Handles color distribution and timeline visualizations
 */

import { CONFIG } from '../config.js';
import { getCanvasContext } from './chartFactory.js';

// Color palette for color families
const COLOR_PALETTE = {
  'Red': '#dc2626',
  'Orange': '#ea580c',
  'Yellow': '#ca8a04',
  'Green': '#16a34a',
  'Blue': '#2563eb',
  'Purple': '#9333ea',
  'Brown': '#92400e',
  'Black': '#171717',
  'Gray': '#737373',
  'White': '#e5e5e5'
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
          label: 'Male Artists',
          data: maleData,
          counts: maleCounts, // Store counts in dataset for tooltip access
          backgroundColor: CONFIG.colors.male,
          borderColor: CONFIG.colors.male,
          borderWidth: 1
        },
        {
          label: 'Female Artists',
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
