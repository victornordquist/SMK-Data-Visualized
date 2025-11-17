/**
 * Main entry point for SMK Data Visualized application
 */
import { CONFIG } from './config.js';
import { fetchAllDataIncremental, getCachedData } from './api/smkApi.js';
import { groupByYear } from './data/normalize.js';
import { createLineChart, updateLineChart, createStackedAreaChart, updateStackedAreaChart } from './charts/chartFactory.js';
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
  updateCreatorDepictedChart
} from './charts/barCharts.js';
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
  getCreatorDepictedGenderData
} from './stats/calculator.js';
import {
  showErrorMessage,
  showSuccessMessage,
  updateLoadingIndicator,
  hideLoadingIndicator
} from './utils/ui.js';
import { debounce, throttle } from './utils/debounce.js';
import { LazyLoadManager } from './utils/lazyLoad.js';

// Global state
let artworks = [];

// Performance optimization managers
const lazyLoader = new LazyLoadManager();
let isInitialLoad = true;

// Chart instances
let femaleChartInstance, maleChartInstance, unknownChartInstance, genderPieInstance;
let femaleChart2000Instance, maleChart2000Instance, unknownChart2000Instance, genderPie2000Instance;
let objectTypeChartInstance, objectTypeChartPercentInstance;
let nationalityChartInstance, nationalityChartPercentInstance;
let objectTypeChart2000Instance, nationalityChart2000Instance;
let techniquesChartInstance, techniquesChartPercentInstance;
let materialsChartInstance, materialsChartPercentInstance;
let exhibitionChartInstance, exhibitionChart2000Instance;
let onDisplayChartInstance;
let genderDistributionTimelineInstance;
let displayDistributionTimelineInstance;
let creatorDepictedChartInstance;

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
  container.innerHTML = surpassYears.length ?
    `<h2>Years where female acquisitions surpassed male:</h2><ul>${surpassYears.map(y => `<li>${y}: ${femaleGrouped[y]} vs ${maleGrouped[y] || 0}</li>`).join("")}</ul>` :
    "<p>No years where female acquisitions surpass male.</p>";
}

/**
 * List materials where female acquisitions surpass male
 */
function listFemaleMaterialsSurpass(items) {
  const counts = {};
  items.forEach(a => {
    if (a.materials && a.materials.length && a.gender === "Female") {
      a.materials.forEach(m => counts[m] = (counts[m] || 0) + 1);
    }
  });

  const maleCounts = {};
  items.forEach(a => {
    if (a.materials && a.materials.length && a.gender === "Male") {
      a.materials.forEach(m => maleCounts[m] = (maleCounts[m] || 0) + 1);
    }
  });

  const surpass = Object.keys(counts).filter(m => (counts[m] || 0) > (maleCounts[m] || 0));
  const container = document.getElementById("femaleMaterialsSurpass");

  if (surpass.length === 0) {
    container.innerHTML = "<p>No materials where female acquisitions surpass male.</p>";
  } else {
    container.innerHTML = `<h2>Materials where female acquisitions surpass male:</h2>
      <ul>${surpass.map(m => `<li>${m}: ${counts[m]} vs ${maleCounts[m] || 0}</li>`).join("")}</ul>`;
  }
}

/**
 * List object types where female acquisitions surpass male
 */
function listFemaleObjectTypesSurpass(items) {
  const counts = {};
  items.forEach(a => {
    if (a.object_type && a.gender === "Female") counts[a.object_type] = (counts[a.object_type] || 0) + 1;
  });

  const maleCounts = {};
  items.forEach(a => {
    if (a.object_type && a.gender === "Male") maleCounts[a.object_type] = (maleCounts[a.object_type] || 0) + 1;
  });

  const surpass = Object.keys(counts).filter(o => (counts[o] || 0) > (maleCounts[o] || 0));
  const container = document.getElementById("femaleObjectTypesSurpass");

  if (surpass.length === 0) {
    container.innerHTML = "<p>No object types where female acquisitions surpass male.</p>";
  } else {
    container.innerHTML = `<h2>Object types where female acquisitions surpass male:</h2>
      <ul>${surpass.map(o => `<li>${o}: ${counts[o]} vs ${maleCounts[o] || 0}</li>`).join("")}</ul>`;
  }
}

