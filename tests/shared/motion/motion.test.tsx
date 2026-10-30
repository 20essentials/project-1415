// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { ShinyText } from '@/shared/motion/shiny-text';
import { GradientText } from '@/shared/motion/gradient-text';
import { Marquee } from '@/shared/motion/marquee';
import { SpotlightCard } from '@/shared/motion/spotlight-card';
import { StarBorder } from '@/shared/motion/star-border';
import { CountUp } from '@/shared/motion/count-up';
import { Reveal } from '@/shared/motion/reveal';

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    FakeIntersectionObserver.instances.push(this);
  }

  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();

  intersect() {
    act(() => {
      this.callback(
        [{ isIntersecting: true } as unknown as IntersectionObserverEntry],
        this as unknown as IntersectionObserver,
      );
    });
  }
}

function stubMotionApi() {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({ matches: false, addListener: vi.fn(), removeListener: vi.fn() }),
  );
  vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
  let now = 1000;
  vi.stubGlobal('performance', { now: () => now });
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    now += 400;
    callback(now);
    return now;
  });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
}

afterEach(() => {
  cleanup();
  FakeIntersectionObserver.instances = [];
  vi.unstubAllGlobals();
});

describe('ShinyText', () => {
  it('renders its children inside the primitive wrapper', () => {
    render(<ShinyText>Carnivorous darling</ShinyText>);
    const node = screen.getByText('Carnivorous darling');
    expect(node).toHaveAttribute('data-motion', 'shiny-text');
  });

  it('accepts a custom duration', () => {
    const { getByText } = render(<ShinyText duration={3}>fast</ShinyText>);
    expect(getByText('fast').style.getPropertyValue('--motion-shiny-duration')).toBe('3s');
  });
});

describe('GradientText', () => {
  it('renders its children inside the primitive wrapper', () => {
    render(<GradientText>Autumn 2026</GradientText>);
    expect(screen.getByText('Autumn 2026')).toHaveAttribute('data-motion', 'gradient-text');
  });
});

describe('Marquee', () => {
  it('renders the content twice, hiding the duplicate copy from screen readers', () => {
    const { container } = render(
      <Marquee ariaLabel="Reviews">
        <span>Predator approved</span>
      </Marquee>,
    );
    const copies = container.querySelectorAll('[data-motion-copy]');
    expect(copies).toHaveLength(2);
    expect(copies[0]).not.toHaveAttribute('aria-hidden');
    expect(copies[1]).toHaveAttribute('aria-hidden', 'true');
    expect(container.firstElementChild).toHaveAttribute('data-motion', 'marquee');
  });

  it('does not expose a role when no label is given', () => {
    const { container } = render(
      <Marquee>
        <span>x</span>
      </Marquee>,
    );
    expect(container.firstElementChild).not.toHaveAttribute('role');
  });
});

describe('SpotlightCard', () => {
  it('tracks the pointer with element-scoped CSS variables', () => {
    const { getByTestId } = render(
      <SpotlightCard>
        <div data-testid="inner">flytrap</div>
      </SpotlightCard>,
    );
    const card = getByTestId('inner').parentElement as HTMLElement;
    fireEvent.pointerMove(card, { clientX: 42, clientY: 17 });
    expect(card.style.getPropertyValue('--motion-spot-x')).toBe('42px');
    expect(card.style.getPropertyValue('--motion-spot-y')).toBe('17px');
  });
});

describe('StarBorder', () => {
  it('keeps children interactive-inert within the content layer', () => {
    const { getByTestId, container } = render(
      <StarBorder>
        <button type="button" data-testid="cta">
          Add to cart
        </button>
      </StarBorder>,
    );
    const wrapper = getByTestId('cta').parentElement;
    expect(wrapper).toHaveAttribute('data-motion-star-content');
    expect(container.firstElementChild).toHaveAttribute('data-motion', 'star-border');
  });
});

describe('CountUp', () => {
  it('renders the final formatted value for SSR and animates back to it', async () => {
    stubMotionApi();
    const { getByTestId } = render(
      <span data-testid="host">
        <CountUp to={120} suffix=" plants" />
      </span>,
    );
    const counter = getByTestId('host').querySelector('span') as HTMLElement;
    expect(counter.textContent).toBe('120 plants');

    FakeIntersectionObserver.instances[0].intersect();
    await waitFor(() => expect(counter.textContent).toBe('120 plants'));
    expect(counter).toHaveAttribute('data-motion', 'count-up');
  });

  it('formats decimals', () => {
    stubMotionApi();
    render(
      <span data-testid="host2">
        <CountUp to={4.8} decimals={1} />
      </span>,
    );
    expect(screen.getByText('4.8')).toBeInTheDocument();
  });

  it('never animates when the user prefers reduced motion', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    render(
      <span data-testid="host3">
        <CountUp to={99} />
      </span>,
    );
    expect(FakeIntersectionObserver.instances).toHaveLength(0);
  });
});

describe('Reveal', () => {
  it('keeps above-the-fold content visible and never observes it', () => {
    stubMotionApi();
    render(
      <Reveal>
        <p>visible already</p>
      </Reveal>,
    );
    const node = screen.getByText('visible already').parentElement as HTMLElement;
    expect(node).toHaveAttribute('data-motion', 'reveal');
    expect(node).not.toHaveAttribute('data-hidden');
    expect(FakeIntersectionObserver.instances).toHaveLength(0);
  });

  it('hides off-screen content until it enters the viewport', () => {
    stubMotionApi();
    const rectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockReturnValue({ top: 2000 } as DOMRect);
    try {
      const { getByText } = render(
        <Reveal>
          <p>lazy</p>
        </Reveal>,
      );
      const node = getByText('lazy').parentElement as HTMLElement;
      expect(node).toHaveAttribute('data-hidden');

      FakeIntersectionObserver.instances[0].intersect();
      expect(node).not.toHaveAttribute('data-hidden');
    } finally {
      rectSpy.mockRestore();
    }
  });
});
