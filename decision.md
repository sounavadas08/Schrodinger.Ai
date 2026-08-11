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
