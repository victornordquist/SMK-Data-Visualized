/**
 * Statistics calculation utilities
 */
import { CONFIG } from '../config.js';

/**
 * Calculates gender statistics for a collection of artworks
 * @param {Array<Object>} items - Normalized artwork items
 * @returns {Object} Statistics object with counts and percentages for each gender
 */
export function calculateStats(items) {
  const stats = { Male: 0, Female: 0, Unknown: 0 };
  items.forEach(a => stats[a.gender]++);

  const total = stats.Male + stats.Female + stats.Unknown;
  const malePercent = total > 0 ? ((stats.Male / total) * 100).toFixed(1) : 0;
  const femalePercent = total > 0 ? ((stats.Female / total) * 100).toFixed(1) : 0;
  const unknownPercent = total > 0 ? ((stats.Unknown / total) * 100).toFixed(1) : 0;

  return { stats, total, malePercent, femalePercent, unknownPercent };
}

/**
 * Get object type data grouped by gender
 */
export function getObjectTypeData(items) {
  const counts = {};
  items.forEach(a => {
    if (a.object_type) {
      if (!counts[a.object_type]) counts[a.object_type] = { Male: 0, Female: 0, Unknown: 0 };
      counts[a.object_type][a.gender]++;
    }
  });
  const sorted = Object.entries(counts).sort((a, b) => (b[1].Male + b[1].Female + b[1].Unknown) - (a[1].Male + a[1].Female + a[1].Unknown));
  return {
    labels: sorted.map(e => e[0]),
    maleData: sorted.map(e => e[1].Male),
    femaleData: sorted.map(e => e[1].Female),
    unknownData: sorted.map(e => e[1].Unknown)
  };
}

/**
 * Get nationality data grouped by gender (top 20)
 * Counts unique artists per nationality, not total artworks
 */
export function getNationalityData(items) {
  const counts = {};

  // Track unique artists per nationality and gender
  items.forEach(a => {
    const nat = a.nationality || "Unknown";
    const artist = a.creatorName || "Unknown";

    // Skip if no known artist
    if (artist === "Unknown") return;

    if (!counts[nat]) {
      counts[nat] = {
        Male: new Set(),
        Female: new Set(),
        Unknown: new Set()
      };
    }

    // Add artist to the appropriate gender set for this nationality
    counts[nat][a.gender].add(artist);
  });

  // Convert Sets to counts
  const nationalityCounts = {};
  Object.entries(counts).forEach(([nat, genderSets]) => {
    nationalityCounts[nat] = {
      Male: genderSets.Male.size,
      Female: genderSets.Female.size,
      Unknown: genderSets.Unknown.size
    };
  });

  const sorted = Object.entries(nationalityCounts)
    .sort((a, b) => (b[1].Male + b[1].Female + b[1].Unknown) - (a[1].Male + a[1].Female + a[1].Unknown))
    .slice(0, 20);

  return {
    labels: sorted.map(e => e[0]),
    maleData: sorted.map(e => e[1].Male),
    femaleData: sorted.map(e => e[1].Female),
    unknownData: sorted.map(e => e[1].Unknown)
  };
}

/**
 * Get top attribute data (techniques, materials, etc.)
 */
export function getTopAttributeData(items, attr) {
  const counts = {};
  items.forEach(a => {
    (a[attr] || []).forEach(v => {
      if (!counts[v]) counts[v] = { Male: 0, Female: 0, Unknown: 0 };
      counts[v][a.gender]++;
    });
  });
  const sorted = Object.entries(counts).sort((a, b) => (b[1].Male + b[1].Female + b[1].Unknown) - (a[1].Male + a[1].Female + a[1].Unknown)).slice(0, 20);
  return {
    labels: sorted.map(e => e[0]),
    maleData: sorted.map(e => e[1].Male),
    femaleData: sorted.map(e => e[1].Female),
    unknownData: sorted.map(e => e[1].Unknown)
  };
}

/**
 * Get exhibition statistics by gender
 */
export function getExhibitionData(items) {
  const counts = { Male: 0, Female: 0, Unknown: 0 };
  const worksExhibited = { Male: 0, Female: 0, Unknown: 0 };
  const totalWorks = { Male: 0, Female: 0, Unknown: 0 };

  items.forEach(a => {
    totalWorks[a.gender]++;
    counts[a.gender] += a.exhibitions;
    if (a.exhibitions > 0) {
      worksExhibited[a.gender]++;
    }
  });

  return {
    labels: ["Total Exhibitions", "Works Ever Exhibited", "Avg per Work"],
    maleData: [
      counts.Male,
      worksExhibited.Male,
      totalWorks.Male > 0 ? (counts.Male / totalWorks.Male).toFixed(2) : 0
    ],
    femaleData: [
      counts.Female,
      worksExhibited.Female,
      totalWorks.Female > 0 ? (counts.Female / totalWorks.Female).toFixed(2) : 0
    ],
    unknownData: [
      counts.Unknown,
      worksExhibited.Unknown,
      totalWorks.Unknown > 0 ? (counts.Unknown / totalWorks.Unknown).toFixed(2) : 0
    ],
    totalWorks,
    worksExhibited,
    totalExhibitions: counts
  };
}

/**
 * Get simple exhibition metrics for bar charts
 * Returns average exhibitions per artwork and percentage ever exhibited
 */
export function getExhibitionMetrics(items) {
  const totalWorks = { Male: 0, Female: 0, Unknown: 0 };
  const totalExhibitions = { Male: 0, Female: 0, Unknown: 0 };
  const worksExhibited = { Male: 0, Female: 0, Unknown: 0 };

  items.forEach(a => {
    totalWorks[a.gender]++;
    totalExhibitions[a.gender] += a.exhibitions;
    if (a.exhibitions > 0) {
      worksExhibited[a.gender]++;
    }
  });

  // Calculate averages
  const avgMale = totalWorks.Male > 0 ? totalExhibitions.Male / totalWorks.Male : 0;
  const avgFemale = totalWorks.Female > 0 ? totalExhibitions.Female / totalWorks.Female : 0;
  const avgUnknown = totalWorks.Unknown > 0 ? totalExhibitions.Unknown / totalWorks.Unknown : 0;

  // Calculate percentages ever exhibited
  const percentMale = totalWorks.Male > 0 ? (worksExhibited.Male / totalWorks.Male) * 100 : 0;
  const percentFemale = totalWorks.Female > 0 ? (worksExhibited.Female / totalWorks.Female) * 100 : 0;
  const percentUnknown = totalWorks.Unknown > 0 ? (worksExhibited.Unknown / totalWorks.Unknown) * 100 : 0;

  return {
    // Average exhibitions per artwork
    avgData: {
      labels: ['Male', 'Female', 'Unknown'],
      values: [avgMale, avgFemale, avgUnknown]
    },
    // Percentage ever exhibited
    percentData: {
      labels: ['Male', 'Female', 'Unknown'],
      values: [percentMale, percentFemale, percentUnknown]
    },
    // Raw counts for tooltips
    totalWorks,
    worksExhibited,
    totalExhibitions
  };
}

