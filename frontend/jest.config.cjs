/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  setupFiles: ['<rootDir>/src/test/bootstrap.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleDirectories: ['node_modules'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': '<rootDir>/src/test/styleMock.ts',
  },
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: '<rootDir>/tsconfig.jest.json',
        diagnostics: false,
      },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!msw|@mswjs)'],
  testMatch: ['**/*.spec.ts', '**/*.spec.tsx'],
  coverageProvider: 'v8',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/App.tsx',
    '!src/main.tsx',
    '!src/components/icons.tsx',
    '!src/components/ui/**',
    '!src/features/**/components/**',
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
  },
};
