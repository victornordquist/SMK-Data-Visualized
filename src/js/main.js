/**
 * Main entry point for SMK Data Visualized application
 */
import { CONFIG } from './config.js';
import { fetchAllDataIncremental, getCachedData, clearCachedData, getCacheMetadata, loadFromLocalJSON } from './api/smkApi.js';
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
  createImageAvailabilityChart,
  updateImageAvailabilityChart,
  createCreatorDepictedChart,
  updateCreatorDepictedChart,
  createDimensionChart,
  updateDimensionChart,
  createAreaDistributionChart,
  updateAreaDistributionChart,
  createBirthYearHistogramChart,
  updateBirthYearHistogramChart,
  createCreationYearHistogramChart,
  updateCreationYearHistogramChart,
  createExhibitionAvgChart,
  updateExhibitionAvgChart,
  createExhibitionPercentChart,
  updateExhibitionPercentChart
} from './charts/barCharts.js';
import { createWorldMap, updateWorldMap } from './charts/worldMap.js';
import { createDepartmentSankeyChart, updateDepartmentSankeyChart } from './charts/sankey.js';
import { createDepictionMap, updateDepictionMap, updateDepictionMapGender } from './charts/depictionMap.js';
import { createColorTreemap, updateColorTreemap, createColorFamilyTimelineChart, updateColorFamilyTimelineChart } from './charts/colorCharts.js';
import { createArtistScatterplot, updateArtistScatterplot, renderTopArtistsLists } from './charts/artistCharts.js';
import { createNationalityDivergingChart, updateNationalityDivergingChart } from './charts/nationalityDiverging.js';
import {
  calculateStats,
  getObjectTypeData,
  getNationalityData,
  getTopAttributeData,
  getExhibitionData,
  getExhibitionMetrics,
  getOnDisplayData,
  convertToPercentages,
  getGenderDistributionOverTime,
  getCreatorDepictedGenderData,
  getDimensionData,
  getAreaDistributionData,
  getAcquisitionLagData,
  getAcquisitionLagDistribution,
  getFemaleTrendData,
  getBirthYearData,
  getCreationYearData,
  getDepartmentGenderData,
  getHasImageData,
  getDepictedLocationData,
  getColorTreemapData,
  getColorTimelineData,
  getArtistData
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
import { hasStorageConsent, initConsentBanner } from './utils/consent.js';
import { debounce } from './utils/debounce.js';
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
// Note: femaleChartInstance, maleChartInstance, unknownChartInstance removed (charts no longer exist)
let genderPieInstance;
// Note: femaleChart2000Instance, maleChart2000Instance, unknownChart2000Instance removed (charts no longer exist)
let genderPie2000Instance;
let objectTypeChartInstance, objectTypeChartPercentInstance;
let nationalityDivergingChartInstance;
let objectTypeChart2000Instance, objectTypeChartPercent2000Instance;
let techniquesChartInstance, techniquesChartPercentInstance;
let materialsChartInstance, materialsChartPercentInstance;
let exhibitionAvgChartInstance, exhibitionPercentChartInstance;
let onDisplayChartInstance;
let genderDistributionTimelineInstance;
let creatorDepictedChartInstance;
let dimensionChartInstance;
let areaDistributionChartInstance;
let acquisitionLagChartInstance;
let lagDistributionChartInstance;
let worldMapInstance;
let femaleTrendChartInstance;
let birthYearChartInstance;
let creationYearChartInstance;
let departmentSankeyInstance;
let hasImageChartInstance;
let depictionMapInstance;
let depictionDistanceChartInstance;
let artistScatterChartInstance;
let colorTimelineMaleChartInstance;
let colorTimelineFemaleChartInstance;

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
    // Add summary insight wrapped in insight-box
    const insightBox = document.createElement('div');
    insightBox.className = 'insight-box';

    const summary = document.createElement('p');
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
    insightBox.appendChild(summary);

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
    insightBox.appendChild(ul);
    container.appendChild(insightBox);
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

  // Recent trends insight
  const femaleGrowth = parseFloat(recent.femalePercent) - parseFloat(allYears.femalePercent);
  const trendDirection = femaleGrowth > 0 ? 'increased' : 'decreased';
  const trendWord = Math.abs(femaleGrowth) > 5 ? 'significantly' : 'slightly';

  // Recent trends insight
  const recentBox = document.getElementById('recentInsight');
  if (recentBox) {
    recentBox.innerHTML = `
      <p><strong>Recent Trends 2000-2025 (n=${recent.total.toLocaleString()}):</strong> Female representation has ${trendWord} ${trendDirection} to ${recent.femalePercent}%
      (${Math.abs(femaleGrowth).toFixed(1)} percentage points ${femaleGrowth > 0 ? 'higher' : 'lower'} than the historical average).
      This represents ${recent.stats.Female.toLocaleString()} acquisitions of works by female artists in the past 25 years.</p>
      ${femaleGrowth > 0 ?
        '<p>This positive trend suggests increased efforts to address gender imbalance in the collection.</p>' :
        '<p>This indicates that recent acquisition patterns mirror historical gender distribution.</p>'}
    `;
    recentBox.style.display = 'block';
  }

  // Exhibition insights
  const exhibitionData = getExhibitionData(artworks);

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
    ${parseFloat(percentExhibitedFemale) > parseFloat(percentExhibitedMale) ?
      '<p>Female artists\' works are more likely to be exhibited, suggesting strong curatorial interest.</p>' :
      parseFloat(percentExhibitedFemale) < parseFloat(percentExhibitedMale) ?
        '<p>Male artists\' works are more frequently exhibited, which may reflect both the larger number of works in the collection and curatorial priorities.</p>' :
        '<p>Works by male and female artists are exhibited at similar rates.</p>'}
  `;
  exhibitionBox.style.display = 'block';
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
    ${parseFloat(percentDisplayedFemale) > parseFloat(percentDisplayedMale) ?
      '<p>Female artists have higher representation in current displays, indicating institutional commitment to visibility.</p>' :
      parseFloat(percentDisplayedFemale) < parseFloat(percentDisplayedMale) ?
        '<p>Male artists have higher representation in current displays, which may reflect collection size differences and curatorial decisions.</p>' :
        '<p>Both genders have equal representation in current displays.</p>'}
  `;
  onDisplayBox.style.display = 'block';
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
    updatePercentageStackChart(genderDistributionTimelineInstance, timelineData.years, timelineData.malePercent, timelineData.femalePercent, timelineData.unknownPercent, timelineData.maleCount, timelineData.femaleCount, timelineData.unknownCount);
  } else {
    genderDistributionTimelineInstance = createPercentageStackChart(timelineData.years, timelineData.malePercent, timelineData.femalePercent, timelineData.unknownPercent, "genderDistributionTimeline", timelineData.maleCount, timelineData.femaleCount, timelineData.unknownCount);
  }
}

