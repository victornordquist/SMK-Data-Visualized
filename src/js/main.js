/**
 * Main entry point for SMK Data Visualized application
 */
import { CONFIG } from './config.js';
import { fetchAllDataIncremental, getCachedData, clearCachedData, getCacheMetadata } from './api/smkApi.js';
import { groupByYear } from './data/normalize.js';
import { createLineChart, updateLineChart, createStackedAreaChart, updateStackedAreaChart, createFemaleTrendChart, updateFemaleTrendChart } from './charts/chartFactory.js';
import { createGenderPie, updateGenderPie } from './charts/pieCharts.js';
import {
  createBarStackChart,
  updateBarStackChart,
  createHorizontalBarChart,
  updateHorizontalBarChart,
  createBarChart,
  updateBarChart,
  createPercentageStackChart,
  updatePercentageStackChart,
  createPercentageHorizontalStackChart,
  updatePercentageHorizontalStackChart,
  createDisplayStatusChart,
  updateDisplayStatusChart,
  createCreatorDepictedChart,
  updateCreatorDepictedChart,
  createDimensionChart,
  updateDimensionChart,
  createAreaDistributionChart,
  updateAreaDistributionChart
} from './charts/barCharts.js';
import { createWorldMap, updateWorldMap } from './charts/worldMap.js';
import {
  calculateStats,
  getObjectTypeData,
  getNationalityData,
  getTopAttributeData,
  getExhibitionData,
  getOnDisplayData,
  convertToPercentages,
  getGenderDistributionOverTime,
  getDisplayDistributionOverTime,
  getCreatorDepictedGenderData,
  getDimensionData,
  getAreaDistributionData,
  getAcquisitionLagData,
  getAcquisitionLagDistribution,
  getFemaleTrendData
} from './stats/calculator.js';
import {
  showErrorMessage,
  showSuccessMessage,
  updateLoadingIndicator,
  hideLoadingIndicator,
  showLoadingIndicator,
  showCacheStatus,
  hideCacheStatus
} from './utils/ui.js';
import { debounce, throttle } from './utils/debounce.js';
import { LazyLoadManager } from './utils/lazyLoad.js';

// Global state
let artworks = [];
let artworks2000 = []; // Cached filtered dataset for 2000-2025

// Performance optimization managers
const lazyLoader = new LazyLoadManager();
let isInitialLoad = true;

/**
 * Update the cached filtered dataset for 2000-2025
 */
function updateFilteredCache() {
  artworks2000 = artworks.filter(a =>
    a.acquisitionYear >= CONFIG.dateRanges.recentStart &&
    a.acquisitionYear <= CONFIG.dateRanges.recentEnd
  );
}

// Chart instances
let femaleChartInstance, maleChartInstance, unknownChartInstance, genderPieInstance;
let femaleChart2000Instance, maleChart2000Instance, unknownChart2000Instance, genderPie2000Instance;
let objectTypeChartInstance, objectTypeChartPercentInstance;
let nationalityChartInstance, nationalityChartPercentInstance;
let objectTypeChart2000Instance, objectTypeChartPercent2000Instance;
let nationalityChart2000Instance, nationalityChartPercent2000Instance;
let techniquesChartInstance, techniquesChartPercentInstance;
let materialsChartInstance, materialsChartPercentInstance;
let exhibitionChartInstance, exhibitionChart2000Instance;
let onDisplayChartInstance;
let genderDistributionTimelineInstance;
let displayDistributionTimelineInstance;
let creatorDepictedChartInstance;
let dimensionChartInstance;
let areaDistributionChartInstance;
let acquisitionLagChartInstance;
let lagDistributionChartInstance;
let worldMapInstance;
let femaleTrendChartInstance;

/**
 * Update or create object type chart
 */
function updateOrCreateObjectTypeChart(items, canvasId, chartInstance) {
  const data = getObjectTypeData(items);
  if (chartInstance) {
    updateBarStackChart(chartInstance, data.labels, data.maleData, data.femaleData, data.unknownData);
    return chartInstance;
  } else {
    return createBarStackChart(data.labels, data.maleData, data.femaleData, data.unknownData, canvasId);
  }
}

/**
 * Update or create nationality chart
 */
function updateOrCreateNationalityChart(items, canvasId, chartInstance) {
  const data = getNationalityData(items);
  if (chartInstance) {
    updateHorizontalBarChart(chartInstance, data.labels, data.maleData, data.femaleData, data.unknownData);
    return chartInstance;
  } else {
    return createHorizontalBarChart(data.labels, data.maleData, data.femaleData, data.unknownData, canvasId);
  }
}

/**
 * Update or create top attribute chart (techniques, materials)
 */
function updateOrCreateTopAttributeChart(items, attr, canvasId, chartInstance) {
  const data = getTopAttributeData(items, attr);
  if (chartInstance) {
    updateBarStackChart(chartInstance, data.labels, data.maleData, data.femaleData, data.unknownData);
    return chartInstance;
  } else {
    return createBarStackChart(data.labels, data.maleData, data.femaleData, data.unknownData, canvasId);
  }
}

/**
 * Update or create exhibition chart
 */
function updateOrCreateExhibitionChart(items, canvasId, chartInstance) {
  const data = getExhibitionData(items);
  if (chartInstance) {
    updateBarChart(chartInstance, data.labels, data.maleData, data.femaleData, data.unknownData);
    return chartInstance;
  } else {
    return createBarChart(data.labels, data.maleData, data.femaleData, data.unknownData, canvasId);
  }
}

/**
 * List years where female acquisitions surpass male
 */