/**
 * Get on-display statistics by gender
 */
export function getOnDisplayData(items) {
  const displayed = { Male: 0, Female: 0, Unknown: 0 };
  const total = { Male: 0, Female: 0, Unknown: 0 };

  items.forEach(a => {
    total[a.gender]++;
    if (a.onDisplay) {
      displayed[a.gender]++;
    }
  });

  const percentMale = total.Male > 0 ? ((displayed.Male / total.Male) * 100) : 0;
  const percentFemale = total.Female > 0 ? ((displayed.Female / total.Female) * 100) : 0;
  const percentUnknown = total.Unknown > 0 ? ((displayed.Unknown / total.Unknown) * 100) : 0;

  const percentNotDisplayedMale = 100 - percentMale;
  const percentNotDisplayedFemale = 100 - percentFemale;
  const percentNotDisplayedUnknown = 100 - percentUnknown;

  return {
    labels: ["Male", "Female", "Unknown"],
    displayedPercent: [percentMale, percentFemale, percentUnknown],
    notDisplayedPercent: [percentNotDisplayedMale, percentNotDisplayedFemale, percentNotDisplayedUnknown],
    displayed,
    total,
    // Keep old format for compatibility with insight text
    maleData: [displayed.Male, total.Male, percentMale.toFixed(1)],
    femaleData: [displayed.Female, total.Female, percentFemale.toFixed(1)],
    unknownData: [displayed.Unknown, total.Unknown, percentUnknown.toFixed(1)]
  };
}

/**
 * Convert count data to percentages for 100% stacked charts
 */
export function convertToPercentages(data) {
  const percentageData = {
    labels: data.labels,
    maleData: [],
    femaleData: [],
    unknownData: []
  };

  for (let i = 0; i < data.labels.length; i++) {
    const total = data.maleData[i] + data.femaleData[i] + data.unknownData[i];
    if (total > 0) {
      percentageData.maleData.push((data.maleData[i] / total) * 100);
      percentageData.femaleData.push((data.femaleData[i] / total) * 100);
      percentageData.unknownData.push((data.unknownData[i] / total) * 100);
    } else {
      percentageData.maleData.push(0);
      percentageData.femaleData.push(0);
      percentageData.unknownData.push(0);
    }
  }

  return percentageData;
}

/**
 * Get gender distribution over time (percentage per year)
 */
export function getGenderDistributionOverTime(items) {
  const yearData = {};

  items.forEach(a => {
    const year = a.acquisitionYear;
    if (!yearData[year]) {
      yearData[year] = { Male: 0, Female: 0, Unknown: 0 };
    }
    yearData[year][a.gender]++;
  });

  const years = Object.keys(yearData).sort((a, b) => a - b);
  const malePercent = [];
  const femalePercent = [];
  const unknownPercent = [];
  const maleCount = [];
  const femaleCount = [];
  const unknownCount = [];

  years.forEach(year => {
    const total = yearData[year].Male + yearData[year].Female + yearData[year].Unknown;
    maleCount.push(yearData[year].Male);
    femaleCount.push(yearData[year].Female);
    unknownCount.push(yearData[year].Unknown);

    if (total > 0) {
      malePercent.push((yearData[year].Male / total) * 100);
      femalePercent.push((yearData[year].Female / total) * 100);
      unknownPercent.push((yearData[year].Unknown / total) * 100);
    } else {
      malePercent.push(0);
      femalePercent.push(0);
      unknownPercent.push(0);
    }
  });

  return {
    years,
    malePercent,
    femalePercent,
    unknownPercent,
    maleCount,
    femaleCount,
    unknownCount
  };
}

/**
 * Analyze creator gender vs depicted person gender
 * Answers: Who depicts whom? Do male artists depict more women or men?
 * @param {Array<Object>} items - Normalized artwork items
 * @returns {Object} Analysis of creator-depicted gender relationships
 */
export function getCreatorDepictedGenderData(items) {
  // Filter to items with depicted persons
  const itemsWithDepictions = items.filter(item =>
    item.depictedPersons && item.depictedPersons.length > 0
  );

  // Count combinations: creator gender → depicted gender
  const combinations = {
    'Male': { 'Male': 0, 'Female': 0, 'Unknown': 0 },
    'Female': { 'Male': 0, 'Female': 0, 'Unknown': 0 },
    'Unknown': { 'Male': 0, 'Female': 0, 'Unknown': 0 }
  };

  // Count total artworks with depictions by creator gender
  const creatorCounts = { 'Male': 0, 'Female': 0, 'Unknown': 0 };

  itemsWithDepictions.forEach(item => {
    const creatorGender = item.gender;
    creatorCounts[creatorGender]++;

    // Count each depicted person
    item.depictedPersons.forEach(person => {
      const depictedGender = person.gender;
      combinations[creatorGender][depictedGender]++;
    });
  });

  // Calculate percentages for each creator gender
  const percentages = {
    'Male': { 'Male': 0, 'Female': 0, 'Unknown': 0 },
    'Female': { 'Male': 0, 'Female': 0, 'Unknown': 0 },
    'Unknown': { 'Male': 0, 'Female': 0, 'Unknown': 0 }
  };

  ['Male', 'Female', 'Unknown'].forEach(creatorGender => {
    const totalDepicted = combinations[creatorGender]['Male'] +
                          combinations[creatorGender]['Female'] +
                          combinations[creatorGender]['Unknown'];

    if (totalDepicted > 0) {
      percentages[creatorGender]['Male'] = (combinations[creatorGender]['Male'] / totalDepicted) * 100;
      percentages[creatorGender]['Female'] = (combinations[creatorGender]['Female'] / totalDepicted) * 100;
      percentages[creatorGender]['Unknown'] = (combinations[creatorGender]['Unknown'] / totalDepicted) * 100;
    }
  });

  return {
    totalArtworks: items.length,
    artworksWithDepictions: itemsWithDepictions.length,
    coveragePercent: ((itemsWithDepictions.length / items.length) * 100).toFixed(1),
    creatorCounts,
    combinations,
    percentages,
    // Format for chart display
    labels: ['Male creators', 'Female creators', 'Unknown creators'],
    maleDepictedPercent: [percentages['Male']['Male'], percentages['Female']['Male'], percentages['Unknown']['Male']],
    femaleDepictedPercent: [percentages['Male']['Female'], percentages['Female']['Female'], percentages['Unknown']['Female']],
    unknownDepictedPercent: [percentages['Male']['Unknown'], percentages['Female']['Unknown'], percentages['Unknown']['Unknown']],
    // Count arrays for tooltips
    maleDepictedCount: [combinations['Male']['Male'], combinations['Female']['Male'], combinations['Unknown']['Male']],
    femaleDepictedCount: [combinations['Male']['Female'], combinations['Female']['Female'], combinations['Unknown']['Female']],
    unknownDepictedCount: [combinations['Male']['Unknown'], combinations['Female']['Unknown'], combinations['Unknown']['Unknown']]
  };
}

