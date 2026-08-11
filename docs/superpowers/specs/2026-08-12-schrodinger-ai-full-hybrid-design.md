# Schrödinger AI - Full Hybrid Architecture Design Specification

**Date:** 2026-08-12  
**Status:** Approved  
**Topic:** Full Hybrid Frontend & Backend Functionality with Cloudflare Workers AI & Gemini Integration

---

## 1. Overview
Schrödinger AI is a high-performance AI Content Creation & Automation platform built with React 19, TypeScript, Express, Vite, and TailwindCSS. This design upgrades Schrödinger AI from static/simulated UI components into a fully functional application supporting multi-provider AI (Cloudflare Workers AI + Google Gemini), media extraction, auth, persistent database storage, and live webhook automation.

---

## 2. Architecture & Components

```
+-------------------------------------------------------------------+
|                        Schrödinger AI Client                      |
| (React 19 + TypeScript + TailwindCSS + Lucide Icons + Motion)    |
+-------------------------------------------------------------------+
                                  |
                                  v
+-------------------------------------------------------------------+
|                     Express Backend Server (server.ts)            |
+-------------------------------------------------------------------+
   |                    |                    |                   |
   v                    v                    v                   v
[Cloudflare AI]   [Google Gemini]    [Supabase Auth & DB]   [n8n Webhooks]
Workers AI API    Gemini 3.6/3.1     Auth & Prompt History   Live Dispatcher
(LLMs & SDXL)     (Routines/Images)  (With Local Storage)  (Execution Logs)
```

### 2.1 Multi-Provider AI Engine (`server.ts` & `src/components/Navbar.tsx`)
- **Providers Supported:**
  1. **Cloudflare Workers AI:** Uses `CLOUDFLARE_ACCOUNT_ID` & `CLOUDFLARE_API_TOKEN`
     - Text/Routines/Plans: `@cf/meta/llama-3.1-8b-instruct` or `@cf/deepseek-ai/deepseek-r1-distill-qwen-32b`
     - Image Generation: `@cf/stabilityai/stable-diffusion-xl-base-1.0` or `@cf/bytedance/stable-diffusion-xl-lightning`
  2. **Google Gemini:** Uses `GEMINI_API_KEY`
     - Text/Routines/Plans: `gemini-3.6-flash`
     - Image Generation: `gemini-3.1-flash-lite-image`
  3. **Auto / Fallback:** Tries active API credentials, falls back gracefully to curated visuals & structured schedules if no API keys are configured.
- **UI Provider Selector:** Header settings drawer to switch AI providers and input API keys at runtime.

### 2.2 Media Downloaders (`/api/youtube-to-mp3` & `/api/ig-download`)
- **YouTube Downloader:** Server-side metadata extraction (Video ID, Title, Channel, Duration, Bitrate) and audio stream delivery with ID3 tags.
- **Instagram Downloader:** Extraction of Reel/Post media URLs, author info, likes/views metrics, and high-res video download streams.

### 2.3 Auth & Database (`src/lib/supabase.ts`, `src/context/AuthContext.tsx`, `src/lib/promptHistoryService.ts`)
- **Supabase Integration:** Full authentication (Sign Up, Sign In, Sign Out) and PostgreSQL table sync (`prompt_history`, `saved_creations`).
- **Offline / Local Storage Fallback:** When Supabase credentials (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) are missing, automatically operate using browser IndexedDB / LocalStorage without breaking user experience.

### 2.4 Live Webhook & Automation Engine (`/api/n8n/trigger`)
- Real HTTP webhook proxy accepting custom endpoint URLs, authorization headers, and JSON payloads.
- Returns execution IDs, status, duration, and full payload response logs.

---

## 3. Configuration & Environment Variables

The project uses `.env` with the following schema:

```env
# Cloudflare Workers AI Credentials
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=

# Google Gemini API Key
GEMINI_API_KEY=

# Supabase Authentication & Database
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# App Environment
PORT=3000
NODE_ENV=development
```

---

## 4. Verification & Testing Strategy

1. **Dependency Installation:** Run `npm install` to ensure `tsx`, `express`, `vite`, and `@types/node` are properly linked in `node_modules`.
2. **Dev Server Launch:** Run `npm run dev` to verify backend routes + Vite dev middleware start on port 3000.
3. **API Endpoint Verification:**
   - Test `/api/generate-image` with Cloudflare & Gemini options.
   - Test `/api/generate-routine` and `/api/plan-content`.
   - Test `/api/youtube-to-mp3` and `/api/ig-download`.
   - Test `/api/n8n/trigger`.
4. **UI Interactivity Verification:** Test tools gallery, provider modal, auth modal, and history drawer.