function listFemaleSurpassYears(items) {
  const femaleGrouped = groupByYear(items, "Female");
  const maleGrouped = groupByYear(items, "Male");
  const allYears = Object.keys({ ...femaleGrouped, ...maleGrouped }).sort((a, b) => a - b);
  const surpassYears = allYears.filter(y => (femaleGrouped[y] || 0) > (maleGrouped[y] || 0));
  const container = document.getElementById("femaleSurpass");

  // Clear existing content
  container.textContent = '';

  if (surpassYears.length) {
    const h2 = document.createElement('h2');
    h2.textContent = 'Years where female acquisitions surpassed male:';
    container.appendChild(h2);

    // Add summary insight
    const summary = document.createElement('p');
    summary.className = 'insight-text';
    const recentYears = surpassYears.filter(y => parseInt(y) >= 2000);
    const historicalYears = surpassYears.filter(y => parseInt(y) < 2000);

    let summaryText = `Female artists surpassed male artists in <strong>${surpassYears.length} year${surpassYears.length !== 1 ? 's' : ''}</strong> (${((surpassYears.length / allYears.length) * 100).toFixed(1)}% of all years). `;

    if (recentYears.length > 0 && historicalYears.length > 0) {
      summaryText += `This includes ${recentYears.length} recent year${recentYears.length !== 1 ? 's' : ''} (2000+) and ${historicalYears.length} historical year${historicalYears.length !== 1 ? 's' : ''}.`;
    } else if (recentYears.length > 0) {
      summaryText += `All occurrences are from 2000 onwards.`;
    } else {
      summaryText += `All occurrences are from before 2000.`;
    }

    summary.innerHTML = summaryText;
    container.appendChild(summary);

    const ul = document.createElement('ul');
    surpassYears.forEach(y => {
      const li = document.createElement('li');
      const femaleCount = femaleGrouped[y] || 0;
      const maleCount = maleGrouped[y] || 0;
      const total = femaleCount + maleCount;
      const femalePercent = total > 0 ? ((femaleCount / total) * 100).toFixed(1) : 0;
      const margin = femaleCount - maleCount;

      li.textContent = `${y}: ${femaleCount} vs ${maleCount} (${femalePercent}% female, +${margin} margin)`;
      ul.appendChild(li);
    });
    container.appendChild(ul);
  } else {
    const p = document.createElement('p');
    p.textContent = 'No years where female acquisitions surpass male.';
    container.appendChild(p);
  }
}

/**
 * Update statistics display
 */
function updateStatsDisplay() {
  if (artworks.length === 0) return;

  const allYears = calculateStats(artworks);
  const recent = calculateStats(artworks2000);
  const onDisplayData = getOnDisplayData(artworks);

  // Calculate data completeness metrics
  const knownGenderCount = allYears.stats.Male + allYears.stats.Female;
  const knownGenderPercent = allYears.total > 0 ? ((knownGenderCount / allYears.total) * 100).toFixed(1) : 0;

  const grid = document.getElementById('statsGrid');

  // Helper function to create a stat card
  function createStatCard(value, label, subtext, classes = '') {
    const card = document.createElement('div');
    card.className = `stat-card ${classes}`.trim();

    const valueDiv = document.createElement('div');
    valueDiv.className = 'stat-value';
    valueDiv.textContent = value;

    const labelDiv = document.createElement('div');
    labelDiv.className = 'stat-label';
    labelDiv.textContent = label;

    const subtextDiv = document.createElement('div');
    subtextDiv.className = 'stat-subtext';
    subtextDiv.textContent = subtext;

    card.appendChild(valueDiv);
    card.appendChild(labelDiv);
    card.appendChild(subtextDiv);

    return card;
  }

  // Clear existing content
  grid.textContent = '';

  // Create stat cards
  grid.appendChild(createStatCard(
    allYears.total.toLocaleString(),
    'Total Artworks',
    'with acquisition dates'
  ));

  grid.appendChild(createStatCard(
    allYears.stats.Male.toLocaleString(),
    'Works by male artists',
    `${allYears.malePercent}% of collection`
  ));

  grid.appendChild(createStatCard(
    allYears.stats.Female.toLocaleString(),
    'Works by female artists',
    `${allYears.femalePercent}% of collection`,
    'female'
  ));

  grid.appendChild(createStatCard(
    `${knownGenderPercent}%`,
    'Gender Data Complete',
    `${knownGenderCount.toLocaleString()} of ${allYears.total.toLocaleString()} records`,
    parseFloat(knownGenderPercent) >= 70 ? '' : 'unknown'
  ));

  grid.appendChild(createStatCard(
    recent.stats.Female.toLocaleString(),
    'Works by female artists acquired (2000-2025)',
    `${recent.femalePercent}% of recent acquisitions`,
    'female'
  ));

  grid.appendChild(createStatCard(
    recent.stats.Male.toLocaleString(),
    'Works by male artists acquired (2000-2025)',
    `${recent.malePercent}% of recent acquisitions`
  ));

  grid.appendChild(createStatCard(
    onDisplayData.displayed.Female.toLocaleString(),
    'Works by female artists on display',
    `${onDisplayData.femaleData[2]}% of female works`,
    'female'
  ));

  grid.appendChild(createStatCard(
    onDisplayData.displayed.Male.toLocaleString(),
    'Works by male artists on display',
    `${onDisplayData.maleData[2]}% of male works`
  ));
}

/**
 * Generate insights
 */
