/**
 * Jest Configuration for UI Testing
 * Configured for ESM support with package.json "type": "module"
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',

  // Module file extensions
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'mjs'],

  // Test file patterns
  testMatch: [
    '**/tests/**/*.test.{js,ts}',
    '**/tests/**/*.spec.{js,ts}'
  ],

  // No transforms - native Node.js ESM support
  transform: {},

  // Module name mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Coverage configuration
  collectCoverage: false, // Enable with --coverage flag
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    'examples/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{js,ts}',
    '!**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output
  verbose: false, // Enable with --verbose flag
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Reset modules between tests
  resetModules: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Error on deprecated features
  errorOnDeprecated: true,
  
  // Test path ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/dist/'
  ],
  
  // Watch plugins
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  
  // Reporter configuration
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: 'test-results',
      outputName: 'junit.xml'
    }]
  ],
  
  // Performance test configuration
  maxWorkers: '50%',
  
  // Custom test categories
  projects: [
    {
      displayName: 'UI Components',
      testMatch: ['**/tests/ui/components/**/*.test.{js,ts}']
    },
    {
      displayName: 'UI Integration',
      testMatch: ['**/tests/ui/integration/**/*.test.{js,ts}']
    },
    {
      displayName: 'UI Performance',
      testMatch: ['**/tests/ui/performance/**/*.test.{js,ts}']
    }
  ]
};