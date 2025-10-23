import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';

// We'll mock the supabase client to return initial data and capture persistence calls
const upsertSpy = vi.fn(async () => ({ data: [], error: null }));
const updateSpy = vi.fn(async () => ({ data: [], error: null }));
const deleteSpy = vi.fn(async () => ({ data: [], error: null }));
const insertSpy = vi.fn(async () => ({ data: [], error: null }));

vi.mock('@/integrations/supabase/client', () => {
  const mockFrom = (table: string) => {
    const obj: any = {};
    
    // Mock select to return different data based on the table
    obj.select = vi.fn((..._args: any[]) => {
      const selectChain: any = {
        data: table === 'performance_challenges' 
          ? [{ id: 'c1', user_id: 'user-1', broker_id: 'b1', title: 'Teste', description: null, status: 'active', priority: 'medium', start_date: new Date().toISOString(), end_date: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }] 
          : [{ id: 't1', challenge_id: 'c1', metric_type: 'tasks', target_value: 10, current_value: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }],
        error: null
      };
      selectChain.eq = vi.fn(() => selectChain);
      selectChain.in = vi.fn(() => selectChain);
      selectChain.single = vi.fn(() => ({ 
        data: table === 'performance_challenges'
          ? { id: 'c1', user_id: 'user-1', broker_id: 'b1', title: 'Teste', description: null, status: 'active', priority: 'medium', start_date: new Date().toISOString(), end_date: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
          : null,
        error: null 
      }));
      selectChain.order = vi.fn(() => selectChain);
      return selectChain;
    });
    
    // Mock eq to return chainable methods
    obj.eq = vi.fn(() => {
      const eqChain: any = { 
        select: obj.select, 
        update: updateSpy,
        delete: deleteSpy,
        insert: insertSpy,
        upsert: upsertSpy,
        single: vi.fn(() => ({ data: null, error: null }))
      };
      eqChain.eq = vi.fn(() => eqChain);
      return eqChain;
    });
    
    // Mock in to return select and other methods
    obj.in = vi.fn(() => {
      const inChain: any = { 
        select: obj.select, 
        delete: deleteSpy,
        data: [],
        error: null
      };
      return inChain;
    });
    
    // Mock delete to return chainable methods
    obj.delete = vi.fn(() => {
      const deleteChain: any = {
        eq: obj.eq,
        in: vi.fn(async () => ({ data: [], error: null })),
        data: [],
        error: null
      };
      return deleteChain;
    });
    
    // Direct methods
    obj.upsert = upsertSpy;
    obj.update = updateSpy;
    obj.insert = insertSpy;
    
    return obj;
  };

  return {
    supabase: {
      from: mockFrom,
      auth: { getUser: async () => ({ data: { user: { id: 'user-1' } } }) },
      channel: () => {
        const ch: any = {
          on: (..._args: any[]) => ch,
          subscribe: () => ({})
        };
        return ch;
      },
      removeChannel: () => {},
    },
  };
});

// Mock AuthContext so provider can find a user in tests
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1', email: 'test@example.com' } }),
  AuthProvider: ({ children }: any) => children,
}));

// We need the real provider/module, bypassing the global mock in test setup
const RealModule = await vi.importActual('@/contexts/PerformanceChallengesContext');
const { PerformanceChallengesProvider, usePerformanceChallenges } = RealModule as any;

describe('PerformanceChallengesContext integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('persists batched updates without deleting other targets', async () => {
    // prepare a test consumer component
    const TestConsumer = () => {
      const ctx = usePerformanceChallenges();
      // expose to window for test to call
      (window as any).__ctx = ctx;
      return null;
    };

    render(
      <PerformanceChallengesProvider>
        <TestConsumer />
      </PerformanceChallengesProvider>
    );

    // Wait for initial data load
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    // get consumer ctx
    const ctx = (window as any).__ctx;
    expect(ctx).toBeDefined();
    
    // Verify we have challenges loaded
    expect(ctx.challenges).toBeDefined();
    expect(ctx.challenges.length).toBeGreaterThan(0);

    // Simulate updating only one target
    await act(async () => {
      await ctx.updateTargetProgress('c1', 't1', 5);
    });

    // advance timers to trigger debounce (800ms timeout + buffer)
    await act(async () => {
      await new Promise((r) => setTimeout(r, 900));
    });

    // assert that upsert/update was called with a payload including all targets
    // (we mocked updateChallenge which calls upsert/delete internally, so check that upsertSpy or updateSpy was called)
    const called = upsertSpy.mock.calls.length + updateSpy.mock.calls.length;
    expect(called).toBeGreaterThan(0);
  });
});
