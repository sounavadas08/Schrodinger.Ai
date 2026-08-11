# Schrödinger AI - Full Hybrid Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Schrödinger AI into a fully functional web app with Cloudflare Workers AI + Google Gemini multi-provider support, real media downloaders, Supabase/LocalStorage dual persistence, live n8n webhooks, and clean dev tooling.

**Architecture:** Express backend server (`server.ts`) hosting Vite middleware in dev and handling API requests to Cloudflare Workers AI REST APIs, Google Gemini SDK, media extraction endpoints, and n8n webhooks. React frontend (`src/`) with dynamic provider selection, Auth Context, and Tool components.

**Tech Stack:** React 19, TypeScript, Vite, Express, TailwindCSS, Cloudflare Workers AI, Google GenAI SDK, Supabase JS, Motion, Lucide React.

## Global Constraints

- **Decision Logging:** Every major architectural step or modification MUST be logged in `decision.md`.
- **Node/TS:** Use `npm install` to ensure `node_modules` contains binary for `tsx`.
- **Offline / Zero-Config Capability:** All tools must work seamlessly via fallbacks if user keys are not configured.

---

### Task 1: Fix Dependencies & Dev Server Script Launcher

**Files:**
- Modify: `package.json`
- Modify: `decision.md`

- [ ] **Step 1: Install project npm dependencies**

Run: `npm install`  
Expected: `node_modules/` created with `tsx`, `vite`, `express`, `@google/genai`, and typescript binaries installed.

- [ ] **Step 2: Verify `npm run dev` script execution**

Run: `npm run dev` (or verify `npx tsx server.ts` starts without missing binary errors)  
Expected: Express server starts listening on http://0.0.0.0:3000 with Vite middleware attached.

- [ ] **Step 3: Update `decision.md`**

Append dependency resolution log to `decision.md`.

---

### Task 2: Implement Cloudflare Workers AI & Multi-Provider Backend in `server.ts`

**Files:**
- Modify: `server.ts`
- Modify: `decision.md`

**Interfaces:**
- Consumes: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `GEMINI_API_KEY` from request headers or process.env.
- Produces: JSON response for `/api/generate-image`, `/api/generate-routine`, `/api/plan-content`, `/api/config`.

- [ ] **Step 1: Create Cloudflare Workers AI caller in `server.ts`**

Add helper function `callCloudflareAI(account_id, api_token, model, payload)`:
```ts
async function callCloudflareAI(accountId: string, apiToken: string, model: string, payload: any) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  return await res.json();
}
```

- [ ] **Step 2: Update `/api/generate-image` to support Cloudflare & Gemini**

Check if provider is `cloudflare` or `gemini`. For Cloudflare, call `@cf/stabilityai/stable-diffusion-xl-base-1.0` or `@cf/bytedance/stable-diffusion-xl-lightning`, convert image buffer to Base64 data URL, and return.

- [ ] **Step 3: Update `/api/generate-routine` and `/api/plan-content` to support Cloudflare**

For Cloudflare, call `@cf/meta/llama-3.1-8b-instruct` or `@cf/deepseek-ai/deepseek-r1-distill-qwen-32b`, format prompt into structured JSON, and return.

- [ ] **Step 4: Update `decision.md`**

Append Cloudflare Workers AI implementation details to `decision.md`.

---

### Task 3: Enhance YouTube & Instagram Media Downloader Endpoints in `server.ts`

**Files:**
- Modify: `server.ts`
- Modify: `decision.md`

- [ ] **Step 1: Enhance `/api/youtube-to-mp3` for metadata & stream extraction**

Parse YouTube video ID, fetch title, thumbnail, duration, and generate downloadable audio stream response.

- [ ] **Step 2: Enhance `/api/ig-download` for Instagram video/reel media URL resolution**

Parse IG URL parameters, return high-res preview thumbnail, author, likes, and media download stream.

- [ ] **Step 3: Update `decision.md`**

Append media download engine updates to `decision.md`.

---

### Task 4: Real n8n Webhook Proxy & Execution Engine in `server.ts`

**Files:**
- Modify: `server.ts`
- Modify: `decision.md`

- [ ] **Step 1: Upgrade `/api/n8n/trigger` to dispatch live HTTP requests**

If `webhookUrl` is provided, send real `POST` request with headers & body payload to the webhook endpoint, return response status code, execution duration, and JSON response.

- [ ] **Step 2: Update `decision.md`**

Append n8n webhook proxy updates to `decision.md`.

---

### Task 5: UI Provider & Settings Drawer in `src/components/Navbar.tsx`

**Files:**
- Modify: `src/components/Navbar.tsx`
- Modify: `src/components/tools/ImageGeneratorTool.tsx`
- Modify: `src/components/tools/AIRoutineMakerTool.tsx`
- Modify: `decision.md`

- [ ] **Step 1: Add API Key & Provider Settings Modal in `Navbar.tsx`**

Allow users to select AI Provider (Auto, Cloudflare Workers AI, Google Gemini) and save Cloudflare Account ID & API Token in `localStorage`.

- [ ] **Step 2: Pass provider headers in tool API calls**

Update fetch calls in tool components to pass `x-provider`, `x-cloudflare-account-id`, `x-cloudflare-api-token`, `x-gemini-api-key` headers when custom keys are set in browser storage.

- [ ] **Step 3: Update `decision.md`**

Append UI Provider Settings implementation to `decision.md`.

---

### Task 6: Full Verification & Integration Test

- [ ] **Step 1: Test `npm run dev` dev server**
- [ ] **Step 2: Test AI Image Generator tool**
- [ ] **Step 3: Test AI Routine Maker tool**
- [ ] **Step 4: Test YouTube & Instagram Downloaders**
- [ ] **Step 5: Test n8n Webhook Dispatcher**
- [ ] **Step 6: Confirm `decision.md` reflects all completed changes**
