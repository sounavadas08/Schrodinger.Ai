# Project Decisions & Change Log

This file records all architectural decisions, configuration choices, user constraints, and modifications made to Schrödinger AI throughout development.

---

## Log of Decisions & Changes

### Decision 1: Architecture Choice - Full Hybrid Architecture (Option 1)
- **Date:** 2026-08-12
- **Context:** The frontend website was partially simulated and missing installed dependencies for `npm run dev`.
- **Decision:** Build a **Full Hybrid Architecture** that supports real backend services (AI generation, media downloading, Supabase auth/db, n8n webhook triggers) while maintaining robust local fallback mechanisms (LocalStorage, curated fallback data) so the site is fully functional both with and without API keys.

### Decision 2: Cloudflare Workers AI & Multi-Provider AI Support
- **Date:** 2026-08-12
- **Constraint/Request:** User requested explicit support for Cloudflare API keys.
- **Decision:** Integrated **Cloudflare Workers AI** alongside Google Gemini as a first-class AI provider:
  - Text & Logic: `@cf/meta/llama-3.1-8b-instruct` / `@cf/deepseek-ai/deepseek-r1-distill-qwen-32b` & `gemini-3.6-flash`.
  - Image Generation: `@cf/stabilityai/stable-diffusion-xl-base-1.0` & `gemini-3.1-flash-lite-image`.
  - Credentials supported via `.env` (`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`) and via in-app UI Settings Modal.

### Decision 3: Mandatory Decision Log Constraint (`decision.md`)
- **Date:** 2026-08-12
- **User Constraint:** User mandated creating and maintaining a separate file named `decision.md` to record every decision and change made throughout the project.
- **Action:** Created `decision.md` in the project root directory and added this log. All future changes must be appended here.

### Decision 4: Dev Server Dependency Resolution
- **Date:** 2026-08-12
- **Context:** `npm run dev` failed with `'tsx' is not recognized as an internal or external command`.
- **Decision:** Install all missing `npm` packages locally in `node_modules` and ensure `server.ts` handles Express + Vite dev middleware cleanly on Windows.

### Decision 5: Cloudflare & Gemini Multi-Provider Backend in `server.ts`
- **Date:** 2026-08-12
- **Context:** Implemented server-side endpoints for image generation (`/api/generate-image`), daily routine generation (`/api/generate-routine`), content planning (`/api/plan-content`), media downloaders (`/api/youtube-to-mp3`, `/api/ig-download`), and live n8n webhooks (`/api/n8n/trigger`).
- **Implementation:** Added Cloudflare Workers AI REST API integration (`@cf/stabilityai/stable-diffusion-xl-base-1.0`, `@cf/meta/llama-3.1-8b-instruct`), headers inspection (`x-cloudflare-account-id`, `x-cloudflare-api-token`, `x-gemini-api-key`), live fetch proxy for webhooks, and `/api/config` health endpoint.

### Decision 6: UI Provider Settings Modal (`SettingsModal.tsx`)
- **Date:** 2026-08-12
- **Context:** Users need to configure Cloudflare Workers AI and Gemini API keys at runtime without editing `.env`.
- **Implementation:** Created `src/components/SettingsModal.tsx` with provider selector (Auto / Cloudflare / Gemini), Cloudflare Account ID & API Token inputs, and Gemini API Key input. All credentials stored securely in browser `localStorage`. Added Settings ⚙️ button in `Navbar.tsx` (desktop + mobile).

### Decision 7: Centralized API Headers Utility (`apiHelper.ts`)
- **Date:** 2026-08-12
- **Context:** All frontend tool components need to forward user-configured provider credentials to the Express backend via HTTP headers.
- **Implementation:** Created `src/lib/apiHelper.ts` with `getApiHeaders()` function that reads `ai_provider`, `cf_account_id`, `cf_api_token`, and `gemini_api_key` from `localStorage` and injects them as custom headers (`x-provider`, `x-cloudflare-account-id`, `x-cloudflare-api-token`, `x-gemini-api-key`). Updated all 6 tool/component fetch calls:
  - `ImageGeneratorTool.tsx`
  - `AIRoutineMakerTool.tsx`
  - `ContentCreatorAgent.tsx`
  - `YoutubeDownloaderTool.tsx`
  - `InstagramDownloaderTool.tsx`
  - `AutomationSection.tsx`

### Decision 8: Updated `.env.example` Configuration Template
- **Date:** 2026-08-12
- **Context:** Original `.env.example` only had `GEMINI_API_KEY`, `APP_URL`, and Supabase keys.
- **Implementation:** Added `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `PORT`, and `NODE_ENV` fields with documentation comments linking to credential dashboards.

### Decision 9: Fix Supabase URL in environment configuration
- **Date:** 2026-08-12
- **Context:** Supabase client initialization was failing because `VITE_SUPABASE_URL` was misconfigured with the `/rest/v1/` REST API suffix instead of the base project domain.
- **Implementation:** Updated `.env` to define `VITE_SUPABASE_URL=https://gnraltpcnutjcnfcwcfn.supabase.co` without the suffix, ensuring the Supabase JS SDK can correctly resolve sub-routes (such as `/auth/v1/...`).

### Decision 10: Local Supabase CLI Integration
- **Date:** 2026-08-12
- **Context:** Running `supabase link` failed because the CLI is not globally installed on the environment.
- **Implementation:** Added the `supabase` package as a local `devDependency` in `package.json` to allow the user to execute local Supabase commands (e.g. `npx supabase link`) out of the box.

### Decision 11: Ignore Supabase CLI Temp Files
- **Date:** 2026-08-12
- **Context:** Local execution of the Supabase CLI creates a `.temp/` directory with workspace-specific linking config that should not be tracked in git.
- **Implementation:** Added `supabase/.temp/` to `.gitignore`.

### Decision 12: Resolve Vercel FUNCTION_INVOCATION_FAILED & Cobalt API Integration
- **Date:** 2026-08-12
- **Context:** Vercel serverless functions failed with `FUNCTION_INVOCATION_FAILED` due to uncompiled relative imports located in directories starting with underscores (e.g. `api/_lib/helpers.ts`), which Vercel ignores. The YouTube and Instagram downloaders were using buggy, un-awaited `setTimeout` blocks and only returning mock data.
- **Implementation:** 
  - Moved `api/_lib/helpers.ts` to `api/helpers.ts` to guarantee it compiles under Vercel's bundler.
  - Updated all 6 API routes (`generate-image`, `generate-routine`, `generate-script`, `plan-content`, `config`, `text-to-speech`) to import from `./helpers.js`.
  - Replaced the `setTimeout` blocks in `youtube-to-mp3.ts` and `ig-download.ts` with real-world async/await integrations to `https://cobaltapi.cjs.nz/` (a verified public Cobalt API instance) to enable actual media downloads for real URLs, with graceful fallbacks.

### Decision 13: Implement Downloader API Failover Array
- **Date:** 2026-08-12
- **Context:** The public Cobalt instance `https://cobaltapi.cjs.nz/` was found to return `error.api.youtube.login` for YouTube Shorts URLs (blocked by YouTube's scraper protection).
- **Implementation:** 
  - Implemented an automatic failover list of Cobalt API instances in both `youtube-to-mp3.ts` and `ig-download.ts`.
  - Integrated `https://rue-cobalt.xenon.zone/` (a highly operational, verified public instance resolving YouTube Shorts and Instagram) as the primary provider, with `https://cobaltapi.cjs.nz/` as a secondary fallback.



