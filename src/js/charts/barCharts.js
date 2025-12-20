/**
 * Bar chart creation and update functions
 */
import { CONFIG } from '../config.js';
import { getCanvasContext } from './chartFactory.js';

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
  const ctx = getCanvasContext(canvasId);
  if (!ctx) return null;

  return new Chart(ctx, {
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
  const ctx = getCanvasContext(canvasId);
  if (!ctx) return null;

  return new Chart(ctx, {
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
  const ctx = getCanvasContext(canvasId);
  if (!ctx) return null;

  return new Chart(ctx, {
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
export function updatePercentageStackChart(chartInstance, labels, maleData, femaleData, unknownData, maleCount = null, femaleCount = null, unknownCount = null) {
  chartInstance.data.labels = labels;
  chartInstance.data.datasets[0].data = maleData;
  chartInstance.data.datasets[1].data = femaleData;
  chartInstance.data.datasets[2].data = unknownData;

  // Store count data for tooltips if provided
  if (maleCount && femaleCount && unknownCount) {
    chartInstance.data.datasets[0].countData = maleCount;
    chartInstance.data.datasets[1].countData = femaleCount;
    chartInstance.data.datasets[2].countData = unknownCount;
  }

  chartInstance.update('none');
}

/**
 * Create 100% stacked bar chart (shows percentages within each category)
 */
export function createPercentageStackChart(labels, maleData, femaleData, unknownData, canvasId, maleCount = null, femaleCount = null, unknownCount = null) {
  const ctx = getCanvasContext(canvasId);
  if (!ctx) return null;

  return new Chart(ctx, {
    type: "bar",
    data: {
      labels, datasets: [
        { label: "Male", data: maleData, countData: maleCount, backgroundColor: CONFIG.colors.male },
        { label: "Female", data: femaleData, countData: femaleCount, backgroundColor: CONFIG.colors.female },
        { label: "Unknown", data: unknownData, countData: unknownCount, backgroundColor: CONFIG.colors.unknown }
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
              let label = context.dataset.label + ': ' + context.parsed.y.toFixed(1) + '%';

              // If we have count data, also show the count
              if (context.dataset.countData) {
                const count = context.dataset.countData[context.dataIndex];
                label += ' (' + count + ' works)';
              }

              return label;
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
export function updateDisplayStatusChart(chartInstance, labels, displayedData, notDisplayedData, displayedCount = null, notDisplayedCount = null) {
  chartInstance.data.labels = labels;
  chartInstance.data.datasets[0].data = displayedData;
  chartInstance.data.datasets[1].data = notDisplayedData;
  if (displayedCount) chartInstance.data.datasets[0].countData = displayedCount;
  if (notDisplayedCount) chartInstance.data.datasets[1].countData = notDisplayedCount;
  chartInstance.update('none');
}

/**
 * Update creator-depicted gender relationship chart
 */
export function updateCreatorDepictedChart(chartInstance, labels, maleDepictedData, femaleDepictedData, unknownDepictedData, maleCount = null, femaleCount = null, unknownCount = null) {
  chartInstance.data.labels = labels;
  chartInstance.data.datasets[0].data = maleDepictedData;
  chartInstance.data.datasets[0].countData = maleCount;
  chartInstance.data.datasets[1].data = femaleDepictedData;
  chartInstance.data.datasets[1].countData = femaleCount;
  chartInstance.data.datasets[2].data = unknownDepictedData;
  chartInstance.data.datasets[2].countData = unknownCount;
  chartInstance.update('none');
}

/**
 * Create horizontal stacked bar chart for display status (On Display vs Not on Display)
 */
export function createDisplayStatusChart(labels, displayedData, notDisplayedData, canvasId, displayedCount = null, notDisplayedCount = null) {
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

  const ctx = getCanvasContext(canvasId);
  if (!ctx) return null;

  return new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "On Display",
          data: displayedData,
          backgroundColor: displayedColors,
          borderWidth: 0,
          countData: displayedCount
        },
        {
          label: "Not on Display",
          data: notDisplayedData,
          backgroundColor: notDisplayedColors,
          borderWidth: 0,
          countData: notDisplayedCount
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
              let label = context.dataset.label + ': ' + context.parsed.x.toFixed(1) + '%';
              if (context.dataset.countData) {
                const count = context.dataset.countData[context.dataIndex];
                label += ' (' + count.toLocaleString() + ' works)';
              }
              return label;
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
 * Update image availability chart
 */
export function updateImageAvailabilityChart(chartInstance, labels, withImageData, withoutImageData, withImageCount = null, withoutImageCount = null) {
  chartInstance.data.labels = labels;
  chartInstance.data.datasets[0].data = withImageData;
  chartInstance.data.datasets[1].data = withoutImageData;
  if (withImageCount) chartInstance.data.datasets[0].countData = withImageCount;
  if (withoutImageCount) chartInstance.data.datasets[1].countData = withoutImageCount;
  chartInstance.update('none');
}

/**
 * Create horizontal stacked bar chart for image availability (With Image vs Without Image)
 */
export function createImageAvailabilityChart(labels, withImageData, withoutImageData, canvasId, withImageCount = null, withoutImageCount = null) {
  // Create color arrays matching each gender
  const withImageColors = [
    CONFIG.colors.male,      // Male - solid teal
    CONFIG.colors.female,    // Female - solid purple
    CONFIG.colors.unknown    // Unknown - solid gray
  ];

  const withoutImageColors = [
    CONFIG.colors.male + '40',      // Male - transparent teal
    CONFIG.colors.female + '40',    // Female - transparent purple
    CONFIG.colors.unknown + '40'    // Unknown - transparent gray
  ];

  const ctx = getCanvasContext(canvasId);
  if (!ctx) return null;

  return new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "With Image",
          data: withImageData,
          backgroundColor: withImageColors,
          borderWidth: 0,
          countData: withImageCount
        },
        {
          label: "Without Image",
          data: withoutImageData,
          backgroundColor: withoutImageColors,
          borderWidth: 0,
          countData: withoutImageCount
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
              let label = context.dataset.label + ': ' + context.parsed.x.toFixed(1) + '%';
              if (context.dataset.countData) {
                const count = context.dataset.countData[context.dataIndex];
                label += ' (' + count.toLocaleString() + ' works)';
              }
              return label;
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
export function createCreatorDepictedChart(labels, maleDepictedData, femaleDepictedData, unknownDepictedData, canvasId, maleCount = null, femaleCount = null, unknownCount = null) {
  const ctx = getCanvasContext(canvasId);
  if (!ctx) return null;

  return new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Depicted: Male",
          data: maleDepictedData,
          countData: maleCount,
          backgroundColor: CONFIG.colors.male,
          borderWidth: 0
        },
        {
          label: "Depicted: Female",
          data: femaleDepictedData,
          countData: femaleCount,
          backgroundColor: CONFIG.colors.female,
          borderWidth: 0
        },
        {
          label: "Depicted: Unknown",
          data: unknownDepictedData,
          countData: unknownCount,
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
              let label = context.dataset.label + ': ' + context.parsed.x.toFixed(1) + '%';
              if (context.dataset.countData) {
                const count = context.dataset.countData[context.dataIndex];
                label += ' (' + count + ' depicted persons)';
              }
              return label;
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
 * Update dimension comparison bar chart
 */
export function updateDimensionChart(chartInstance, labels, maleData, femaleData, unknownData) {
  chartInstance.data.labels = labels;
  chartInstance.data.datasets[0].data = maleData;
  chartInstance.data.datasets[1].data = femaleData;
  chartInstance.data.datasets[2].data = unknownData;
  chartInstance.update('none');
}

/**
 * Create grouped bar chart for dimension comparison (not stacked)
 */
export function createDimensionChart(labels, maleData, femaleData, unknownData, canvasId) {
  const ctx = getCanvasContext(canvasId);
  if (!ctx) return null;

  return new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: "Male", data: maleData, backgroundColor: CONFIG.colors.male },
        { label: "Female", data: femaleData, backgroundColor: CONFIG.colors.female },
        { label: "Unknown", data: unknownData, backgroundColor: CONFIG.colors.unknown }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: 'Value' }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.dataset.label;
              const value = context.parsed.y;
              return `${label}: ${value}`;
            }
          }
        }
      },
      animation: false
    }
  });
}

/**
 * Update area distribution line chart
 */
export function updateAreaDistributionChart(chartInstance, labels, maleData, femaleData, unknownData) {
  chartInstance.data.labels = labels;
  chartInstance.data.datasets[0].data = maleData;
  chartInstance.data.datasets[1].data = femaleData;
  chartInstance.data.datasets[2].data = unknownData;
  chartInstance.update('none');
}

/**
 * Update birth year histogram chart
 */
export function updateBirthYearHistogramChart(chartInstance, labels, maleData, femaleData, unknownData, maleCount = null, femaleCount = null, unknownCount = null) {
  chartInstance.data.labels = labels;
  chartInstance.data.datasets[0].data = maleData;
  chartInstance.data.datasets[1].data = femaleData;
  chartInstance.data.datasets[2].data = unknownData;

  // Store count data for tooltips if provided
  if (maleCount && femaleCount && unknownCount) {
    chartInstance.data.datasets[0].countData = maleCount;
    chartInstance.data.datasets[1].countData = femaleCount;
    chartInstance.data.datasets[2].countData = unknownCount;
  }

  chartInstance.update('none');
}

/**
 * Create histogram chart for birth year distribution
 * Shows count or percentage of unique artists by birth year decade
 */
export function createBirthYearHistogramChart(labels, maleData, femaleData, unknownData, canvasId, genderLabel = 'All', usePercentage = false, maleCount = null, femaleCount = null, unknownCount = null) {
  const ctx = getCanvasContext(canvasId);
  if (!ctx) return null;

  // Determine which datasets to show based on gender filter
  const datasets = [];

  if (genderLabel === 'Male') {
    datasets.push({
      label: "Male",
      data: maleData,
      countData: maleCount,
      backgroundColor: CONFIG.colors.male,
      borderColor: CONFIG.colors.male,
      borderWidth: 1
    });
  } else if (genderLabel === 'Female') {
    datasets.push({
      label: "Female",
      data: femaleData,
      countData: femaleCount,
      backgroundColor: CONFIG.colors.female,
      borderColor: CONFIG.colors.female,
      borderWidth: 1
    });
  } else {
    // Show all genders
    datasets.push(
      {
        label: "Male",
        data: maleData,
        countData: maleCount,
        backgroundColor: CONFIG.colors.male + 'CC',
        borderColor: CONFIG.colors.male,
        borderWidth: 1
      },
      {
        label: "Female",
        data: femaleData,
        countData: femaleCount,
        backgroundColor: CONFIG.colors.female + 'CC',
        borderColor: CONFIG.colors.female,
        borderWidth: 1
      },
      {
        label: "Unknown",
        data: unknownData,
        countData: unknownCount,
        backgroundColor: CONFIG.colors.unknown + 'CC',
        borderColor: CONFIG.colors.unknown,
        borderWidth: 1
      }
    );
  }

  const yAxisTitle = usePercentage ? 'Percentage of Artists (%)' : 'Number of Artists';
  const tooltipSuffix = usePercentage ? '%' : ' artists';

  return new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets
    },
    options: {
      responsive: true,
      scales: {
        x: {
          title: { display: true, text: 'Birth Year (by decade)' }
        },
        y: {
          beginAtZero: true,
          title: { display: true, text: yAxisTitle },
          ticks: {
            precision: usePercentage ? 1 : 0,
            callback: function(value) {
              return usePercentage ? value.toFixed(1) + '%' : value;
            }
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = usePercentage ? context.parsed.y.toFixed(1) : context.parsed.y;
              let label = context.dataset.label + ': ' + value + tooltipSuffix;

              // If we have count data and are showing percentages, also show the count
              if (usePercentage && context.dataset.countData) {
                const count = context.dataset.countData[context.dataIndex];
                label += ' (' + count + ' artists)';
              }

              return label;
            }
          }
        },
        legend: {
          display: genderLabel === 'All',
          position: 'top'
        }
      },
      animation: false
    }
  });
}

/**
 * Update creation year histogram chart
 */
export function updateCreationYearHistogramChart(chartInstance, labels, maleData, femaleData, unknownData, maleCount = null, femaleCount = null, unknownCount = null) {
  chartInstance.data.labels = labels;
  chartInstance.data.datasets[0].data = maleData;
  chartInstance.data.datasets[1].data = femaleData;
  chartInstance.data.datasets[2].data = unknownData;

  // Store count data for tooltips if provided
  if (maleCount && femaleCount && unknownCount) {
    chartInstance.data.datasets[0].countData = maleCount;
    chartInstance.data.datasets[1].countData = femaleCount;
    chartInstance.data.datasets[2].countData = unknownCount;
  }

  chartInstance.update('none');
}

/**
 * Create histogram chart for creation year distribution
 * Shows count or percentage of artworks by creation year decade
 */
export function createCreationYearHistogramChart(labels, maleData, femaleData, unknownData, canvasId, genderLabel = 'All', usePercentage = false, maleCount = null, femaleCount = null, unknownCount = null) {
  const ctx = getCanvasContext(canvasId);
  if (!ctx) return null;

  // Determine which datasets to show based on gender filter
  const datasets = [];

  if (genderLabel === 'Male') {
    datasets.push({
      label: "Male",
      data: maleData,
      countData: maleCount,
      backgroundColor: CONFIG.colors.male,
      borderColor: CONFIG.colors.male,
      borderWidth: 1
    });
  } else if (genderLabel === 'Female') {
    datasets.push({
      label: "Female",
      data: femaleData,
      countData: femaleCount,
      backgroundColor: CONFIG.colors.female,
      borderColor: CONFIG.colors.female,
      borderWidth: 1
    });
  } else {
    // Show all genders
    datasets.push(
      {
        label: "Male",
        data: maleData,
        countData: maleCount,
        backgroundColor: CONFIG.colors.male + 'CC',
        borderColor: CONFIG.colors.male,
        borderWidth: 1
      },
      {
        label: "Female",
        data: femaleData,
        countData: femaleCount,
        backgroundColor: CONFIG.colors.female + 'CC',
        borderColor: CONFIG.colors.female,
        borderWidth: 1
      },
      {
        label: "Unknown",
        data: unknownData,
        countData: unknownCount,
        backgroundColor: CONFIG.colors.unknown + 'CC',
        borderColor: CONFIG.colors.unknown,
        borderWidth: 1
      }
    );
  }

  const yAxisTitle = usePercentage ? 'Percentage of Artworks (%)' : 'Number of Artworks';
  const tooltipSuffix = usePercentage ? '%' : ' artworks';

  return new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets
    },
    options: {
      responsive: true,
      scales: {
        x: {
          title: { display: true, text: 'Creation Year (by decade)' }
        },
        y: {
          beginAtZero: true,
          title: { display: true, text: yAxisTitle },
          ticks: {
            precision: usePercentage ? 1 : 0,
            callback: function(value) {
              return usePercentage ? value.toFixed(1) + '%' : value;
            }
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = usePercentage ? context.parsed.y.toFixed(1) : context.parsed.y;
              let label = context.dataset.label + ': ' + value + tooltipSuffix;

              // If we have count data and are showing percentages, also show the count
              if (usePercentage && context.dataset.countData) {
                const count = context.dataset.countData[context.dataIndex];
                label += ' (' + count + ' artworks)';
              }

              return label;
            }
          }
        },
        legend: {
          display: genderLabel === 'All',
          position: 'top'
        }
      },
      animation: false
    }
  });
}