function generateInsights() {
  if (artworks.length === 0) return;

  const allYears = calculateStats(artworks);
  const recent = calculateStats(artworks2000);

  // Timeline insight
  const femaleGrowth = parseFloat(recent.femalePercent) - parseFloat(allYears.femalePercent);
  const trendDirection = femaleGrowth > 0 ? 'increased' : 'decreased';
  const trendWord = Math.abs(femaleGrowth) > 5 ? 'significantly' : 'slightly';

  const timelineBox = document.getElementById('timelineInsight');
  timelineBox.innerHTML = `
    <p><strong>Historical Overview (n=${allYears.total.toLocaleString()}):</strong> The collection includes ${allYears.total.toLocaleString()} artworks with acquisition dates.
    Male artists represent ${allYears.malePercent}% (n=${allYears.stats.Male.toLocaleString()}) while female artists represent ${allYears.femalePercent}% (n=${allYears.stats.Female.toLocaleString()}) of the collection.
    ${allYears.unknownPercent}% (n=${allYears.stats.Unknown.toLocaleString()}) have unknown or unclear gender attribution.</p>
  `;
  timelineBox.style.display = 'block';

  // Recent trends insight
  const recentBox = document.getElementById('recentInsight');
  recentBox.innerHTML = `
    <p><strong>Recent Trends 2000-2025 (n=${recent.total.toLocaleString()}):</strong> Female representation has ${trendWord} ${trendDirection} to ${recent.femalePercent}%
    (${Math.abs(femaleGrowth).toFixed(1)} percentage points ${femaleGrowth > 0 ? 'higher' : 'lower'} than the historical average).
    This represents ${recent.stats.Female.toLocaleString()} acquisitions of works by female artists in the past 25 years.</p>
    ${femaleGrowth > 0 ?
      '<p>This positive trend suggests increased efforts to address gender imbalance in the collection.</p>' :
      '<p>This indicates that recent acquisition patterns mirror historical gender distribution.</p>'}
  `;
  recentBox.style.display = 'block';

  // Exhibition insights
  const exhibitionData = getExhibitionData(artworks);
  const exhibitionData2000 = getExhibitionData(artworks2000);

  const percentExhibitedMale = exhibitionData.totalWorks.Male > 0 ?
    ((exhibitionData.worksExhibited.Male / exhibitionData.totalWorks.Male) * 100).toFixed(1) : 0;
  const percentExhibitedFemale = exhibitionData.totalWorks.Female > 0 ?
    ((exhibitionData.worksExhibited.Female / exhibitionData.totalWorks.Female) * 100).toFixed(1) : 0;

  const avgExhMale = exhibitionData.totalWorks.Male > 0 ?
    (exhibitionData.totalExhibitions.Male / exhibitionData.totalWorks.Male).toFixed(2) : 0;
  const avgExhFemale = exhibitionData.totalWorks.Female > 0 ?
    (exhibitionData.totalExhibitions.Female / exhibitionData.totalWorks.Female).toFixed(2) : 0;

  const exhibitionBox = document.getElementById('exhibitionInsight');
  exhibitionBox.innerHTML = `
    <p><strong>Exhibition Patterns (All Years):</strong> ${percentExhibitedMale}% of works by male artists (n=${exhibitionData.totalWorks.Male.toLocaleString()}) have been exhibited at least once,
    compared to ${percentExhibitedFemale}% of works by female artists (n=${exhibitionData.totalWorks.Female.toLocaleString()}). On average, works by male artists appear in ${avgExhMale} exhibitions,
    while works by female artists appear in ${avgExhFemale} exhibitions.</p>
    ${percentExhibitedFemale > percentExhibitedMale ?
      '<p>Female artists\' works are more likely to be exhibited, suggesting strong curatorial interest.</p>' :
      percentExhibitedFemale < percentExhibitedMale ?
        '<p>Male artists\' works are more frequently exhibited, which may reflect both the larger number of works in the collection and curatorial priorities.</p>' :
        '<p>Works by male and female artists are exhibited at similar rates.</p>'}
  `;
  exhibitionBox.style.display = 'block';

  // Exhibition insight for 2000-2025
  const percentExhibited2000Male = exhibitionData2000.totalWorks.Male > 0 ?
    ((exhibitionData2000.worksExhibited.Male / exhibitionData2000.totalWorks.Male) * 100).toFixed(1) : 0;
  const percentExhibited2000Female = exhibitionData2000.totalWorks.Female > 0 ?
    ((exhibitionData2000.worksExhibited.Female / exhibitionData2000.totalWorks.Female) * 100).toFixed(1) : 0;

  const avgExh2000Male = exhibitionData2000.totalWorks.Male > 0 ?
    (exhibitionData2000.totalExhibitions.Male / exhibitionData2000.totalWorks.Male).toFixed(2) : 0;
  const avgExh2000Female = exhibitionData2000.totalWorks.Female > 0 ?
    (exhibitionData2000.totalExhibitions.Female / exhibitionData2000.totalWorks.Female).toFixed(2) : 0;

  const exhibition2000Box = document.getElementById('exhibitionInsight2000');
  exhibition2000Box.innerHTML = `
    <p><strong>Recent Exhibition Patterns (2000-2025 Acquisitions):</strong> Among recently acquired works, ${percentExhibited2000Male}% of male artists' works (n=${exhibitionData2000.totalWorks.Male.toLocaleString()})
    and ${percentExhibited2000Female}% of female artists' works (n=${exhibitionData2000.totalWorks.Female.toLocaleString()}) have been exhibited. Recent acquisitions by male artists average ${avgExh2000Male} exhibitions per work,
    while female artists average ${avgExh2000Female} exhibitions per work.</p>
    ${parseFloat(percentExhibited2000Female) > parseFloat(percentExhibitedFemale) ?
      '<p>Recently acquired works by female artists are being exhibited more actively than the historical average, indicating increased institutional commitment.</p>' :
      '<p>Exhibition rates for recently acquired works follow similar patterns to the overall collection.</p>'}
  `;
  exhibition2000Box.style.display = 'block';
}

/**
 * Update on-display insights
 */
function updateOnDisplayInsight() {
  if (artworks.length === 0) return;

  const onDisplayData = getOnDisplayData(artworks);
  const percentDisplayedMale = onDisplayData.maleData[2];
  const percentDisplayedFemale = onDisplayData.femaleData[2];

  const onDisplayBox = document.getElementById('onDisplayInsight');
  onDisplayBox.innerHTML = `
    <p><strong>Current Display Status:</strong> ${percentDisplayedMale}% of works by male artists are currently on display
    (${onDisplayData.displayed.Male.toLocaleString()} of n=${onDisplayData.total.Male.toLocaleString()}), compared to
    ${percentDisplayedFemale}% of works by female artists (${onDisplayData.displayed.Female.toLocaleString()} of n=${onDisplayData.total.Female.toLocaleString()}).
    Unknown gender: ${onDisplayData.displayed.Unknown.toLocaleString()} of n=${onDisplayData.total.Unknown.toLocaleString()} displayed.</p>
    ${percentDisplayedFemale > percentDisplayedMale ?
      '<p>Female artists have higher representation in current displays, indicating institutional commitment to visibility.</p>' :
      percentDisplayedFemale < percentDisplayedMale ?
        '<p>Male artists have higher representation in current displays, which may reflect collection size differences and curatorial decisions.</p>' :
        '<p>Both genders have equal representation in current displays.</p>'}
  `;
  onDisplayBox.style.display = 'block';
}

/**
 * Update timeline charts (always visible, load immediately)
 */
function updateTimelineCharts() {
  if (femaleChartInstance) {
    updateLineChart(femaleChartInstance, groupByYear(artworks, "Female"), CONFIG.colors.female);
  } else {
    femaleChartInstance = createLineChart("femaleChart", groupByYear(artworks, "Female"), CONFIG.colors.female);
  }

  if (maleChartInstance) {
    updateLineChart(maleChartInstance, groupByYear(artworks, "Male"), CONFIG.colors.male);
  } else {
    maleChartInstance = createLineChart("maleChart", groupByYear(artworks, "Male"), CONFIG.colors.male);
  }

  if (unknownChartInstance) {
    updateLineChart(unknownChartInstance, groupByYear(artworks, "Unknown"), CONFIG.colors.unknown);
  } else {
    unknownChartInstance = createLineChart("unknownChart", groupByYear(artworks, "Unknown"), CONFIG.colors.unknown);
  }
}

