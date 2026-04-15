// Server-side geo detection. Runs on every request, reads the visitor's IP
// from x-forwarded-for (Railway sits behind a proxy), and resolves the US
// state via ipwho.is. Falls back to null if anything fails — page still renders.

import mapSvgRaw from '$lib/us-map.svg?raw';

export const prerender = false;

const HIGHLIGHT_FILL = '#4f46e5';
const HIGHLIGHT_STROKE = '#312e81';

function injectStateHighlight(svg, stateCode) {
  if (!stateCode) return svg;
  const code = stateCode.toLowerCase();
  // Match path/g elements whose class starts with the state code OR contains it as a token.
  // Wikimedia map uses class="ca" for the state body and class="ca-az" etc. for borders.
  // We want only the body element — class is exactly the 2-letter code.
  const re = new RegExp(`(<(?:path|g)[^>]*\\bclass="${code}")([^>]*)>`, 'gi');
  return svg.replace(re, (match, openTag, attrs) => {
    if (/\bfill=/.test(attrs)) {
      // replace existing fill
      return openTag + attrs.replace(/\bfill="[^"]*"/, `fill="${HIGHLIGHT_FILL}"`) + '>';
    }
    return `${openTag}${attrs} fill="${HIGHLIGHT_FILL}" stroke="${HIGHLIGHT_STROKE}" stroke-width="1">`;
  });
}

export async function load({ request, getClientAddress, fetch }) {
  let ip = '';
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    ip = xff.split(',')[0].trim();
  } else {
    try { ip = getClientAddress(); } catch (_) { ip = ''; }
  }

  const isLocal = !ip || ip === '::1' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.');

  let state = null;
  let stateCode = null;
  try {
    const url = isLocal ? 'https://ipwho.is/' : `https://ipwho.is/${encodeURIComponent(ip)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(1500) });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.country_code === 'US' && data.region) {
        state = data.region;
        stateCode = data.region_code || null;
      }
    }
  } catch (_) {
    // swallow — page still renders without state
  }

  const mapSvg = injectStateHighlight(mapSvgRaw, stateCode);

  return { state, stateCode, mapSvg };
}
