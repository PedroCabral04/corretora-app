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

// Global mock for PerformanceContext (legacy/alternate Performance provider used by some components)
vi.mock('@/contexts/PerformanceContext', () => {
  const usePerformance = () => ({
    challenges: [],
    metrics: [],
    isLoading: false,
    error: null,
    createChallenge: vi.fn(),
    updateChallenge: vi.fn(),
    deleteChallenge: vi.fn(),
    getChallengeById: (id: string) => undefined,
    getChallengesByBrokerId: (brokerId: string) => [],
    calculateProgress: vi.fn(),
    updateMetrics: vi.fn(),
    getMetricsByChallengeId: (challengeId: string) => [],
    getActiveChallenges: () => [],
    getCompletedChallenges: () => [],
    getExpiredChallenges: () => [],
    refreshChallenges: vi.fn(),
    exportChallengeReport: vi.fn(),
  });

  const PerformanceProvider = ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children);

  return { usePerformance, PerformanceProvider };
});

// Global mock for AuthContext so hooks/components using auth work in tests
vi.mock('@/contexts/AuthContext', () => {
  const useAuth = () => ({
    user: { id: 'test-user', email: 'test@example.com', name: 'Test User', role: 'manager' },
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    isLoading: false,
  });

  const AuthProvider = ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children);

  return { useAuth, AuthProvider };
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as unknown as typeof globalThis.ResizeObserver;
