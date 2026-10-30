// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GlitchText } from '@/features/not-found/glitch-text';

describe('GlitchText', () => {
  it('renders the text once for readers and twice as visual slices', () => {
    render(<GlitchText>404</GlitchText>);

    expect(screen.getAllByText('404')).toHaveLength(3);
  });

  it('applies the brand shadow colors through the style variables', () => {
    const { container } = render(
      <GlitchText shadowColors={['#18e299', '#faf8f5']}>404</GlitchText>,
    );

    const root = container.querySelector('.glitch') as HTMLElement;
    expect(root.style.getPropertyValue('--glitch-color-a')).toBe('#18e299');
    expect(root.style.getPropertyValue('--glitch-color-b')).toBe('#faf8f5');
  });
});
