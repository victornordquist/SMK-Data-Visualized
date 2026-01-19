/**
 * Configuration constants for the SMK Data Visualized application
 */
export const CONFIG = {
  colors: {
    male: '#00C4AA',
    female: '#8700F9',
    unknown: '#dbdddd'
  },
  api: {
    baseUrl: 'https://api.smk.dk/api/v1/art/search/',
    pageSize: 2000,
    language: 'en'
  },
  cache: {
    key: 'smk_data_cache',
    version: 2, // Increment when data structure changes to invalidate old cache
    duration: 30 * 24 * 60 * 60 * 1000 // 30 days (1 month)
  },
  performance: {
    debounceDelay: 300, // milliseconds to wait before updating charts during data load
    lazyLoadMargin: '50px', // load charts 50px before they enter viewport
    lazyLoadThreshold: 0.1 // 10% of chart visible triggers load
  }
};
