# error.md — Debugging Report (Kilo)

> Live debugging tracker. Another agent is continuously editing code per requirements.
> This file lists problems as they are found, newest first. Each entry: severity, location, problem, impact, suggested fix, **status**.
> Run `npx tsc --noEmit` and `npm run build` after each change to catch new breakage.

---

## STATUS SUMMARY
- `npx tsc --noEmit` → **PASS** (no errors)
- `npm run build` → **PASS** (vite + esbuild both succeed; only a chunk-size warning)
- All reported issues from the initial pass (E1–E11) have been **resolved**.

---

## RESOLVED — Initial Pass

### [E1] ✅ TypeScript compile error in `server.ts` — `app.listen` port type mismatch
- **Fixed:** `const PORT = Number(process.env.PORT) || 3000;` — now a `number`, valid for `app.listen`.

### [E2] ✅ `no-scrollbar` utility was undefined
- **Fixed:** Added `.no-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }` + `::-webkit-scrollbar { display: none; }` to `src/index.css`.

### [E3] ✅ n8n trigger always faked success
- **Fixed:** `/api/n8n/trigger` now returns `success:false` (400/502) when no valid webhook URL is provided or the dispatch fails. Frontend (`AutomationSection`) only increments `executionsCount` on real `success`.

### [E4] ✅ Instagram download returned wrong asset type
- **Fixed:** Server returns `mediaType: "image"|"video"` and a matching `downloadUrl` (image URL for "High-Res Image", MP3 only for video). Frontend uses a `.jpg` filename for images.

### [E5] ✅ Invalid Gemini image model id + silent fallback
- **Fixed:** Model set to `gemini-2.0-flash-preview-image-generation` with `responseModalities: ["TEXT","IMAGE"]`. Failures now `console.warn` instead of silently returning a stock photo while claiming `source:"gemini"`.

### [E6] ✅ TTS pause/resume unreliable
- **Fixed:** `pause()` keeps `speaking=true` (only sets `paused`); resume branch no longer calls `cancel()` first. Pause button label shows "Resume Speech" while paused.

### [E8] ✅ promptHistoryService userId inconsistency
- **Fixed:** `addPromptHistoryItem` resolves `userId || 'guest'` and passes it to BOTH local and Supabase layers (also inserts explicit `id`). DB-id detection now uses the reliable `id.startsWith('ph_')` prefix instead of fragile `id.length > 20`.

### [E9] ✅ Settings "provider" selector had no server effect
- **Fixed:** Added `getProvider(req, bodyProvider)` helper honoring the `x-provider` header (from Settings modal) over request body. Wired into all three AI routes (image, routine, plan-content).

### [E10] ✅ `/api/config` misreported Supabase status
- **Fixed:** Server no longer reads `VITE_*` (unavailable server-side). Client now sends `x-supabase-configured: 'true'` via `getApiHeaders` based on its own `import.meta.env` check; `/api/config` trusts that header.

### [E11] ✅ Hard-coded mock n8n credentials
- **Fixed:** `AutomationSection` starts with empty `instanceUrl`/`apiKey` (still persisted to localStorage once entered). Connect button disabled until a URL is provided, with a hint.

---

## LOW / OBSERVATIONS (not blocking, no action needed)
- Build emits a chunk-size warning (>500 kB JS). Could be improved later with code-splitting, but not a bug.
- Web fonts (Plus Jakarta Sans / Playfair Display) are referenced in CSS but there's no `<link>`/font import in `index.html` — verify they load (currently falls back to system serif/sans). Low priority.

---

*This file is updated whenever a new problem is spotted. Last full verification: `tsc` + `build` both green.*
