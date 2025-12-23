/**
 * Main entry point for SMK Data Visualized application
 */
import { CONFIG } from './config.js';
import { fetchAllDataIncremental, getCachedData, clearCachedData, getCacheMetadata, loadFromLocalJSON } from './api/smkApi.js';
import { createFemaleTrendChart, updateFemaleTrendChart } from './charts/lineCharts.js';
import {
  createBarStackChart,
  updateBarStackChart,
  createHorizontalBarChart,
  updateHorizontalBarChart,
  createBarChart,
  updateBarChart,
  createPercentageStackChart,
  updatePercentageStackChart,
  createDisplayStatusChart,
  updateDisplayStatusChart,
  createImageAvailabilityChart,
  updateImageAvailabilityChart,
  createCreatorDepictedChart,
  updateCreatorDepictedChart,
  createDimensionChart,
  updateDimensionChart,
  createAreaChart,
  updateAreaChart,
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
import { createDepictionMap, updateDepictionMap } from './charts/depictionMap.js';
import { createColorTreemap, createColorFamilyTimelineChart, updateColorFamilyTimelineChart } from './charts/colorCharts.js';
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

// Performance optimization managers
const lazyLoader = new LazyLoadManager();
let isInitialLoad = true;

// Chart instances
let objectTypeChartInstance, objectTypeChartPercentInstance;
let nationalityDivergingChartInstance;
let techniquesChartInstance, techniquesChartPercentInstance;
let materialsChartInstance, materialsChartPercentInstance;
let exhibitionAvgChartInstance, exhibitionPercentChartInstance;
let onDisplayChartInstance;
let genderDistributionTimelineInstance;
let creatorDepictedChartInstance;
let dimensionChartInstance;
let areaChartInstance;
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
 * Update statistics display
 */
function updateStatsDisplay() {
  if (artworks.length === 0) return;

  const allYears = calculateStats(artworks);

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
    artworks.length.toLocaleString(),
    'Works',
    'in the SMK collection'
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
    'Gender data complete',
    `${knownGenderCount.toLocaleString()} of ${allYears.total.toLocaleString()} records`,
    parseFloat(knownGenderPercent) >= 70 ? '' : 'unknown'
  ));
}

/**
 * Generate insights
 */