/**
 * Update recent timeline charts (2000-2025)
 */
function updateRecentTimelineCharts() {
  if (femaleChart2000Instance) {
    updateLineChart(femaleChart2000Instance, groupByYear(artworks2000, "Female"), CONFIG.colors.female);
  } else {
    femaleChart2000Instance = createLineChart("femaleChart2000", groupByYear(artworks2000, "Female"), CONFIG.colors.female);
  }

  if (maleChart2000Instance) {
    updateLineChart(maleChart2000Instance, groupByYear(artworks2000, "Male"), CONFIG.colors.male);
  } else {
    maleChart2000Instance = createLineChart("maleChart2000", groupByYear(artworks2000, "Male"), CONFIG.colors.male);
  }

  if (unknownChart2000Instance) {
    updateLineChart(unknownChart2000Instance, groupByYear(artworks2000, "Unknown"), CONFIG.colors.unknown);
  } else {
    unknownChart2000Instance = createLineChart("unknownChart2000", groupByYear(artworks2000, "Unknown"), CONFIG.colors.unknown);
  }
}

/**
 * Update pie charts
 */
function updatePieCharts() {
  if (genderPieInstance) {
    updateGenderPie(genderPieInstance, artworks);
  } else {
    genderPieInstance = createGenderPie(artworks, "genderPie");
  }

  if (genderPie2000Instance) {
    updateGenderPie(genderPie2000Instance, artworks2000);
  } else {
    genderPie2000Instance = createGenderPie(artworks2000, "genderPie2000");
  }
}

/**
 * Update gender distribution timeline chart
 */
function updateGenderDistributionTimeline() {
  const timelineData = getGenderDistributionOverTime(artworks);

  if (genderDistributionTimelineInstance) {
    updatePercentageStackChart(genderDistributionTimelineInstance, timelineData.years, timelineData.malePercent, timelineData.femalePercent, timelineData.unknownPercent);
  } else {
    genderDistributionTimelineInstance = createPercentageStackChart(timelineData.years, timelineData.malePercent, timelineData.femalePercent, timelineData.unknownPercent, "genderDistributionTimeline");
  }
}

/**
 * Update female trend chart
 */
function updateFemaleTrendChartView() {
  const trendData = getFemaleTrendData(artworks2000, artworks);

  if (femaleTrendChartInstance) {
    updateFemaleTrendChart(femaleTrendChartInstance, trendData.years, trendData.femalePercents, trendData.collectionAverage);
  } else {
    femaleTrendChartInstance = createFemaleTrendChart("femaleTrendChart", trendData.years, trendData.femalePercents, trendData.collectionAverage);
  }

  // Generate insight
  generateFemaleTrendInsight(trendData);
}

/**
 * Generate insight for female trend chart
 */
function generateFemaleTrendInsight(data) {
  const insightDiv = document.getElementById('femaleTrendInsight');
  if (!insightDiv) return;

  const avgRecent = data.femalePercents.slice(-5).reduce((a, b) => a + b, 0) / 5;
  const avgEarly = data.femalePercents.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
  const change = avgRecent - avgEarly;
  const vsCollection = avgRecent - data.collectionAverage;

  let insightText = `<strong>Trend Analysis:</strong> `;

  if (change > 5) {
    insightText += `Acquisitions of female artists' works have <strong>increased significantly</strong> from an average of ${avgEarly.toFixed(1)}% (2000-2004) to ${avgRecent.toFixed(1)}% (2020-2025), showing a positive shift of ${change.toFixed(1)} percentage points.`;
  } else if (change > 0) {
    insightText += `There has been a <strong>modest increase</strong> in female artist acquisitions, rising from ${avgEarly.toFixed(1)}% to ${avgRecent.toFixed(1)}%.`;
  } else {
    insightText += `Female artist representation in recent acquisitions (${avgRecent.toFixed(1)}%) is relatively stable compared to the early 2000s (${avgEarly.toFixed(1)}%).`;
  }

  insightText += ` Recent acquisitions are ${vsCollection > 0 ? 'above' : 'below'} the overall collection average of ${data.collectionAverage.toFixed(1)}% by ${Math.abs(vsCollection).toFixed(1)} percentage points.`;

  insightDiv.innerHTML = `<p>${insightText}</p>`;
  insightDiv.style.display = 'block';
}

/**
 * Update display distribution timeline chart
 */
function updateDisplayDistributionTimeline() {
  const displayData = getDisplayDistributionOverTime(artworks);

  if (displayDistributionTimelineInstance) {
    updateStackedAreaChart(displayDistributionTimelineInstance, displayData.years, displayData.malePercent, displayData.femalePercent, displayData.unknownPercent);
  } else {
    displayDistributionTimelineInstance = createStackedAreaChart("displayDistributionTimeline", displayData.years, displayData.malePercent, displayData.femalePercent, displayData.unknownPercent);
  }
}

/**
 * Update object type charts
 */
function updateObjectTypeCharts() {
  objectTypeChartInstance = updateOrCreateObjectTypeChart(artworks, "objectTypeChart", objectTypeChartInstance);

  // Add percentage chart
  const objectTypeData = getObjectTypeData(artworks);
  const objectTypePercentData = convertToPercentages(objectTypeData);

  if (objectTypeChartPercentInstance) {
    updatePercentageStackChart(objectTypeChartPercentInstance, objectTypePercentData.labels, objectTypePercentData.maleData, objectTypePercentData.femaleData, objectTypePercentData.unknownData);
  } else {
    objectTypeChartPercentInstance = createPercentageStackChart(objectTypePercentData.labels, objectTypePercentData.maleData, objectTypePercentData.femaleData, objectTypePercentData.unknownData, "objectTypeChartPercent");
  }

  objectTypeChart2000Instance = updateOrCreateObjectTypeChart(artworks2000, "objectTypeChart2000", objectTypeChart2000Instance);

  // Add percentage chart for 2000-2025
  const objectTypeData2000 = getObjectTypeData(artworks2000);
  const objectTypePercentData2000 = convertToPercentages(objectTypeData2000);

  if (objectTypeChartPercent2000Instance) {
    updatePercentageStackChart(objectTypeChartPercent2000Instance, objectTypePercentData2000.labels, objectTypePercentData2000.maleData, objectTypePercentData2000.femaleData, objectTypePercentData2000.unknownData);
  } else {
    objectTypeChartPercent2000Instance = createPercentageStackChart(objectTypePercentData2000.labels, objectTypePercentData2000.maleData, objectTypePercentData2000.femaleData, objectTypePercentData2000.unknownData, "objectTypeChartPercent2000");
  }
}

