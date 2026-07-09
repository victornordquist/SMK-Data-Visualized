/**
 * Data export utilities
 * Rebuilds the exact dataset behind every chart (via stats/calculator.js) and
 * bundles them as one CSV per chart inside a single downloadable .zip file.
 */
import {
  calculateStats,
  getObjectTypeData,
  getNationalityData,
  getTopAttributeData,
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
} from '../stats/calculator.js';

const GENDERS = ['Male', 'Female', 'Unknown'];

/**
 * Converts headers + row arrays into an RFC 4180-ish CSV string
 */
function toCSV(headers, rows) {
  const escape = (val) => {
    if (val === null || val === undefined) return '';
    const str = String(val);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };
  const lines = [headers.map(escape).join(',')];
  rows.forEach(row => lines.push(row.map(escape).join(',')));
  return lines.join('\n');
}

function pct(value) {
  return typeof value === 'number' ? value.toFixed(2) : value;
}

/**
 * Builds { filename, headers, rows } for every chart/insight in the app
 */
function buildDatasets(artworks) {
  const datasets = [];
  const add = (filename, headers, rows) => datasets.push({ filename, headers, rows });

  // Overview
  const stats = calculateStats(artworks);
  add('overview-summary.csv',
    ['Metric', 'Value'],
    [
      ['Total artworks', stats.total],
      ['Male artist works', stats.stats.Male],
      ['Male artist works (%)', stats.malePercent],
      ['Female artist works', stats.stats.Female],
      ['Female artist works (%)', stats.femalePercent],
      ['Unknown gender works', stats.stats.Unknown],
      ['Unknown gender works (%)', stats.unknownPercent]
    ]);

  // Artists
  const artistData = getArtistData(artworks);
  add('artist-scatterplot.csv',
    ['Artist Name', 'Gender', 'Birth Year', 'Artwork Count', 'Nationality'],
    artistData.scatterData.map(a => [a.name, a.gender, a.birthYear, a.artworkCount, a.nationality || '']));

  add('top-10-artists.csv',
    ['Rank', 'Gender', 'Artist Name', 'Artwork Count', 'Birth Year', 'Nationality'],
    [
      ...artistData.topMale.map((a, i) => [i + 1, 'Male', a.name, a.artworkCount, a.birthYear || '', a.nationality || '']),
      ...artistData.topFemale.map((a, i) => [i + 1, 'Female', a.name, a.artworkCount, a.birthYear || '', a.nationality || ''])
    ]);

  add('artist-summary-stats.csv',
    ['Metric', 'Value'],
    [
      ['Total unique artists', artistData.stats.totalArtists],
      ['Male artists', artistData.stats.maleArtistCount],
      ['Female artists', artistData.stats.femaleArtistCount],
      ['Unknown gender artists', artistData.stats.unknownArtistCount],
      ['Avg works per artist', artistData.stats.avgWorksPerArtist],
      ['Median works per male artist', artistData.stats.medianMaleWorks],
      ['Median works per female artist', artistData.stats.medianFemaleWorks]
    ]);

  const nationalityData = getNationalityData(artworks);
  add('nationality-top20.csv',
    ['Nationality', 'Male Artists', 'Female Artists', 'Unknown Artists', 'Total Artists'],
    nationalityData.labels.map((label, i) => [
      label,
      nationalityData.maleData[i],
      nationalityData.femaleData[i],
      nationalityData.unknownData[i],
      nationalityData.maleData[i] + nationalityData.femaleData[i] + nationalityData.unknownData[i]
    ]));

  const birthYearData = getBirthYearData(artworks);
  add('artist-birth-year-distribution.csv',
    ['Decade', 'Male Artists', 'Female Artists', 'Unknown Artists', 'Male %', 'Female %', 'Unknown %'],
    birthYearData.labels.map((label, i) => [
      label,
      birthYearData.maleData[i],
      birthYearData.femaleData[i],
      birthYearData.unknownData[i],
      pct(birthYearData.malePercent[i]),
      pct(birthYearData.femalePercent[i]),
      pct(birthYearData.unknownPercent[i])
    ]));

  // Temporal / acquisition
  const creationYearData = getCreationYearData(artworks);
  add('creation-year-distribution.csv',
    ['Decade', 'Male Works', 'Female Works', 'Unknown Works', 'Male %', 'Female %', 'Unknown %'],
    creationYearData.labels.map((label, i) => [
      label,
      creationYearData.maleData[i],
      creationYearData.femaleData[i],
      creationYearData.unknownData[i],
      pct(creationYearData.malePercent[i]),
      pct(creationYearData.femalePercent[i]),
      pct(creationYearData.unknownPercent[i])
    ]));

  const timelineData = getGenderDistributionOverTime(artworks);
  add('gender-distribution-over-time.csv',
    ['Year', 'Male Count', 'Female Count', 'Unknown Count', 'Male %', 'Female %', 'Unknown %'],
    timelineData.years.map((year, i) => [
      year,
      timelineData.maleCount[i],
      timelineData.femaleCount[i],
      timelineData.unknownCount[i],
      pct(timelineData.malePercent[i]),
      pct(timelineData.femalePercent[i]),
      pct(timelineData.unknownPercent[i])
    ]));

  const trendData = getFemaleTrendData(artworks, artworks, 1975);
  add('female-trend-1975-2025.csv',
    ['Year', 'Female %', 'Collection Average Female %'],
    trendData.years.map((year, i) => [year, pct(trendData.femalePercents[i]), pct(trendData.collectionAverage)]));

  const lagData = getAcquisitionLagData(artworks);
  add('acquisition-lag-summary.csv',
    ['Gender', 'Count', 'Avg Lag (years)', 'Median Lag (years)', 'Min Lag (years)', 'Max Lag (years)'],
    GENDERS.map(g => [g, lagData.stats[g].count, pct(lagData.stats[g].avgLag), lagData.stats[g].medianLag, lagData.stats[g].minLag, lagData.stats[g].maxLag]));

  const lagDistData = getAcquisitionLagDistribution(artworks);
  add('acquisition-lag-distribution.csv',
    ['Lag Bin (years)', 'Male Count', 'Female Count', 'Unknown Count', 'Male %', 'Female %', 'Unknown %'],
    lagDistData.labels.map((label, i) => [
      label,
      lagDistData.maleData[i],
      lagDistData.femaleData[i],
      lagDistData.unknownData[i],
      pct(lagDistData.malePercent[i]),
      pct(lagDistData.femalePercent[i]),
      pct(lagDistData.unknownPercent[i])
    ]));

  // Collection organization
  const departmentData = getDepartmentGenderData(artworks);
  add('department-gender-flow.csv',
    ['Department', 'Male', 'Female', 'Unknown', 'Total'],
    Object.entries(departmentData.departmentCounts).map(([dept, counts]) => [dept, counts.Male, counts.Female, counts.Unknown, counts.total]));

  const objectTypeData = getObjectTypeData(artworks);
  const objectTypePercent = convertToPercentages(objectTypeData);
  add('object-types-by-gender.csv',
    ['Object Type', 'Male Count', 'Female Count', 'Unknown Count', 'Male %', 'Female %', 'Unknown %'],
    objectTypeData.labels.map((label, i) => [
      label,
      objectTypeData.maleData[i],
      objectTypeData.femaleData[i],
      objectTypeData.unknownData[i],
      pct(objectTypePercent.maleData[i]),
      pct(objectTypePercent.femaleData[i]),
      pct(objectTypePercent.unknownData[i])
    ]));

  const techniquesData = getTopAttributeData(artworks, 'techniques');
  const techniquesPercent = convertToPercentages(techniquesData);
  add('techniques-by-gender.csv',
    ['Technique', 'Male Count', 'Female Count', 'Unknown Count', 'Male %', 'Female %', 'Unknown %'],
    techniquesData.labels.map((label, i) => [
      label,
      techniquesData.maleData[i],
      techniquesData.femaleData[i],
      techniquesData.unknownData[i],
      pct(techniquesPercent.maleData[i]),
      pct(techniquesPercent.femaleData[i]),
      pct(techniquesPercent.unknownData[i])
    ]));

  const materialsData = getTopAttributeData(artworks, 'materials');
  const materialsPercent = convertToPercentages(materialsData);
  add('materials-by-gender.csv',
    ['Material', 'Male Count', 'Female Count', 'Unknown Count', 'Male %', 'Female %', 'Unknown %'],
    materialsData.labels.map((label, i) => [
      label,
      materialsData.maleData[i],
      materialsData.femaleData[i],
      materialsData.unknownData[i],
      pct(materialsPercent.maleData[i]),
      pct(materialsPercent.femaleData[i]),
      pct(materialsPercent.unknownData[i])
    ]));

  // Subject & content
  const creatorDepictedData = getCreatorDepictedGenderData(artworks);
  add('creator-depicted-gender.csv',
    ['Creator Gender', 'Depicted Male %', 'Depicted Female %', 'Depicted Unknown %', 'Depicted Male Count', 'Depicted Female Count', 'Depicted Unknown Count'],
    creatorDepictedData.labels.map((label, i) => [
      label,
      pct(creatorDepictedData.maleDepictedPercent[i]),
      pct(creatorDepictedData.femaleDepictedPercent[i]),
      pct(creatorDepictedData.unknownDepictedPercent[i]),
      creatorDepictedData.maleDepictedCount[i],
      creatorDepictedData.femaleDepictedCount[i],
      creatorDepictedData.unknownDepictedCount[i]
    ]));

  const locationData = getDepictedLocationData(artworks);
  add('depicted-locations.csv',
    ['Location Name', 'Latitude', 'Longitude', 'Distance from Copenhagen (km)', 'Male Count', 'Female Count', 'Unknown Count'],
    locationData.allLocations.map(loc => [loc.name || '', loc.latitude, loc.longitude, loc.distance.toFixed(0), loc.Male, loc.Female, loc.Unknown]));

  add('depicted-location-distance-bins.csv',
    ['Distance Bin', 'Male Count', 'Female Count', 'Unknown Count', 'Male %', 'Female %', 'Unknown %'],
    locationData.distanceBins.map((label, i) => [
      label,
      locationData.distanceDistribution.Male[i],
      locationData.distanceDistribution.Female[i],
      locationData.distanceDistribution.Unknown[i],
      pct(locationData.malePercents[i]),
      pct(locationData.femalePercents[i]),
      pct(locationData.unknownPercents[i])
    ]));

  add('depicted-location-distance-summary.csv',
    ['Gender', 'Count', 'Median (km)', 'Q1 (km)', 'Q3 (km)', 'Min (km)', 'Max (km)', 'Avg (km)'],
    [
      ['Male', locationData.totals.Male, locationData.maleStats.median, locationData.maleStats.q1, locationData.maleStats.q3, locationData.maleStats.min, locationData.maleStats.max, locationData.maleStats.avg],
      ['Female', locationData.totals.Female, locationData.femaleStats.median, locationData.femaleStats.q1, locationData.femaleStats.q3, locationData.femaleStats.min, locationData.femaleStats.max, locationData.femaleStats.avg],
      ['Unknown', locationData.totals.Unknown, locationData.unknownStats.median, locationData.unknownStats.q1, locationData.unknownStats.q3, locationData.unknownStats.min, locationData.unknownStats.max, locationData.unknownStats.avg]
    ]);

  // Color analysis (13-color system)
  const colorTimelineData = getColorTimelineData(artworks);
  const colorTimelineRows = [];
  colorTimelineData.labels.forEach((decade, i) => {
    colorTimelineData.colorFamilies.forEach(family => {
      colorTimelineRows.push([decade, family, 'Male', pct(colorTimelineData.maleData[family][i])]);
      colorTimelineRows.push([decade, family, 'Female', pct(colorTimelineData.femaleData[family][i])]);
      colorTimelineRows.push([decade, family, 'Unknown', pct(colorTimelineData.unknownData[family][i])]);
    });
  });
  add('color-distribution-by-decade.csv',
    ['Decade', 'Color Family', 'Gender', 'Percentage'],
    colorTimelineRows);

  const colorTreemapData = getColorTreemapData(artworks);
  add('color-treemap-male.csv', ['Hex Color', 'Count'], colorTreemapData.male.slice(0, 100).map(c => [c.hex, c.count]));
  add('color-treemap-female.csv', ['Hex Color', 'Count'], colorTreemapData.female.slice(0, 100).map(c => [c.hex, c.count]));
  add('color-treemap-unknown.csv', ['Hex Color', 'Count'], colorTreemapData.unknown.slice(0, 100).map(c => [c.hex, c.count]));

  // Physical characteristics
  const dimensionData = getDimensionData(artworks, 'Painting');
  add('painting-dimensions.csv',
    ['Gender', 'Count', 'Avg Height (cm)', 'Avg Width (cm)', 'Avg Area (cm²)', 'Median Area (cm²)', 'Min Area (cm²)', 'Max Area (cm²)'],
    GENDERS.map(g => {
      const s = dimensionData.stats[g];
      return [g, s.count, pct(s.avgHeight), pct(s.avgWidth), pct(s.avgArea), pct(s.medianArea), pct(s.minArea), pct(s.maxArea)];
    }));

  const areaDistData = getAreaDistributionData(artworks, 'Painting');
  add('painting-size-distribution.csv',
    ['Area Bin (cm²)', 'Male Count', 'Female Count', 'Unknown Count', 'Male %', 'Female %', 'Unknown %'],
    areaDistData.labels.map((label, i) => [
      label,
      areaDistData.maleData[i],
      areaDistData.femaleData[i],
      areaDistData.unknownData[i],
      pct(areaDistData.malePercent[i]),
      pct(areaDistData.femalePercent[i]),
      pct(areaDistData.unknownPercent[i])
    ]));

  // Visibility & access
  const exhibitionMetrics = getExhibitionMetrics(artworks);
  add('exhibitions-by-gender.csv',
    ['Gender', 'Total Works', 'Works Ever Exhibited', 'Ever Exhibited (%)', 'Total Exhibitions', 'Avg Exhibitions per Work'],
    GENDERS.map(g => [
      g,
      exhibitionMetrics.totalWorks[g],
      exhibitionMetrics.worksExhibited[g],
      pct(exhibitionMetrics.totalWorks[g] > 0 ? (exhibitionMetrics.worksExhibited[g] / exhibitionMetrics.totalWorks[g]) * 100 : 0),
      exhibitionMetrics.totalExhibitions[g],
      pct(exhibitionMetrics.totalWorks[g] > 0 ? exhibitionMetrics.totalExhibitions[g] / exhibitionMetrics.totalWorks[g] : 0)
    ]));

  const onDisplayData = getOnDisplayData(artworks);
  add('on-display-by-gender.csv',
    ['Gender', 'Total Works', 'On Display Count', 'On Display %', 'Not Displayed Count', 'Not Displayed %'],
    onDisplayData.labels.map((label, i) => [
      label,
      onDisplayData.total[label],
      onDisplayData.displayedCount[i],
      pct(onDisplayData.displayedPercent[i]),
      onDisplayData.notDisplayedCount[i],
      pct(onDisplayData.notDisplayedPercent[i])
    ]));

  const hasImageData = getHasImageData(artworks);
  add('digitization-by-gender.csv',
    ['Gender', 'Total Works', 'Photographed Count', 'Photographed %', 'Not Photographed Count', 'Not Photographed %'],
    hasImageData.labels.map((label, i) => [
      label,
      hasImageData.total[label],
      hasImageData.withImageCount[i],
      pct(hasImageData.withImagePercent[i]),
      hasImageData.withoutImageCount[i],
      pct(hasImageData.withoutImagePercent[i])
    ]));

  return datasets;
}

/**
 * Builds a CSV per chart and downloads them bundled as a single .zip file
 * @param {Array<Object>} artworks - Normalized artwork items (full in-memory collection)
 */
export async function exportAllChartData(artworks) {
  const datasets = buildDatasets(artworks);

  const zip = new JSZip();
  datasets.forEach(({ filename, headers, rows }) => {
    zip.file(filename, toCSV(headers, rows));
  });

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().slice(0, 10);

  const link = document.createElement('a');
  link.href = url;
  link.download = `smk-data-export-${date}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
