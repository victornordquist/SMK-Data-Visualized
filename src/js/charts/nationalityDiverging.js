/**
 * Diverging bar chart for nationality comparison
 */
import { CONFIG } from '../config.js';
import { getCanvasContext } from './chartFactory.js';

/**
 * Create diverging bar chart for nationality comparison
 * Male bars extend left (negative values), female bars extend right (positive values)
 * @param {Array<string>} labels - Nationality labels
 * @param {Array<number>} maleData - Male artist counts
 * @param {Array<number>} femaleData - Female artist counts
 * @param {Array<number>} unknownData - Unknown gender artist counts
 * @param {string} canvasId - Canvas element ID
 * @returns {Chart} Chart.js instance
 */
export function createNationalityDivergingChart(labels, maleData, femaleData, unknownData, canvasId) {
  const ctx = getCanvasContext(canvasId);
  if (!ctx) return null;

  // Convert male data to negative values for left-side bars
  const maleNegative = maleData.map(val => -val);

  // Calculate totals for percentage calculations (including unknown)
  const totalMale = maleData.reduce((sum, val) => sum + val, 0);
  const totalFemale = femaleData.reduce((sum, val) => sum + val, 0);
  const totalUnknown = unknownData.reduce((sum, val) => sum + val, 0);
  const totalAll = totalMale + totalFemale + totalUnknown;

  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Male Artists',
          data: maleNegative,
          rawData: maleData, // Store original positive values
          totalGender: totalMale,
          totalAll: totalAll,
          backgroundColor: CONFIG.colors.male,
          borderColor: CONFIG.colors.male,
          borderWidth: 1
        },
        {
          label: 'Female Artists',
          data: femaleData,
          rawData: femaleData,
          totalGender: totalFemale,
          totalAll: totalAll,
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
          ticks: {
            callback: function(value) {
              return Math.abs(value).toLocaleString(); // Show absolute values
            },
            color: CONFIG.colors.text || '#fff'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        },
        y: {
          ticks: {
            color: CONFIG.colors.text || '#fff'
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
            usePointStyle: true,
            padding: 15
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.dataset.label || '';
              const value = Math.abs(context.parsed.x);
              const totalGender = context.dataset.totalGender;
              const totalAll = context.dataset.totalAll;

              // Calculate percentages
              const percentOfGender = totalGender > 0 ? (value / totalGender * 100).toFixed(1) : 0;
              const percentOfAll = totalAll > 0 ? (value / totalAll * 100).toFixed(1) : 0;

              return [
                `${label}: ${value.toLocaleString()} artists`,
                `${percentOfGender}% of ${label.toLowerCase()}`,
                `${percentOfAll}% of all artists`
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
 * Update diverging bar chart for nationality
 */
export function updateNationalityDivergingChart(chartInstance, labels, maleData, femaleData, unknownData) {
  const maleNegative = maleData.map(val => -val);

  // Recalculate totals for percentage calculations (including unknown)
  const totalMale = maleData.reduce((sum, val) => sum + val, 0);
  const totalFemale = femaleData.reduce((sum, val) => sum + val, 0);
  const totalUnknown = unknownData.reduce((sum, val) => sum + val, 0);
  const totalAll = totalMale + totalFemale + totalUnknown;

  chartInstance.data.labels = labels;
  chartInstance.data.datasets[0].data = maleNegative;
  chartInstance.data.datasets[0].rawData = maleData;
  chartInstance.data.datasets[0].totalGender = totalMale;
  chartInstance.data.datasets[0].totalAll = totalAll;

  chartInstance.data.datasets[1].data = femaleData;
  chartInstance.data.datasets[1].rawData = femaleData;
  chartInstance.data.datasets[1].totalGender = totalFemale;
  chartInstance.data.datasets[1].totalAll = totalAll;

  chartInstance.update('none');
}