/**
 * Get dimension statistics by gender for paintings
 * Analyzes physical size (area) and height/width distributions
 * @param {Array<Object>} items - Normalized artwork items
 * @param {string} objectType - Object type to filter by (e.g., "Painting")
 * @returns {Object} Dimension statistics by gender
 */
export function getDimensionData(items, objectType = "Painting") {
  // Filter to specified object type with valid dimensions
  const filtered = items.filter(item =>
    item.object_type &&
    item.object_type.toLowerCase() === objectType.toLowerCase() &&
    item.dimensions &&
    item.dimensions.area
  );

  // Group by gender
  const byGender = {
    Male: [],
    Female: [],
    Unknown: []
  };

  filtered.forEach(item => {
    byGender[item.gender].push(item.dimensions);
  });

  // Calculate statistics for each gender
  const stats = {};

  ['Male', 'Female', 'Unknown'].forEach(gender => {
    const dims = byGender[gender];
    const count = dims.length;

    if (count === 0) {
      stats[gender] = {
        count: 0,
        avgArea: 0,
        medianArea: 0,
        avgHeight: 0,
        avgWidth: 0,
        areas: []
      };
      return;
    }

    // Calculate areas in cm² (convert from mm²)
    const areas = dims.map(d => d.area / 100).sort((a, b) => a - b);
    const heights = dims.map(d => d.height / 10).sort((a, b) => a - b); // cm
    const widths = dims.map(d => d.width / 10).sort((a, b) => a - b); // cm

    const sumArea = areas.reduce((a, b) => a + b, 0);
    const sumHeight = heights.reduce((a, b) => a + b, 0);
    const sumWidth = widths.reduce((a, b) => a + b, 0);

    // Median calculation
    const median = arr => {
      const mid = Math.floor(arr.length / 2);
      return arr.length % 2 !== 0 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
    };

    stats[gender] = {
      count,
      avgArea: sumArea / count,
      medianArea: median(areas),
      avgHeight: sumHeight / count,
      avgWidth: sumWidth / count,
      minArea: areas[0],
      maxArea: areas[areas.length - 1],
      areas, // Raw data for histogram
      heights,
      widths
    };
  });

  return {
    objectType,
    totalCount: filtered.length,
    stats,
    // Format for bar chart display (average dimensions)
    labels: ['Avg Height (cm)', 'Avg Width (cm)', 'Avg Area (cm²)'],
    maleData: [
      stats.Male.avgHeight.toFixed(1),
      stats.Male.avgWidth.toFixed(1),
      stats.Male.avgArea.toFixed(0)
    ],
    femaleData: [
      stats.Female.avgHeight.toFixed(1),
      stats.Female.avgWidth.toFixed(1),
      stats.Female.avgArea.toFixed(0)
    ],
    unknownData: [
      stats.Unknown.avgHeight.toFixed(1),
      stats.Unknown.avgWidth.toFixed(1),
      stats.Unknown.avgArea.toFixed(0)
    ]
  };
}

/**
 * Get area distribution data for histogram/box plot visualization
 * Bins artworks by area ranges to show distribution
 * @param {Array<Object>} items - Normalized artwork items
 * @param {string} objectType - Object type to filter by
 * @returns {Object} Binned area distribution by gender
 */
export function getAreaDistributionData(items, objectType = "Painting") {
  // Filter to paintings with valid dimensions
  const filtered = items.filter(item =>
    item.object_type &&
    item.object_type.toLowerCase() === objectType.toLowerCase() &&
    item.dimensions &&
    item.dimensions.area
  );

  // Define area bins (in cm²) - logarithmic scale for better visualization
  const bins = [
    { min: 0, max: 500, label: '< 500' },
    { min: 500, max: 1000, label: '500-1K' },
    { min: 1000, max: 2500, label: '1K-2.5K' },
    { min: 2500, max: 5000, label: '2.5K-5K' },
    { min: 5000, max: 10000, label: '5K-10K' },
    { min: 10000, max: 25000, label: '10K-25K' },
    { min: 25000, max: 50000, label: '25K-50K' },
    { min: 50000, max: Infinity, label: '> 50K' }
  ];

  // Initialize bin counts
  const binCounts = {
    Male: bins.map(() => 0),
    Female: bins.map(() => 0),
    Unknown: bins.map(() => 0)
  };

  // Count artworks in each bin
  filtered.forEach(item => {
    const areaCm2 = item.dimensions.area / 100;
    const binIndex = bins.findIndex(bin => areaCm2 >= bin.min && areaCm2 < bin.max);
    if (binIndex !== -1) {
      binCounts[item.gender][binIndex]++;
    }
  });

  // Convert to percentages within each gender
  const toPercent = (counts, total) =>
    total > 0 ? counts.map(c => (c / total) * 100) : counts.map(() => 0);

  const maleTotal = binCounts.Male.reduce((a, b) => a + b, 0);
  const femaleTotal = binCounts.Female.reduce((a, b) => a + b, 0);
  const unknownTotal = binCounts.Unknown.reduce((a, b) => a + b, 0);

  return {
    labels: bins.map(b => b.label),
    // Absolute counts
    maleData: binCounts.Male,
    femaleData: binCounts.Female,
    unknownData: binCounts.Unknown,
    // Percentage distributions
    malePercent: toPercent(binCounts.Male, maleTotal),
    femalePercent: toPercent(binCounts.Female, femaleTotal),
    unknownPercent: toPercent(binCounts.Unknown, unknownTotal),
    // Totals for reference
    totals: { Male: maleTotal, Female: femaleTotal, Unknown: unknownTotal }
  };
}

/**
 * Get acquisition lag data (time between production and acquisition)
 * Analyzes whether works by different genders are acquired at different rates
 * @param {Array<Object>} items - Normalized artwork items
 * @returns {Object} Acquisition lag statistics by gender
 */
