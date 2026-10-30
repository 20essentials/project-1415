// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { CardHover } from '@/features/product-catalog/card-hover';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  document.body.innerHTML = '';
});

describe('CardHover', () => {
  it('writes pointer coordinates as CSS variables on the hovered card', () => {
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(performance.now());
      return 0;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    render(<CardHover />);

    const card = document.createElement('li');
    card.setAttribute('data-product-card', '');
    const media = document.createElement('div');
    media.setAttribute('data-product-media', '');
    card.append(media);
    document.body.append(card);

    fireEventOn(media, 'pointermove', { clientX: 34, clientY: 12 });

    expect(card.style.getPropertyValue('--card-glow-x')).toBe('34px');
    expect(card.style.getPropertyValue('--card-glow-y')).toBe('12px');
  });

  it('ignores moves outside of any card', () => {
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(performance.now());
      return 0;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    render(<CardHover />);

    const outside = document.createElement('div');
    document.body.append(outside);
    expect(() =>
      fireEventOn(outside, 'pointermove', { clientX: 5, clientY: 5 }),
    ).not.toThrow();
  });
});

function fireEventOn(target: Element, type: string, init: { clientX: number; clientY: number }) {
  const event = new MouseEvent(type, { ...init, bubbles: true });
  target.dispatchEvent(event);
  return event;
}
