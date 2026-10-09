---
version: alpha
name: Petals & Predators
colors:
  paper: "#08090A"
  paper-warm: "#0F0F12"
  ink: "#FAF8F5"
  ink-soft: "#D9D7D4"
  mute: "#969E9B"
  rule: "#1E1F21"
  accent: "#18E299"
  cream: "#FFFFFF"
  error: "#EA4335"
typography:
  display:
    fontFamily: Fraunces, Georgia, serif
    fontWeight: 400
    lineHeight: 52px
    letterSpacing: -2px
  body:
    fontFamily: Inter, ui-sans-serif, system-ui, sans-serif
    fontWeight: 400
    lineHeight: 20px
  mono:
    fontFamily: ui-monospace, SFMono-Regular, monospace
rounded:
  sm: 4px
  md: 6px
  lg: 12px
containers:
  prose: 42rem
  md: 48rem
  3xl: 64rem
  6xl: 76.8rem
googleFontsHref: https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..700&family=Inter:wght@400;500;600&display=swap
---
# Design reference

Source: https://www.mintlify.com/
Page: Mintlify - The documentation platform for agents

Measured from 408 rendered elements at 1396 x 663px. This is a sample of the current document and state, not the original design source.

## Color palette

Only observed CSS colors are listed. Usage labels describe where a color was found. Hex is an sRGB preview; retain the original CSS value for its color space and transparency.

Usage | Original CSS value | sRGB hex | Observed root properties | Occurrences
--- | --- | --- | --- | ---
Text | lab(79.9844 -59.6292 22.5096) | #18E299 |  | 63
Text | lab(100 0 0) | #FFFFFF |  | 45
Text | lab(2.42579 -0.165291 -0.470081) | #08090A |  | 10
Text | rgb(250, 248, 245) | #FAF8F5 | --consent-widget-link-text-color, --button-neutral-hover-dark, --consent-dialog-foreground-color, --consent-banner-text-color | 8
Text | rgb(150, 158, 155) | #969E9B |  | 5
Text | rgb(255, 255, 255) | #FFFFFF | --color-white | 4
Text | lab(100 0 0 / 0.6) | #FFFFFF99 |  | 2
Text | lab(100 0 0 / 0.7) | #FFFFFFB3 |  | 1
Text | rgb(217, 215, 212) | #D9D7D4 | --collapsible-content-color, --accordion-icon-color | 1
Surface | lab(100 0 0) | #FFFFFF |  | 10
Surface | oklab(0.999994 0.0000455678 0.0000200868 / 0.03) | #FFFFFF08 |  | 8
Surface | lab(2.42579 -0.165291 -0.470081) | #08090A |  | 7
Surface | rgb(10, 11, 15) | #0A0B0F | --consent-banner-background-color, --tabs-list-background, --consent-widget-background-color-dark, --consent-widget-accordion-background-color | 6
Surface | rgb(15, 15, 18) | #0F0F12 |  | 6
Surface | rgb(30, 31, 33) | #1E1F21 |  | 5
Surface | rgba(31, 167, 122, 0.08) | #1FA77A14 |  | 1
Surface | rgb(18, 23, 21) | #121715 |  | 1
Border | rgb(30, 31, 33) | #1E1F21 |  | 23
Border | lab(100 0 0 / 0.07) | #FFFFFF12 |  | 9
Border | rgba(255, 255, 255, 0.08) | #FFFFFF14 |  | 8
Border | rgba(255, 255, 255, 0.1) | #FFFFFF1A | --consent-widget-border-color-dark, --consent-dialog-border-color, --button-border-color | 4
Border | oklab(0 0 0 / 0.04) | #0000000A |  | 1
Border | oklab(0.999994 0.0000455678 0.0000200868 / 0.05) | #FFFFFF0D |  | 1
Border | rgb(24, 226, 153) | #18E299 | --consent-widget-branding-link-color, --color-speedy-mint | 1
Icon | rgb(150, 158, 155) | #969E9B |  | 22
Icon | rgb(255, 255, 255) | #FFFFFF | --color-white | 15
Icon | lab(100 0 0) | #FFFFFF |  | 9
Icon | lab(2.42579 -0.165291 -0.470081) | #08090A |  | 5
Icon | rgb(18, 23, 21) | #121715 |  | 4
Icon | rgb(12, 140, 94) | #0C8C5E |  | 3
Icon | lab(100 0 0 / 0.6) | #FFFFFF99 |  | 3
Icon | rgb(255, 177, 0) | #FFB100 |  | 2
Icon | rgb(250, 248, 245) | #FAF8F5 | --consent-widget-link-text-color, --button-neutral-hover-dark, --consent-dialog-foreground-color, --consent-banner-text-color | 2
Icon | rgb(24, 226, 153) | #18E299 | --consent-widget-branding-link-color, --color-speedy-mint | 1
Icon | rgb(66, 133, 244) | #4285F4 |  | 1
Icon | rgb(52, 168, 83) | #34A853 |  | 1
Icon | rgb(251, 188, 5) | #FBBC05 |  | 1
Icon | rgb(234, 67, 53) | #EA4335 |  | 1
Icon | rgb(241, 81, 27) | #F1511B |  | 1
Icon | rgb(128, 204, 40) | #80CC28 |  | 1

