# Contributing

Welcome to **Petals & Predators**, a headless e-commerce store for carnivorous plants
and flowers, built with Astro 5 + Wix Managed Headless. We're excited that you're
interested in contributing! This document walks you through everything you need to get
your valuable work into the project.

## First steps

1. **Familiarize yourself with the stack**:
   - [Astro](https://docs.astro.build) — the SSR frontend framework.
   - [Wix Managed Headless + Astro](https://dev.wix.com/docs/go-headless/wix-managed-headless/full-integration-astro/about-the-astro-integration) — how the Wix backend integrates with Astro.
2. **Set up your environment**: this project uses **npm only**. There is no pnpm/bun
   support and none is planned — see [Why npm and not pnpm?](README.md#getting-started).

## How to contribute

### 1. Set up your environment

- **Fork the repository**: click the "Fork" button at the top right of the
  [repo page](https://github.com/20essentials/project-1415) to get your own copy.
- **Clone your fork**:

  ```sh
  git clone https://github.com/YOUR-USER/project-1415.git
  cd project-1415
  ```

- **Add the original repository as a remote** so you can keep your fork up to date:

  ```sh
  git remote add upstream https://github.com/20essentials/project-1415.git
  ```

- **Use the right Node version** (repo ships an [`.nvmrc`](.nvmrc)):

  ```sh
  nvm use
  ```

- **Install dependencies** (postinstall also applies the `patch-package` patch):

  ```sh
  npm install
  ```

- **Link the project to a Wix site** if you'll work with live data:

  ```sh
  npm run wix  # then: wix login
  ```

### 2. Work on your changes

- **Sync your fork**: either click `Sync fork` on your repo page, or run:

  ```sh
  git switch main && git fetch upstream && git merge upstream/main
  ```

- **Create a branch**:

  ```sh
  git switch -c feature/AmazingFeature
  ```

- **Develop your changes** and check them in the browser:

  ```sh
  npm run dev  # http://localhost:4321
  ```

- **Follow the project conventions** (defined in [AGENTS.md](AGENTS.md), worth reading
  fully):
  - Screaming Architecture: folders describe what the business does, not the tech.
    New code lives in `src/features/` (one folder per business capability) or
    `src/shared/` (cross-cutting infra used by 2+ features). Never create files
    inside `src/components/`, `src/utils/` or `src/data/`.
  - A feature never imports from another feature; `src/pages/` only composes features.
  - Every file inside `src/` is **kebab-case**.
  - Named exports only in `.ts`/`.tsx` (no `export default`, no barrels). Astro
    components (`.astro`) are the only default-export exception.
  - Never use `any` — type Wix SDK calls with types from the [Wix API docs](https://dev.wix.com/docs/api-reference).
  - Tailwind classes must be canonical (`gap-1.25`, not `gap-[5px]`). Treat
    `tailwindcss(suggestCanonicalClasses)` diagnostics as errors.
  - Comments only when they explain a non-obvious "why"; one line max.

### 3. Send your changes

- **Test your changes** before committing — CI enforces the same checks:

  ```sh
  npm run check      # typecheck (TS + .astro)
  npm test           # unit tests (Vitest)
  npm run test:e2e   # E2E (Playwright, Chromium)
  ```

- **Commit** with a clear, descriptive message (reference issues with `#123`).
- **Push to your fork** and **open a pull request** — the
  [PR template](.github/pull_request_template.md) will guide you. Keep it
  one change per PR.

## Good practices

- Check the [open issues](https://github.com/20essentials/project-1415/issues) before
  starting; if you can fix one with no PR in flight, reference the issue number in your
  commits.
- Check the [open PRs](https://github.com/20essentials/project-1415/pulls) so you don't
  work on something already in progress — you can always help reviewing instead.
- Keep your branch up to date with `main` frequently.
- Update the E2E/unit tests when you change behavior; tests mirror the architecture
  (`tests/features/<feature>/`, `tests/shared/`, `tests/e2e/`).
- Don't assert on values injected by Wix in SSR (e.g. `<title>`, SEO meta) in tests —
  only assert what this repo controls.
- Take part in the discussion of your PR if reviewers leave comments.

## Need help?

Open an [issue](https://github.com/20essentials/project-1415/issues) and we'll be glad
to help. Thanks for contributing to Petals & Predators!