export function getAcquisitionLagData(items) {
  // Filter to items with both production and acquisition years
  const filtered = items.filter(item =>
    item.productionYear &&
    item.acquisitionYear &&
    item.acquisitionYear >= item.productionYear
  );

  // Group by gender
  const byGender = {
    Male: [],
    Female: [],
    Unknown: []
  };

  filtered.forEach(item => {
    const lag = item.acquisitionYear - item.productionYear;
    byGender[item.gender].push({
      lag,
      acquisitionYear: item.acquisitionYear,
      productionYear: item.productionYear
    });
  });

  // Calculate statistics for each gender
  const stats = {};

  ['Male', 'Female', 'Unknown'].forEach(gender => {
    const lags = byGender[gender].map(d => d.lag).sort((a, b) => a - b);
    const count = lags.length;

    if (count === 0) {
      stats[gender] = {
        count: 0,
        avgLag: 0,
        medianLag: 0,
        minLag: 0,
        maxLag: 0,
        contemporaryCount: 0,
        contemporaryPercent: 0
      };
      return;
    }

    const sumLag = lags.reduce((a, b) => a + b, 0);

    // Median calculation
    const median = arr => {
      const mid = Math.floor(arr.length / 2);
      return arr.length % 2 !== 0 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
    };

    // Count acquisitions from 2000-2025
    const recentCount = byGender[gender].filter(d => d.acquisitionYear >= 2000 && d.acquisitionYear <= 2025).length;

    stats[gender] = {
      count,
      avgLag: sumLag / count,
      medianLag: median(lags),
      minLag: lags[0],
      maxLag: lags[lags.length - 1],
      recentCount,
      recentPercent: (recentCount / count) * 100,
      lags // Raw data
    };
  });

  return {
    totalCount: filtered.length,
    stats,
    // Format for bar chart display
    labels: ['Avg Lag (years)', 'Median Lag (years)', '% 2000-2025'],
    maleData: [
      stats.Male.avgLag.toFixed(0),
      stats.Male.medianLag.toFixed(0),
      stats.Male.recentPercent.toFixed(1)
    ],
    femaleData: [
      stats.Female.avgLag.toFixed(0),
      stats.Female.medianLag.toFixed(0),
      stats.Female.recentPercent.toFixed(1)
    ],
    unknownData: [
      stats.Unknown.avgLag.toFixed(0),
      stats.Unknown.medianLag.toFixed(0),
      stats.Unknown.recentPercent.toFixed(1)
    ]
  };
}

/**
 * Get acquisition lag distribution data
 * Bins artworks by lag ranges to show distribution
 * @param {Array<Object>} items - Normalized artwork items
 * @returns {Object} Binned lag distribution by gender
 */
export function getAcquisitionLagDistribution(items) {
  // Filter to items with both production and acquisition years
  const filtered = items.filter(item =>
    item.productionYear &&
    item.acquisitionYear &&
    item.acquisitionYear >= item.productionYear
  );

  // Define lag bins (in years)
  const bins = [
    { min: 0, max: 10, label: '0-10' },
    { min: 10, max: 25, label: '10-25' },
    { min: 25, max: 50, label: '25-50' },
    { min: 50, max: 100, label: '50-100' },
    { min: 100, max: 200, label: '100-200' },
    { min: 200, max: 300, label: '200-300' },
    { min: 300, max: 500, label: '300-500' },
    { min: 500, max: Infinity, label: '500+' }
  ];

  // Initialize bin counts
  const binCounts = {
    Male: bins.map(() => 0),
    Female: bins.map(() => 0),
    Unknown: bins.map(() => 0)
  };

  // Count artworks in each bin
  filtered.forEach(item => {
    const lag = item.acquisitionYear - item.productionYear;
    const binIndex = bins.findIndex(bin => lag >= bin.min && lag < bin.max);
    if (binIndex !== -1) {
      binCounts[item.gender][binIndex]++;
    }
  });

  // Convert to percentages within each gender
  const toPercent = (counts, total) =>
    total > 0 ? counts.map(c => (c / total) * 100) : counts.map(() => 0);

  const maleTotal = binCounts.Male.reduce((a, b) => a + b, 0);
  const femaleTotal = binCounts.Female.reduce((a, b) => a + b, 0);
  const unknownTotal = binCounts.Unknown.reduce((a, b) => a + b, 0);

  return {
    labels: bins.map(b => b.label),
    // Absolute counts
    maleData: binCounts.Male,
    femaleData: binCounts.Female,
    unknownData: binCounts.Unknown,
    // Percentage distributions
    malePercent: toPercent(binCounts.Male, maleTotal),
    femalePercent: toPercent(binCounts.Female, femaleTotal),
    unknownPercent: toPercent(binCounts.Unknown, unknownTotal),
    // Totals for reference
    totals: { Male: maleTotal, Female: femaleTotal, Unknown: unknownTotal }
  };
}

/**
 * Get female representation trend over time (2000-2025)
 * Returns yearly female percentage with collection average
 */
export function getFemaleTrendData(items, allItems, startYear = 1975) {
  // Filter to startYear-2025
  const recentItems = items.filter(a =>
    a.acquisitionYear >= startYear &&
    a.acquisitionYear <= CONFIG.dateRanges.recentEnd
  );

  // Group by year
  const yearlyData = {};
  recentItems.forEach(a => {
    const year = a.acquisitionYear;
    if (!yearlyData[year]) {
      yearlyData[year] = { male: 0, female: 0, unknown: 0 };
    }
    if (a.gender === 'Male') yearlyData[year].male++;
    else if (a.gender === 'Female') yearlyData[year].female++;
    else yearlyData[year].unknown++;
  });

  // Convert to arrays and calculate percentages
  const years = [];
  const femalePercents = [];

  for (let year = startYear; year <= CONFIG.dateRanges.recentEnd; year++) {
    const data = yearlyData[year];
    if (data) {
      const total = data.male + data.female + data.unknown;
      const femalePercent = total > 0 ? (data.female / total) * 100 : 0;
      years.push(year);
      femalePercents.push(femalePercent);
    }
  }

  // Calculate collection average (including unknown)
  const allStats = calculateStats(allItems);
  const collectionFemalePercent = allStats.total > 0
    ? (allStats.stats.Female / allItems.length) * 100
    : 0;

  return {
    years,
    femalePercents,
    collectionAverage: collectionFemalePercent
  };
}

/**
 * Get image availability statistics by gender
 * @param {Array<Object>} items - Normalized artwork items
 * @returns {Object} Image availability statistics by gender
 */
export function getHasImageData(items) {
  const withImage = { Male: 0, Female: 0, Unknown: 0 };
  const total = { Male: 0, Female: 0, Unknown: 0 };

  items.forEach(item => {
    total[item.gender]++;
    if (item.hasImage) {
      withImage[item.gender]++;
    }
  });

  const percentMale = total.Male > 0 ? ((withImage.Male / total.Male) * 100) : 0;
  const percentFemale = total.Female > 0 ? ((withImage.Female / total.Female) * 100) : 0;
  const percentUnknown = total.Unknown > 0 ? ((withImage.Unknown / total.Unknown) * 100) : 0;

  return {
    labels: ['Male', 'Female', 'Unknown'],
    withImagePercent: [percentMale, percentFemale, percentUnknown],
    withoutImagePercent: [100 - percentMale, 100 - percentFemale, 100 - percentUnknown],
    withImage,
    total,
    // For insight generation
    maleData: [withImage.Male, total.Male, percentMale.toFixed(1)],
    femaleData: [withImage.Female, total.Female, percentFemale.toFixed(1)],
    unknownData: [withImage.Unknown, total.Unknown, percentUnknown.toFixed(1)]
  };
}

