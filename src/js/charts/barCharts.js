/**
 * Bar chart creation and update functions
 */
import { CONFIG } from '../config.js';

/**
 * Update bar stack chart
 */
export function updateBarStackChart(chartInstance, labels, maleData, femaleData, unknownData) {
  chartInstance.data.labels = labels;
  chartInstance.data.datasets[0].data = maleData;
  chartInstance.data.datasets[1].data = femaleData;
  chartInstance.data.datasets[2].data = unknownData;
  chartInstance.update('none');
}

/**
 * Create stacked bar chart
 */
export function createBarStackChart(labels, maleData, femaleData, unknownData, canvasId) {
  return new Chart(document.getElementById(canvasId).getContext("2d"), {
    type: "bar",
    data: {
      labels, datasets: [
        { label: "Male", data: maleData, backgroundColor: CONFIG.colors.male },
        { label: "Female", data: femaleData, backgroundColor: CONFIG.colors.female },
        { label: "Unknown", data: unknownData, backgroundColor: CONFIG.colors.unknown }
      ]
    },
    options: { responsive: true, scales: { x: { stacked: true }, y: { stacked: true } }, animation: false }
  });
}

/**
 * Update horizontal bar chart
 */
export function updateHorizontalBarChart(chartInstance, labels, maleData, femaleData, unknownData) {
  chartInstance.data.labels = labels;
  chartInstance.data.datasets[0].data = maleData;
  chartInstance.data.datasets[1].data = femaleData;
  chartInstance.data.datasets[2].data = unknownData;
  chartInstance.update('none');
}

/**
 * Create horizontal bar chart
 */
export function createHorizontalBarChart(labels, maleData, femaleData, unknownData, canvasId) {
  return new Chart(document.getElementById(canvasId).getContext("2d"), {
    type: "bar",
    data: {
      labels, datasets: [
        { label: "Male", data: maleData, backgroundColor: CONFIG.colors.male },
        { label: "Female", data: femaleData, backgroundColor: CONFIG.colors.female },
        { label: "Unknown", data: unknownData, backgroundColor: CONFIG.colors.unknown }
      ]
    },
    options: { indexAxis: 'y', responsive: true, animation: false }
  });
}

/**
 * Update regular bar chart
 */
export function updateBarChart(chartInstance, labels, maleData, femaleData, unknownData) {
  chartInstance.data.labels = labels;
  chartInstance.data.datasets[0].data = maleData;
  chartInstance.data.datasets[1].data = femaleData;
  chartInstance.data.datasets[2].data = unknownData;
  chartInstance.update('none');
}

/**
 * Create regular bar chart
 */
export function createBarChart(labels, maleData, femaleData, unknownData, canvasId) {
  return new Chart(document.getElementById(canvasId).getContext("2d"), {
    type: "bar",
    data: {
      labels, datasets: [
        { label: "Male", data: maleData, backgroundColor: CONFIG.colors.male },
        { label: "Female", data: femaleData, backgroundColor: CONFIG.colors.female },
        { label: "Unknown", data: unknownData, backgroundColor: CONFIG.colors.unknown }
      ]
    },
    options: { responsive: true, animation: false }
  });
}

/**
 * Update 100% stacked bar chart (shows percentages)
 */
export function updatePercentageStackChart(chartInstance, labels, maleData, femaleData, unknownData) {
  chartInstance.data.labels = labels;
  chartInstance.data.datasets[0].data = maleData;
  chartInstance.data.datasets[1].data = femaleData;
  chartInstance.data.datasets[2].data = unknownData;
  chartInstance.update('none');
}

/**
 * Create 100% stacked bar chart (shows percentages within each category)
 */
export function createPercentageStackChart(labels, maleData, femaleData, unknownData, canvasId) {
  return new Chart(document.getElementById(canvasId).getContext("2d"), {
    type: "bar",
    data: {
      labels, datasets: [
        { label: "Male", data: maleData, backgroundColor: CONFIG.colors.male },
        { label: "Female", data: femaleData, backgroundColor: CONFIG.colors.female },
        { label: "Unknown", data: unknownData, backgroundColor: CONFIG.colors.unknown }
      ]
    },
    options: {
      responsive: true,
      scales: {
        x: { stacked: true },
        y: {
          stacked: true,
          max: 100,
          ticks: {
            callback: function(value) {
              return value + '%';
            }
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': ' + context.parsed.y.toFixed(1) + '%';
            }
          }
        }
      },
      animation: false
    }
  });
}

/**
 * Update 100% stacked horizontal bar chart
 */