## Typography

Role | Family | Size | Weight | Line height | Tracking | Text transform
--- | --- | --- | --- | --- | --- | ---
Heading | arizonaFlare, "arizonaFlare Fallback", serif | 50px | 400 | 52px | -2px | none
Section heading | inter, "inter Fallback" | 36px | 500 | 40px | -0.72px | none
Subheading | inter, "inter Fallback" | 16px | 500 | 24px | normal | none
Body | inter, "inter Fallback" | 14px | 400 | 20px | normal | none
Button | inter, "inter Fallback" | 16px | 400 | 24px | normal | none

## Spacing

Value | Occurrences
--- | ---
4px | 16
6px | 1
8px | 6
10px | 9
12px | 52
14px | 4
16px | 10
20px | 4
28px | 2
32px | 34
40px | 16
64px | 1
80px | 1
104px | 1
147.273px | 46
160px | 7
290.545px | 6
342.545px | 1

## Layout gaps

Value | Occurrences
--- | ---
4px | 42
6px | 6
12px | 2
16px | 32
24px | 12
40px | 1

## Corner radii

Value | Occurrences
--- | ---
2px | 8
4px | 92
6px | 96
12px | 36

## Shadows

No values observed in this sample.

## Motion durations

Value | Occurrences
--- | ---
0.2s | 72
0.1s | 38
0.15s | 23
0.7s | 12
0.3s | 8
0.5s | 7

## Motion easing

Value | Occurrences
--- | ---
cubic-bezier(0.4, 0, 0.2, 1) | 59
ease | 56
cubic-bezier(0, 0, 0.2, 1) | 20
cubic-bezier(0.22, 1, 0.36, 1) | 12
cubic-bezier(0, 0, 0, 1) | 7
cubic-bezier(0.23, 1, 0.32, 1) | 6

### Accessible keyframe names

- c15t-ui-enter-EoZFn
- c15t-ui-exit-Z4gI_
- c15t-ui-enter-oqaf_
- c15t-ui-exit-Yh5ig
- c15t-ui-fadeIn-moBzd
- enterFromRight
- enterFromLeft
- exitToRight
- exitToLeft
- scaleIn
- scaleOut
- navContentIn

## Component recipes

Computed styles for the captured state. Selectors identify sampled elements; text and placeholders come from the page. Form values are excluded. These style specimens do not reconstruct child markup or uncaptured interaction states.

### Button 1

Observed text or placeholder: Products

