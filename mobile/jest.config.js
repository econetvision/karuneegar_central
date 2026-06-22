module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  setupFilesAfterFramework: ['@testing-library/jest-native/extend-expect'],
  setupFiles: ['./jest.setup.ts'],
  moduleNameMapper: {
    '^../api/client$': '<rootDir>/src/__mocks__/api.ts',
    '^../../api/client$': '<rootDir>/src/__mocks__/api.ts',
    '^../contexts/AuthContext$': '<rootDir>/src/__mocks__/AuthContext.ts',
    '^../../contexts/AuthContext$': '<rootDir>/src/__mocks__/AuthContext.ts',
  },
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
};
