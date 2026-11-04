export const SMOOTHER_TICK_MS = 40;
export const SMOOTHER_DRAIN_TICKS = 14;

export class StreamSmoother {
  private target = '';
  private shown = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private doneListeners: ((text: string) => void)[] = [];

  constructor(
    private readonly render: (text: string) => void,
    private readonly tickMs: number = SMOOTHER_TICK_MS,
    private readonly drainTicks: number = SMOOTHER_DRAIN_TICKS,
  ) {}

  get fullText(): string {
    return this.target;
  }

  get shownText(): string {
    return this.target.slice(0, this.shown);
  }

  get isSettled(): boolean {
    return this.shown >= this.target.length;
  }

  append(chunk: string): void {
    this.target += chunk;
    this.ensureTicker();
  }

  reset(): void {
    this.stopTicker();
    this.target = '';
    this.shown = 0;
    this.doneListeners = [];
    this.render('');
  }

  drain(): Promise<string> {
    if (this.isSettled) {
      return Promise.resolve(this.target);
    }
    return new Promise((resolve) => {
      this.doneListeners.push((text) => resolve(text));
      this.ensureTicker();
    });
  }

  dispose(): void {
    this.stopTicker();
    this.target = '';
    this.shown = 0;
    const listeners = this.doneListeners;
    this.doneListeners = [];
    this.render('');
    for (const listener of listeners) listener('');
  }

  private ensureTicker(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), this.tickMs);
  }

  private stopTicker(): void {
    if (this.timer === null) return;
    clearInterval(this.timer);
    this.timer = null;
  }

  private tick(): void {
    const remaining = this.target.length - this.shown;
    if (remaining <= 0) {
      this.settle();
      return;
    }
    this.shown += Math.max(1, Math.ceil(remaining / this.drainTicks));
    this.render(this.shownText);
    if (this.shown >= this.target.length) this.settle();
  }

  private settle(): void {
    this.shown = this.target.length;
    this.render(this.shownText);
    this.stopTicker();
    const listeners = this.doneListeners;
    this.doneListeners = [];
    for (const listener of listeners) listener(this.target);
  }
}
