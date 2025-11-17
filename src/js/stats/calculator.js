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
 */
export function getNationalityData(items) {
  const counts = {};
  items.forEach(a => {
    const nat = a.nationality || "Unknown";
    if (!counts[nat]) counts[nat] = { Male: 0, Female: 0, Unknown: 0 };
    counts[nat][a.gender]++;
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

  years.forEach(year => {
    const total = yearData[year].Male + yearData[year].Female + yearData[year].Unknown;
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
    unknownPercent
  };
}

/**
 * Calculate average works per artist by gender
 */
export function getWorksPerArtist(items) {
  // Note: SMK API doesn't have unique artist IDs, so we approximate using production.creator
  // This is an estimation based on available data
  const artistWorks = { Male: {}, Female: {}, Unknown: {} };

  items.forEach(item => {
    // Use a simple heuristic: if we had creator names, we'd count unique creators
    // For now, we'll calculate total works / estimated unique artists
    const gender = item.gender;
    if (!artistWorks[gender].totalWorks) {
      artistWorks[gender].totalWorks = 0;
      artistWorks[gender].count = 0;
    }
    artistWorks[gender].totalWorks++;
    artistWorks[gender].count++; // This is a simplified count
  });

  // Estimate unique artists (rough heuristic: assume avg 4.5 works per artist)
  const ESTIMATED_WORKS_PER_ARTIST = 4.5;

  const genderCounts = {
    Male: artistWorks.Male.totalWorks || 0,
    Female: artistWorks.Female.totalWorks || 0,
    Unknown: artistWorks.Unknown.totalWorks || 0
  };

  const maleArtists = Math.round(genderCounts.Male / ESTIMATED_WORKS_PER_ARTIST);
  const femaleArtists = Math.round(genderCounts.Female / ESTIMATED_WORKS_PER_ARTIST);
  const unknownArtists = Math.round(genderCounts.Unknown / ESTIMATED_WORKS_PER_ARTIST);

  return {
    labels: ['Total Works', 'Est. Artists*', 'Avg Works/Artist*'],
    maleData: [
      genderCounts.Male,
      maleArtists,
      maleArtists > 0 ? (genderCounts.Male / maleArtists).toFixed(1) : 0
    ],
    femaleData: [
      genderCounts.Female,
      femaleArtists,
      femaleArtists > 0 ? (genderCounts.Female / femaleArtists).toFixed(1) : 0
    ],
    unknownData: [
      genderCounts.Unknown,
      unknownArtists,
      unknownArtists > 0 ? (genderCounts.Unknown / unknownArtists).toFixed(1) : 0
    ],
    note: '* Estimated - API lacks unique artist identifiers. Assumes avg ~4.5 works/artist.'
  };
}

/**
 * Get display distribution over time (by acquisition year cohorts)
 * Shows: Of artworks acquired in year X, what % are currently on display by gender
 */
export function getDisplayDistributionOverTime(items) {
  const yearData = {};

  // Group by acquisition year and track display status
  items.forEach(a => {
    const year = a.acquisitionYear;
    if (!yearData[year]) {
      yearData[year] = {
        Male: { total: 0, displayed: 0 },
        Female: { total: 0, displayed: 0 },
        Unknown: { total: 0, displayed: 0 }
      };
    }
    yearData[year][a.gender].total++;
    if (a.onDisplay) {
      yearData[year][a.gender].displayed++;
    }
  });

  const years = Object.keys(yearData).sort((a, b) => a - b);
  const malePercent = [];
  const femalePercent = [];
  const unknownPercent = [];

  years.forEach(year => {
    const maleRate = yearData[year].Male.total > 0
      ? (yearData[year].Male.displayed / yearData[year].Male.total) * 100
      : 0;
    const femaleRate = yearData[year].Female.total > 0
      ? (yearData[year].Female.displayed / yearData[year].Female.total) * 100
      : 0;
    const unknownRate = yearData[year].Unknown.total > 0
      ? (yearData[year].Unknown.displayed / yearData[year].Unknown.total) * 100
      : 0;

    malePercent.push(maleRate);
    femalePercent.push(femaleRate);
    unknownPercent.push(unknownRate);
  });

  return {
    years,
    malePercent,
    femalePercent,
    unknownPercent
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
    unknownDepictedPercent: [percentages['Male']['Unknown'], percentages['Female']['Unknown'], percentages['Unknown']['Unknown']]
  };
}