```css
#radix-_R_6aaivb_-trigger-Products {
  align-items: center;
  backdrop-filter: none;
  background-color: rgba(0, 0, 0, 0);
  background-image: none;
  border-bottom-color: lab(100 0 0);
  border-bottom-style: solid;
  border-bottom-width: 0px;
  border-left-color: lab(100 0 0);
  border-left-style: solid;
  border-left-width: 0px;
  border-radius: 0px;
  border-right-color: lab(100 0 0);
  border-right-style: solid;
  border-right-width: 0px;
  border-top-color: lab(100 0 0);
  border-top-style: solid;
  border-top-width: 0px;
  box-shadow: none;
  color: lab(100 0 0);
  display: flex;
  font-family: inter, "inter Fallback";
  font-size: 14px;
  font-weight: 500;
  gap: 4px;
  justify-content: center;
  letter-spacing: normal;
  line-height: 16px;
  opacity: 1;
  padding-bottom: 4px;
  padding-left: 10px;
  padding-right: 10px;
  padding-top: 4px;
  text-transform: none;
}
```

Ancestor backgrounds (outermost first):

Layer | Background color | Background image | Opacity
--- | --- | --- | ---
1 | lab(2.42579 -0.165291 -0.470081) | none | 1
2 | lab(2.42579 -0.165291 -0.470081) | none | 1

### Button 2

Observed text or placeholder: Pause testimonials

```css
button.cursor-pointer.rounded-\[4px\] {
  align-items: normal;
  backdrop-filter: none;
  background-color: rgba(0, 0, 0, 0);
  background-image: none;
  border-bottom-color: rgb(217, 215, 212);
  border-bottom-style: solid;
  border-bottom-width: 0px;
  border-left-color: rgb(217, 215, 212);
  border-left-style: solid;
  border-left-width: 0px;
  border-radius: 4px;
  border-right-color: rgb(217, 215, 212);
  border-right-style: solid;
  border-right-width: 0px;
  border-top-color: rgb(217, 215, 212);
  border-top-style: solid;
  border-top-width: 0px;
  box-shadow: none;
  color: rgb(217, 215, 212);
  display: block;
  font-family: inter, "inter Fallback";
  font-size: 14px;
  font-weight: 500;
  gap: normal;
  justify-content: normal;
  letter-spacing: normal;
  line-height: 20px;
  opacity: 1;
  padding-bottom: 0px;
  padding-left: 0px;
  padding-right: 0px;
  padding-top: 0px;
  text-transform: none;
}
```

Ancestor backgrounds (outermost first):

Layer | Background color | Background image | Opacity
--- | --- | --- | ---
1 | lab(2.42579 -0.165291 -0.470081) | none | 1

### Card 1

Observed text or placeholder: Microsoft

```css
div.group\/card.relative {
  align-items: center;
  backdrop-filter: none;
  background-color: oklab(0.999994 0.0000455678 0.0000200868 / 0.03);
  background-image: none;
  border-bottom-color: rgba(255, 255, 255, 0.08);
  border-bottom-style: solid;
  border-bottom-width: 0.727273px;
  border-left-color: rgba(255, 255, 255, 0.08);
  border-left-style: solid;
  border-left-width: 0.727273px;
  border-radius: 6px;
  border-right-color: rgba(255, 255, 255, 0.08);
  border-right-style: solid;
  border-right-width: 0.727273px;
  border-top-color: rgba(255, 255, 255, 0.08);
  border-top-style: solid;
  border-top-width: 0.727273px;
  box-shadow: none;
  color: rgb(255, 255, 255);
  display: flex;
  font-family: inter, "inter Fallback";
  font-size: 16px;
  font-weight: 400;
  gap: normal;
  justify-content: center;
  letter-spacing: normal;
  line-height: 24px;
  opacity: 1;
  padding-bottom: 0px;
  padding-left: 0px;
  padding-right: 0px;
  padding-top: 0px;
  text-transform: none;
}
```

Ancestor backgrounds (outermost first):

Layer | Background color | Background image | Opacity
--- | --- | --- | ---
1 | lab(2.42579 -0.165291 -0.470081) | none | 1

### Card 2

Observed text or placeholder: Agent-native platform

