/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  setupFiles: ['<rootDir>/src/test-env.js'],
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  testTimeout: 30000
}