/**
 * Update female trend chart
 */
function updateFemaleTrendChartView() {
  const trendData = getFemaleTrendData(artworks, artworks, 1975);

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

  // Compare first 25 years to last 25 years
  const halfwayPoint = Math.floor(data.femalePercents.length / 2);
  const avgEarly = data.femalePercents.slice(0, halfwayPoint).reduce((a, b) => a + b, 0) / halfwayPoint;
  const avgRecent = data.femalePercents.slice(halfwayPoint).reduce((a, b) => a + b, 0) / (data.femalePercents.length - halfwayPoint);
  const change = avgRecent - avgEarly;
  const vsCollection = avgRecent - data.collectionAverage;

  // Calculate the year ranges
  const firstYear = data.years[0];
  const lastYear = data.years[data.years.length - 1];
  const midYear = data.years[halfwayPoint];
  const earlyYears = `${firstYear}-${data.years[halfwayPoint - 1]}`;
  const recentYears = `${midYear}-${lastYear}`;

  let insightText = `<strong>50-Year Trend Analysis:</strong> `;

  if (change > 5) {
    insightText += `Acquisitions of female artists' works have <strong>increased significantly</strong> from an average of ${avgEarly.toFixed(1)}% (${earlyYears}) to ${avgRecent.toFixed(1)}% (${recentYears}), showing a positive shift of ${change.toFixed(1)} percentage points over the 50-year period.`;
  } else if (change > 0) {
    insightText += `There has been a <strong>modest increase</strong> in female artist acquisitions, rising from ${avgEarly.toFixed(1)}% (${earlyYears}) to ${avgRecent.toFixed(1)}% (${recentYears}).`;
  } else {
    insightText += `Female artist representation in recent acquisitions (${avgRecent.toFixed(1)}%, ${recentYears}) is relatively stable compared to the earlier period (${avgEarly.toFixed(1)}%, ${earlyYears}).`;
  }

  insightText += ` Recent acquisitions are ${vsCollection > 0 ? 'above' : 'below'} the overall collection average of ${data.collectionAverage.toFixed(1)}% by ${Math.abs(vsCollection).toFixed(1)} percentage points.`;

  insightDiv.innerHTML = `<p>${insightText}</p>`;
  insightDiv.style.display = 'block';
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
  // Get top 10 nationalities from all artworks
  const nationalityData = getNationalityData(artworks);
  const top10Labels = nationalityData.labels.slice(0, 10);
  const top10Male = nationalityData.maleData.slice(0, 10);
  const top10Female = nationalityData.femaleData.slice(0, 10);
  const top10Unknown = nationalityData.unknownData.slice(0, 10);

  // Create or update diverging bar chart
  if (nationalityDivergingChartInstance) {
    updateNationalityDivergingChart(nationalityDivergingChartInstance, top10Labels, top10Male, top10Female, top10Unknown);
  } else {
    nationalityDivergingChartInstance = createNationalityDivergingChart(top10Labels, top10Male, top10Female, top10Unknown, "nationalityDivergingChart");
  }
}