/**
 * Update statistics display
 */
function updateStatsDisplay() {
  if (artworks.length === 0) return;

  const allYears = calculateStats(artworks);
  const recent = calculateStats(artworks.filter(a => a.acquisitionYear >= CONFIG.dateRanges.recentStart && a.acquisitionYear <= CONFIG.dateRanges.recentEnd));
  const onDisplayData = getOnDisplayData(artworks);

  const grid = document.getElementById('statsGrid');
  grid.innerHTML = `
    <div class="stat-card">
      <div class="stat-value">${allYears.total.toLocaleString()}</div>
      <div class="stat-label">Total Artworks</div>
      <div class="stat-subtext">with acquisition dates</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${allYears.stats.Male.toLocaleString()}</div>
      <div class="stat-label">Male Artists</div>
      <div class="stat-subtext">${allYears.malePercent}% of collection</div>
    </div>
    <div class="stat-card female">
      <div class="stat-value">${allYears.stats.Female.toLocaleString()}</div>
      <div class="stat-label">Female Artists</div>
      <div class="stat-subtext">${allYears.femalePercent}% of collection</div>
    </div>
    <div class="stat-card unknown">
      <div class="stat-value">${allYears.stats.Unknown.toLocaleString()}</div>
      <div class="stat-label">Unknown Gender</div>
      <div class="stat-subtext">${allYears.unknownPercent}% of collection</div>
    </div>
    <div class="stat-card female">
      <div class="stat-value">${recent.stats.Female.toLocaleString()}</div>
      <div class="stat-label">Female (2000-2025)</div>
      <div class="stat-subtext">${recent.femalePercent}% of recent acquisitions</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${recent.stats.Male.toLocaleString()}</div>
      <div class="stat-label">Male (2000-2025)</div>
      <div class="stat-subtext">${recent.malePercent}% of recent acquisitions</div>
    </div>
    <div class="stat-card female">
      <div class="stat-value">${onDisplayData.displayed.Female.toLocaleString()}</div>
      <div class="stat-label">Female On Display</div>
      <div class="stat-subtext">${onDisplayData.femaleData[2]}% of female works</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">${onDisplayData.displayed.Male.toLocaleString()}</div>
      <div class="stat-label">Male On Display</div>
      <div class="stat-subtext">${onDisplayData.maleData[2]}% of male works</div>
    </div>
  `;
}

/**
 * Generate insights
 */
