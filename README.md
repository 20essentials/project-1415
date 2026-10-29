<a id="readme-top"></a>
<a href="https://petals-d960960gm-0609.wix-site-host.com/" target="_blank" rel="noopener noreferrer">
  <img src="preview/project-1415.avif" alt="Petals & Predators" />
</a>

# Petals & Predators

Headless store for carnivorous plants and flowers — Astro + Wix Managed Headless. [Report a bug](https://github.com/20essentials/project-1415/issues) · [Suggest a feature](https://github.com/20essentials/project-1415/issues)

An English-language e-commerce built on **Wix Stores** as the backend (catalog, cart and
native checkout) and **Astro** as the SSR frontend. The design follows a dark, minimal
aesthetic inspired by Mintlify: `#08090A` background, mint `#18E299` accent, Fraunces +
Inter type. See `DESIGN.md`.

</div>

<details>
<summary>Table of contents</summary>

- [Features](#features)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Contributing to the project](#contributing-to-the-project)
- [🛠️ Stack](#️-stack)
- [Wix apps](#wix-apps)
- [Structure](#structure)
- [Scripts](#scripts)
- [CI/CD](#cicd)
- [Environment variables](#environment-variables)
- [How this is built](#how-this-is-built)
- [Docs](#docs)
- [License](#license)

</details>

---

## Features

- **Home** with a cinematic _scroll-world_ landing (6 pre-rendered clips).
- **Shop** with a product grid and per-category pages.
- **Product detail** with variants, quantity and add-to-cart.
- **Cart + checkout** native Wix flow + reactive badge in the nav.
- **Journal** of plant care (Wix CMS) with dynamic routes.
- **Seasonal Lookbook** with a mosaic per season.
- **Product reviews** (Wix Reviews) — rating on the PDP and home.
- **Gift cards** with a fallback if the app is not installed.
- **Members** — login, account and logout (Wix Members Area).
- **Multilingual** with a language selector and per-locale SEO.

---

## Getting Started

### Prerequisites

- **Node LTS** (Astro 5 requires a modern Node). You can use [NVM](https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating) to pin the version:

  ```sh
  nvm use --lts
  ```

- **npm ≥ 11.10.0** (the root `.npmrc` uses `min-release-age`).

  ```sh
  npm install npm@latest -g
  ```

> **Why npm and not pnpm?** The Wix dependency tree mixes React versions. Packages like
> `@wix/dashboard` declare stale peer ranges (`react: "^16.0.0 || ^18.0.0"`) that clash
> with the project's **React 18** under strict peer resolution. `.npmrc` sets
> `legacy-peer-deps=true` so the install doesn't abort on that conflict, plus
> `min-release-age=1` (a 1-day cooldown on freshly published versions). That's why the
> only lockfile is `package-lock.json`.

### Installation

1. Clone the repository

   ```sh
   git clone https://github.com/20essentials/project-1415.git
   cd project-1415
   ```

2. Install NPM packages (postinstall also applies the `patch-package` patch)

   ```sh
   npm install
   ```

3. Link the project to a Wix site and log in (`wix login`), then run the project

   ```sh
   npm run dev      # wix dev — http://localhost:4321
   ```

4. Build and release

   ```sh
   npm run build    # wix build
   npm run preview  # wix preview
   npm run release  # wix release
   ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Contributing to the project

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contribution you make is **greatly appreciated**!

If you have a suggestion that would improve the project, please [_fork_](https://github.com/20essentials/project-1415/fork) the repository and create a [_pull request_](https://github.com/20essentials/project-1415/pulls). You can also simply open an [_issue_](https://github.com/20essentials/project-1415/issues) with the "enhancement" tag. Don't forget to give the project a star if you like it!

Here's a quick guide:

1. [_Fork_](https://github.com/20essentials/project-1415/fork) the Project
2. Clone your [_fork_](https://github.com/20essentials/project-1415/fork) (`git clone <fork URL>`)
3. Add the original repository as remote (`git remote add upstream <original repo URL>`)
4. Create your Feature Branch (`git switch -c feature/AmazingFeature`)
5. Commit your Changes (`git commit -m 'Add: some AmazingFeature'`)
6. Push to the Branch (`git push origin feature/AmazingFeature`)
7. Open a [_pull request_](https://github.com/20essentials/project-1415/pulls)

Please, see our [contributing guide](CONTRIBUTING.md) to learn how to get started in the best way and following [good practices](CONTRIBUTING.md#good-practices).

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## 🛠️ Stack

- [![Astro][astro-badge]][astro-url] - The web framework for content-driven websites.
- [![React][react-badge]][react-url] - Islands for interactive components.
- [![Tailwind CSS][tailwind-badge]][tailwind-url] - A utility-first CSS framework for rapidly building custom designs.
- [![Vitest][vitest-badge]][vitest-url] - Unit testing framework, with Playwright for E2E.
- [![Wix][wix-badge]][wix-url] - Headless backend: Stores, eCommerce, CMS, Blog, Forms, Reviews, Members, Bookings, Gift Cards, Pricing Plans.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

---

## Wix apps

Apps the project uses (✅) and Wix-API-available apps that are **not** installed or used (❌).

| Status | Wix app                           | Features / pages / sections this site uses                                                                          |
| :----: | --------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
|   ✅   | **Wix Stores** (catalog)          | Home (featured products) · Shop / product grid · category pages · PDP (variants, price) · Site search               |
|   ✅   | **Wix eCommerce** (cart/checkout) | Cart + reactive badge in the nav · native Wix checkout · Order history                                              |
|   ✅   | **Wix CMS** (`@wix/data`)         | Journal (care guides with dynamic routes) · seasonal Lookbook · Wishlist · Restock alerts                           |
|   ✅   | **Wix Blog**                      | `/blog` index · `/blog/[slug]` posts with rich content · categories by slug `/blog/category/[slug]` · related posts |
|   ✅   | **Wix Forms**                     | Contact (contact form) · Newsletter (subscription)                                                                  |
|   ✅   | **Wix Reviews**                   | Rating and reviews on the PDP · home reviews carousel · create-review form                                          |
|   ✅   | **Wix Members**                   | Login / logout · account page (avatar, profile) · unlocks Wishlist and per-member Order history                     |
|   ✅   | **Wix Bookings**                  | Workshops (Care 101, Repotting 101 — APPOINTMENT services)                                                          |
|   ✅   | **Wix Gift Cards**                | Gift cards page (eGift Card with 5 preset variants)                                                                 |
|   ✅   | **Wix Pricing Plans**             | Club (subscription, monthly / annual plans)                                                                         |
|   ✅   | **Wix Multilingual**              | Language selector `en` / `es` / `it` · SEO and routes per locale                                                    |
|   ❌   | **Wix Events**                    | Unused — we don't sell tickets or RSVPs                                                                             |
|   ❌   | **Wix Donations**                 | Unused — pure e-commerce                                                                                            |
|   ❌   | **Wix Restaurants**               | Unused                                                                                                              |
|   ❌   | **Wix Forum**                     | Unused                                                                                                              |
|   ❌   | **Wix Portfolio**                 | Unused — the Lookbook is our own CMS                                                                                |

---

## Structure

Screaming Architecture: the folders scream **what the business does**, not what technology it uses (see the rules in `AGENTS.md`).

```
src/
├── app/            # app chrome: layout.astro, header, footer, logo, language-selector
├── shared/         # cross-cutting infra (2+ features): i18n, wix-image, ricos, seo,
│                   # analytics, wix-forms, discounts, site, og-image
├── features/       # ONE folder per business capability (with index.ts as public API)
│                   # home, product-catalog, cart, journal, lookbook, workshops,
│                   # gift-cards, reviews, account, newsletter, contact, site-search
├── pages/          # thin routes (Astro requirement): compose features, no logic
├── styles/         # global.css + @theme tokens
├── assets/         # fonts and static media
└── translations.json
tests/              # features/, shared/, e2e/, mocks/
```

Rules: every feature exposes its API in `index.ts` and is imported only as `@/features/<feature>`; a feature **never** imports from another feature (if they share something → `src/shared/`); `src/pages` only composes. `src/components/`, `src/utils/` and `src/data/` are deprecated.

> Every file inside `src/` goes in **kebab-case** and without `any` (see `AGENTS.md`).

---

## Scripts

| Command               | Description                               |
| --------------------- | ----------------------------------------- |
| `npm run dev`         | Dev server (`wix dev`)                    |
| `npm run build`       | Builds the site (`wix build`)             |
| `npm run release`     | Publishes to Wix Hosting                  |
| `npm run check`       | TS and `.astro` typecheck (`astro check`) |
| `npm test`            | Unit tests (Vitest)                       |
| `npm run test:watch`  | Vitest in watch mode                      |
| `npm run test:e2e`    | E2E with Playwright                       |
| `npm run test:e2e:ui` | E2E in UI mode                            |
| `npm run wix`         | Wix CLI (translate, env, generate, …)     |

## CI/CD

- **CI**: `.github/workflows/ci.yml` runs on push/PR (`npm ci`, `npm run check`, `npm test`, Playwright Chromium E2E, `npx @wix/cli build`).
- **Release**: `.github/workflows/release.yml` supports manual dispatch (`workflow_dispatch`) or tags (`v*`). Uses `wix build` + `wix login --api-key` + `wix release` with secrets (never commit secrets). Set `WIX_API_KEY` in GitHub Secrets (and use environment `production` as desired).

## Environment variables

Use the Wix CLI to manage env vars:

```bash
# Set a public/server variable on Wix (shared with collaborators)
npx @wix/cli env set --key=MY_VAR --value=...

# Pull variables from Wix to .env.local (required for secrets/shared vars)
npx @wix/cli env pull

# Remove a variable
npx @wix/cli env remove --key=MY_VAR
```

Notes:

- Secrets are stored on Wix servers; `wix env pull` downloads them locally. Public vars can be stored in `.env.local` or via `wix env set/pull`.
- Never commit real secrets. `.env`, `.env.local`, `.env.*.local` are gitignored. See `.env.example` for non-secret placeholders.
- Schema is typed in `astro.config.mjs` via `envField` (Astro env schema). Access client vars via `astro:env/client`, server vars via `astro:env/server`.

---

## How this is built

The site is developed **step by step**. Every `.opencode/commands/step-N-*.md` file is the
source of truth for what to do next; run them in order.

- `ROADMAP.md` — backlog status (`pending` → `materialized` → `✅ done`).
- `PLAN.md` — design decisions and flow mechanics.
- `AGENTS.md` — conventions, work rules and Wix recipes.

---

## Docs

- [Wix Managed Headless + Astro](https://dev.wix.com/docs/go-headless/wix-managed-headless/full-integration-astro/about-the-astro-integration)
- [Wix REST API](https://dev.wix.com/docs/api-reference)
- [Wix JS SDK](https://dev.wix.com/docs/sdk)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## License

Distributed under the [MIT License](LICENSE.md).

[astro-url]: https://astro.build/
[react-url]: https://react.dev/
[tailwind-url]: https://tailwindcss.com/
[vitest-url]: https://vitest.dev/
[wix-url]: https://dev.wix.com/docs/go-headless/get-started/about-wix-headless
[astro-badge]: https://img.shields.io/badge/Astro-fff?style=for-the-badge&logo=astro&logoColor=bd303a&color=352563
[react-badge]: https://img.shields.io/badge/React-ffffff?style=for-the-badge&logo=react&logoColor=61dafb
[tailwind-badge]: https://img.shields.io/badge/Tailwind-ffffff?style=for-the-badge&logo=tailwindcss&logoColor=38bdf8
[vitest-badge]: https://img.shields.io/badge/Vitest-ffffff?style=for-the-badge&logo=vitest&logoColor=6da75d
[wix-badge]: https://img.shields.io/badge/Wix_Headless-ffffff?style=for-the-badge&logo=wix&logoColor=faad4d
[issues-shield]: https://img.shields.io/github/issues/20essentials/project-1415.svg?style=for-the-badge
[issues-url]: https://github.com/20essentials/project-1415/issues