/**
 * Get department-gender flow data for Sankey diagram
 * Shows which departments collect works by which genders
 * @param {Array<Object>} items - Normalized artwork items
 * @returns {Object} Flow data for Sankey visualization
 */
export function getDepartmentGenderData(items) {
  // Count combinations: department → gender
  const departmentCounts = {};

  items.forEach(item => {
    const dept = item.department || "Unknown";
    const gender = item.gender;

    if (!departmentCounts[dept]) {
      departmentCounts[dept] = { Male: 0, Female: 0, Unknown: 0, total: 0 };
    }

    departmentCounts[dept][gender]++;
    departmentCounts[dept].total++;
  });

  // Sort departments by total count and take top departments
  const sortedDepts = Object.entries(departmentCounts)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 15); // Show top 15 departments

  // Prepare data for Sankey diagram
  const nodes = [];
  const links = [];

  // Add department nodes (left side)
  sortedDepts.forEach(([dept, _], index) => {
    nodes.push({ name: dept, id: `dept_${index}` });
  });

  // Add gender nodes (right side)
  const genderNodes = [
    { name: 'Male', id: 'gender_male' },
    { name: 'Female', id: 'gender_female' },
    { name: 'Unknown', id: 'gender_unknown' }
  ];
  nodes.push(...genderNodes);

  // Create links from departments to genders
  sortedDepts.forEach(([dept, counts], deptIndex) => {
    // Only create links for non-zero values
    if (counts.Male > 0) {
      links.push({
        source: `dept_${deptIndex}`,
        target: 'gender_male',
        value: counts.Male
      });
    }
    if (counts.Female > 0) {
      links.push({
        source: `dept_${deptIndex}`,
        target: 'gender_female',
        value: counts.Female
      });
    }
    if (counts.Unknown > 0) {
      links.push({
        source: `dept_${deptIndex}`,
        target: 'gender_unknown',
        value: counts.Unknown
      });
    }
  });

  // Calculate totals
  const totalMale = sortedDepts.reduce((sum, [_, counts]) => sum + counts.Male, 0);
  const totalFemale = sortedDepts.reduce((sum, [_, counts]) => sum + counts.Female, 0);
  const totalUnknown = sortedDepts.reduce((sum, [_, counts]) => sum + counts.Unknown, 0);

  return {
    nodes,
    links,
    departmentCounts: Object.fromEntries(sortedDepts),
    totalMale,
    totalFemale,
    totalUnknown,
    totalArtworks: totalMale + totalFemale + totalUnknown
  };
}

/**
 * Get birth year distribution data for histogram visualization
 * Creates binned distribution of artist birth years by gender
 * Counts unique artists, not artworks
 * @param {Array<Object>} items - Normalized artwork items
 * @returns {Object} Birth year distribution by gender
 */
export function getBirthYearData(items) {
  // Filter to items with valid birth years
  const filtered = items.filter(item => item.birthYear && item.birthYear >= 1400 && item.birthYear <= 2025);

  if (filtered.length === 0) {
    return {
      labels: [],
      maleData: [],
      femaleData: [],
      unknownData: [],
      totals: { Male: 0, Female: 0, Unknown: 0 }
    };
  }

  // Find min and max birth years to define range
  const birthYears = filtered.map(item => item.birthYear);
  // Use reduce to avoid stack overflow with large arrays
  const minYear = birthYears.reduce((min, year) => year < min ? year : min, birthYears[0]);
  const maxYear = birthYears.reduce((max, year) => year > max ? year : max, birthYears[0]);

  // Create bins by decade (10-year intervals)
  const bins = [];
  const startDecade = Math.floor(minYear / 10) * 10;
  const endDecade = Math.ceil(maxYear / 10) * 10;

  for (let year = startDecade; year < endDecade; year += 10) {
    bins.push({
      min: year,
      max: year + 10,
      label: `${year}s`
    });
  }

  // Initialize bin sets for unique artists
  const binArtists = {
    Male: bins.map(() => new Set()),
    Female: bins.map(() => new Set()),
    Unknown: bins.map(() => new Set())
  };

  // Track unique artists in each bin
  filtered.forEach(item => {
    const binIndex = bins.findIndex(bin => item.birthYear >= bin.min && item.birthYear < bin.max);
    if (binIndex !== -1) {
      const artistKey = `${item.creatorName || 'Unknown'}_${item.birthYear}`;
      binArtists[item.gender][binIndex].add(artistKey);
    }
  });

  // Convert sets to counts
  const binCounts = {
    Male: binArtists.Male.map(set => set.size),
    Female: binArtists.Female.map(set => set.size),
    Unknown: binArtists.Unknown.map(set => set.size)
  };

  // Calculate totals
  const maleTotal = binCounts.Male.reduce((a, b) => a + b, 0);
  const femaleTotal = binCounts.Female.reduce((a, b) => a + b, 0);
  const unknownTotal = binCounts.Unknown.reduce((a, b) => a + b, 0);

  // Convert to percentages for each gender
  const malePercent = binCounts.Male.map(count => maleTotal > 0 ? (count / maleTotal) * 100 : 0);
  const femalePercent = binCounts.Female.map(count => femaleTotal > 0 ? (count / femaleTotal) * 100 : 0);
  const unknownPercent = binCounts.Unknown.map(count => unknownTotal > 0 ? (count / unknownTotal) * 100 : 0);

  return {
    labels: bins.map(b => b.label),
    maleData: binCounts.Male,
    femaleData: binCounts.Female,
    unknownData: binCounts.Unknown,
    malePercent,
    femalePercent,
    unknownPercent,
    totals: { Male: maleTotal, Female: femaleTotal, Unknown: unknownTotal },
    minYear,
    maxYear
  };
}

/**
 * Get creation year distribution data for histogram visualization
 * Creates binned distribution of artwork creation years by gender
 * Counts artworks, not unique artists
 * @param {Array<Object>} items - Normalized artwork items
 * @returns {Object} Creation year distribution by gender
 */
