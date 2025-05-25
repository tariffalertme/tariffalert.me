const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  // Use the Node environment for testing backend code
  testEnvironment: 'jsdom',
  preset: 'ts-jest',
  moduleNameMapper: {
    // Handle module aliases (if you have them in tsconfig.json)
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\.(ts|tsx)$': ['ts-jest', {
        tsconfig: 'tsconfig.json',
    }],
  },
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/sanity/'
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: ['**/__tests__/**/*.test.[jt]s?(x)'],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig) 