/**
 * Update world map visualization
 */
async function updateWorldMapView() {
  if (worldMapInstance) {
    updateWorldMap(artworks);
  } else {
    worldMapInstance = await createWorldMap(artworks, 'worldMap');
  }
}

/**
 * Update nationality charts
 */
function updateNationalityCharts() {
  nationalityChartInstance = updateOrCreateNationalityChart(artworks, "nationalityChart", nationalityChartInstance);

  // Add percentage chart
  const nationalityData = getNationalityData(artworks);
  const nationalityPercentData = convertToPercentages(nationalityData);

  if (nationalityChartPercentInstance) {
    updatePercentageHorizontalStackChart(nationalityChartPercentInstance, nationalityPercentData.labels, nationalityPercentData.maleData, nationalityPercentData.femaleData, nationalityPercentData.unknownData);
  } else {
    nationalityChartPercentInstance = createPercentageHorizontalStackChart(nationalityPercentData.labels, nationalityPercentData.maleData, nationalityPercentData.femaleData, nationalityPercentData.unknownData, "nationalityChartPercent");
  }

  nationalityChart2000Instance = updateOrCreateNationalityChart(artworks2000, "nationalityChart2000", nationalityChart2000Instance);

  // Add percentage chart for 2000-2025
  const nationalityData2000 = getNationalityData(artworks2000);
  const nationalityPercentData2000 = convertToPercentages(nationalityData2000);

  if (nationalityChartPercent2000Instance) {
    updatePercentageHorizontalStackChart(nationalityChartPercent2000Instance, nationalityPercentData2000.labels, nationalityPercentData2000.maleData, nationalityPercentData2000.femaleData, nationalityPercentData2000.unknownData);
  } else {
    nationalityChartPercent2000Instance = createPercentageHorizontalStackChart(nationalityPercentData2000.labels, nationalityPercentData2000.maleData, nationalityPercentData2000.femaleData, nationalityPercentData2000.unknownData, "nationalityChartPercent2000");
  }
}

/**
 * Update techniques and materials charts
 */
function updateTechniquesMaterialsCharts() {
  techniquesChartInstance = updateOrCreateTopAttributeChart(artworks, "techniques", "techniquesChart", techniquesChartInstance);

  // Add techniques percentage chart
  const techniquesData = getTopAttributeData(artworks, "techniques");
  const techniquesPercentData = convertToPercentages(techniquesData);

  if (techniquesChartPercentInstance) {
    updatePercentageStackChart(techniquesChartPercentInstance, techniquesPercentData.labels, techniquesPercentData.maleData, techniquesPercentData.femaleData, techniquesPercentData.unknownData);
  } else {
    techniquesChartPercentInstance = createPercentageStackChart(techniquesPercentData.labels, techniquesPercentData.maleData, techniquesPercentData.femaleData, techniquesPercentData.unknownData, "techniquesChartPercent");
  }

  materialsChartInstance = updateOrCreateTopAttributeChart(artworks, "materials", "materialsChart", materialsChartInstance);

  // Add materials percentage chart
  const materialsData = getTopAttributeData(artworks, "materials");
  const materialsPercentData = convertToPercentages(materialsData);

  if (materialsChartPercentInstance) {
    updatePercentageStackChart(materialsChartPercentInstance, materialsPercentData.labels, materialsPercentData.maleData, materialsPercentData.femaleData, materialsPercentData.unknownData);
  } else {
    materialsChartPercentInstance = createPercentageStackChart(materialsPercentData.labels, materialsPercentData.maleData, materialsPercentData.femaleData, materialsPercentData.unknownData, "materialsChartPercent");
  }
}

/**
 * Update exhibition charts
 */
function updateExhibitionCharts() {
  exhibitionChartInstance = updateOrCreateExhibitionChart(artworks, "exhibitionChart", exhibitionChartInstance);

  if (artworks2000.length > 0) {
    exhibitionChart2000Instance = updateOrCreateExhibitionChart(artworks2000, "exhibitionChart2000", exhibitionChart2000Instance);
  }
}

/**
 * Update on-display chart
 */
function updateOnDisplayChart() {
  const onDisplayData = getOnDisplayData(artworks);
  if (onDisplayChartInstance) {
    updateDisplayStatusChart(onDisplayChartInstance, onDisplayData.labels, onDisplayData.displayedPercent, onDisplayData.notDisplayedPercent);
  } else {
    onDisplayChartInstance = createDisplayStatusChart(onDisplayData.labels, onDisplayData.displayedPercent, onDisplayData.notDisplayedPercent, "onDisplayChart");
  }
  updateOnDisplayInsight();
}

/**
 * Update creator-depicted gender relationship chart
 */
function updateCreatorDepictedChartView() {
  const data = getCreatorDepictedGenderData(artworks);

  if (creatorDepictedChartInstance) {
    updateCreatorDepictedChart(creatorDepictedChartInstance, data.labels, data.maleDepictedPercent, data.femaleDepictedPercent, data.unknownDepictedPercent);
  } else {
    creatorDepictedChartInstance = createCreatorDepictedChart(data.labels, data.maleDepictedPercent, data.femaleDepictedPercent, data.unknownDepictedPercent, "creatorDepictedChart");
  }

  // Update insight text
  updateCreatorDepictedInsight(data);
}

/**
 * Update insight text for creator-depicted analysis
 */
function updateCreatorDepictedInsight(data) {
  const insightEl = document.getElementById('creatorDepictedInsight');
  if (!insightEl) return;

  if (data.artworksWithDepictions === 0) {
    insightEl.style.display = 'none';
    return;
  }

  let insightHTML = `<strong>Analysis based on ${data.artworksWithDepictions.toLocaleString()} artworks (${data.coveragePercent}% of collection)</strong> where depicted persons are identified.<br><br>`;

  // Analyze male creators
  const maleCreatorDepictsMale = data.percentages.Male.Male.toFixed(1);
  const maleCreatorDepictsFemale = data.percentages.Male.Female.toFixed(1);

  if (data.creatorCounts.Male > 0) {
    insightHTML += `<strong>Male creators</strong> depict: ${maleCreatorDepictsMale}% male, ${maleCreatorDepictsFemale}% female<br>`;
  }

  // Analyze female creators
  if (data.creatorCounts.Female > 0) {
    const femaleCreatorDepictsMale = data.percentages.Female.Male.toFixed(1);
    const femaleCreatorDepictsFemale = data.percentages.Female.Female.toFixed(1);
    insightHTML += `<strong>Female creators</strong> depict: ${femaleCreatorDepictsMale}% male, ${femaleCreatorDepictsFemale}% female<br>`;
  } else {
    insightHTML += `<strong>Female creators:</strong> No data available in portraits with identified persons.<br>`;
  }

  insightEl.innerHTML = insightHTML;
  insightEl.style.display = 'block';
}

