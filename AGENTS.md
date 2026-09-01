# Portfolio v2 Agent Guide

This file governs the entire repository. Preserve Git history and keep all design, code, content, and assets original to this portfolio.

## Product boundaries

- Maintain a compact, one-page portfolio intended for Vercel.
- Do not add X/Twitter integration, a résumé link, a public email address, a CMS, a message database, or custom analytics.
- Do not deploy, change DNS, create accounts, submit search-engine properties, or configure production secrets without explicit approval.
- Keep editable portfolio copy and records in `src/content/site.ts`. Use `projects: []` when no projects are ready; the page must omit the section and skip GitHub requests. Mark future unfinished values with `TODO` and use `status: "draft"` while placeholders remain.

## Stack and commands

- Use the exact Bun version declared in `package.json`; Bun is the only package manager and `bun.lock` is the only lockfile.
- Explain why a new runtime dependency is necessary before adding it.
- Primary commands are `bun run dev`, `bun run format`, `bun run format:check`, `bun run lint`, `bun run typecheck`, `bun run content:check`, `bun run test`, `bun run build`, and `bun run test:e2e`.

## Architecture

- Use Next.js App Router and React Server Components by default. Keep routes as thin server orchestrators.
- Organize product behavior under `src/features/<feature>`; each feature owns its components, styles, pure services, and tests.
- Put genuinely shared, stable primitives under `src/shared`. Do not introduce broad barrel exports.
- Keep data flow explicit: typed content → server page or service → presentational component. Never import server adapters into client code.
- Use client components only for state, effects, browser APIs, or event handlers. Keep islands narrow and preserve useful no-JavaScript content.
- Extract repeated behavior after a concept is stable or has a second real consumer. Prefer explicit composition over speculative frameworks.
- Keep global CSS to tokens, reset, typography, and page-shell rules. Feature presentation belongs in CSS Modules.
- Use `next/image`; prioritize only the portrait and first project image. Lazy-load remaining project media.
- Motion uses strict `LazyMotion` and `m` components. Limit animation to opacity, transform, and disclosure transitions; content must never depend on motion.

## Content, assets, and SEO

- Maintain the `SiteContent`, `CompanyExperience`, `ExperiencePosition`, `Project`, and `SeoContent` contracts in `src/content/types.ts`.
- IDs and slugs must be unique. URLs must be HTTP(S), repositories must use `owner/repository`, project technologies are limited to three, and referenced local media must exist.
- Experience months use `YYYY-MM`; positions are newest-first, start cannot follow end, and only the newest position may use `present`.
- Preserve the optimized square WebP portrait; do not commit the original HEIC. Project focal points remain within 0–100.
- Keep the approved TO favicon family under `public/icons` consistent across ICO, browser PNG, Apple, and manifest assets. Treat those checked-in files as the source of truth; do not recolor or regenerate them without approval.
- Draft mode emits `noindex` and no sitemap entries. Ready mode rejects every `TODO`, requires an 80–160 character description, and enables canonical metadata, indexing, sitemap, Open Graph, and privacy-safe Person JSON-LD.
- Do not add keyword metadata or X-specific metadata. Search Console verification and sitemap submission are external launch tasks requiring explicit approval.
- Never place private contact details in content, metadata, structured data, fixtures, logs, or client bundles.

## Security and privacy

- Treat form values and external responses as untrusted. Normalize, validate, and cap inputs server-side.
- Contact messages are plain text. Require a blank honeypot, reject header injection, and use visitor email only as Resend `replyTo`.
- `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`, and optional `GITHUB_TOKEN` are server-only and never use a `NEXT_PUBLIC_` prefix.
- Never log submissions, personal data, secrets, message bodies, or full provider errors.
- GitHub failures degrade to `null`; unavailable stars never block project rendering and a true zero remains visible.
- New-tab links use `rel="noreferrer"`. Do not add storage, tracking, cookies, or third-party scripts beyond Vercel Web Analytics without approval.

## Accessibility and interaction

- Use semantic landmarks, headings, lists, labels, buttons, and native disclosure elements where practical.
- Maintain strong focus states, accessible names, AA-readable contrast, and no horizontal overflow at 320px and wider.
- Theme controls support system, light, and dark modes and persist locally.
- Respect reduced-motion preferences in CSS and Motion. Core identity, experience, projects, contact content, and fallback social links remain available without JavaScript.
- Floating and footer controls must never be simultaneously keyboard-active. Preserve focus while transitioning between them.
- Preserve exact star counts in accessible labels when visible values are compacted.
- Success, validation, unavailable, and retryable contact states must be announced and understandable without color alone.

## Tests and completion

- Pure behavior changes require Vitest coverage; visible interactions require Playwright coverage.
- Cover success, validation, malformed data, missing dependencies, timeouts, rate limits, zero values, boundaries, reduced motion, mobile overflow, and keyboard operation.
- Mock GitHub and Resend. Tests never send real messages or require live APIs. Assert behavior and semantics; do not add screenshot snapshots.
- Run automated accessibility checks at desktop and mobile widths for material UI changes.
- Use proportional verification while iterating. Run the narrowest relevant check after each coherent edit: touched-file formatting for copy or CSS, the affected Vitest file for pure behavior, one batched typecheck after related type changes, focused Chromium Playwright coverage for stateful UI, and asset/content tests for generated media.
- Do not rerun a passing check unless later work can invalidate it. Reuse results from the same unchanged working tree and report which checks were run or intentionally skipped.
- Do not repeatedly run `bun ci`, production builds, the complete Vitest suite, or the full Playwright matrix. Run dependency installation checks and production builds once after their related batch stabilizes. Use focused Playwright specs or `--grep` during interaction work, then run mobile and accessibility coverage after the UI is stable.
- Select final gates according to risk. Broad work spanning dependencies, server behavior, metadata, and interactions requires one final pass of `bun ci`, `bun run format:check`, `bun run lint`, `bun run typecheck`, `bun run content:check`, `bun run test`, `bun run build`, and `bun run test:e2e`; documentation-only or trivially isolated changes do not require unrelated build or E2E gates.
- If a final command fails, fix the issue and rerun only the failing check and downstream checks invalidated by that fix. Do not automatically restart the complete matrix.
- Fix in-scope failures without weakening tests, TypeScript, linting, validation, security, privacy, or accessibility rules.
