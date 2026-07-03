module.exports = {
  clearMocks: true,
  collectCoverageFrom: [
    '<rootDir>/.tmp/jest/src/filters/filter-registry.js',
    '<rootDir>/.tmp/jest/src/filters/*.filter.js',
    '<rootDir>/.tmp/jest/src/graph/graph.loader.js',
    '<rootDir>/.tmp/jest/src/graph/graph.repository.js',
    '<rootDir>/.tmp/jest/src/graph/graph.schema.js',
    '<rootDir>/.tmp/jest/src/graph/graph.service.js',
    '<rootDir>/.tmp/jest/src/routes/graph.controller.js',
    '<rootDir>/.tmp/jest/src/routes/graph.query-schema.js',
  ],
  coverageDirectory: 'coverage',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/.tmp/jest/tests/**/*.test.js'],
};