/**
 * Update dimension charts for paintings
 */
function updateDimensionCharts() {
  // Get dimension data for paintings
  const dimensionData = getDimensionData(artworks, "Painting");
  const areaDistData = getAreaDistributionData(artworks, "Painting");

  // Update or create dimension comparison chart
  if (dimensionChartInstance) {
    updateDimensionChart(dimensionChartInstance, dimensionData.labels, dimensionData.maleData, dimensionData.femaleData, dimensionData.unknownData);
  } else {
    dimensionChartInstance = createDimensionChart(dimensionData.labels, dimensionData.maleData, dimensionData.femaleData, dimensionData.unknownData, "dimensionChart");
  }

  // Update or create area distribution chart
  if (areaDistributionChartInstance) {
    updateAreaDistributionChart(areaDistributionChartInstance, areaDistData.labels, areaDistData.malePercent, areaDistData.femalePercent, areaDistData.unknownPercent);
  } else {
    areaDistributionChartInstance = createAreaDistributionChart(areaDistData.labels, areaDistData.malePercent, areaDistData.femalePercent, areaDistData.unknownPercent, "areaDistributionChart");
  }

  // Update insights
  updateDimensionInsights(dimensionData, areaDistData);
}

/**
 * Update dimension insights text
 */
function updateDimensionInsights(dimensionData, areaDistData) {
  const insightEl = document.getElementById('dimensionsInsight');
  if (!insightEl) return;

  const stats = dimensionData.stats;

  // Check if we have enough data
  if (stats.Male.count === 0 && stats.Female.count === 0) {
    insightEl.style.display = 'none';
    return;
  }

  let insightHTML = `<strong>Analysis of ${dimensionData.totalCount.toLocaleString()} paintings with dimension data:</strong><br><br>`;

  // Compare male vs female average areas
  if (stats.Male.count > 0 && stats.Female.count > 0) {
    const maleAvg = stats.Male.avgArea;
    const femaleAvg = stats.Female.avgArea;
    const sizeDiff = ((maleAvg - femaleAvg) / femaleAvg * 100).toFixed(1);
    const larger = maleAvg > femaleAvg ? 'male' : 'female';
    const smaller = maleAvg > femaleAvg ? 'female' : 'male';

    insightHTML += `<strong>Average size comparison:</strong> Paintings by ${larger} artists are on average ${Math.abs(sizeDiff)}% larger than those by ${smaller} artists. `;
    insightHTML += `Male artists: ${stats.Male.avgArea.toFixed(0)} cm² (n=${stats.Male.count.toLocaleString()}), `;
    insightHTML += `Female artists: ${stats.Female.avgArea.toFixed(0)} cm² (n=${stats.Female.count.toLocaleString()}).<br><br>`;

    // Compare medians (more robust to outliers)
    const maleMedian = stats.Male.medianArea;
    const femaleMedian = stats.Female.medianArea;
    const medianDiff = ((maleMedian - femaleMedian) / femaleMedian * 100).toFixed(1);

    insightHTML += `<strong>Median size (less affected by outliers):</strong> Male: ${maleMedian.toFixed(0)} cm², Female: ${femaleMedian.toFixed(0)} cm² `;
    insightHTML += `(${Math.abs(medianDiff)}% ${maleMedian > femaleMedian ? 'larger' : 'smaller'} for male artists).<br><br>`;

    // Interpretation
    if (Math.abs(parseFloat(sizeDiff)) > 10) {
      insightHTML += `<strong>Interpretation:</strong> There is a notable difference in painting sizes between genders. `;
      if (maleAvg > femaleAvg) {
        insightHTML += `Works by male artists tend to be larger on average, which historically correlates with perceived importance and prominent museum placement.`;
      } else {
        insightHTML += `Interestingly, works by female artists in this collection tend to be larger on average, counter to typical historical patterns.`;
      }
    } else {
      insightHTML += `<strong>Interpretation:</strong> The size difference between genders is relatively modest, suggesting comparable scale ambitions across genders in this collection.`;
    }
  } else {
    insightHTML += `Insufficient data for comparison between genders.`;
  }

  insightEl.innerHTML = insightHTML;
  insightEl.style.display = 'block';
}

/**
 * Update acquisition lag charts
 */
function updateAcquisitionLagCharts() {
  // Get acquisition lag data
  const lagData = getAcquisitionLagData(artworks);
  const lagDistData = getAcquisitionLagDistribution(artworks);

  // Update or create acquisition lag comparison chart
  if (acquisitionLagChartInstance) {
    updateDimensionChart(acquisitionLagChartInstance, lagData.labels, lagData.maleData, lagData.femaleData, lagData.unknownData);
  } else {
    acquisitionLagChartInstance = createDimensionChart(lagData.labels, lagData.maleData, lagData.femaleData, lagData.unknownData, "acquisitionLagChart");
  }

  // Update or create lag distribution chart
  if (lagDistributionChartInstance) {
    updateAreaDistributionChart(lagDistributionChartInstance, lagDistData.labels, lagDistData.malePercent, lagDistData.femalePercent, lagDistData.unknownPercent);
  } else {
    lagDistributionChartInstance = createAreaDistributionChart(lagDistData.labels, lagDistData.malePercent, lagDistData.femalePercent, lagDistData.unknownPercent, "lagDistributionChart", "Years between production and acquisition");
  }

  // Update insights
  updateAcquisitionLagInsights(lagData, lagDistData);
}

/**
 * Update acquisition lag insights text
 */
