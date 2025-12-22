/**
 * Artist-level visualizations
 * Scatterplot and top artist lists
 */

import { CONFIG } from '../config.js';
import { getCanvasContext } from './lineCharts.js';

/**
 * Create bubble scatterplot of artists by birth year and artwork count
 * @param {Array<Object>} scatterData - Array of artist objects with name, birthYear, artworkCount, gender
 * @param {string} canvasId - Canvas element ID
 * @returns {Chart} Chart.js instance
 */
export function createArtistScatterplot(scatterData, canvasId) {
  const ctx = getCanvasContext(canvasId);
  if (!ctx) return null;

  // Separate by gender for different datasets
  const maleData = scatterData
    .filter(a => a.gender === 'Male')
    .map(a => ({
      x: a.birthYear,
      y: a.artworkCount,
      r: Math.sqrt(a.artworkCount) * 1.5, // Scale bubble size
      label: a.name,
      nationality: a.nationality
    }));

  const femaleData = scatterData
    .filter(a => a.gender === 'Female')
    .map(a => ({
      x: a.birthYear,
      y: a.artworkCount,
      r: Math.sqrt(a.artworkCount) * 1.5,
      label: a.name,
      nationality: a.nationality
    }));

  const unknownData = scatterData
    .filter(a => a.gender === 'Unknown')
    .map(a => ({
      x: a.birthYear,
      y: a.artworkCount,
      r: Math.sqrt(a.artworkCount) * 1.5,
      label: a.name,
      nationality: a.nationality
    }));

  return new Chart(ctx, {
    type: 'bubble',
    data: {
      datasets: [
        {
          label: 'Male Artists',
          data: maleData,
          backgroundColor: CONFIG.colors.male + '20', // Add transparency
          borderColor: CONFIG.colors.male,
          borderWidth: 1
        },
        {
          label: 'Female Artists',
          data: femaleData,
          backgroundColor: CONFIG.colors.female + '80',
          borderColor: CONFIG.colors.female,
          borderWidth: 1
        },
        {
          label: 'Unknown Gender',
          data: unknownData,
          backgroundColor: CONFIG.colors.unknown + '40',
          borderColor: CONFIG.colors.unknown,
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          title: {
            display: true,
            text: 'Artist Birth Year',
            color: CONFIG.colors.text || '#fff'
          },
          ticks: {
            color: CONFIG.colors.text || '#fff',
            callback: function(value) {
              return value; // Return year without comma formatting
            }
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        },
        y: {
          type: 'logarithmic', // Log scale to handle outliers
          title: {
            display: true,
            text: 'Number of Artworks (log scale)',
            color: CONFIG.colors.text || '#fff'
          },
          ticks: {
            color: CONFIG.colors.text || '#fff',
            callback: function(value) {
              // Show only major ticks
              if (value === 1 || value === 10 || value === 100 || value === 1000) {
                return value;
              }
              return '';
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
            usePointStyle: true,
            padding: 15
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const point = context.raw;
              return [
                `${point.label}`,
                `Birth Year: ${point.x}`,
                `Artworks: ${point.y}`,
                `Nationality: ${point.nationality || 'Unknown'}`
              ];
            }
          }
        }
      },
      animation: false
    }
  });
}

/**
 * Update artist scatterplot
 */
export function updateArtistScatterplot(chartInstance, scatterData) {
  const maleData = scatterData
    .filter(a => a.gender === 'Male')
    .map(a => ({
      x: a.birthYear,
      y: a.artworkCount,
      r: Math.sqrt(a.artworkCount) * 1.5,
      label: a.name,
      nationality: a.nationality
    }));

  const femaleData = scatterData
    .filter(a => a.gender === 'Female')
    .map(a => ({
      x: a.birthYear,
      y: a.artworkCount,
      r: Math.sqrt(a.artworkCount) * 1.5,
      label: a.name,
      nationality: a.nationality
    }));

  const unknownData = scatterData
    .filter(a => a.gender === 'Unknown')
    .map(a => ({
      x: a.birthYear,
      y: a.artworkCount,
      r: Math.sqrt(a.artworkCount) * 1.5,
      label: a.name,
      nationality: a.nationality
    }));

  chartInstance.data.datasets[0].data = maleData;
  chartInstance.data.datasets[1].data = femaleData;
  chartInstance.data.datasets[2].data = unknownData;

  chartInstance.update('none');
}

/**
 * Render top 10 artists lists side-by-side
 * @param {Array<Object>} topMale - Top 10 male artists
 * @param {Array<Object>} topFemale - Top 10 female artists
 * @param {string} containerId - Container element ID
 */
export function renderTopArtistsLists(topMale, topFemale, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Find max count for scaling bars
  const maxCount = Math.max(
    topMale[0]?.artworkCount || 0,
    topFemale[0]?.artworkCount || 0
  );

  const renderList = (artists, title, gender) => {
    const color = gender === 'Male' ? CONFIG.colors.male : CONFIG.colors.female;

    let html = `<div class="top-artists-list">`;
    html += `<h3>${title}</h3>`;
    html += `<ol class="artist-ranking">`;

    artists.forEach((artist, index) => {
      const barWidth = (artist.artworkCount / maxCount * 100).toFixed(1);
      const birthYearDisplay = artist.birthYear ? ` (b. ${artist.birthYear})` : '';

      html += `<li class="artist-item">`;
      html += `  <div class="artist-info">`;
      html += `    <span class="artist-rank">${index + 1}</span>`;
      html += `    <span class="artist-name">${artist.name}${birthYearDisplay}</span>`;
      html += `    <span class="artist-count">${artist.artworkCount} works</span>`;
      html += `  </div>`;
      html += `  <div class="artist-bar-container">`;
      html += `    <div class="artist-bar" style="width: ${barWidth}%; background-color: ${color};"></div>`;
      html += `  </div>`;
      html += `</li>`;
    });

    html += `</ol></div>`;
    return html;
  };

  container.innerHTML = `
    <div class="top-artists-grid">
      ${renderList(topMale, 'Top 10 Male Artists', 'Male')}
      ${renderList(topFemale, 'Top 10 Female Artists', 'Female')}
    </div>
  `;
}