function generateInsights() {
  if (artworks.length === 0) return;

  const allYears = calculateStats(artworks);
  const recent = calculateStats(artworks.filter(a => a.acquisitionYear >= CONFIG.dateRanges.recentStart && a.acquisitionYear <= CONFIG.dateRanges.recentEnd));

  // Timeline insight
  const femaleGrowth = parseFloat(recent.femalePercent) - parseFloat(allYears.femalePercent);
  const trendDirection = femaleGrowth > 0 ? 'increased' : 'decreased';
  const trendWord = Math.abs(femaleGrowth) > 5 ? 'significantly' : 'slightly';

  const timelineBox = document.getElementById('timelineInsight');
  timelineBox.innerHTML = `
    <p><strong>Historical Overview:</strong> The collection includes ${allYears.total.toLocaleString()} artworks with acquisition dates.
    Male artists represent ${allYears.malePercent}% while female artists represent ${allYears.femalePercent}% of the collection.
    ${allYears.unknownPercent}% have unknown or unclear gender attribution.</p>
  `;
  timelineBox.style.display = 'block';

  // Recent trends insight
  const recentBox = document.getElementById('recentInsight');
  recentBox.innerHTML = `
    <p><strong>Recent Trends (2000-2025):</strong> Female representation has ${trendWord} ${trendDirection} to ${recent.femalePercent}%
    (${Math.abs(femaleGrowth).toFixed(1)} percentage points ${femaleGrowth > 0 ? 'higher' : 'lower'} than the historical average).
    This represents ${recent.stats.Female.toLocaleString()} acquisitions of works by female artists in the past 25 years.</p>
    ${femaleGrowth > 0 ?
      '<p>This positive trend suggests increased efforts to address gender imbalance in the collection.</p>' :
      '<p>This indicates that recent acquisition patterns mirror historical gender distribution.</p>'}
  `;
  recentBox.style.display = 'block';

  // Exhibition insights
  const exhibitionData = getExhibitionData(artworks);
  const exhibitionData2000 = getExhibitionData(artworks.filter(a => a.acquisitionYear >= CONFIG.dateRanges.recentStart && a.acquisitionYear <= CONFIG.dateRanges.recentEnd));

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
    <p><strong>Exhibition Patterns (All Years):</strong> ${percentExhibitedMale}% of works by male artists have been exhibited at least once,
    compared to ${percentExhibitedFemale}% of works by female artists. On average, works by male artists appear in ${avgExhMale} exhibitions,
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
    <p><strong>Recent Exhibition Patterns (2000-2025 Acquisitions):</strong> Among recently acquired works, ${percentExhibited2000Male}% of male artists' works
    and ${percentExhibited2000Female}% of female artists' works have been exhibited. Recent acquisitions by male artists average ${avgExh2000Male} exhibitions per work,
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
    (${onDisplayData.displayed.Male.toLocaleString()} of ${onDisplayData.total.Male.toLocaleString()} works), compared to
    ${percentDisplayedFemale}% of works by female artists (${onDisplayData.displayed.Female.toLocaleString()} of ${onDisplayData.total.Female.toLocaleString()} works).</p>
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
  const items2000 = artworks.filter(a => a.acquisitionYear >= CONFIG.dateRanges.recentStart && a.acquisitionYear <= CONFIG.dateRanges.recentEnd);

  if (femaleChart2000Instance) {
    updateLineChart(femaleChart2000Instance, groupByYear(items2000, "Female"), CONFIG.colors.female);
  } else {
    femaleChart2000Instance = createLineChart("femaleChart2000", groupByYear(items2000, "Female"), CONFIG.colors.female);
  }

  if (maleChart2000Instance) {
    updateLineChart(maleChart2000Instance, groupByYear(items2000, "Male"), CONFIG.colors.male);
  } else {
    maleChart2000Instance = createLineChart("maleChart2000", groupByYear(items2000, "Male"), CONFIG.colors.male);
  }

  if (unknownChart2000Instance) {
    updateLineChart(unknownChart2000Instance, groupByYear(items2000, "Unknown"), CONFIG.colors.unknown);
  } else {
    unknownChart2000Instance = createLineChart("unknownChart2000", groupByYear(items2000, "Unknown"), CONFIG.colors.unknown);
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

  const items2000 = artworks.filter(a => a.acquisitionYear >= CONFIG.dateRanges.recentStart && a.acquisitionYear <= CONFIG.dateRanges.recentEnd);
  if (genderPie2000Instance) {
    updateGenderPie(genderPie2000Instance, items2000);
  } else {
    genderPie2000Instance = createGenderPie(items2000, "genderPie2000");
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

  const items2000 = artworks.filter(a => a.acquisitionYear >= CONFIG.dateRanges.recentStart && a.acquisitionYear <= CONFIG.dateRanges.recentEnd);
  objectTypeChart2000Instance = updateOrCreateObjectTypeChart(items2000, "objectTypeChart2000", objectTypeChart2000Instance);
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

  const items2000 = artworks.filter(a => a.acquisitionYear >= CONFIG.dateRanges.recentStart && a.acquisitionYear <= CONFIG.dateRanges.recentEnd);
  nationalityChart2000Instance = updateOrCreateNationalityChart(items2000, "nationalityChart2000", nationalityChart2000Instance);
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

  const items2000exhibitions = artworks.filter(a => a.acquisitionYear >= CONFIG.dateRanges.recentStart && a.acquisitionYear <= CONFIG.dateRanges.recentEnd);
  if (items2000exhibitions.length > 0) {
    exhibitionChart2000Instance = updateOrCreateExhibitionChart(items2000exhibitions, "exhibitionChart2000", exhibitionChart2000Instance);
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
 * Update all visualizations with current artwork data
 * Uses lazy loading for charts below the fold
 */
function updateAllVisualizations() {
  if (artworks.length === 0) return;

  // Always update stats and insights (above the fold)
  updateStatsDisplay();
  generateInsights();

  // Always render timeline charts (above the fold)
  updateTimelineCharts();

  if (isInitialLoad) {
    // Setup lazy loading for below-the-fold charts
    lazyLoader.observe('charts2000', () => updateRecentTimelineCharts());
    lazyLoader.observe('pieChartContainer', () => updatePieCharts());
    lazyLoader.observe('genderDistributionTimelineContainer', () => updateGenderDistributionTimeline());
    lazyLoader.observe('objectTypeContainer', () => updateObjectTypeCharts());
    lazyLoader.observe('nationalityContainer', () => updateNationalityCharts());
    lazyLoader.observe('techniquesContainer', () => updateTechniquesMaterialsCharts());
    lazyLoader.observe('exhibitionContainer', () => updateExhibitionCharts());
    lazyLoader.observe('onDisplayContainer', () => updateOnDisplayChart());
    lazyLoader.observe('displayDistributionTimelineContainer', () => updateDisplayDistributionTimeline());
    lazyLoader.observe('creatorDepictedContainer', () => updateCreatorDepictedChartView());

    isInitialLoad = false;
  } else {
    // On data updates, update all loaded charts
    if (lazyLoader.isLoaded('charts2000')) updateRecentTimelineCharts();
    if (lazyLoader.isLoaded('pieChartContainer')) updatePieCharts();
    if (lazyLoader.isLoaded('genderDistributionTimelineContainer')) updateGenderDistributionTimeline();
    if (lazyLoader.isLoaded('objectTypeContainer')) updateObjectTypeCharts();
    if (lazyLoader.isLoaded('nationalityContainer')) updateNationalityCharts();
    if (lazyLoader.isLoaded('techniquesContainer')) updateTechniquesMaterialsCharts();
    if (lazyLoader.isLoaded('exhibitionContainer')) updateExhibitionCharts();
    if (lazyLoader.isLoaded('onDisplayContainer')) updateOnDisplayChart();
    if (lazyLoader.isLoaded('displayDistributionTimelineContainer')) updateDisplayDistributionTimeline();
    if (lazyLoader.isLoaded('creatorDepictedContainer')) updateCreatorDepictedChartView();
  }

  // Update text-based insights
  listFemaleSurpassYears(artworks);
  listFemaleMaterialsSurpass(artworks);
  listFemaleObjectTypesSurpass(artworks);
}

/**
 * Debounced version of updateAllVisualizations for incremental data loading
 */
const debouncedUpdateVisualizations = debounce(updateAllVisualizations, CONFIG.performance.debounceDelay);

/**
 * Initialize the application
 */
async function init() {
  // Check cache first
  const cachedData = getCachedData();
  if (cachedData && cachedData.length > 0) {
    artworks = cachedData;
    updateAllVisualizations();
    hideLoadingIndicator();
    showSuccessMessage(`Loaded ${artworks.length.toLocaleString()} artworks from cache`);
    return;
  }

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
    showSuccessMessage(`Successfully loaded ${artworks.length.toLocaleString()} artworks`);
  } catch (error) {
    hideLoadingIndicator();
    showErrorMessage(`Failed to load data: ${error.message}. Please try refreshing the page.`);
  }
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

// Check if DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', waitForChart);
} else {
  waitForChart();
}