function updateAcquisitionLagInsights(lagData, lagDistData) {
  const insightEl = document.getElementById('acquisitionLagInsight');
  if (!insightEl) return;

  const stats = lagData.stats;

  // Check if we have enough data
  if (stats.Male.count === 0 && stats.Female.count === 0) {
    insightEl.style.display = 'none';
    return;
  }

  let insightHTML = `<strong>Analysis of ${lagData.totalCount.toLocaleString()} artworks with both production and acquisition dates:</strong><br><br>`;

  // Compare male vs female average lags
  if (stats.Male.count > 0 && stats.Female.count > 0) {
    const maleAvg = stats.Male.avgLag;
    const femaleAvg = stats.Female.avgLag;
    const lagDiff = maleAvg - femaleAvg;
    const shorter = maleAvg < femaleAvg ? 'male' : 'female';
    const longer = maleAvg < femaleAvg ? 'female' : 'male';

    insightHTML += `<strong>Average acquisition lag:</strong> Works by ${shorter} artists are acquired on average ${Math.abs(lagDiff).toFixed(0)} years sooner after production than works by ${longer} artists. `;
    insightHTML += `Male artists: ${stats.Male.avgLag.toFixed(0)} years (n=${stats.Male.count.toLocaleString()}), `;
    insightHTML += `Female artists: ${stats.Female.avgLag.toFixed(0)} years (n=${stats.Female.count.toLocaleString()}).<br><br>`;

    // Compare medians
    const maleMedian = stats.Male.medianLag;
    const femaleMedian = stats.Female.medianLag;

    insightHTML += `<strong>Median lag:</strong> Male: ${maleMedian.toFixed(0)} years, Female: ${femaleMedian.toFixed(0)} years.<br><br>`;

    // Compare recent collecting rates (2000-2025)
    const maleRecent = stats.Male.recentPercent;
    const femaleRecent = stats.Female.recentPercent;

    insightHTML += `<strong>Recent collecting (2000-2025):</strong> ${maleRecent.toFixed(1)}% of male artists' works vs ${femaleRecent.toFixed(1)}% of female artists' works were acquired between 2000 and 2025.<br><br>`;

    // Interpretation
    if (femaleRecent > maleRecent + 10) {
      insightHTML += `<strong>Interpretation:</strong> Female artists are significantly more likely to have been acquired recently (2000-2025), suggesting increased focus on collecting works by female artists in recent decades.`;
    } else if (maleRecent > femaleRecent + 10) {
      insightHTML += `<strong>Interpretation:</strong> Male artists are more likely to have been acquired recently (2000-2025), while a larger proportion of female artists' works were acquired before 2000.`;
    } else {
      insightHTML += `<strong>Interpretation:</strong> Both genders show similar patterns in recent acquisition activity (2000-2025).`;
    }
  } else {
    insightHTML += `Insufficient data for comparison between genders.`;
  }

  insightEl.innerHTML = insightHTML;
  insightEl.style.display = 'block';
}

/**
 * Update all visualizations with current artwork data
 * Uses lazy loading for charts below the fold
 */
function updateAllVisualizations() {
  if (artworks.length === 0) return;

  // Update cached filtered dataset
  updateFilteredCache();

  // Always update stats and insights (above the fold)
  updateStatsDisplay();
  generateInsights();

  // Always render timeline charts (above the fold)
  updateTimelineCharts();

  if (isInitialLoad) {
    // Setup lazy loading for below-the-fold charts
    lazyLoader.observe('charts2000', () => updateRecentTimelineCharts());
    lazyLoader.observe('pieChartContainer', () => updatePieCharts());
    lazyLoader.observe('femaleTrendContainer', () => updateFemaleTrendChartView());
    lazyLoader.observe('genderDistributionTimelineContainer', () => updateGenderDistributionTimeline());
    lazyLoader.observe('objectTypeContainer', () => updateObjectTypeCharts());
    lazyLoader.observe('worldMapContainer', () => updateWorldMapView());
    lazyLoader.observe('nationalityContainer', () => updateNationalityCharts());
    lazyLoader.observe('techniquesContainer', () => updateTechniquesMaterialsCharts());
    lazyLoader.observe('exhibitionContainer', () => updateExhibitionCharts());
    lazyLoader.observe('onDisplayContainer', () => updateOnDisplayChart());
    lazyLoader.observe('displayDistributionTimelineContainer', () => updateDisplayDistributionTimeline());
    lazyLoader.observe('creatorDepictedContainer', () => updateCreatorDepictedChartView());
    lazyLoader.observe('dimensionsContainer', () => updateDimensionCharts());
    lazyLoader.observe('acquisitionLagContainer', () => updateAcquisitionLagCharts());

    isInitialLoad = false;
  } else {
    // On data updates, update all loaded charts
    if (lazyLoader.isLoaded('charts2000')) updateRecentTimelineCharts();
    if (lazyLoader.isLoaded('pieChartContainer')) updatePieCharts();
    if (lazyLoader.isLoaded('femaleTrendContainer')) updateFemaleTrendChartView();
    if (lazyLoader.isLoaded('genderDistributionTimelineContainer')) updateGenderDistributionTimeline();
    if (lazyLoader.isLoaded('objectTypeContainer')) updateObjectTypeCharts();
    if (lazyLoader.isLoaded('worldMapContainer')) updateWorldMapView();
    if (lazyLoader.isLoaded('nationalityContainer')) updateNationalityCharts();
    if (lazyLoader.isLoaded('techniquesContainer')) updateTechniquesMaterialsCharts();
    if (lazyLoader.isLoaded('exhibitionContainer')) updateExhibitionCharts();
    if (lazyLoader.isLoaded('onDisplayContainer')) updateOnDisplayChart();
    if (lazyLoader.isLoaded('displayDistributionTimelineContainer')) updateDisplayDistributionTimeline();
    if (lazyLoader.isLoaded('creatorDepictedContainer')) updateCreatorDepictedChartView();
    if (lazyLoader.isLoaded('dimensionsContainer')) updateDimensionCharts();
    if (lazyLoader.isLoaded('acquisitionLagContainer')) updateAcquisitionLagCharts();
  }

  // Update text-based insights
  listFemaleSurpassYears(artworks);
}

/**
 * Debounced version of updateAllVisualizations for incremental data loading
 */
const debouncedUpdateVisualizations = debounce(updateAllVisualizations, CONFIG.performance.debounceDelay);

/**
 * Load data from cache or API
 * @param {boolean} forceRefresh - Force fetch from API even if cache exists
 */
