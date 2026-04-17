# Lander — Engineering Handoff

Complete packet for deploying, maintaining, and extending the `lander-optimized` SvelteKit landing page.

## TL;DR

- **Stack:** SvelteKit 2 + Svelte 5 (runes) + Tailwind 4 + `@sveltejs/adapter-node`
- **Deploy:** Railway auto-detects SvelteKit — connect GitHub repo, done
- **No database required** — all dynamic content is bundled data or SSR'd from IP lookup
- **No environment variables required** — geo lookup uses key-less public APIs
- **Auto dark mode** — `prefers-color-scheme: dark` switches styles at paint
- **CTA destination:** `https://t.emergencycashpro.com/lc` (`CTA_URL` in `+page.svelte`)

---

## Repo Layout

```
src/
  app.html                    # HTML shell, font preconnect, theme-color meta
  app.css                     # Global CSS: animations, dark mode overrides, radial bg
  lib/
    state-cities.js           # City data + weighting algorithm + ticker/popup names
    us-map.svg                # Fallback SVG US map (served when no state detected)
  routes/
    +page.server.js           # SSR: IP → state → ticker + popup data
    +page.svelte              # Main page markup + client reactive logic
svelte.config.js              # Uses @sveltejs/adapter-node
package.json                  # Node scripts
README.md                     # User-facing overview
HANDOFF.md                    # This file
```

---

## Local Development

```bash
npm install
npm run dev      # vite dev server on :5173
```

