import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';
import React from 'react';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as unknown as typeof globalThis.IntersectionObserver;

// Global mock for PerformanceChallengesContext
vi.mock('@/contexts/PerformanceChallengesContext', () => {
  const usePerformanceChallenges = () => ({
    challenges: [],
    isLoading: false,
    createChallenge: vi.fn(),
    updateChallenge: vi.fn(),
    deleteChallenge: vi.fn(),
    getChallengesByBrokerId: (brokerId: string) => [],
    refreshChallenges: vi.fn(),
  });

  const PerformanceChallengesProvider = ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children);

  return { usePerformanceChallenges, PerformanceChallengesProvider };
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as unknown as typeof globalThis.ResizeObserver;