```css
article.relative.flex {
  align-items: normal;
  backdrop-filter: none;
  background-color: rgb(15, 15, 18);
  background-image: none;
  border-bottom-color: lab(100 0 0 / 0.07);
  border-bottom-style: solid;
  border-bottom-width: 0.727273px;
  border-left-color: lab(100 0 0 / 0.07);
  border-left-style: solid;
  border-left-width: 0.727273px;
  border-radius: 12px;
  border-right-color: lab(100 0 0 / 0.07);
  border-right-style: solid;
  border-right-width: 0.727273px;
  border-top-color: lab(100 0 0 / 0.07);
  border-top-style: solid;
  border-top-width: 0.727273px;
  box-shadow: none;
  color: rgb(255, 255, 255);
  display: flex;
  font-family: inter, "inter Fallback";
  font-size: 16px;
  font-weight: 400;
  gap: normal;
  justify-content: normal;
  letter-spacing: normal;
  line-height: 24px;
  opacity: 1;
  padding-bottom: 32px;
  padding-left: 32px;
  padding-right: 32px;
  padding-top: 32px;
  text-transform: none;
}
```

Ancestor backgrounds (outermost first):

Layer | Background color | Background image | Opacity
--- | --- | --- | ---
1 | lab(2.42579 -0.165291 -0.470081) | none | 1

### Card 3

Observed text or placeholder: See how Anthropic accelerates AI adoption with Mintlify 2M Monthly active developers 4+ Products serviced Read the story

```css
div.min-w-0.shrink-0 {
  align-items: normal;
  backdrop-filter: none;
  background-color: rgba(0, 0, 0, 0);
  background-image: none;
  border-bottom-color: rgb(255, 255, 255);
  border-bottom-style: solid;
  border-bottom-width: 0px;
  border-left-color: rgb(255, 255, 255);
  border-left-style: solid;
  border-left-width: 0px;
  border-radius: 0px;
  border-right-color: rgb(255, 255, 255);
  border-right-style: solid;
  border-right-width: 0px;
  border-top-color: rgb(255, 255, 255);
  border-top-style: solid;
  border-top-width: 0px;
  box-shadow: none;
  color: rgb(255, 255, 255);
  display: block;
  font-family: inter, "inter Fallback";
  font-size: 16px;
  font-weight: 400;
  gap: normal;
  justify-content: normal;
  letter-spacing: normal;
  line-height: 24px;
  opacity: 1;
  padding-bottom: 0px;
  padding-left: 0px;
  padding-right: 0px;
  padding-top: 0px;
  text-transform: none;
}
```

Ancestor backgrounds (outermost first):

Layer | Background color | Background image | Opacity
--- | --- | --- | ---
1 | lab(2.42579 -0.165291 -0.470081) | none | 1

## Layout measurements

Element | Width | Display | Columns | Gap | Padding (T R B L)
--- | --- | --- | --- | --- | ---
header | 1383px | block | none | normal | 0px 0px 0px 0px
main | 1383px | block | none | normal | 0px 0px 0px 0px
section | 1383px | block | none | normal | 0px 0px 0px 0px
section | 1383px | block | none | normal | 0px 0px 0px 0px
section | 1383px | block | none | normal | 0px 0px 0px 0px
header | 995px | flex | none | 24px | 0px 0px 0px 0px
article | 698px | flex | none | normal | 32px 32px 32px 32px
article | 341px | flex | none | normal | 32px 32px 32px 32px
article | 341px | flex | none | normal | 32px 32px 32px 32px
article | 341px | flex | none | normal | 32px 32px 32px 32px

## Responsive conditions

- `(pointer: fine)`
- `(hover: hover)`
- `(prefers-reduced-motion: reduce)`
- `(hover: none)`
- `(min-width: 640px)`
- `(max-width: 480px)`
- `(hover: hover) and (pointer: fine)`
- `(max-width: 640px)`
- `(min-width: 40rem)`
- `(min-width: 48rem)`
- `(min-width: 64rem)`
- `(min-width: 80rem)`
- `(min-width: 96rem)`
- `(prefers-reduced-motion: no-preference)`
- `(forced-colors: active)`
- `not all and (hover: hover)`
- `not all and (min-width: 965px)`
- `not all and (min-width: 950px)`
- `not all and (min-width: 935px)`
- `not all and (min-width: 900px)`

## CSS custom properties

Names and values read from the root element; no new token names or ramps were generated.