Local IPs (`127.0.0.1`, `::1`, etc.) are detected automatically; the geo lookup falls back to the request IP from ipwho.is (your dev machine's public IP). To test specific states without changing your IP, pass a query to the lookup manually — see the `?debug` section below.

## Production Build

```bash
npm run build
npm start        # node build/, reads PORT env (default 3000)
```

Output goes to `build/` (Node-compatible server bundle).

---

## Deployment (Railway)

1. Push this folder to a GitHub repo.
2. Railway → **New Project** → **Deploy from GitHub** → select the repo.
3. That's it. Railway's nixpacks detects SvelteKit, runs `npm install && npm run build`, and starts with `npm start`. `PORT` is injected automatically and `adapter-node` respects it.

**Custom domain:** Railway → **Settings → Domains → Custom Domain**. SSL is auto-provisioned.

**Zero-downtime deploys:** Railway does rolling replacement on new commits to the main branch.

---

## Data Model (no database)

All dynamic content is **bundled in the repo** and rendered server-side per request. There's nothing to seed, migrate, or back up beyond the repo itself.

### State cities — `src/lib/state-cities.js`

Object map: state name → array of `[cityName, population_thousands]`. Used to build the per-state approval ticker at the top of the page.

```js
Washington: [['Seattle', 755], ['Spokane', 230], ['Tacoma', 220], ...]
```

- Keys must match the `region` field returned by **ipwho.is** / **ip-api.com**.
- Adding/editing cities: just edit the object and redeploy.
- Population-based weighting uses a `pop ** 0.6` dampening factor so dominant cities (Seattle, LA, NYC) don't eat half the ticker slots.

### Ticker / popup names

Two disjoint arrays in the same file:

- `TICKER_NAMES` — 10 names in the scrolling top ticker
- `POPUP_NAMES` — 12 names for the bottom-left approval popup toast

Kept separate so the ticker and popup don't feel like the same people.

### Ticker amounts + times

`TICKER_AMOUNTS` and `TICKER_TIMES` arrays, each 10 entries paired positionally with `TICKER_NAMES`. Popup uses random generation instead (`$12k–$40k`, `1–14 min ago`).

### Fallback ticker

`FALLBACK_TICKER` is used for non-US visitors (country ≠ US) or when state lookup fails. 10 hardcoded entries with major US cities.

---

## Request Flow

```
1. Visitor hits the Railway URL (or custom domain)
2. SvelteKit calls `load()` in src/routes/+page.server.js
3. Server extracts IP from headers (x-forwarded-for, cf-connecting-ip, etc.)
4. Calls ipwho.is → falls back to ip-api.com on failure
5. Builds per-state ticker (10 entries, weighted by population)
6. Builds popup city weights (same weighting, for client random pick)
7. Injects state into SVG US map viewBox (zoom + highlight color)
8. Returns { state, stateCode, mapSvg, ticker, popupCities, popupNames }
9. Server renders the HTML with all dynamic content already in place
10. Client hydrates:
    - Starts scanning→revealed animation on the geo pill (1.2s delay)
    - Fits the headline font-size to exactly 2 lines
    - Schedules the approval popup (first fires at 2s, then 5s visible + 0.5–2.5s gap)
    - IntersectionObserver for sticky-CTA show/hide on scroll
```

---

## Debug Mode

Append `?debug` to any URL:

```
https://<domain>/?debug
```

Shows a fixed-position JSON overlay with:

- Detected IP, state, state code, country
- Lookup source (`ipwho` vs `ipapi`)
- Any error messages
- Raw response from the geo provider
- All request headers

Useful for diagnosing geo misdetection or proxy header issues.

---

## Geo Provider

Currently uses **two providers with fallback**:

1. **Primary:** `https://ipwho.is/<ip>` — free, HTTPS, no API key, ~10k/month free tier
2. **Fallback:** `http://ip-api.com/json/<ip>` — free, no key, ~45 req/min per source IP

**2.5s timeout** on each. If both fail, the page still renders — just without state personalization (headline becomes generic "Secure Up To $40,000").

### Scaling up

When traffic outgrows the free tiers:

| Option | Tier | Integration |
|---|---|---|
| **ipinfo.io** | 50k/month free with API key | Replace fetch URL in `lookupViaIpwho()`, add `IPINFO_TOKEN` env var |
| **MaxMind GeoLite2** | Free DB, bundle into app | Load `.mmdb` file, use `maxmind` npm package, zero external calls |
| **Cloudflare headers** | Free if CF in front | Read `cf-ipcountry` + `cf-region` request headers, skip API call entirely |

Swapping providers: edit `lookupViaIpwho()` / `lookupViaIpapi()` in `+page.server.js`. Return shape is `{ state, stateCode, country, raw }`.

### Caching

**Recommended for production:** in-memory LRU cache on the IP → state lookup. Each repeat visitor hits the external API unnecessarily. A 15-minute TTL cache cuts API calls by ~80%+.

```js
// pseudo — add to +page.server.js
import { LRUCache } from 'lru-cache';
const geoCache = new LRUCache({ max: 10000, ttl: 15 * 60 * 1000 });
```

---

## Environment Variables

**None required** for the current config. When you add:

- `IPINFO_TOKEN` — if swapping to ipinfo.io
- `FB_PIXEL_ID` — Meta Pixel tracking
- `GA4_MEASUREMENT_ID` — Google Analytics
- `SENTRY_DSN` — error monitoring

Set them in Railway → **Variables** tab. SvelteKit reads them via `$env/static/private` or `$env/dynamic/private`.

---

## Dark Mode

Auto-detected via `@media (prefers-color-scheme: dark)`. No toggle, no cookie, no JS.

- Light mode default
- Dark mode uses custom radial-gradient backgrounds (not `filter: blur()` blobs) so it renders identically on Brave, Safari, Chrome, Firefox
- Card backgrounds are **solid `bg-slate-900/80`** (not relying on `backdrop-filter` which Brave throttles)
- Font stack falls back to SF Pro / Segoe / Roboto if Google Fonts fails to load

To disable dark mode (force light everywhere), remove all `dark:` classes in `+page.svelte` and the `@media (prefers-color-scheme: dark)` block in `app.css`.

---

## Key UI Features

| Feature | Location | Notes |
|---|---|---|
| Approval ticker (top) | `+page.svelte` + `state-cities.js` | 10 per-state entries, pop-weighted |
| Dynamic 2-line headline | `fitHeadline()` in `+page.svelte` | Measures + scales font to fit any state name |
| Scanning → revealed geo pill | `.geo-pill` CSS | 1.2s scan animation then green flash |
| Urgency pill | `urgencyCount` $state | Randomized 25–54 on page load |
| Micro-form (amount selector) | `amount-btn` CSS | Single-click = selected, double-click = navigate |
| Google Maps embed | `+page.svelte` | `output=embed` URL, no API key, `z=5` zoom |
| Social proof card | `+page.svelte` | Static stats + mobile-only testimonial |
| Stats band (indigo) | `+page.svelte` | Full-bleed, gradient in dark mode |
| Testimonials (3 cards) | `+page.svelte` | Hardcoded; swap for CMS if needed |
| Approval popup | `schedulePopup()` in `+page.svelte` | Rotates POPUP_NAMES with weighted city |
| Sticky bottom CTA | `.sticky-cta` CSS | Slides in when headline scrolls out |
| Footer disclaimer | `+page.svelte` | `pb-28` inside footer creates scroll buffer |

---

## Things Devs Should Add For Production

These weren't implemented because they're integration-specific, but are **necessary for paid traffic**:

### 1. Tracking & Attribution (highest priority)

- **Meta Pixel** (`fbq`) — paid social won't optimize without it
- **GA4** or **Mixpanel**
- **UTM + click-ID passthrough**: append all `?fbclid=`, `?utm_*`, `?gclid=` params onto `CTA_URL` when navigating. Currently the CTA is a plain static link — tracking is lost on click.

```js
// suggested implementation in +page.svelte
function getCtaUrl() {
  if (typeof window === 'undefined') return CTA_URL;
  const incoming = new URLSearchParams(window.location.search);
  const url = new URL(CTA_URL);
  for (const [k, v] of incoming) url.searchParams.set(k, v);
  return url.toString();
}
```

### 2. `/go` Redirect Endpoint (recommended)

Create `src/routes/go/+server.js` that:

1. Logs the click (IP, UA, UTM, timestamp) to your DB
2. Sets a session cookie for attribution
3. 302 redirects to the offer URL with all click IDs

Point all CTAs at `/go` instead of directly at the offer URL. This gives you independent conversion data that doesn't depend on the offer network.

### 3. A/B Variant Routing

The repo currently has versions v2 and v3 as git tags. For split-testing:

- Cookie or query-param based routing (e.g., `?v=a`)
- Or run two Railway services on different subdomains (`a.domain.com`, `b.domain.com`)
- FB ad URL includes `?v=a` so each creative routes to a specific variant

### 4. Form Enhancements

The 4 amount buttons could be replaced with:

- **Zip code input** — required by most loan offer networks; passing it skips a step on their form
- **Credit tier selector** (Excellent / Good / Fair / Poor) — pre-qualifies leads, boosts EPL
- **Loan amount slider** — higher UX engagement than buttons

### 5. Exit Intent (desktop)

Mouse-leave toward the browser chrome → modal: "Wait! Check if you qualify in 60 seconds"

### 6. Rate Limiting / Caching

- **IP lookup cache** (15-min TTL, LRU) — see Geo Provider section above
- **Per-IP rate limit** on the server — Railway has basic DDoS protection but consider Cloudflare for more
- **CDN** in front of static assets — Railway serves these, but Cloudflare/Vercel CDN is faster globally

### 7. Observability

- **Sentry** or **Rollbar** — client error tracking (the ticker animation, popup scheduler, font fit logic could fail silently)
- **Server logs** — Railway has built-in log view; pipe to Datadog/Logtail for search
- **Web Vitals** — report to GA4 or Vercel Analytics

### 8. SEO & Share Polish

- **Open Graph** meta tags (`og:image`, `og:title`, `og:description`)
- **Twitter Card** tags
- **Favicon** (currently missing — browser tab is blank)

---

## Known Limitations

- **Google Maps embed stays light in dark mode.** The `output=embed` URL doesn't support dark tiles. Fix requires swapping to the official Embed API (needs API key) or replacing with Leaflet + dark tiles.
- **Approval data is fictional.** The ticker, popup, and testimonials are static marketing copy. If regulatory concerns arise, replace with real approvals logged to a DB and streamed via a `/api/approvals` endpoint.
- **No phone number capture.** If SMS marketing is planned, add a phone input + Twilio/Postmark/Klaviyo integration.
- **No cookie consent / GDPR banner.** US-only targeting so this hasn't been added. Required if expanding to EU/UK.

---

## Useful Git Tags

- `v2` — the current deployed version (no amount selector, map in right card, scroll-triggered sticky CTA)
- `v3` — alternate variant (no amount selector, map moved under urgency pill, always-visible bottom CTA)

Swap versions: `git checkout v2 -- .` (or `v3`), commit, push. Railway redeploys automatically.

---

## Contact

Original build: David @ Power Fox Media — `davidp@powerfoxmedia.com`