function generateInsights() {
  if (artworks.length === 0) return;

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
    <p><strong>Exhibition History:</strong> Among male artists' works (n=${exhibitionData.totalWorks.Male.toLocaleString()}), ${percentExhibitedMale}% have been exhibited at least once, appearing in an average of ${avgExhMale} exhibitions per work. For female artists' works (n=${exhibitionData.totalWorks.Female.toLocaleString()}), ${percentExhibitedFemale}% have been exhibited, with an average of ${avgExhFemale} exhibitions per work. This data reflects the museum's curatorial programming choices and historical exhibition patterns across the collection's lifetime.</p>
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
    <p><strong>Gallery Display Rates:</strong> Currently, ${percentDisplayedMale}% of male artists' works are on display (${onDisplayData.displayed.Male.toLocaleString()} of ${onDisplayData.total.Male.toLocaleString()} works), while ${percentDisplayedFemale}% of female artists' works are displayed (${onDisplayData.displayed.Female.toLocaleString()} of ${onDisplayData.total.Female.toLocaleString()} works). For works with unknown creator gender, ${onDisplayData.displayed.Unknown.toLocaleString()} of ${onDisplayData.total.Unknown.toLocaleString()} are currently visible in the museum's galleries.</p>
  `;
  onDisplayBox.style.display = 'block';
}

// ============================================================================
// SECTION 1: OVERVIEW (STATS)
// Matches index.html line 74: #statsContainer
// ============================================================================

// No update function needed - updateStatsDisplay() is already in the right place

// ============================================================================
// SECTION 2: ARTISTS
// Matches index.html lines 100-179
// ============================================================================

/**
 * Update artist scatterplot and top 10 lists
 * Matches: #artistScatterChart (line 114) and #topArtistsLists (line 124)
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

  insightHTML += `<p><strong>Breadth vs. depth of artist representation:</strong> The collection comprises works by ${artistData.stats.totalArtists.toLocaleString()} identified artists (${artistData.stats.maleArtistCount.toLocaleString()} male, ${artistData.stats.femaleArtistCount.toLocaleString()} female, ${artistData.stats.unknownArtistCount.toLocaleString()} unknown gender). `;

  if (artistData.topMale.length > 0 && artistData.topFemale.length > 0) {
    const topMaleCount = artistData.topMale[0].artworkCount;
    const topFemaleCount = artistData.topFemale[0].artworkCount;
    const ratio = (topMaleCount / topFemaleCount).toFixed(1);
    const top10MaleTotal = artistData.topMale.reduce((sum, a) => sum + a.artworkCount, 0);
    const top10FemaleTotal = artistData.topFemale.reduce((sum, a) => sum + a.artworkCount, 0);
    const maleTotal = artistData.maleArtists.reduce((sum, a) => sum + a.artworkCount, 0);
    const femaleTotal = artistData.femaleArtists.reduce((sum, a) => sum + a.artworkCount, 0);
    const maleConcentration = maleTotal > 0 ? (top10MaleTotal / maleTotal * 100).toFixed(1) : 0;
    const femaleConcentration = femaleTotal > 0 ? (top10FemaleTotal / femaleTotal * 100).toFixed(1) : 0;

    insightHTML += `The most represented male artist (${artistData.topMale[0].name}) accounts for ${topMaleCount} works, while the leading female artist (${artistData.topFemale[0].name}) has ${topFemaleCount} works (${ratio}:1 ratio). Looking at concentration patterns, the top 10 male artists represent ${maleConcentration}% of all male artist works, while the top 10 female artists represent ${femaleConcentration}% of female artist works, indicating how institutional collecting balances deep engagement with select artists against broad representation across many creators.</p>`;
  } else {
    insightHTML += `Limited data prevents detailed comparison of collection depth patterns.</p>`;
  }

  insightEl.innerHTML = insightHTML;
  insightEl.style.display = 'block';
}

/**
 * Update world map visualization
 * Matches: #worldMapContainer (line 128)
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
 * Matches: #nationalityContainer (line 150)
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
 * Matches: #birthYearContainer (line 161)
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
 * Matches: #creationYearContainer (line 174)
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

// ============================================================================
// SECTION 3: ACQUISITION
// Matches index.html lines 181-239
// ============================================================================

/**
 * Update gender distribution timeline chart
 * Matches: #genderDistributionTimelineContainer (line 183)
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
 * Matches: #femaleTrendContainer (line 192)
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

  let insightText = `<strong>50 year trend analysis:</strong> `;

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
 * Update acquisition lag charts
 * Matches: #acquisitionLagContainer (line 204)
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
  updateAcquisitionLagInsights(lagData);
}

/**
 * Update acquisition lag insights text
 */
function updateAcquisitionLagInsights(lagData) {
  const insightEl = document.getElementById('acquisitionLagInsight');
  if (!insightEl) return;

  const stats = lagData.stats;

  // Check if we have enough data
  if (stats.Male.count === 0 && stats.Female.count === 0) {
    insightEl.style.display = 'none';
    return;
  }

  let insightHTML = '';

  if (stats.Male.count > 0 && stats.Female.count > 0) {
    const maleAvg = stats.Male.avgLag;
    const femaleAvg = stats.Female.avgLag;
    const lagDiff = Math.abs(maleAvg - femaleAvg);
    const maleMedian = stats.Male.medianLag;
    const femaleMedian = stats.Female.medianLag;

    insightHTML = `<p><strong>Time between creation and acquisition:</strong> Analyzing ${lagData.totalCount.toLocaleString()} artworks with both production and acquisition dates reveals how quickly works enter the museum collection after being created. Works by male artists show an average lag of ${stats.Male.avgLag.toFixed(0)} years (median: ${maleMedian.toFixed(0)} years, n=${stats.Male.count.toLocaleString()}), while works by female artists average ${stats.Female.avgLag.toFixed(0)} years (median: ${femaleMedian.toFixed(0)} years, n=${stats.Female.count.toLocaleString()}), a difference of ${lagDiff.toFixed(0)} years.</p>`;
  } else {
    insightHTML = `<p><strong>Time between creation and acquisition:</strong> Limited data for ${lagData.totalCount.toLocaleString()} artworks prevents meaningful gender comparison of acquisition lag patterns.</p>`;
  }

  insightEl.innerHTML = insightHTML;
  insightEl.style.display = 'block';
}

/**
 * Update department Sankey diagram
 * Matches: #departmentSankeyContainer (line 235)
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

// ============================================================================
// SECTION 4: ARTWORKS
// Matches index.html lines 241-271
// ============================================================================

/**
 * Update object type charts
 * Matches: #objectTypeContainer (line 245)
 */
function updateObjectTypeCharts() {
  objectTypeChartInstance = updateOrCreateObjectTypeChart(artworks, "objectTypeChart", objectTypeChartInstance);

  // Add percentage chart
  const objectTypeData = getObjectTypeData(artworks);
  const objectTypePercentData = convertToPercentages(objectTypeData);

  if (objectTypeChartPercentInstance) {
    updatePercentageStackChart(objectTypeChartPercentInstance, objectTypePercentData.labels, objectTypePercentData.maleData, objectTypePercentData.femaleData, objectTypePercentData.unknownData, objectTypePercentData.maleCount, objectTypePercentData.femaleCount, objectTypePercentData.unknownCount);
  } else {
    objectTypeChartPercentInstance = createPercentageStackChart(objectTypePercentData.labels, objectTypePercentData.maleData, objectTypePercentData.femaleData, objectTypePercentData.unknownData, "objectTypeChartPercent", objectTypePercentData.maleCount, objectTypePercentData.femaleCount, objectTypePercentData.unknownCount);
  }
}

/**
 * Update techniques and materials charts
 * Matches: #techniquesContainer (line 254) and #materialsContainer (line 263)
 */
function updateTechniquesMaterialsCharts() {
  techniquesChartInstance = updateOrCreateTopAttributeChart(artworks, "techniques", "techniquesChart", techniquesChartInstance);

  // Add techniques percentage chart
  const techniquesData = getTopAttributeData(artworks, "techniques");
  const techniquesPercentData = convertToPercentages(techniquesData);

  if (techniquesChartPercentInstance) {
    updatePercentageStackChart(techniquesChartPercentInstance, techniquesPercentData.labels, techniquesPercentData.maleData, techniquesPercentData.femaleData, techniquesPercentData.unknownData, techniquesPercentData.maleCount, techniquesPercentData.femaleCount, techniquesPercentData.unknownCount);
  } else {
    techniquesChartPercentInstance = createPercentageStackChart(techniquesPercentData.labels, techniquesPercentData.maleData, techniquesPercentData.femaleData, techniquesPercentData.unknownData, "techniquesChartPercent", techniquesPercentData.maleCount, techniquesPercentData.femaleCount, techniquesPercentData.unknownCount);
  }

  materialsChartInstance = updateOrCreateTopAttributeChart(artworks, "materials", "materialsChart", materialsChartInstance);

  // Add materials percentage chart
  const materialsData = getTopAttributeData(artworks, "materials");
  const materialsPercentData = convertToPercentages(materialsData);

  if (materialsChartPercentInstance) {
    updatePercentageStackChart(materialsChartPercentInstance, materialsPercentData.labels, materialsPercentData.maleData, materialsPercentData.femaleData, materialsPercentData.unknownData, materialsPercentData.maleCount, materialsPercentData.femaleCount, materialsPercentData.unknownCount);
  } else {
    materialsChartPercentInstance = createPercentageStackChart(materialsPercentData.labels, materialsPercentData.maleData, materialsPercentData.femaleData, materialsPercentData.unknownData, "materialsChartPercent", materialsPercentData.maleCount, materialsPercentData.femaleCount, materialsPercentData.unknownCount);
  }
}

// ============================================================================
// SECTION 5: SUBJECTS
// Matches index.html lines 273-324
// ============================================================================

/**
 * Update creator-depicted gender relationship chart
 * Matches: #creatorDepictedContainer (line 275)
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

  const maleCreatorDepictsMale = data.percentages.Male.Male.toFixed(1);
  const maleCreatorDepictsFemale = data.percentages.Male.Female.toFixed(1);

  let insightHTML = `<p><strong>Portraiture and figural subject gender analysis:</strong> Among ${data.artworksWithDepictions.toLocaleString()} works (${data.coveragePercent}% of collection) with identified depicted persons, distinct patterns emerge in who creates images of whom. Male artists depict male subjects in ${maleCreatorDepictsMale}% of their figural works and female subjects in ${maleCreatorDepictsFemale}% of cases.`;

  if (data.creatorCounts.Female > 0) {
    const femaleCreatorDepictsMale = data.percentages.Female.Male.toFixed(1);
    const femaleCreatorDepictsFemale = data.percentages.Female.Female.toFixed(1);
    insightHTML += ` Female artists depict male subjects in ${femaleCreatorDepictsMale}% of their figural works and female subjects in ${femaleCreatorDepictsFemale}% of cases.</p>`;
  } else {
    insightHTML += ` The collection currently lacks data on depicted persons for works by female artists with identified subjects, limiting gender comparison in this category.</p>`;
  }

  insightEl.innerHTML = insightHTML;
  insightEl.style.display = 'block';
}

/**
 * Update depiction geography map and distance chart
 * Matches: #depictionGeographyContainer (line 288)
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
  const medianDiff = Math.abs(data.maleStats.median - data.femaleStats.median);
  const maleLocal = data.distanceDistribution.Male[0]; // 0-50km
  const femaleLocal = data.distanceDistribution.Female[0];
  const maleLocalPercent = data.totals.Male > 0 ? (maleLocal / data.totals.Male * 100).toFixed(1) : 0;
  const femaleLocalPercent = data.totals.Female > 0 ? (femaleLocal / data.totals.Female * 100).toFixed(1) : 0;
  const maxDistance = data.femaleStats.max > data.maleStats.max ? data.femaleStats.max : data.maleStats.max;
  const maleAvgMedianDiff = Math.abs(data.maleStats.avg - data.maleStats.median);
  const femaleAvgMedianDiff = Math.abs(data.femaleStats.avg - data.femaleStats.median);

  let insightHTML = `<p><strong>Geographic analysis of depicted locations:</strong> Among ${data.artworksWithLocation.toLocaleString()} artworks (${coveragePercent}% of collection) with identified geographic locations depicted in the artwork, we can measure the distance from Copenhagen to understand geographic scope. The analysis includes ${data.totals.Male.toLocaleString()} works by male artists and ${data.totals.Female.toLocaleString()} works by female artists.</p>`;

  insightHTML += `<p><strong>Distance patterns:</strong> The median distance from Copenhagen is ${data.maleStats.median} km for male artists' works and ${data.femaleStats.median} km for female artists' works (${medianDiff} km difference). Looking at proximity to Denmark's capital, ${maleLocalPercent}% of male artists' works depict locations within 50 km of Copenhagen, compared to ${femaleLocalPercent}% for female artists, indicating the balance between local Danish scenes and international subject matter across the collection.</p>`;

  if (maleAvgMedianDiff > 200 || femaleAvgMedianDiff > 200) {
    insightHTML += `<p><strong>Statistical note:</strong> The median values provide more accurate typical distances than averages (Male: ${data.maleStats.avg} km, Female: ${data.femaleStats.avg} km) because some artworks depict very distant locations such as Greenland (maximum distance: ${maxDistance} km), which significantly skew the arithmetic means upward.</p>`;
  }

  insightEl.innerHTML = insightHTML;
  insightEl.style.display = 'block';
}

// ============================================================================
// SECTION 6: CHARACTERISTICS
// Matches index.html lines 326-383
// ============================================================================

/**
 * Update color charts
 * Matches: #colortreemapContainer (line 331) and #colorContainer (line 345)
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
 * Update dimension charts for paintings
 * Matches: #dimensionsContainer (line 328)
 */
function updateDimensionCharts() {
  // Get dimension data for paintings
  const dimensionData = getDimensionData(artworks, "Painting");
  const areaDistData = getAreaDistributionData(artworks, "Painting");

  // Update or create dimension comparison chart (height and width)
  if (dimensionChartInstance) {
    updateDimensionChart(dimensionChartInstance, dimensionData.labels, dimensionData.maleData, dimensionData.femaleData, dimensionData.unknownData);
  } else {
    dimensionChartInstance = createDimensionChart(dimensionData.labels, dimensionData.maleData, dimensionData.femaleData, dimensionData.unknownData, "dimensionChart");
  }

  // Update or create area comparison chart
  if (areaChartInstance) {
    updateAreaChart(areaChartInstance, dimensionData.labels, dimensionData.maleData, dimensionData.femaleData, dimensionData.unknownData);
  } else {
    areaChartInstance = createAreaChart(dimensionData.labels, dimensionData.maleData, dimensionData.femaleData, dimensionData.unknownData, "areaChart");
  }

  // Update or create area distribution chart
  if (areaDistributionChartInstance) {
    updateAreaDistributionChart(areaDistributionChartInstance, areaDistData.labels, areaDistData.malePercent, areaDistData.femalePercent, areaDistData.unknownPercent);
  } else {
    areaDistributionChartInstance = createAreaDistributionChart(areaDistData.labels, areaDistData.malePercent, areaDistData.femalePercent, areaDistData.unknownPercent, "areaDistributionChart");
  }

  // Update insights
  updateDimensionInsights(dimensionData);
}

/**
 * Update dimension insights text
 */
function updateDimensionInsights(dimensionData) {
  const insightEl = document.getElementById('dimensionsInsight');
  if (!insightEl) return;

  const stats = dimensionData.stats;

  // Check if we have enough data
  if (stats.Male.count === 0 && stats.Female.count === 0) {
    insightEl.style.display = 'none';
    return;
  }

  let insightHTML = '';

  if (stats.Male.count > 0 && stats.Female.count > 0) {
    const maleAvg = stats.Male.avgArea;
    const femaleAvg = stats.Female.avgArea;
    const sizeDiff = ((maleAvg - femaleAvg) / femaleAvg * 100).toFixed(1);
    const maleMedian = stats.Male.medianArea;
    const femaleMedian = stats.Female.medianArea;

    insightHTML = `<p><strong>Painting dimensions analysis:</strong> Examining ${dimensionData.totalCount.toLocaleString()} paintings with complete dimension data reveals scale patterns across creator genders. The average dimensions are ${stats.Male.avgHeight.toFixed(1)} cm × ${stats.Male.avgWidth.toFixed(1)} cm for male artists (n=${stats.Male.count.toLocaleString()}) and ${stats.Female.avgHeight.toFixed(1)} cm × ${stats.Female.avgWidth.toFixed(1)} cm for female artists (n=${stats.Female.count.toLocaleString()}). When examining total canvas area, male artists' paintings average ${stats.Male.avgArea.toFixed(0)} cm² while female artists' average ${stats.Female.avgArea.toFixed(0)} cm², a difference of ${Math.abs(sizeDiff)}%. Note that average area is calculated by averaging individual painting areas rather than multiplying average height by average width, which accounts for variation in painting proportions. The median areas are ${maleMedian.toFixed(0)} cm² and ${femaleMedian.toFixed(0)} cm² respectively, with median values providing more robust comparison by minimizing the impact of unusually large or small outlier works.</p>`;
  } else {
    insightHTML = `<p><strong>Painting Dimensions Analysis:</strong> Limited data available for ${dimensionData.totalCount.toLocaleString()} paintings prevents meaningful gender comparison in this category.</p>`;
  }

  insightEl.innerHTML = insightHTML;
  insightEl.style.display = 'block';
}

// ============================================================================
// SECTION 7: VISIBILITY
// Matches index.html lines 385-434
// ============================================================================

/**
 * Update exhibition charts
 * Matches: #exhibitionContainer (line 395)
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
 * Matches: #onDisplayContainer (line 411)
 */
function updateOnDisplayChart() {
  const onDisplayData = getOnDisplayData(artworks);
  if (onDisplayChartInstance) {
    updateDisplayStatusChart(onDisplayChartInstance, onDisplayData.labels, onDisplayData.displayedPercent, onDisplayData.notDisplayedPercent, onDisplayData.displayedCount, onDisplayData.notDisplayedCount);
  } else {
    onDisplayChartInstance = createDisplayStatusChart(onDisplayData.labels, onDisplayData.displayedPercent, onDisplayData.notDisplayedPercent, "onDisplayChart", onDisplayData.displayedCount, onDisplayData.notDisplayedCount);
  }
  updateOnDisplayInsight();
}

/**
 * Update has image chart
 * Matches: #hasImageContainer (line 423)
 */
function updateHasImageChart() {
  const hasImageData = getHasImageData(artworks);
  if (hasImageChartInstance) {
    updateImageAvailabilityChart(hasImageChartInstance, hasImageData.labels, hasImageData.withImagePercent, hasImageData.withoutImagePercent, hasImageData.withImageCount, hasImageData.withoutImageCount);
  } else {
    hasImageChartInstance = createImageAvailabilityChart(hasImageData.labels, hasImageData.withImagePercent, hasImageData.withoutImagePercent, "hasImageChart", hasImageData.withImageCount, hasImageData.withoutImageCount);
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
    <p><strong>Digital Collection Photography:</strong> The museum has photographed and digitized ${percentWithImageMale}% of male artists' works (${hasImageData.withImage.Male.toLocaleString()} of ${hasImageData.total.Male.toLocaleString()} total) and ${percentWithImageFemale}% of female artists' works (${hasImageData.withImage.Female.toLocaleString()} of ${hasImageData.total.Female.toLocaleString()} total). For works with unknown creator gender, ${hasImageData.withImage.Unknown.toLocaleString()} of ${hasImageData.total.Unknown.toLocaleString()} have been photographed.</p>
  `;
  hasImageBox.style.display = 'block';
}

/**
 * Update all visualizations with current artwork data
 * Uses lazy loading for charts below the fold
 */
function updateAllVisualizations() {
  if (artworks.length === 0) return;

  // Always update stats and insights (above the fold)
  updateStatsDisplay();
  generateInsights();

  if (isInitialLoad) {
    // Setup lazy loading for below-the-fold charts
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
