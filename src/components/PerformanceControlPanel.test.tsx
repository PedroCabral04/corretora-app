import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { render as wrappedRender } from '@/test/test-utils';
import { PerformanceControlPanel } from './PerformanceControlPanel';
import type { PerformanceTarget } from '@/contexts/PerformanceChallengesContext';

vi.useFakeTimers();

describe('PerformanceControlPanel', () => {
  const baseTarget: PerformanceTarget = {
    id: 't1',
    metricType: 'tasks',
    targetValue: 10,
    currentValue: 3,
  } as unknown as PerformanceTarget;

  it('calls onTargetChange immediately on increment and decrement', async () => {
    const onTargetChange = vi.fn();
    // use project wrapper to ensure providers are present
    wrappedRender(<PerformanceControlPanel targets={[baseTarget]} onTargetChange={onTargetChange} />);

    // find the metric label then its container to locate the input and its +/- buttons
    const label = screen.getByText(/Tarefas/i);
    // climb up until we find an ancestor that contains the input element
    let container: HTMLElement | null = label.parentElement;
    while (container && container.querySelector('input') === null) {
      container = container.parentElement;
    }
    expect(container).toBeDefined();

    const input = container!.querySelector('input') as HTMLInputElement;
    const buttons = container!.querySelectorAll('button');
    // assume buttons order: decrement, increment
    const decrement = buttons[0];
    const increment = buttons[buttons.length - 1];

    // Click plus
    fireEvent.click(increment);
    expect(onTargetChange).toHaveBeenCalledTimes(1);
    expect(onTargetChange).toHaveBeenCalledWith(baseTarget.id, 4);

    // Click minus
    fireEvent.click(decrement);
    expect(onTargetChange).toHaveBeenCalledTimes(2);
    expect(onTargetChange).toHaveBeenCalledWith(baseTarget.id, 3);
  });

  it('debounces input typing and commits after timeout', () => {
    const onTargetChange = vi.fn();
    wrappedRender(<PerformanceControlPanel targets={[baseTarget]} onTargetChange={onTargetChange} />);

    const label = screen.getByText(/Tarefas/i);
    let container: HTMLElement | null = label.parentElement;
    while (container && container.querySelector('input') === null) {
      container = container.parentElement;
    }
    const input = container!.querySelector('input') as HTMLInputElement;

    // simulate typing 7 -> should schedule a commit after debounce
    fireEvent.change(input, { target: { value: '7' } });

    // advance less than debounce -> should not call yet
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(onTargetChange).toHaveBeenCalledTimes(0);

    // advance to pass debounce
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(onTargetChange).toHaveBeenCalledTimes(1);
    expect(onTargetChange).toHaveBeenCalledWith(baseTarget.id, 7);
  });

  it('commits immediately on Enter and on blur', () => {
    const onTargetChange = vi.fn();
    wrappedRender(<PerformanceControlPanel targets={[baseTarget]} onTargetChange={onTargetChange} />);

    const label = screen.getByText(/Tarefas/i);
    let container2: HTMLElement | null = label.parentElement;
    while (container2 && container2.querySelector('input') === null) {
      container2 = container2.parentElement;
    }
    const input = container2!.querySelector('input') as HTMLInputElement;

    // change to 6 and press Enter
    fireEvent.change(input, { target: { value: '6' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    expect(onTargetChange).toHaveBeenCalledWith(baseTarget.id, 6);

    // change to 5 and blur
    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.blur(input);
    expect(onTargetChange).toHaveBeenCalledWith(baseTarget.id, 5);
  });
});