/**
 * Create line chart for area distribution comparison
 * Shows percentage distribution across size bins
 */
export function createAreaDistributionChart(labels, maleData, femaleData, unknownData, canvasId, xAxisLabel = 'Area (cm²)') {
  const ctx = getCanvasContext(canvasId);
  if (!ctx) return null;

  return new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Male",
          data: maleData,
          borderColor: CONFIG.colors.male,
          backgroundColor: CONFIG.colors.male + '40',
          fill: false,
          tension: 0.3
        },
        {
          label: "Female",
          data: femaleData,
          borderColor: CONFIG.colors.female,
          backgroundColor: CONFIG.colors.female + '40',
          fill: false,
          tension: 0.3
        },
        {
          label: "Unknown",
          data: unknownData,
          borderColor: CONFIG.colors.unknown,
          backgroundColor: CONFIG.colors.unknown + '40',
          fill: false,
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          max: 50,
          title: { display: true, text: 'Percentage of works (%)' },
          ticks: {
            callback: function(value) {
              return value + '%';
            }
          }
        },
        x: {
          title: { display: true, text: xAxisLabel }
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
 * Create simple exhibition average chart
 * Shows average number of exhibitions per artwork by gender
 */
export function createExhibitionAvgChart(labels, values, totalWorks, totalExhibitions, canvasId) {
  const ctx = getCanvasContext(canvasId);
  if (!ctx) return null;

  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Average exhibitions per artwork',
        data: values,
        backgroundColor: labels.map(label => {
          if (label === 'Male') return CONFIG.colors.male;
          if (label === 'Female') return CONFIG.colors.female;
          return CONFIG.colors.unknown;
        }),
        borderColor: labels.map(label => {
          if (label === 'Male') return CONFIG.colors.male;
          if (label === 'Female') return CONFIG.colors.female;
          return CONFIG.colors.unknown;
        }),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label;
              const avg = context.parsed.y.toFixed(2);
              const total = totalWorks[label] || 0;
              const exhibitions = totalExhibitions[label] || 0;
              return [
                `Average: ${avg} exhibitions per artwork`,
                `Total: ${exhibitions.toLocaleString()} exhibitions`,
                `Across: ${total.toLocaleString()} artworks`
              ];
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: CONFIG.colors.text || '#fff'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          title: {
            display: true,
            text: 'Average exhibitions',
            color: CONFIG.colors.text || '#fff'
          }
        },
        x: {
          ticks: {
            color: CONFIG.colors.text || '#fff'
          },
          grid: {
            display: false
          }
        }
      },
      animation: false
    }
  });
}