async function loadData(forceRefresh = false) {
  // Clear cache if force refresh
  if (forceRefresh) {
    await clearCachedData();
    hideCacheStatus();
  }

  // Check cache first
  const cachedData = await getCachedData();
  if (cachedData && cachedData.length > 0 && !forceRefresh) {
    artworks = cachedData;
    updateAllVisualizations();
    hideLoadingIndicator();

    // Show cache status
    const metadata = await getCacheMetadata();
    if (metadata) {
      showCacheStatus(metadata.timestamp, metadata.itemCount);
    }

    showSuccessMessage(`Loaded ${artworks.length.toLocaleString()} artworks from cache`);
    return;
  }

  // Show loading indicator
  showLoadingIndicator();
  hideCacheStatus();

  // Fetch data with progress updates (using debounced updates for performance)
  try {
    artworks = await fetchAllDataIncremental(
      (offset, currentArtworks) => {
        artworks = currentArtworks;
        // Use debounced updates during incremental loading to reduce CPU usage
        debouncedUpdateVisualizations();
        updateLoadingIndicator(offset);
      },
      (error) => {
        showErrorMessage(`Failed to load data: ${error.message}. Please try refreshing the page.`);
      }
    );

    // Final update with all data (no debounce)
    updateAllVisualizations();
    hideLoadingIndicator();

    // Show success message
    showSuccessMessage(`Successfully loaded ${artworks.length.toLocaleString()} artworks from API`);

    // Show cache status after data is cached
    setTimeout(async () => {
      const metadata = await getCacheMetadata();
      if (metadata) {
        showCacheStatus(metadata.timestamp, metadata.itemCount);
      }
    }, 100);

  } catch (error) {
    hideLoadingIndicator();
    showErrorMessage(`Failed to load data: ${error.message}. Please try refreshing the page.`);
  }
}

/**
 * Initialize the application
 */
async function init() {
  await loadData(false);
}

// Start the application when the page loads and Chart.js is ready
function waitForChart() {
  if (typeof Chart !== 'undefined') {
    init();
  } else {
    // Wait for Chart.js to load
    setTimeout(waitForChart, 50);
  }
}

/**
 * Back to top button functionality
 */
function initBackToTop() {
  const backToTopButton = document.getElementById('backToTop');
  if (!backToTopButton) return;

  // Show/hide button based on scroll position
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      backToTopButton.classList.add('show');
    } else {
      backToTopButton.classList.remove('show');
    }
  });

  // Smooth scroll to top
  backToTopButton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

/**
 * Initialize hamburger menu for mobile navigation
 */
function initHamburgerMenu() {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  if (!hamburger || !navLinks) return;

  // Toggle menu on hamburger click
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('open');

    // Update aria-expanded for accessibility
    const isExpanded = hamburger.classList.contains('active');
    hamburger.setAttribute('aria-expanded', isExpanded);
  });

  // Close menu when clicking a link
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navLinks.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
      hamburger.classList.remove('active');
      navLinks.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
  });
}

/**
 * Highlight active navigation link based on scroll position
 */
function initNavigationHighlight() {
  const navLinks = document.querySelectorAll('.nav-links a');
  const sections = document.querySelectorAll('section[class*="section-"]');

  if (navLinks.length === 0 || sections.length === 0) return;

  window.addEventListener('scroll', () => {
    let current = '';

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      if (window.scrollY >= sectionTop - 100) {
        const anchor = section.querySelector('.section-anchor');
        if (anchor) {
          current = anchor.id;
        }
      }
    });

    navLinks.forEach(link => {
      link.style.fontWeight = 'normal';
      link.style.textDecoration = 'none';
      if (link.getAttribute('href') === '#' + current) {
        link.style.fontWeight = '600';
        link.style.textDecoration = 'underline';
      }
    });
  });
}

/**
 * Initialize tab switching functionality
 */
function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');
      const parentSection = button.closest('section');

      if (!parentSection) return;

      // Update button states
      parentSection.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
      });
      button.classList.add('active');
      button.setAttribute('aria-selected', 'true');

      // Update panel visibility
      parentSection.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
      });

      // Find and show the target panel
      const targetPanel = parentSection.querySelector(`#${tabId}-panel`);
      if (targetPanel) {
        targetPanel.classList.add('active');

        // Trigger lazy loading for charts in the newly visible tab
        lazyLoadTabContent(targetPanel);
      }
    });
  });
}

/**
 * Initialize refresh button
 */
function initRefreshButton() {
  const refreshButton = document.getElementById('refreshButton');
  if (!refreshButton) return;

  refreshButton.addEventListener('click', async () => {
    if (refreshButton.disabled) return;

    // Disable button during refresh
    refreshButton.disabled = true;
    refreshButton.textContent = 'Refreshing...';

    try {
      await loadData(true);
    } finally {
      // Re-enable button
      refreshButton.disabled = false;
      refreshButton.textContent = 'Refresh Data';
    }
  });
}

/**
 * Lazy load content in newly visible tabs
 */
function lazyLoadTabContent(panel) {
  // Check if panel contains charts that need to be loaded
  const containers = panel.querySelectorAll('[id*="Container"]');

  containers.forEach(container => {
    const containerId = container.id;

    // Only load if not already loaded
    if (!lazyLoader.isLoaded(containerId)) {
      // Trigger appropriate chart updates based on container ID
      if (containerId === 'charts2000' && !lazyLoader.isLoaded('charts2000')) {
        lazyLoader.observe('charts2000', () => updateRecentTimelineCharts());
      } else if (containerId === 'pieContainer2000' && !lazyLoader.isLoaded('pieChartContainer')) {
        // Pie chart 2000 is part of pie chart container lazy loading
        lazyLoader.observe('pieChartContainer', () => updatePieCharts());
      } else if (containerId === 'objectTypeContainer2000' && !lazyLoader.isLoaded('objectTypeContainer')) {
        lazyLoader.observe('objectTypeContainer', () => updateObjectTypeCharts());
      } else if (containerId === 'nationalityContainer2000' && !lazyLoader.isLoaded('nationalityContainer')) {
        lazyLoader.observe('nationalityContainer', () => updateNationalityCharts());
      } else if (containerId === 'exhibitionContainer2000' && !lazyLoader.isLoaded('exhibitionContainer')) {
        lazyLoader.observe('exhibitionContainer', () => updateExhibitionCharts());
      }
    }
  });
}

// Check if DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    waitForChart();
    initBackToTop();
    initNavigationHighlight();
    initTabs();
    initHamburgerMenu();
    initRefreshButton();
  });
} else {
  waitForChart();
  initBackToTop();
  initNavigationHighlight();
  initTabs();
  initHamburgerMenu();
  initRefreshButton();
}