export function getCreationYearData(items) {
  // Filter to items with valid production years
  const filtered = items.filter(item => item.productionYear && item.productionYear >= 1400 && item.productionYear <= 2025);

  if (filtered.length === 0) {
    return {
      labels: [],
      maleData: [],
      femaleData: [],
      unknownData: [],
      totals: { Male: 0, Female: 0, Unknown: 0 }
    };
  }

  // Find min and max creation years to define range
  const creationYears = filtered.map(item => item.productionYear);
  // Use reduce to avoid stack overflow with large arrays
  const minYear = creationYears.reduce((min, year) => year < min ? year : min, creationYears[0]);
  const maxYear = creationYears.reduce((max, year) => year > max ? year : max, creationYears[0]);

  // Create bins by decade (10-year intervals)
  const bins = [];
  const startDecade = Math.floor(minYear / 10) * 10;
  const endDecade = Math.ceil(maxYear / 10) * 10;

  for (let year = startDecade; year < endDecade; year += 10) {
    bins.push({
      min: year,
      max: year + 10,
      label: `${year}s`
    });
  }

  // Initialize bin counts
  const binCounts = {
    Male: bins.map(() => 0),
    Female: bins.map(() => 0),
    Unknown: bins.map(() => 0)
  };

  // Count artworks in each bin
  filtered.forEach(item => {
    const binIndex = bins.findIndex(bin => item.productionYear >= bin.min && item.productionYear < bin.max);
    if (binIndex !== -1) {
      binCounts[item.gender][binIndex]++;
    }
  });

  // Calculate totals
  const maleTotal = binCounts.Male.reduce((a, b) => a + b, 0);
  const femaleTotal = binCounts.Female.reduce((a, b) => a + b, 0);
  const unknownTotal = binCounts.Unknown.reduce((a, b) => a + b, 0);

  // Convert to percentages for each gender
  const malePercent = binCounts.Male.map(count => maleTotal > 0 ? (count / maleTotal) * 100 : 0);
  const femalePercent = binCounts.Female.map(count => femaleTotal > 0 ? (count / femaleTotal) * 100 : 0);
  const unknownPercent = binCounts.Unknown.map(count => unknownTotal > 0 ? (count / unknownTotal) * 100 : 0);

  return {
    labels: bins.map(b => b.label),
    maleData: binCounts.Male,
    femaleData: binCounts.Female,
    unknownData: binCounts.Unknown,
    malePercent,
    femalePercent,
    unknownPercent,
    totals: { Male: maleTotal, Female: femaleTotal, Unknown: unknownTotal },
    minYear,
    maxYear
  };
}

/**
 * Calculate distance between two geographic coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get depicted location data for map visualization
 * @param {Array<Object>} items - Normalized artwork items
 * @returns {Object} Location data grouped by gender with distance analysis
 */
export function getDepictedLocationData(items) {
  // Copenhagen coordinates (SMK museum location)
  const COPENHAGEN_LAT = 55.6761;
  const COPENHAGEN_LON = 12.5683;

  // Aggregate locations by coordinates and gender
  const locationMap = new Map();

  items.forEach(item => {
    if (item.geoLocations && item.geoLocations.length > 0) {
      item.geoLocations.forEach(loc => {
        const key = `${loc.latitude.toFixed(4)},${loc.longitude.toFixed(4)}`;

        if (!locationMap.has(key)) {
          const distance = calculateDistance(COPENHAGEN_LAT, COPENHAGEN_LON, loc.latitude, loc.longitude);
          locationMap.set(key, {
            name: loc.name,
            latitude: loc.latitude,
            longitude: loc.longitude,
            distance,
            Male: 0,
            Female: 0,
            Unknown: 0
          });
        }

        const locationData = locationMap.get(key);
        locationData[item.gender]++;
      });
    }
  });

  // Convert to arrays for each gender
  const locations = Array.from(locationMap.values());

  const maleLocations = locations
    .filter(loc => loc.Male > 0)
    .map(loc => ({ ...loc, count: loc.Male }));

  const femaleLocations = locations
    .filter(loc => loc.Female > 0)
    .map(loc => ({ ...loc, count: loc.Female }));

  const unknownLocations = locations
    .filter(loc => loc.Unknown > 0)
    .map(loc => ({ ...loc, count: loc.Unknown }));

  // Distance analysis: categorize by distance from Copenhagen
  const distanceBins = [
    { label: '0-50 km', min: 0, max: 50 },
    { label: '50-200 km', min: 50, max: 200 },
    { label: '200-500 km', min: 200, max: 500 },
    { label: '500-1000 km', min: 500, max: 1000 },
    { label: '1000-2000 km', min: 1000, max: 2000 },
    { label: '2000+ km', min: 2000, max: Infinity }
  ];

  const distanceDistribution = {
    Male: Array(distanceBins.length).fill(0),
    Female: Array(distanceBins.length).fill(0),
    Unknown: Array(distanceBins.length).fill(0)
  };

  locations.forEach(loc => {
    const binIndex = distanceBins.findIndex(bin => loc.distance >= bin.min && loc.distance < bin.max);
    if (binIndex >= 0) {
      distanceDistribution.Male[binIndex] += loc.Male;
      distanceDistribution.Female[binIndex] += loc.Female;
      distanceDistribution.Unknown[binIndex] += loc.Unknown;
    }
  });

  // Calculate totals and percentages
  const totalMale = distanceDistribution.Male.reduce((sum, val) => sum + val, 0);
  const totalFemale = distanceDistribution.Female.reduce((sum, val) => sum + val, 0);
  const totalUnknown = distanceDistribution.Unknown.reduce((sum, val) => sum + val, 0);

  const malePercents = distanceDistribution.Male.map(val =>
    totalMale > 0 ? (val / totalMale * 100) : 0
  );
  const femalePercents = distanceDistribution.Female.map(val =>
    totalFemale > 0 ? (val / totalFemale * 100) : 0
  );
  const unknownPercents = distanceDistribution.Unknown.map(val =>
    totalUnknown > 0 ? (val / totalUnknown * 100) : 0
  );

  // Calculate average distance (weighted by count)
  const avgDistanceMale = maleLocations.length > 0
    ? maleLocations.reduce((sum, loc) => sum + loc.distance * loc.count, 0) / totalMale
    : 0;
  const avgDistanceFemale = femaleLocations.length > 0
    ? femaleLocations.reduce((sum, loc) => sum + loc.distance * loc.count, 0) / totalFemale
    : 0;

  // Helper function to calculate median and quartiles from distance array
  const calculateDistanceStats = (locations, total) => {
    if (locations.length === 0) {
      return { median: 0, q1: 0, q3: 0, min: 0, max: 0 };
    }

    // Create array of distances, repeating each distance by its count
    const distances = [];
    locations.forEach(loc => {
      for (let i = 0; i < loc.count; i++) {
        distances.push(loc.distance);
      }
    });

    // Sort distances
    distances.sort((a, b) => a - b);

    // Calculate median (50th percentile)
    const median = distances[Math.floor(distances.length / 2)];

    // Calculate quartiles
    const q1 = distances[Math.floor(distances.length * 0.25)];
    const q3 = distances[Math.floor(distances.length * 0.75)];

    return {
      median,
      q1,
      q3,
      min: distances[0],
      max: distances[distances.length - 1]
    };
  };

  const maleStats = calculateDistanceStats(maleLocations, totalMale);
  const femaleStats = calculateDistanceStats(femaleLocations, totalFemale);
  const unknownStats = calculateDistanceStats(unknownLocations, totalUnknown);

  return {
    maleLocations,
    femaleLocations,
    unknownLocations,
    allLocations: locations,
    distanceBins: distanceBins.map(b => b.label),
    distanceDistribution,
    malePercents,
    femalePercents,
    unknownPercents,
    totals: { Male: totalMale, Female: totalFemale, Unknown: totalUnknown },
    // Average distances (for backwards compatibility)
    avgDistanceMale: avgDistanceMale.toFixed(0),
    avgDistanceFemale: avgDistanceFemale.toFixed(0),
    // Median and distribution statistics
    maleStats: {
      median: maleStats.median.toFixed(0),
      q1: maleStats.q1.toFixed(0),
      q3: maleStats.q3.toFixed(0),
      min: maleStats.min.toFixed(0),
      max: maleStats.max.toFixed(0),
      avg: avgDistanceMale.toFixed(0)
    },
    femaleStats: {
      median: femaleStats.median.toFixed(0),
      q1: femaleStats.q1.toFixed(0),
      q3: femaleStats.q3.toFixed(0),
      min: femaleStats.min.toFixed(0),
      max: femaleStats.max.toFixed(0),
      avg: avgDistanceFemale.toFixed(0)
    },
    unknownStats: {
      median: unknownStats.median.toFixed(0),
      q1: unknownStats.q1.toFixed(0),
      q3: unknownStats.q3.toFixed(0),
      min: unknownStats.min.toFixed(0),
      max: unknownStats.max.toFixed(0),
      avg: 0
    },
    artworksWithLocation: items.filter(item => item.geoLocations && item.geoLocations.length > 0).length,
    totalArtworks: items.length
  };
}

