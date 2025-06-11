const { jestConfig } = require('@salesforce/sfdx-lwc-jest/config');

module.exports = {
  ...jestConfig,
  moduleNameMapper: {
    '^apexcharts$': require.resolve('apexcharts'),
    '@salesforce/resourceUrl/ApexCharts': '<rootDir>/node_modules/apexcharts/dist/apexcharts.min.js'
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  modulePathIgnorePatterns: ['<rootDir>/.localdevserver']
};
