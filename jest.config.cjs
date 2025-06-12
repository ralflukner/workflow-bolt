/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      useESM: true
    }]
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)'
  ],
  // Separate test runners for different test types
  projects: [
    {
      displayName: 'unit',
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.test.(ts|tsx)',
        '<rootDir>/src/**/*.test.(ts|tsx)'
      ],
      testPathIgnorePatterns: [
        '/integration/',
        '/e2e/',
        '.integration.test.',
        '.e2e.test.'
      ]
    },
    {
      displayName: 'integration',
      testMatch: [
        '<rootDir>/src/**/*.integration.test.(ts|tsx)',
        '<rootDir>/src/**/__tests__/**/integration/**/*.test.(ts|tsx)'
      ],
      // Only run integration tests when environment variable is set
      testRunner: process.env.RUN_INTEGRATION_TESTS ? 'jest-runner' : '<rootDir>/src/test/skipRunner.js'
    },
    {
      displayName: 'real-api',
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*Configuration.test.(ts|tsx)'
      ],
      // Only run real API tests when explicitly enabled
      testRunner: process.env.RUN_REAL_API_TESTS ? 'jest-runner' : '<rootDir>/src/test/skipRunner.js'
    }
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/__tests__/**/*',
    '!src/**/*.test.*'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  globals: {
    'ts-jest': {
      useESM: true
    }
  }
}; 