/**
 * Configuration constants for the SMK Data Visualized application
 */
export const CONFIG = {
  colors: {
    male: '#3e5c82',
    female: '#ed969d',
    unknown: '#cccccc'
  },
  api: {
    baseUrl: 'https://api.smk.dk/api/v1/art/search/',
    pageSize: 2000,
    language: 'en'
  },
  dateRanges: {
    recentStart: 2000,
    recentEnd: 2025
  },
  cache: {
    key: 'smk_data_cache',
    duration: 7 * 24 * 60 * 60 * 1000 // 7 days
  },
  performance: {
    debounceDelay: 300, // milliseconds to wait before updating charts during data load
    lazyLoadMargin: '50px', // load charts 50px before they enter viewport
    lazyLoadThreshold: 0.1 // 10% of chart visible triggers load
  }
};
