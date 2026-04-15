// Server-side geo detection. Runs on every request, reads the visitor's IP
// from x-forwarded-for (Railway sits behind a proxy), and resolves the US
// state via ipwho.is. Falls back to null if anything fails — page still renders.

import mapSvgRaw from '$lib/us-map.svg?raw';

export const prerender = false;

const HIGHLIGHT_FILL = '#4f46e5';
const HIGHLIGHT_STROKE = '#312e81';

function normalizeSvg(svg) {
  // Wikimedia ships the SVG with width/height but no viewBox, so it can't scale
  // responsively. Force a viewBox and strip the fixed dimensions.
  let out = svg;
  if (!/viewBox=/.test(out)) {
    out = out.replace(/<svg([^>]*)>/, (m, attrs) => {
      const w = (attrs.match(/\bwidth="(\d+)"/) || [])[1] || '959';
      const h = (attrs.match(/\bheight="(\d+)"/) || [])[1] || '593';
      const stripped = attrs.replace(/\b(width|height)="[^"]*"/g, '');
      return `<svg${stripped} viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">`;
    });
  }
  return out;
}

function injectStateHighlight(svg, stateCode) {
  if (!stateCode) return svg;
  const code = stateCode.toLowerCase();
  const re = new RegExp(`(<(?:path|g)[^>]*\\bclass="${code}")([^>]*)>`, 'gi');
  return svg.replace(re, (match, openTag, attrs) => {
    if (/\bfill=/.test(attrs)) {
      return openTag + attrs.replace(/\bfill="[^"]*"/, `fill="${HIGHLIGHT_FILL}"`) + '>';
    }
    return `${openTag}${attrs} fill="${HIGHLIGHT_FILL}" stroke="${HIGHLIGHT_STROKE}" stroke-width="1">`;
  });
}

function pickIp(request) {
  // Try every header a proxy could set — different platforms use different ones.
  const candidates = [
    request.headers.get('cf-connecting-ip'),
    request.headers.get('x-real-ip'),
    request.headers.get('x-forwarded-for'),
    request.headers.get('x-client-ip'),
    request.headers.get('forwarded'),
  ];
  for (const c of candidates) {
    if (!c) continue;
    // Forwarded header is "for=1.2.3.4;..." — extract the IP
    const match = c.match(/(?:for=)?["']?(\d{1,3}(?:\.\d{1,3}){3}|[a-fA-F0-9:]+)["']?/);
    if (match) return match[1];
  }
  return '';
}

async function lookupViaIpwho(ip, fetch) {
  const url = ip ? `https://ipwho.is/${encodeURIComponent(ip)}` : 'https://ipwho.is/';
  const res = await fetch(url, { signal: AbortSignal.timeout(2500) });
  if (!res.ok) throw new Error(`ipwho status ${res.status}`);
  const data = await res.json();
  if (!data || !data.success) throw new Error(`ipwho no-success: ${data?.message || 'unknown'}`);
  return { state: data.region || null, stateCode: data.region_code || null, country: data.country_code || null, raw: data };
}

async function lookupViaIpapi(ip, fetch) {
  // Fallback — ip-api.com (HTTP only on free tier, but works fine for server-side calls)
  const url = ip ? `http://ip-api.com/json/${encodeURIComponent(ip)}` : 'http://ip-api.com/json/';
  const res = await fetch(url, { signal: AbortSignal.timeout(2500) });
  if (!res.ok) throw new Error(`ipapi status ${res.status}`);
  const data = await res.json();
  if (data.status !== 'success') throw new Error(`ipapi failed: ${data.message}`);
  return { state: data.regionName || null, stateCode: data.region || null, country: data.countryCode || null, raw: data };
}

export async function load({ request, getClientAddress, fetch, url }) {
  const debug = url.searchParams.has('debug');

  let ip = pickIp(request);
  if (!ip) {
    try { ip = getClientAddress(); } catch (_) { ip = ''; }
  }

  const isLocal = !ip || ip === '::1' || ip.startsWith('127.') || ip.startsWith('192.168.') || ip.startsWith('10.');

  let state = null;
  let stateCode = null;
  let country = null;
  let lookupError = null;
  let lookupSource = null;
  let raw = null;

  try {
    const r = await lookupViaIpwho(isLocal ? '' : ip, fetch);
    state = r.state; stateCode = r.stateCode; country = r.country; raw = r.raw;
    lookupSource = 'ipwho';
  } catch (e1) {
    try {
      const r = await lookupViaIpapi(isLocal ? '' : ip, fetch);
      state = r.state; stateCode = r.stateCode; country = r.country; raw = r.raw;
      lookupSource = 'ipapi';
    } catch (e2) {
      lookupError = `ipwho:${e1.message} | ipapi:${e2.message}`;
    }
  }

  // Only show state-specific UI for US visitors
  if (country !== 'US') {
    state = null;
    stateCode = null;
  }

  const mapSvg = injectStateHighlight(normalizeSvg(mapSvgRaw), stateCode);

  console.log(`[geo] ip=${ip} state=${state} code=${stateCode} country=${country} src=${lookupSource} err=${lookupError || 'none'}`);

  return {
    state,
    stateCode,
    mapSvg,
    debug: debug ? { ip, state, stateCode, country, lookupSource, lookupError, raw, headers: Object.fromEntries(request.headers) } : null,
  };
}
