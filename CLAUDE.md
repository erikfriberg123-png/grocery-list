# CLAUDE.md — Grocery List App

This file is loaded into every Claude Code session in this repo. Read it fully before doing any work. The authoritative product spec lives in `Instructions.txt` in this same folder — read that too on first run of any new session.

---

## What we're building (one paragraph)

A real-time, mobile-first shared shopping list and recipe app. Households share lists; guests can join via secure share links (no login). AI helps with image-to-list extraction, recipe URL parsing, item normalization, and category assignment. Built iOS-first on React Native + Expo, with Supabase as the backend. Must support Swedish and English from day one. Full requirements, data model, and phase plan are in `Instructions.txt`.

---

## Reference materials in this folder

- `Instructions.txt` — full product spec. Source of truth for scope, data model, RLS expectations, AI flows, and phase order. If anything here contradicts `Instructions.txt`, `Instructions.txt` wins.
- `lista-mobile-prototype.html` — visual prototype of the mobile UI. Use it as a design reference for layout, spacing, color, and component hierarchy when building real React Native screens. It is not code to port — it's a design target.
- `Skärmbild 2026-04-26 074847.png` — supporting screenshot, treat as additional design reference.

---

## Tech stack (locked in)

**Frontend:** React Native + Expo (managed workflow), TypeScript strict mode, Expo Router for file-based navigation, NativeWind for styling, Zustand for client state, React Query (`@tanstack/react-query`) for server state, React Hook Form + Zod for forms, i18next + expo-localization for translations.

**Backend:** Supabase — Postgres, Auth, Row Level Security, Realtime, Storage, Edge Functions (Deno).

**AI:** Called only from Edge Functions. Provider key never ships in the app bundle.

Do not introduce a different framework, ORM, state library, or styling system without asking first.

---

## Repository layout

```
app/                      Expo Router routes
  (auth)/                 sign-in / sign-up
  (tabs)/                 main authenticated tab navigator
  list/[id].tsx           single list view
  guest/[token].tsx       guest view via share link
  import/                 image + recipe import flows
src/
  components/             reusable presentational components
  features/               feature-scoped logic (lists, items, sharing, ai, auth)
  lib/                    supabase client, i18n config, hooks, utils
  types/                  shared TS types (mirror DB types where possible)
locales/
  en.json
  sv.json
supabase/
  migrations/             SQL migrations, numbered
  functions/              Edge Functions (one folder per function)
```

Place new code in the matching folder. Don't invent new top-level folders without asking.

---

## Implementation phases (do these in order)

1. Project setup — Expo + TS + routing + styling + i18n scaffolding boots in simulator.
2. Supabase setup — client wired, env vars, type generation working.
3. Auth — email/password sign up, sign in, sign out, session persistence, auto-create household on signup.
4. Database schema — all tables from `Instructions.txt` §6 as numbered migrations.
5. RLS — every table has policies, no table is left RLS-disabled. Tested manually for both authed and guest paths.
6. Core list functionality — create/rename/archive lists, add/edit/check/delete items.
7. Realtime — items table subscribed, last-write-wins.
8. Sharing — share link creation, hashed token storage, guest validation Edge Function, QR code display.
9. AI normalization — `normalize-shopping-item` Edge Function + client fallback path.
10. Image import — upload, `analyze-shopping-image` Edge Function, review UI.
11. Recipe import — `import-recipe-url` Edge Function with structured-data-first / AI fallback.
12. Polish — empty states, error handling, accessibility, perf.

Do not start phase N+1 until phase N runs end-to-end in the simulator and is committed.

---

## Working agreements with Claude Code

These exist to keep the project healthy. Follow them unless the user explicitly overrides.

**Plan first on anything risky.** Use plan mode (Shift+Tab) before: writing or changing RLS policies, anything touching share-link tokens, schema migrations, Edge Functions that handle auth, and any change involving secrets. Show the plan and wait for approval.

**Ask before adding dependencies.** If a task seems to need a new npm package or Supabase extension, propose it with one-line justification and wait. The stack above is intentionally small.

**Commit at every working checkpoint.** When a phase step compiles, runs, and the user confirms, commit with a clear conventional-commits-style message (`feat:`, `fix:`, `chore:`, `db:`). One logical change per commit. Never `--amend` past commits.

**Migrations are forward-only and numbered.** Every schema change is a new file in `supabase/migrations/` with a timestamp prefix. Never edit a migration that has already been applied. If a change is wrong, write a new migration that corrects it.

**Secrets discipline.** App `.env` only ever contains the Supabase URL and the **anon** key. The Supabase `service_role` key, AI provider keys, and any other secret live exclusively as Edge Function secrets (`supabase secrets set`). Never log secrets. Never commit `.env` files — make sure `.gitignore` covers them before the first commit.

**TypeScript strict.** `strict: true` in `tsconfig.json` from day one. No `any` without a comment explaining why. Generate Supabase types (`supabase gen types typescript`) after every migration and check them in.

**No hardcoded user-facing strings.** Every string the user sees goes through i18next with a stable key like `list.add_item` or `error.invalid_link`. If a key is missing in `sv.json`, add it.

**RLS is non-negotiable.** Every new table gets RLS enabled in the same migration that creates it, with at least one policy. A migration that creates a table without RLS is a bug.

**Share-link tokens.** Generate a high-entropy random token client-server-roundtrip-style: server generates, returns once to the creator, stores only a hash (sha256 with a per-row salt is fine, or `crypt()` via pgcrypto). The plaintext token never goes back to the database after the initial response.

**Guest paths go through Edge Functions.** Guests never hit Postgres directly via the JS client. The `validate-share-link` and `guest-list-operation` functions are the only way a guest mutates anything. Treat them as the security boundary.

**AI is best-effort.** Every AI-powered feature has a non-AI manual fallback. The app must remain fully usable if every AI call fails.

**Don't silently overwrite user input.** AI suggestions go through a review screen. If we have a normalized name we're not sure about, surface both and let the user pick.

**Realtime is for items.** Don't subscribe the whole world. One subscription per active list view, cleaned up on unmount.

---

## Tone and response style

Be terse. Show diffs, don't re-summarize them in prose. When a task is multi-step, say what you're about to do, do it, and stop — don't pad with recap. If a decision could go two reasonable ways, ask once rather than guessing.

---

## What "done" looks like for the MVP

Mirrors `Instructions.txt` §17, plus: TypeScript builds with no errors, `supabase db reset` produces the current schema cleanly from migrations alone, RLS policies pass a manual test where a second account cannot read the first account's data, and a guest with a `view`-only link cannot mutate items.

---

## First task in any fresh session

If the user hasn't told you what to work on, say: "I've read CLAUDE.md and Instructions.txt. We're on phase X — want me to continue with [next concrete step], or is there something else?" Don't start coding without that confirmation.