/**
 * Update exhibition average chart
 */
export function updateExhibitionAvgChart(chartInstance, labels, values, totalWorks, totalExhibitions) {
  chartInstance.data.labels = labels;
  chartInstance.data.datasets[0].data = values;
  chartInstance.update('none');
}

/**
 * Create simple exhibition percentage chart
 * Shows percentage of works exhibited at least once by gender
 */
export function createExhibitionPercentChart(labels, values, totalWorks, worksExhibited, canvasId) {
  const ctx = getCanvasContext(canvasId);
  if (!ctx) return null;

  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: '% of works exhibited',
        data: values,
        backgroundColor: labels.map(label => {
          if (label === 'Male') return CONFIG.colors.male;
          if (label === 'Female') return CONFIG.colors.female;
          return CONFIG.colors.unknown;
        }),
        borderColor: labels.map(label => {
          if (label === 'Male') return CONFIG.colors.male;
          if (label === 'Female') return CONFIG.colors.female;
          return CONFIG.colors.unknown;
        }),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label;
              const percent = context.parsed.y.toFixed(1);
              const exhibited = worksExhibited[label] || 0;
              const total = totalWorks[label] || 0;
              return [
                `${percent}% exhibited at least once`,
                `${exhibited.toLocaleString()} of ${total.toLocaleString()} works`
              ];
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: function(value) {
              return value + '%';
            },
            color: CONFIG.colors.text || '#fff'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          },
          title: {
            display: true,
            text: 'Percentage of works',
            color: CONFIG.colors.text || '#fff'
          }
        },
        x: {
          ticks: {
            color: CONFIG.colors.text || '#fff'
          },
          grid: {
            display: false
          }
        }
      },
      animation: false
    }
  });
}

/**
 * Update exhibition percentage chart
 */
export function updateExhibitionPercentChart(chartInstance, labels, values, totalWorks, worksExhibited) {
  chartInstance.data.labels = labels;
  chartInstance.data.datasets[0].data = values;
  chartInstance.update('none');
}