Property | Value
--- | ---
--accordion-radius | 8px
--twoslash-tag-bg | rgba(107,182,255,.19)
--consent-widget-link-text-color | #faf8f5
--blur-lg | 16px
--collapsible-content-color | #d9d7d4
--preference-item-gap | .75rem
--accordion-icon-color | #d9d7d4
--consent-widget-accordion-content-color | #5c5c5c
--tw-mask-bottom-from-color | black
--button-shadow-neutral-hover | none
--accordion-focus-shadow | 0 0 0 2px #18e299
--consent-dialog-branding-icon-width | auto
--color-neutral-300 | #cfcdca
--tw-mask-conic | linear-gradient(#fff,#fff)
--button-shadow-primary | 0 1px 2px hsla(0, 0%, 0%, 0.05),inset 0 0 0 1px #18e299
--consent-widget-title-line-height | 1.25
--tw-inset-ring-shadow | 0 0 transparent
--text-base--line-height | calc(1.5/1)
--radius-4xl | 2rem
--consent-widget-branding-link-color | #18e299
--carousel-gutter | calc(max(calc((100vw - 1088px)/2),32px) + 16px)
--consent-banner-background-color | #0a0b0f
--c15t-radius-sm | 4px
--color-speedy-mint | #18e299
--button-neutral-hover-dark | #faf8f5
--frame-placeholder-border-radius | 1.25rem
--consent-widget-border-color-dark | rgba(255,255,255,.1)
--tabs-list-background | #0a0b0f
--consent-dialog-title-font-size | 0.875rem
--tw-mask-top-to-position | 100%
--consent-dialog-foreground-color | #faf8f5
--consent-dialog-overlay-background-color-dark | color-mix(in oklab, #0a0b0f 50%, transparent)
--tw-inset-shadow | 0 0 transparent
--button-shadow-neutral-hover-dark | none
--color-white | #fff
--legal-links-transition | text-decoration .2s ease
--consent-widget-background-color-dark | #0a0b0f
--tw-shadow-alpha | 100%
--radius-sm | .25rem
--consent-widget-accordion-background-color | #0a0b0f
--frame-placeholder-animation | c15t-ui-fadeIn-moBzd .15s cubic-bezier(.165,.84,.44,1)forwards
--color-gray-100 | lab(96.1596% -.0823438 -1.13575)
--consent-widget-title-weight | 600
--consent-dialog-title-font-weight | 600
--legal-links-color | #476cff
--accordion-ease | cubic-bezier(0.4, 0, 0.2, 1)
--twoslash-popup-bg | #151819
--color-border-transparent | rgba(255,255,255,0)
--color-pink-2 | #ffa3d3
--button-hover-transition-full | background-color 280ms/**/cubic-bezier(0.4, 0, 0.2, 1),box-shadow 280ms/**/cubic-bezier(0.4, 0, 0.2, 1),color 280ms/**/cubic-bezier(0.4, 0, 0.2, 1)
--consent-widget-accordion-content-color-dark | #999
--color-background-tertiary | #485450
--tw-space-x-reverse | 0
--consent-dialog-border-color | rgba(255,255,255,.1)
--tw-mask-right | linear-gradient(#fff,#fff)
--consent-banner-text-color | #faf8f5
--button-border-color | rgba(255,255,255,.1)
--tw-gradient-to-position | 100%
--c15t-font-weight-normal | 400
--color-purple | #d87cff

## Capture coverage

- 0 stylesheet(s) could not be inspected. Computed styles are still measured.
- Sampling excludes hidden elements and Sitepeel tools. Offscreen rendered elements may be included. Counts refer to the sample, not the entire website.
- Colors are CSS values, not a screenshot pixel palette. Images, compositing and gradients can affect their visible appearance.
- Hover, focus, active states, other viewport sizes, iframe documents and shadow trees need separate captures.
- No inferred brand personality, invented colors, placeholder copy or unobserved code is presented as a page measurement.
- 15 canvas element(s) detected. CSS extraction does not expose canvas drawing, WebGL shaders or JavaScript animation internals.
