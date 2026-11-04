import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SMOOTHER_TICK_MS, StreamSmoother } from '@/features/smart-chat/stream-smoother';

describe('StreamSmoother', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reveals streamed text progressively and settles with the full text', async () => {
    const frames: string[] = [];
    const smoother = new StreamSmoother((text) => frames.push(text));
    smoother.append('Hello streaming world');
    const drained = smoother.drain();

    await vi.advanceTimersByTimeAsync(SMOOTHER_TICK_MS * 20);

    await expect(drained).resolves.toBe('Hello streaming world');
    expect(new Set(frames).size).toBeGreaterThan(1);
    expect(frames[0].length).toBeLessThan('Hello streaming world'.length);
    expect(frames.at(-1)).toBe('Hello streaming world');
    expect(smoother.isSettled).toBe(true);
  });

  it('resolves drain immediately once settled', async () => {
    const frames: string[] = [];
    const smoother = new StreamSmoother((text) => frames.push(text));
    smoother.append('Short');
    await vi.advanceTimersByTimeAsync(SMOOTHER_TICK_MS * 20);

    expect(frames.at(-1)).toBe('Short');
    await expect(smoother.drain()).resolves.toBe('Short');
  });

  it('reset clears buffered text and stops rendering', async () => {
    const frames: string[] = [];
    const smoother = new StreamSmoother((text) => frames.push(text));
    smoother.append('Some streaming answer');
    smoother.reset();

    await vi.advanceTimersByTimeAsync(SMOOTHER_TICK_MS * 30);

    expect(frames.at(-1)).toBe('');
    expect(smoother.fullText).toBe('');
  });

  it('dispose resolves a pending drain with an empty string', async () => {
    const rendered: string[] = [];
    const smoother = new StreamSmoother((text) => rendered.push(text));
    smoother.append('Answer in flight');
    const drained = smoother.drain();
    smoother.dispose();

    await expect(drained).resolves.toBe('');
  });
});