/**
 * Update birth year histogram chart
 */
function updateBirthYearCharts() {
  const birthYearData = getBirthYearData(artworks);

  // Return early if no data
  if (!birthYearData.labels.length) {
    return;
  }

  // Combined chart showing both male and female artists (use percentage data with counts in tooltip)
  if (birthYearChartInstance) {
    updateBirthYearHistogramChart(birthYearChartInstance, birthYearData.labels, birthYearData.malePercent, birthYearData.femalePercent, birthYearData.unknownPercent, birthYearData.maleData, birthYearData.femaleData, birthYearData.unknownData);
  } else {
    birthYearChartInstance = createBirthYearHistogramChart(birthYearData.labels, birthYearData.malePercent, birthYearData.femalePercent, birthYearData.unknownPercent, "birthYearChart", "All", true, birthYearData.maleData, birthYearData.femaleData, birthYearData.unknownData);
  }
}

/**
 * Update creation year histogram chart
 */
function updateCreationYearCharts() {
  const creationYearData = getCreationYearData(artworks);

  // Return early if no data
  if (!creationYearData.labels.length) {
    return;
  }

  // Combined chart showing both male and female artists (use percentage data with counts in tooltip)
  if (creationYearChartInstance) {
    updateCreationYearHistogramChart(creationYearChartInstance, creationYearData.labels, creationYearData.malePercent, creationYearData.femalePercent, creationYearData.unknownPercent, creationYearData.maleData, creationYearData.femaleData, creationYearData.unknownData);
  } else {
    creationYearChartInstance = createCreationYearHistogramChart(creationYearData.labels, creationYearData.malePercent, creationYearData.femalePercent, creationYearData.unknownPercent, "creationYearChart", "All", true, creationYearData.maleData, creationYearData.femaleData, creationYearData.unknownData);
  }
}

/**
 * Update department Sankey diagram
 */