/**
 * Convert hex color to HSL (Hue, Saturation, Lightness)
 * @param {string} hex - Hex color code (e.g., "#ff0000")
 * @returns {Object} HSL values {h: 0-360, s: 0-100, l: 0-100}
 */
function hexToHSL(hex) {
  // Remove # if present
  hex = hex.replace('#', '');

  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

/**
 * Categorize a color into a color family based on HSL values
 * @param {string} hexColor - Hex color code
 * @returns {string} Color family name
 */
function categorizeColor(hexColor) {
  if (!hexColor) return 'Unknown';

  const hsl = hexToHSL(hexColor);
  const { h, s, l } = hsl;

  // Brown: low saturation with mid-range lightness and warm hue
  if (s < 40 && s >= 15 && l >= 20 && l <= 60 && h >= 20 && h <= 60) {
    return 'Brown';
  }

  // Grayscale: low saturation
  if (s < 15) {
    if (l < 20) return 'Black';
    if (l > 80) return 'White';
    return 'Gray';
  }

  // Chromatic colors based on hue (12 color wheel segments)
  // Red: 345-15 degrees
  if (h >= 345 || h < 15) return 'Red';
  // Orange: 15-35 degrees
  if (h >= 15 && h < 35) return 'Orange';
  // Yellow: 35-65 degrees
  if (h >= 35 && h < 65) return 'Yellow';
  // Yellow-Green: 65-95 degrees
  if (h >= 65 && h < 95) return 'Yellow-Green';
  // Green: 95-155 degrees
  if (h >= 95 && h < 155) return 'Green';
  // Cyan: 155-200 degrees
  if (h >= 155 && h < 200) return 'Cyan';
  // Blue: 200-260 degrees
  if (h >= 200 && h < 260) return 'Blue';
  // Purple: 260-300 degrees
  if (h >= 260 && h < 300) return 'Purple';
  // Magenta: 300-345 degrees
  if (h >= 300 && h < 345) return 'Magenta';

  return 'Gray'; // catch-all
}

/**
 * Get color distribution data by gender
 * Analyzes all colors from the colors array (multiple colors per artwork)
 * @param {Array<Object>} items - Normalized artwork items
 * @returns {Object} Color family distribution by gender
 */
export function getColorDistributionData(items) {
  // Filter to items with color data
  const itemsWithColors = items.filter(item => item.colors && item.colors.length > 0);

  // Color families in display order (13 colors: full color wheel + neutrals)
  const colorFamilies = ['Red', 'Orange', 'Yellow', 'Yellow-Green', 'Green', 'Cyan', 'Blue', 'Purple', 'Magenta', 'Brown', 'Black', 'Gray', 'White'];

  // Count by gender and color family
  const counts = {
    Male: {},
    Female: {},
    Unknown: {}
  };

  colorFamilies.forEach(family => {
    counts.Male[family] = 0;
    counts.Female[family] = 0;
    counts.Unknown[family] = 0;
  });

  // Count all colors from each artwork (each color in the array gets counted)
  itemsWithColors.forEach(item => {
    item.colors.forEach(hexColor => {
      const colorFamily = categorizeColor(hexColor);
      if (counts[item.gender] && counts[item.gender][colorFamily] !== undefined) {
        counts[item.gender][colorFamily]++;
      }
    });
  });

  // Calculate totals
  const totals = {
    Male: Object.values(counts.Male).reduce((a, b) => a + b, 0),
    Female: Object.values(counts.Female).reduce((a, b) => a + b, 0),
    Unknown: Object.values(counts.Unknown).reduce((a, b) => a + b, 0)
  };

  // Convert to percentages
  const percentages = {
    Male: {},
    Female: {},
    Unknown: {}
  };

  colorFamilies.forEach(family => {
    percentages.Male[family] = totals.Male > 0 ? (counts.Male[family] / totals.Male * 100) : 0;
    percentages.Female[family] = totals.Female > 0 ? (counts.Female[family] / totals.Female * 100) : 0;
    percentages.Unknown[family] = totals.Unknown > 0 ? (counts.Unknown[family] / totals.Unknown * 100) : 0;
  });

  return {
    labels: colorFamilies,
    maleData: colorFamilies.map(f => percentages.Male[f]),
    femaleData: colorFamilies.map(f => percentages.Female[f]),
    unknownData: colorFamilies.map(f => percentages.Unknown[f]),
    maleCounts: colorFamilies.map(f => counts.Male[f]),
    femaleCounts: colorFamilies.map(f => counts.Female[f]),
    unknownCounts: colorFamilies.map(f => counts.Unknown[f]),
    totals,
    totalWithColors: itemsWithColors.length,
    totalArtworks: items.length
  };
}

/**
 * Get color usage over time (by production year)
 * Groups artworks into decades and calculates color family percentages
 * @param {Array<Object>} items - Normalized artwork items
 * @returns {Object} Color family percentages by decade and gender
 */
export function getColorTimelineData(items) {
  // Filter to items with both production year and color data
  const itemsWithData = items.filter(item =>
    item.productionYear &&
    item.colors &&
    item.colors.length > 0 &&
    item.productionYear >= 1400 &&
    item.productionYear <= 2025
  );

  if (itemsWithData.length === 0) {
    return {
      labels: [],
      maleData: {},
      femaleData: {},
      unknownData: {},
      totals: { Male: 0, Female: 0, Unknown: 0 }
    };
  }

  // Group by decade - count all colors from each artwork
  const decades = {};
  itemsWithData.forEach(item => {
    const decade = Math.floor(item.productionYear / 10) * 10;
    if (!decades[decade]) {
      decades[decade] = { Male: {}, Female: {}, Unknown: {} };
    }

    const gender = item.gender;

    // Process each color in the artwork's color array
    item.colors.forEach(hexColor => {
      const colorFamily = categorizeColor(hexColor);

      if (!decades[decade][gender][colorFamily]) {
        decades[decade][gender][colorFamily] = 0;
      }
      decades[decade][gender][colorFamily]++;
    });
  });

  // Sort decades
  const sortedDecades = Object.keys(decades).map(Number).sort((a, b) => a - b);
  const labels = sortedDecades.map(d => d.toString());

  // Color families (13 colors: full color wheel + neutrals)
  const colorFamilies = ['Red', 'Orange', 'Yellow', 'Yellow-Green', 'Green', 'Cyan', 'Blue', 'Purple', 'Magenta', 'Brown', 'Black', 'Gray', 'White'];

  // Prepare data structure for stacked area chart
  // Each color family gets arrays of percentages over time for each gender
  const maleData = {};
  const femaleData = {};
  const unknownData = {};

  colorFamilies.forEach(family => {
    maleData[family] = [];
    femaleData[family] = [];
    unknownData[family] = [];
  });

  sortedDecades.forEach(decade => {
    const decadeData = decades[decade];

    // Calculate totals for each gender in this decade
    const maleTotalInDecade = Object.values(decadeData.Male).reduce((a, b) => a + b, 0);
    const femaleTotalInDecade = Object.values(decadeData.Female).reduce((a, b) => a + b, 0);
    const unknownTotalInDecade = Object.values(decadeData.Unknown).reduce((a, b) => a + b, 0);

    colorFamilies.forEach(family => {
      const maleCount = decadeData.Male[family] || 0;
      const femaleCount = decadeData.Female[family] || 0;
      const unknownCount = decadeData.Unknown[family] || 0;

      maleData[family].push(maleTotalInDecade > 0 ? (maleCount / maleTotalInDecade * 100) : 0);
      femaleData[family].push(femaleTotalInDecade > 0 ? (femaleCount / femaleTotalInDecade * 100) : 0);
      unknownData[family].push(unknownTotalInDecade > 0 ? (unknownCount / unknownTotalInDecade * 100) : 0);
    });
  });

  return {
    labels,
    colorFamilies,
    maleData,
    femaleData,
    unknownData,
    totals: {
      Male: itemsWithData.filter(i => i.gender === 'Male').length,
      Female: itemsWithData.filter(i => i.gender === 'Female').length,
      Unknown: itemsWithData.filter(i => i.gender === 'Unknown').length
    },
    totalWithData: itemsWithData.length,
    totalArtworks: items.length
  };
}

/**
 * Get artist data for scatterplot and top lists
 * Aggregates artworks by artist name, including birth year and gender
 * @param {Array<Object>} items - Normalized artwork items
 * @returns {Object} Artist data including scatterplot points and top lists
 */
export function getArtistData(items) {
  // Aggregate by artist name
  const artistMap = new Map();

  items.forEach(item => {
    if (!item.creatorName || item.creatorName === 'Unknown') return;

    const key = item.creatorName;
    if (!artistMap.has(key)) {
      artistMap.set(key, {
        name: item.creatorName,
        gender: item.gender,
        birthYear: item.birthYear,
        artworkCount: 0,
        nationality: item.nationality
      });
    }
    artistMap.get(key).artworkCount++;
  });

  // Convert to array and sort by artwork count
  const artists = Array.from(artistMap.values())
    .filter(artist => artist.artworkCount > 0)
    .sort((a, b) => b.artworkCount - a.artworkCount);

  // Separate by gender
  const maleArtists = artists.filter(a => a.gender === 'Male');
  const femaleArtists = artists.filter(a => a.gender === 'Female');
  const unknownArtists = artists.filter(a => a.gender === 'Unknown');

  // Get top 10 for each gender
  const topMale = maleArtists.slice(0, 10);
  const topFemale = femaleArtists.slice(0, 10);

  // Prepare scatterplot data (filter to artists with birth year and at least 2 works to reduce clutter)
  const scatterData = artists.filter(a => a.birthYear && a.birthYear >= 1400 && a.birthYear <= 2025 && a.artworkCount >= 2);

  return {
    allArtists: artists,
    maleArtists,
    femaleArtists,
    unknownArtists,
    topMale,
    topFemale,
    scatterData,
    stats: {
      totalArtists: artists.length,
      maleArtistCount: maleArtists.length,
      femaleArtistCount: femaleArtists.length,
      unknownArtistCount: unknownArtists.length,
      avgWorksPerArtist: artists.length > 0 ? (items.length / artists.length).toFixed(1) : 0,
      medianMaleWorks: maleArtists.length > 0 ? maleArtists[Math.floor(maleArtists.length / 2)].artworkCount : 0,
      medianFemaleWorks: femaleArtists.length > 0 ? femaleArtists[Math.floor(femaleArtists.length / 2)].artworkCount : 0
    }
  };
}

/**
 * Get raw color frequency data for treemap visualization
 * Returns actual hex codes with their frequency counts by gender
 * @param {Array<Object>} items - Normalized artwork items
 * @returns {Object} Color frequency data by gender
 */
export function getColorTreemapData(items) {
  // Filter to items with color data
  const itemsWithColors = items.filter(item => item.colors && item.colors.length > 0);

  if (itemsWithColors.length === 0) {
    return {
      male: [],
      female: [],
      unknown: [],
      totals: { Male: 0, Female: 0, Unknown: 0 }
    };
  }

  // Count occurrences of each hex color by gender
  const colorCounts = {
    Male: {},
    Female: {},
    Unknown: {}
  };

  // Count each color occurrence
  itemsWithColors.forEach(item => {
    item.colors.forEach(hexColor => {
      const normalizedHex = hexColor.toUpperCase();
      if (!colorCounts[item.gender][normalizedHex]) {
        colorCounts[item.gender][normalizedHex] = 0;
      }
      colorCounts[item.gender][normalizedHex]++;
    });
  });

  // Convert to arrays sorted by frequency
  const convertToArray = (counts) => {
    return Object.entries(counts)
      .map(([hex, count]) => ({ hex, count }))
      .sort((a, b) => b.count - a.count);
  };

  const maleColors = convertToArray(colorCounts.Male);
  const femaleColors = convertToArray(colorCounts.Female);
  const unknownColors = convertToArray(colorCounts.Unknown);

  // Calculate totals
  const maleTotal = maleColors.reduce((sum, c) => sum + c.count, 0);
  const femaleTotal = femaleColors.reduce((sum, c) => sum + c.count, 0);
  const unknownTotal = unknownColors.reduce((sum, c) => sum + c.count, 0);

  return {
    male: maleColors,
    female: femaleColors,
    unknown: unknownColors,
    totals: {
      Male: maleTotal,
      Female: femaleTotal,
      Unknown: unknownTotal
    }
  };
}
