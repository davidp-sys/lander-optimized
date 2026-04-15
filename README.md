# Optimized Loans Lander - SvelteKit

Server-rendered landing page with IP-based state detection for personalized social proof.

## Quick Start (local)

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm start        # serves the built app on PORT (default 3000)
```

## Deploy to Railway

1. Push this folder to a GitHub repo.
2. In Railway: **New Project → Deploy from GitHub → pick the repo**.
3. Railway auto-detects SvelteKit (nixpacks). No config needed.
   - Build: `npm run build`
   - Start: `npm start`
   - Port: injected via `PORT` env var (adapter-node respects it).
4. Click the generated domain — geo detection runs server-side on every hit.

If you want a custom domain, use Railway's **Settings → Domains → Custom Domain**.

## How the geo detection works

- `src/routes/+page.server.js` runs on every request.
- Reads the visitor IP from `x-forwarded-for` (Railway sets this).
- Calls `https://ipwho.is/<ip>` (free, HTTPS, no API key, ~10k/month free tier).
- Returns `{ state }` — injected into the page HTML before it ships.
- On the client, a ~1.2s scan animation plays for drama, then the pill flashes green and reveals "Now available in **[State]**".
- If the API fails or the visitor is outside the US, it falls back to "Available nationwide" gracefully.

### Swapping the geo provider

If you outgrow `ipwho.is` (10k/month free), swap the `fetch()` call in `+page.server.js` for:
- **ipinfo.io** — 50k/month free with API key
- **MaxMind GeoLite2** — free DB you bundle, zero external calls (best for scale)
- **Cloudflare `cf-ipcountry` + `cf-region`** headers — if you put CF in front, no API call needed

## Structure

- `src/routes/+page.svelte` — Main lander (markup + reactive logic)
- `src/routes/+page.server.js` — Server-side IP → state lookup
- `src/app.css` — Global styles (animations, Tailwind imports)
- `src/app.html` — HTML shell (Inter font preconnect)

## CTA Link

All CTAs point to: `https://t.emergencycashpro.com/lc`

Update `CTA_URL` at the top of `+page.svelte` to change.

## Key Features

- **Server-side IP geolocation** — state rendered in initial HTML, no ad-blocker risk
- Animated "scanning → revealed" geo pill in the hero
- Micro-form: CTA hidden until user selects an amount (double-click same = go to offer)
- Sticky CTA appears when headline scrolls out of view (mobile + desktop)
- Glisten animation on $40,000 text
- Scrolling approval ticker
- Randomized urgency counter with state injected: *"30 people in California checking..."*