function updateDepartmentSankey() {
  const departmentData = getDepartmentGenderData(artworks);

  // Return early if no data
  if (!departmentData.nodes || departmentData.nodes.length === 0) {
    return;
  }

  // Create or update Sankey diagram
  if (departmentSankeyInstance) {
    departmentSankeyInstance = updateDepartmentSankeyChart(departmentData, "departmentSankeyChart");
  } else {
    departmentSankeyInstance = createDepartmentSankeyChart(departmentData, "departmentSankeyChart");
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
  // Get metrics for all years
  const metrics = getExhibitionMetrics(artworks);

  // Average exhibitions chart
  if (exhibitionAvgChartInstance) {
    updateExhibitionAvgChart(
      exhibitionAvgChartInstance,
      metrics.avgData.labels,
      metrics.avgData.values,
      metrics.totalWorks,
      metrics.totalExhibitions
    );
  } else {
    exhibitionAvgChartInstance = createExhibitionAvgChart(
      metrics.avgData.labels,
      metrics.avgData.values,
      metrics.totalWorks,
      metrics.totalExhibitions,
      'exhibitionAvgChart'
    );
  }

  // Percentage exhibited chart
  if (exhibitionPercentChartInstance) {
    updateExhibitionPercentChart(
      exhibitionPercentChartInstance,
      metrics.percentData.labels,
      metrics.percentData.values,
      metrics.totalWorks,
      metrics.worksExhibited
    );
  } else {
    exhibitionPercentChartInstance = createExhibitionPercentChart(
      metrics.percentData.labels,
      metrics.percentData.values,
      metrics.totalWorks,
      metrics.worksExhibited,
      'exhibitionPercentChart'
    );
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
 * Update has image chart
 */
function updateHasImageChart() {
  const hasImageData = getHasImageData(artworks);
  if (hasImageChartInstance) {
    updateImageAvailabilityChart(hasImageChartInstance, hasImageData.labels, hasImageData.withImagePercent, hasImageData.withoutImagePercent);
  } else {
    hasImageChartInstance = createImageAvailabilityChart(hasImageData.labels, hasImageData.withImagePercent, hasImageData.withoutImagePercent, "hasImageChart");
  }
  updateHasImageInsight(hasImageData);
}

/**
 * Update insight text for has image analysis
 */
function updateHasImageInsight(hasImageData) {
  if (artworks.length === 0) return;

  const percentWithImageMale = hasImageData.maleData[2];
  const percentWithImageFemale = hasImageData.femaleData[2];

  const hasImageBox = document.getElementById('hasImageInsight');
  hasImageBox.innerHTML = `
    <p><strong>Digitization Status:</strong> ${percentWithImageMale}% of works by male artists have been digitized
    (${hasImageData.withImage.Male.toLocaleString()} of n=${hasImageData.total.Male.toLocaleString()}), compared to
    ${percentWithImageFemale}% of works by female artists (${hasImageData.withImage.Female.toLocaleString()} of n=${hasImageData.total.Female.toLocaleString()}).
    Unknown gender: ${hasImageData.withImage.Unknown.toLocaleString()} of n=${hasImageData.total.Unknown.toLocaleString()} digitized.</p>
    ${percentWithImageFemale > percentWithImageMale ?
      '<p>Female artists\' works have higher digitization rates, indicating stronger institutional prioritization for online visibility and documentation.</p>' :
      percentWithImageFemale < percentWithImageMale ?
        '<p>Male artists\' works have higher digitization rates, which may reflect historical collection priorities and resource allocation decisions.</p>' :
        '<p>Both genders have equal digitization rates.</p>'}
  `;
  hasImageBox.style.display = 'block';
}

/**
 * Update creator-depicted gender relationship chart
 */
function updateCreatorDepictedChartView() {
  const data = getCreatorDepictedGenderData(artworks);

  if (creatorDepictedChartInstance) {
    updateCreatorDepictedChart(creatorDepictedChartInstance, data.labels, data.maleDepictedPercent, data.femaleDepictedPercent, data.unknownDepictedPercent, data.maleDepictedCount, data.femaleDepictedCount, data.unknownDepictedCount);
  } else {
    creatorDepictedChartInstance = createCreatorDepictedChart(data.labels, data.maleDepictedPercent, data.femaleDepictedPercent, data.unknownDepictedPercent, "creatorDepictedChart", data.maleDepictedCount, data.femaleDepictedCount, data.unknownDepictedCount);
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

  let insightHTML = `<p><strong>Analysis based on ${data.artworksWithDepictions.toLocaleString()} artworks (${data.coveragePercent}% of collection)</strong> where depicted persons are identified.</p>`;

  // Analyze male creators
  const maleCreatorDepictsMale = data.percentages.Male.Male.toFixed(1);
  const maleCreatorDepictsFemale = data.percentages.Male.Female.toFixed(1);

  if (data.creatorCounts.Male > 0) {
    insightHTML += `<p><strong>Male creators</strong> depict: ${maleCreatorDepictsMale}% male, ${maleCreatorDepictsFemale}% female</p>`;
  }

  // Analyze female creators
  if (data.creatorCounts.Female > 0) {
    const femaleCreatorDepictsMale = data.percentages.Female.Male.toFixed(1);
    const femaleCreatorDepictsFemale = data.percentages.Female.Female.toFixed(1);
    insightHTML += `<p><strong>Female creators</strong> depict: ${femaleCreatorDepictsMale}% male, ${femaleCreatorDepictsFemale}% female</p>`;
  } else {
    insightHTML += `<p><strong>Female creators:</strong> No data available in portraits with identified persons.</p>`;
  }

  insightEl.innerHTML = insightHTML;
  insightEl.style.display = 'block';
}

/**
 * Update depiction geography map and distance chart
 */
function updateDepictionGeography() {
  const locationData = getDepictedLocationData(artworks);

  // Update or create map
  if (depictionMapInstance) {
    updateDepictionMap(locationData, "depictionMapContainer");
  } else {
    depictionMapInstance = createDepictionMap(locationData, "depictionMapContainer");
  }

  // Update or create distance chart
  if (depictionDistanceChartInstance) {
    updateBarChart(depictionDistanceChartInstance, locationData.distanceBins, locationData.distanceDistribution.Male, locationData.distanceDistribution.Female, locationData.distanceDistribution.Unknown);
  } else {
    depictionDistanceChartInstance = createBarChart(locationData.distanceBins, locationData.distanceDistribution.Male, locationData.distanceDistribution.Female, locationData.distanceDistribution.Unknown, "depictionDistanceChart");
  }

  // Update insights
  updateDepictionGeographyInsight(locationData);
}

/**
 * Update insight text for depiction geography analysis
 */
function updateDepictionGeographyInsight(data) {
  const insightEl = document.getElementById('depictionGeographyInsight');
  if (!insightEl) return;

  if (data.artworksWithLocation === 0) {
    insightEl.style.display = 'none';
    return;
  }

  const coveragePercent = ((data.artworksWithLocation / data.totalArtworks) * 100).toFixed(1);

  let insightHTML = `<p><strong>Analysis based on ${data.artworksWithLocation.toLocaleString()} artworks (${coveragePercent}% of collection)</strong> with identified geographic locations.</p>`;

  // Show sample sizes to provide context
  insightHTML += `<p><strong>Sample sizes:</strong> Male artists: ${data.totals.Male.toLocaleString()} works, Female artists: ${data.totals.Female.toLocaleString()} works</p>`;

  // Use median instead of average for more robust comparison
  insightHTML += `<p><strong>Typical Distance from Copenhagen (Median):</strong> The median distance for male artists' works is ${data.maleStats.median} km, while for female artists it's ${data.femaleStats.median} km. `;

  const medianDiff = Math.abs(data.maleStats.median - data.femaleStats.median);

  if (medianDiff < 50) {
    insightHTML += `Both genders show very similar geographic ranges (within ${medianDiff} km), suggesting comparable patterns in depicted locations.</p>`;
  } else if (data.maleStats.median > data.femaleStats.median) {
    insightHTML += `Male artists' typical depictions are ${medianDiff} km farther from Copenhagen.</p>`;
  } else {
    insightHTML += `Female artists' typical depictions are ${medianDiff} km farther from Copenhagen.</p>`;
  }

  // Add note about outliers if average differs significantly from median
  const maleAvgMedianDiff = Math.abs(data.maleStats.avg - data.maleStats.median);
  const femaleAvgMedianDiff = Math.abs(data.femaleStats.avg - data.femaleStats.median);

  if (maleAvgMedianDiff > 200 || femaleAvgMedianDiff > 200) {
    insightHTML += `<p><strong>Note:</strong> Averages (Male: ${data.maleStats.avg} km, Female: ${data.femaleStats.avg} km) differ significantly from medians due to outliers - a few artworks depicting very distant locations (e.g., Greenland, max ${data.femaleStats.max > data.maleStats.max ? data.femaleStats.max : data.maleStats.max} km). The median provides a more typical representation.</p>`;
  }

  // Analyze local vs international split
  const maleLocal = data.distanceDistribution.Male[0]; // 0-50km
  const femaleLocal = data.distanceDistribution.Female[0];
  const maleLocalPercent = data.totals.Male > 0 ? (maleLocal / data.totals.Male * 100).toFixed(1) : 0;
  const femaleLocalPercent = data.totals.Female > 0 ? (femaleLocal / data.totals.Female * 100).toFixed(1) : 0;

  insightHTML += `<p><strong>Local Depictions (within 50km):</strong> ${maleLocalPercent}% of male artists' works and ${femaleLocalPercent}% of female artists' works depict locations close to Copenhagen, `;

  if (femaleLocalPercent > maleLocalPercent) {
    insightHTML += `suggesting female artists had somewhat more focus on local Danish scenes.</p>`;
  } else if (maleLocalPercent > femaleLocalPercent) {
    insightHTML += `suggesting male artists had somewhat more focus on local Danish scenes.</p>`;
  } else {
    insightHTML += `showing similar patterns of local vs. international subject matter.</p>`;
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

  let insightHTML = `<p><strong>Analysis of ${dimensionData.totalCount.toLocaleString()} paintings with dimension data:</strong></p>`;

  // Compare male vs female average areas
  if (stats.Male.count > 0 && stats.Female.count > 0) {
    const maleAvg = stats.Male.avgArea;
    const femaleAvg = stats.Female.avgArea;
    const sizeDiff = ((maleAvg - femaleAvg) / femaleAvg * 100).toFixed(1);
    const larger = maleAvg > femaleAvg ? 'male' : 'female';
    const smaller = maleAvg > femaleAvg ? 'female' : 'male';

    insightHTML += `<p><strong>Average size comparison:</strong> Paintings by ${larger} artists are on average ${Math.abs(sizeDiff)}% larger than those by ${smaller} artists. `;
    insightHTML += `Male artists: ${stats.Male.avgArea.toFixed(0)} cm² (n=${stats.Male.count.toLocaleString()}), `;
    insightHTML += `Female artists: ${stats.Female.avgArea.toFixed(0)} cm² (n=${stats.Female.count.toLocaleString()}).</p>`;

    // Compare medians (more robust to outliers)
    const maleMedian = stats.Male.medianArea;
    const femaleMedian = stats.Female.medianArea;
    const medianDiff = ((maleMedian - femaleMedian) / femaleMedian * 100).toFixed(1);

    insightHTML += `<p><strong>Median size (less affected by outliers):</strong> Male: ${maleMedian.toFixed(0)} cm², Female: ${femaleMedian.toFixed(0)} cm² `;
    insightHTML += `(${Math.abs(medianDiff)}% ${maleMedian > femaleMedian ? 'larger' : 'smaller'} for male artists).</p>`;

    // Interpretation
    if (Math.abs(parseFloat(sizeDiff)) > 10) {
      insightHTML += `<p><strong>Interpretation:</strong> There is a notable difference in painting sizes between genders. `;
      if (maleAvg > femaleAvg) {
        insightHTML += `Works by male artists tend to be larger on average, which historically correlates with perceived importance and prominent museum placement.</p>`;
      } else {
        insightHTML += `Interestingly, works by female artists in this collection tend to be larger on average, counter to typical historical patterns.</p>`;
      }
    } else {
      insightHTML += `<p><strong>Interpretation:</strong> The size difference between genders is relatively modest, suggesting comparable scale ambitions across genders in this collection.</p>`;
    }
  } else {
    insightHTML += `<p>Insufficient data for comparison between genders.</p>`;
  }

  insightEl.innerHTML = insightHTML;
  insightEl.style.display = 'block';
}

/**
 * Update color charts
 */
function updateColorCharts() {
  // Get color timeline data
  const colorTimelineData = getColorTimelineData(artworks);

  // Update or create male color timeline chart
  if (colorTimelineMaleChartInstance) {
    updateColorFamilyTimelineChart(
      colorTimelineMaleChartInstance,
      colorTimelineData.labels,
      colorTimelineData.colorFamilies,
      colorTimelineData.maleData
    );
  } else {
    colorTimelineMaleChartInstance = createColorFamilyTimelineChart(
      colorTimelineData.labels,
      colorTimelineData.colorFamilies,
      colorTimelineData.maleData,
      "colorTimelineMaleChart"
    );
  }

  // Update or create female color timeline chart
  if (colorTimelineFemaleChartInstance) {
    updateColorFamilyTimelineChart(
      colorTimelineFemaleChartInstance,
      colorTimelineData.labels,
      colorTimelineData.colorFamilies,
      colorTimelineData.femaleData
    );
  } else {
    colorTimelineFemaleChartInstance = createColorFamilyTimelineChart(
      colorTimelineData.labels,
      colorTimelineData.colorFamilies,
      colorTimelineData.femaleData,
      "colorTimelineFemaleChart"
    );
  }

  // Get color treemap data
  const colorTreemapData = getColorTreemapData(artworks);

  // Create or update male color treemap
  createColorTreemap(colorTreemapData.male, 'colorTreemapMaleContainer', 'Male Artists');

  // Create or update female color treemap
  createColorTreemap(colorTreemapData.female, 'colorTreemapFemaleContainer', 'Female Artists');
}

/**
 * Update artist scatterplot and top 10 lists
 */
function updateArtistCharts() {
  const artistData = getArtistData(artworks);

  // Update or create scatterplot
  if (artistScatterChartInstance) {
    updateArtistScatterplot(artistScatterChartInstance, artistData.scatterData);
  } else {
    artistScatterChartInstance = createArtistScatterplot(artistData.scatterData, 'artistScatterChart');
  }

  // Render top 10 lists
  renderTopArtistsLists(artistData.topMale, artistData.topFemale, 'topArtistsLists');

  // Update insights
  updateArtistInsights(artistData);
}

/**
 * Update artist analysis insights
 */
function updateArtistInsights(artistData) {
  const insightEl = document.getElementById('artistsInsight');
  if (!insightEl) return;

  let insightHTML = '';

  if (artistData.stats.totalArtists < 10) {
    insightHTML = '<p>Insufficient artist data for meaningful insights.</p>';
    insightEl.innerHTML = insightHTML;
    insightEl.style.display = 'block';
    return;
  }

  insightHTML += `<p><strong>Artist Representation:</strong> The collection includes works by ${artistData.stats.totalArtists.toLocaleString()} identified artists `;
  insightHTML += `(${artistData.stats.maleArtistCount.toLocaleString()} male, ${artistData.stats.femaleArtistCount.toLocaleString()} female, ${artistData.stats.unknownArtistCount.toLocaleString()} unknown gender).</p>`;

  // Compare top artists
  if (artistData.topMale.length > 0 && artistData.topFemale.length > 0) {
    const topMaleCount = artistData.topMale[0].artworkCount;
    const topFemaleCount = artistData.topFemale[0].artworkCount;
    const ratio = (topMaleCount / topFemaleCount).toFixed(1);

    insightHTML += `<p><strong>Collection Depth Leaders:</strong> The most collected male artist (${artistData.topMale[0].name}) has ${topMaleCount} works, `;
    insightHTML += `while the most collected female artist (${artistData.topFemale[0].name}) has ${topFemaleCount} works`;

    if (ratio > 1.5) {
      insightHTML += ` — a ${ratio}:1 ratio, showing significantly deeper collection from the leading male artist.</p>`;
    } else if (ratio < 0.67) {
      insightHTML += ` — the female artist is actually more heavily collected.</p>`;
    } else {
      insightHTML += ` — relatively comparable collection depth for the leading artists of each gender.</p>`;
    }
  }

  // Concentration analysis
  const top10MaleTotal = artistData.topMale.reduce((sum, a) => sum + a.artworkCount, 0);
  const top10FemaleTotal = artistData.topFemale.reduce((sum, a) => sum + a.artworkCount, 0);
  const maleTotal = artistData.maleArtists.reduce((sum, a) => sum + a.artworkCount, 0);
  const femaleTotal = artistData.femaleArtists.reduce((sum, a) => sum + a.artworkCount, 0);

  const maleConcentration = maleTotal > 0 ? (top10MaleTotal / maleTotal * 100).toFixed(1) : 0;
  const femaleConcentration = femaleTotal > 0 ? (top10FemaleTotal / femaleTotal * 100).toFixed(1) : 0;

  insightHTML += `<p><strong>Collection Concentration:</strong> The top 10 male artists account for ${maleConcentration}% of all works by male artists, `;
  insightHTML += `while the top 10 female artists account for ${femaleConcentration}% of all works by female artists. `;

  if (femaleConcentration > maleConcentration * 1.3) {
    insightHTML += `This suggests the museum collects more deeply from a smaller pool of female artists, with less breadth in female representation.</p>`;
  } else if (maleConcentration > femaleConcentration * 1.3) {
    insightHTML += `This suggests the museum collects more deeply from a smaller pool of male artists.</p>`;
  } else {
    insightHTML += `This shows similar concentration patterns across both genders.</p>`;
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

  let insightHTML = `<p><strong>Analysis of ${lagData.totalCount.toLocaleString()} artworks with both production and acquisition dates:</strong></p>`;

  // Compare male vs female average lags
  if (stats.Male.count > 0 && stats.Female.count > 0) {
    const maleAvg = stats.Male.avgLag;
    const femaleAvg = stats.Female.avgLag;
    const lagDiff = maleAvg - femaleAvg;
    const shorter = maleAvg < femaleAvg ? 'male' : 'female';
    const longer = maleAvg < femaleAvg ? 'female' : 'male';

    insightHTML += `<p><strong>Average acquisition lag:</strong> Works by ${shorter} artists are acquired on average ${Math.abs(lagDiff).toFixed(0)} years sooner after production than works by ${longer} artists. `;
    insightHTML += `Male artists: ${stats.Male.avgLag.toFixed(0)} years (n=${stats.Male.count.toLocaleString()}), `;
    insightHTML += `Female artists: ${stats.Female.avgLag.toFixed(0)} years (n=${stats.Female.count.toLocaleString()}).</p>`;

    // Compare medians
    const maleMedian = stats.Male.medianLag;
    const femaleMedian = stats.Female.medianLag;

    insightHTML += `<p><strong>Median lag:</strong> Male: ${maleMedian.toFixed(0)} years, Female: ${femaleMedian.toFixed(0)} years.</p>`;

    // Compare recent collecting rates (2000-2025)
    const maleRecent = stats.Male.recentPercent;
    const femaleRecent = stats.Female.recentPercent;

    insightHTML += `<p><strong>Recent collecting (2000-2025):</strong> ${maleRecent.toFixed(1)}% of male artists' works vs ${femaleRecent.toFixed(1)}% of female artists' works were acquired between 2000 and 2025.</p>`;

    // Interpretation
    if (femaleRecent > maleRecent + 10) {
      insightHTML += `<p><strong>Interpretation:</strong> Female artists are significantly more likely to have been acquired recently (2000-2025), suggesting increased focus on collecting works by female artists in recent decades.</p>`;
    } else if (maleRecent > femaleRecent + 10) {
      insightHTML += `<p><strong>Interpretation:</strong> Male artists are more likely to have been acquired recently (2000-2025), while a larger proportion of female artists' works were acquired before 2000.</p>`;
    } else {
      insightHTML += `<p><strong>Interpretation:</strong> Both genders show similar patterns in recent acquisition activity (2000-2025).</p>`;
    }
  } else {
    insightHTML += `<p>Insufficient data for comparison between genders.</p>`;
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

  if (isInitialLoad) {
    // Setup lazy loading for below-the-fold charts
    // Note: charts2000 and pieChartContainer removed - replaced by stats cards
    lazyLoader.observe('femaleTrendContainer', () => updateFemaleTrendChartView());
    lazyLoader.observe('genderDistributionTimelineContainer', () => updateGenderDistributionTimeline());
    lazyLoader.observe('objectTypeContainer', () => updateObjectTypeCharts());
    lazyLoader.observe('worldMapContainer', () => updateWorldMapView());
    lazyLoader.observe('nationalityContainer', () => updateNationalityCharts());
    lazyLoader.observe('birthYearContainer', () => updateBirthYearCharts());
    lazyLoader.observe('creationYearContainer', () => updateCreationYearCharts());
    lazyLoader.observe('techniquesContainer', () => updateTechniquesMaterialsCharts());
    lazyLoader.observe('departmentSankeyContainer', () => updateDepartmentSankey());
    lazyLoader.observe('exhibitionContainer', () => updateExhibitionCharts());
    lazyLoader.observe('onDisplayContainer', () => updateOnDisplayChart());
    lazyLoader.observe('hasImageContainer', () => updateHasImageChart());
    lazyLoader.observe('creatorDepictedContainer', () => updateCreatorDepictedChartView());
    lazyLoader.observe('depictionGeographyContainer', () => updateDepictionGeography());
    lazyLoader.observe('dimensionsContainer', () => updateDimensionCharts());
    lazyLoader.observe('acquisitionLagContainer', () => updateAcquisitionLagCharts());
    lazyLoader.observe('colorContainer', () => updateColorCharts());
    lazyLoader.observe('artistsContainer', () => updateArtistCharts());

    isInitialLoad = false;
  } else {
    // On data updates, update all loaded charts
    if (lazyLoader.isLoaded('femaleTrendContainer')) updateFemaleTrendChartView();
    if (lazyLoader.isLoaded('genderDistributionTimelineContainer')) updateGenderDistributionTimeline();
    if (lazyLoader.isLoaded('objectTypeContainer')) updateObjectTypeCharts();
    if (lazyLoader.isLoaded('worldMapContainer')) updateWorldMapView();
    if (lazyLoader.isLoaded('nationalityContainer')) updateNationalityCharts();
    if (lazyLoader.isLoaded('birthYearContainer')) updateBirthYearCharts();
    if (lazyLoader.isLoaded('creationYearContainer')) updateCreationYearCharts();
    if (lazyLoader.isLoaded('techniquesContainer')) updateTechniquesMaterialsCharts();
    if (lazyLoader.isLoaded('departmentSankeyContainer')) updateDepartmentSankey();
    if (lazyLoader.isLoaded('exhibitionContainer')) updateExhibitionCharts();
    if (lazyLoader.isLoaded('onDisplayContainer')) updateOnDisplayChart();
    if (lazyLoader.isLoaded('hasImageContainer')) updateHasImageChart();
    if (lazyLoader.isLoaded('creatorDepictedContainer')) updateCreatorDepictedChartView();
    if (lazyLoader.isLoaded('depictionGeographyContainer')) updateDepictionGeography();
    if (lazyLoader.isLoaded('dimensionsContainer')) updateDimensionCharts();
    if (lazyLoader.isLoaded('acquisitionLagContainer')) updateAcquisitionLagCharts();
    if (lazyLoader.isLoaded('colorContainer')) updateColorCharts();
    if (lazyLoader.isLoaded('artistsContainer')) updateArtistCharts();
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
  // Check storage consent
  const consent = hasStorageConsent();
  const canUseCache = consent === true;

  // Clear cache if force refresh
  if (forceRefresh) {
    await clearCachedData();
    hideCacheStatus();
  }

  // Check cache first (only if consent is given)
  if (canUseCache && !forceRefresh) {
    const cachedData = await getCachedData();
    if (cachedData && cachedData.length > 0) {
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
  }

  // Show loading indicator
  showLoadingIndicator();
  hideCacheStatus();

  // Fetch data with progress updates (using debounced updates for performance)
  try {
    // Check if we should load from local JSON file
    if (CONFIG.api.useLocalJSON) {
      artworks = await loadFromLocalJSON(
        (totalCount, currentArtworks) => {
          artworks = currentArtworks;
          updateLoadingIndicator(totalCount);
        }
      );
    } else {
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
    }

    // Final update with all data (no debounce)
    updateAllVisualizations();
    hideLoadingIndicator();

    // Show success message
    const consentStatus = hasStorageConsent();
    if (consentStatus === true) {
      showSuccessMessage(`Successfully loaded ${artworks.length.toLocaleString()} artworks from API`);

      // Show cache status after data is cached
      setTimeout(async () => {
        const metadata = await getCacheMetadata();
        if (metadata) {
          showCacheStatus(metadata.timestamp, metadata.itemCount);
        }
      }, 100);
    } else if (consentStatus === false) {
      showSuccessMessage(`Successfully loaded ${artworks.length.toLocaleString()} artworks from API (caching disabled)`);
    } else {
      showSuccessMessage(`Successfully loaded ${artworks.length.toLocaleString()} artworks from API`);
    }

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
  // Select all sections that contain a section-anchor
  const anchors = document.querySelectorAll('.section-anchor');

  if (navLinks.length === 0 || anchors.length === 0) return;

  window.addEventListener('scroll', () => {
    let current = '';

    anchors.forEach(anchor => {
      const section = anchor.closest('section');
      if (!section) return;

      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      // Trigger when we're past the top of the section (with offset for sticky nav)
      if (window.scrollY >= sectionTop - 150) {
        current = anchor.id;
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
      if (containerId === 'objectTypeContainer2000' && !lazyLoader.isLoaded('objectTypeContainer')) {
        lazyLoader.observe('objectTypeContainer', () => updateObjectTypeCharts());
      } else if (containerId === 'nationalityContainer2000' && !lazyLoader.isLoaded('nationalityContainer')) {
        lazyLoader.observe('nationalityContainer', () => updateNationalityCharts());
      } else if (containerId === 'exhibitionContainer2000' && !lazyLoader.isLoaded('exhibitionContainer')) {
        lazyLoader.observe('exhibitionContainer', () => updateExhibitionCharts());
      }
    }
  });
}

/**
 * Initialize all UI components and start data loading
 */
function initializeApplication() {
  // Initialize consent banner first
  initConsentBanner(
    () => {
      // On accept - reload data to use cache
      loadData(false);
    },
    () => {
      // On decline - continue without cache
    }
  );

  waitForChart();
  initBackToTop();
  initNavigationHighlight();
  initTabs();
  initHamburgerMenu();
  initRefreshButton();
}

// Check if DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApplication);
} else {
  initializeApplication();
}