export function updatePercentageHorizontalStackChart(chartInstance, labels, maleData, femaleData, unknownData) {
  chartInstance.data.labels = labels;
  chartInstance.data.datasets[0].data = maleData;
  chartInstance.data.datasets[1].data = femaleData;
  chartInstance.data.datasets[2].data = unknownData;
  chartInstance.update('none');
}

/**
 * Create 100% stacked horizontal bar chart
 */
export function createPercentageHorizontalStackChart(labels, maleData, femaleData, unknownData, canvasId) {
  return new Chart(document.getElementById(canvasId).getContext("2d"), {
    type: "bar",
    data: {
      labels, datasets: [
        { label: "Male", data: maleData, backgroundColor: CONFIG.colors.male },
        { label: "Female", data: femaleData, backgroundColor: CONFIG.colors.female },
        { label: "Unknown", data: unknownData, backgroundColor: CONFIG.colors.unknown }
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      scales: {
        x: {
          stacked: true,
          max: 100,
          ticks: {
            callback: function(value) {
              return value + '%';
            }
          }
        },
        y: { stacked: true }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': ' + context.parsed.x.toFixed(1) + '%';
            }
          }
        }
      },
      animation: false
    }
  });
}

/**
 * Update display status horizontal stacked bar chart
 */
export function updateDisplayStatusChart(chartInstance, labels, displayedData, notDisplayedData) {
  chartInstance.data.labels = labels;
  chartInstance.data.datasets[0].data = displayedData;
  chartInstance.data.datasets[1].data = notDisplayedData;
  chartInstance.update('none');
}

/**
 * Update creator-depicted gender relationship chart
 */
export function updateCreatorDepictedChart(chartInstance, labels, maleDepictedData, femaleDepictedData, unknownDepictedData) {
  chartInstance.data.labels = labels;
  chartInstance.data.datasets[0].data = maleDepictedData;
  chartInstance.data.datasets[1].data = femaleDepictedData;
  chartInstance.data.datasets[2].data = unknownDepictedData;
  chartInstance.update('none');
}

/**
 * Create horizontal stacked bar chart for display status (On Display vs Not on Display)
 */
export function createDisplayStatusChart(labels, displayedData, notDisplayedData, canvasId) {
  // Create color arrays matching each gender
  const displayedColors = [
    CONFIG.colors.male,      // Male - solid blue
    CONFIG.colors.female,    // Female - solid pink
    CONFIG.colors.unknown    // Unknown - solid gray
  ];

  const notDisplayedColors = [
    CONFIG.colors.male + '40',      // Male - transparent blue
    CONFIG.colors.female + '40',    // Female - transparent pink
    CONFIG.colors.unknown + '40'    // Unknown - transparent gray
  ];

  return new Chart(document.getElementById(canvasId).getContext("2d"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "On Display",
          data: displayedData,
          backgroundColor: displayedColors,
          borderWidth: 0
        },
        {
          label: "Not on Display",
          data: notDisplayedData,
          backgroundColor: notDisplayedColors,
          borderWidth: 0
        }
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      scales: {
        x: {
          stacked: true,
          max: 100,
          title: { display: true, text: 'Percentage (%)' },
          ticks: {
            callback: function(value) {
              return value + '%';
            }
          }
        },
        y: {
          stacked: true,
          title: { display: true, text: 'Gender' }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': ' + context.parsed.x.toFixed(1) + '%';
            }
          }
        },
        legend: {
          display: true,
          position: 'top'
        }
      },
      animation: false
    }
  });
}

/**
 * Create horizontal 100% stacked bar chart showing creator-depicted gender relationships
 * Shows what gender is depicted by each creator gender (as percentages)
 */
export function createCreatorDepictedChart(labels, maleDepictedData, femaleDepictedData, unknownDepictedData, canvasId) {
  return new Chart(document.getElementById(canvasId).getContext("2d"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Depicted: Male",
          data: maleDepictedData,
          backgroundColor: CONFIG.colors.male,
          borderWidth: 0
        },
        {
          label: "Depicted: Female",
          data: femaleDepictedData,
          backgroundColor: CONFIG.colors.female,
          borderWidth: 0
        },
        {
          label: "Depicted: Unknown",
          data: unknownDepictedData,
          backgroundColor: CONFIG.colors.unknown,
          borderWidth: 0
        }
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      scales: {
        x: {
          stacked: true,
          max: 100,
          title: { display: true, text: 'Percentage of depicted persons (%)' },
          ticks: {
            callback: function(value) {
              return value + '%';
            }
          }
        },
        y: {
          stacked: true,
          title: { display: true, text: 'Creator Gender' }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': ' + context.parsed.x.toFixed(1) + '%';
            }
          }
        },
        legend: {
          display: true,
          position: 'top'
        }
      },
      animation: false
    }
  });
}
