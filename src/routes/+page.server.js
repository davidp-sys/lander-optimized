// Server-side geo detection. Runs on every request, reads the visitor's IP
// from x-forwarded-for (Railway sits behind a proxy), and resolves the US
// state via ipwho.is. Falls back to null if anything fails — page still renders.

import mapSvgRaw from '$lib/us-map.svg?raw';
import { buildStateTicker, FALLBACK_TICKER, buildPopupCityWeights, POPUP_NAMES } from '$lib/state-cities.js';

export const prerender = false;

const HIGHLIGHT_FILL = '#4f46e5';
const HIGHLIGHT_STROKE = '#312e81';

const SVG_NATIVE_W = 959;
const SVG_NATIVE_H = 593;
const TARGET_RATIO = SVG_NATIVE_W / SVG_NATIVE_H;

function normalizeSvg(svg, viewBox) {
  // Wikimedia ships the SVG with width/height but no viewBox, so it can't scale
  // responsively. Force a viewBox and strip the fixed dimensions.
  return svg.replace(/<svg([^>]*)>/, (m, attrs) => {
    const stripped = attrs.replace(/\b(width|height|viewBox)="[^"]*"/g, '');
    return `<svg${stripped} viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet">`;
  });
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

// Compute the bounding box of an SVG path "d" attribute. Handles common
// commands (M/m, L/l, H/h, V/v, C/c, S/s, Q/q, T/t, A/a, Z/z) — good enough
// for state outlines (no tight curves to tangent-track).
function pathBBox(d) {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g);
  if (!tokens) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let cx = 0, cy = 0, sx = 0, sy = 0, cmd = '';
  let i = 0;

  function track(x, y) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }

  while (i < tokens.length) {
    const t = tokens[i];
    if (/[a-zA-Z]/.test(t)) {
      cmd = t;
      i++;
      // 'z' takes no coordinates — execute it immediately and move on.
      if (cmd === 'z' || cmd === 'Z') {
        cx = sx; cy = sy;
      }
      continue;
    }
    const abs = cmd === cmd.toUpperCase();
    const lc = cmd.toLowerCase();

    if (lc === 'm') {
      const x = parseFloat(tokens[i++]);
      const y = parseFloat(tokens[i++]);
      cx = abs ? x : cx + x;
      cy = abs ? y : cy + y;
      sx = cx; sy = cy;        // remember subpath start for 'z'
      track(cx, cy);
      // implicit lineto after moveto, same case
      cmd = abs ? 'L' : 'l';
    } else if (lc === 'l' || lc === 't') {
      const x = parseFloat(tokens[i++]);
      const y = parseFloat(tokens[i++]);
      cx = abs ? x : cx + x;
      cy = abs ? y : cy + y;
      track(cx, cy);
    } else if (lc === 'h') {
      const x = parseFloat(tokens[i++]);
      cx = abs ? x : cx + x;
      track(cx, cy);
    } else if (lc === 'v') {
      const y = parseFloat(tokens[i++]);
      cy = abs ? y : cy + y;
      track(cx, cy);
    } else if (lc === 'c') {
      const x1 = parseFloat(tokens[i++]); const y1 = parseFloat(tokens[i++]);
      const x2 = parseFloat(tokens[i++]); const y2 = parseFloat(tokens[i++]);
      const x = parseFloat(tokens[i++]); const y = parseFloat(tokens[i++]);
      const X1 = abs ? x1 : cx + x1, Y1 = abs ? y1 : cy + y1;
      const X2 = abs ? x2 : cx + x2, Y2 = abs ? y2 : cy + y2;
      const X = abs ? x : cx + x, Y = abs ? y : cy + y;
      track(X1, Y1); track(X2, Y2); track(X, Y);
      cx = X; cy = Y;
    } else if (lc === 's' || lc === 'q') {
      const x1 = parseFloat(tokens[i++]); const y1 = parseFloat(tokens[i++]);
      const x = parseFloat(tokens[i++]); const y = parseFloat(tokens[i++]);
      const X1 = abs ? x1 : cx + x1, Y1 = abs ? y1 : cy + y1;
      const X = abs ? x : cx + x, Y = abs ? y : cy + y;
      track(X1, Y1); track(X, Y);
      cx = X; cy = Y;
    } else if (lc === 'a') {
      i += 5; // skip rx, ry, rotation, large-arc, sweep
      const x = parseFloat(tokens[i++]); const y = parseFloat(tokens[i++]);
      const X = abs ? x : cx + x, Y = abs ? y : cy + y;
      track(X, Y);
      cx = X; cy = Y;
    } else if (lc === 'z') {
      cx = sx; cy = sy;        // return to subpath start
    } else {
      i++; // skip unknown
    }
  }

  if (!isFinite(minX)) return null;
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

function computeStateBBox(svg, stateCode) {
  if (!stateCode) return null;
  const code = stateCode.toLowerCase();
  // Path could be `<path class="ca" d="...">` or `<path d="..." class="ca">` — handle both.
  const re1 = new RegExp(`<path[^>]*\\bclass="${code}"[^>]*\\bd="([^"]+)"`, 'i');
  const re2 = new RegExp(`<path[^>]*\\bd="([^"]+)"[^>]*\\bclass="${code}"`, 'i');
  const m = svg.match(re1) || svg.match(re2);
  if (!m) return null;
  return pathBBox(m[1]);
}

function computeViewBox(svg, stateCode) {
  if (!stateCode) return `0 0 ${SVG_NATIVE_W} ${SVG_NATIVE_H}`;
  const bbox = computeStateBBox(svg, stateCode);
  if (!bbox || !bbox.w || !bbox.h) return `0 0 ${SVG_NATIVE_W} ${SVG_NATIVE_H}`;

  // Pad around the state to show neighboring states for context.
  // Padding is proportional to state size, with a minimum so tiny states
  // (RI, DE) still show plenty of context.
  const padFactor = 1.6; // 1.6x state dimension on each side
  const minDim = 180;    // minimum padded dimension before aspect-ratio fit
  let w = Math.max(bbox.w * (1 + 2 * padFactor), minDim);
  let h = Math.max(bbox.h * (1 + 2 * padFactor), minDim / TARGET_RATIO);
  let cxs = bbox.x + bbox.w / 2;
  let cys = bbox.y + bbox.h / 2;

  // Maintain the SVG's native aspect ratio so the rendered map isn't squished.
  const ratio = w / h;
  if (ratio > TARGET_RATIO) {
    h = w / TARGET_RATIO;
  } else {
    w = h * TARGET_RATIO;
  }

  let x = cxs - w / 2;
  let y = cys - h / 2;

  // Clamp to native bounds.
  if (x < 0) x = 0;
  if (y < 0) y = 0;
  if (x + w > SVG_NATIVE_W) x = SVG_NATIVE_W - w;
  if (y + h > SVG_NATIVE_H) y = SVG_NATIVE_H - h;
  if (w > SVG_NATIVE_W) { x = 0; w = SVG_NATIVE_W; }
  if (h > SVG_NATIVE_H) { y = 0; h = SVG_NATIVE_H; }

  return `${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`;
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

  const viewBox = computeViewBox(mapSvgRaw, stateCode);
  const mapSvg = injectStateHighlight(normalizeSvg(mapSvgRaw, viewBox), stateCode);

  // Per-state approval ticker: 10 entries, city mix weighted by population
  // so Las Vegas visitors see mostly Las Vegas, LA visitors see mostly LA, etc.
  const ticker = buildStateTicker(state) || FALLBACK_TICKER;

  // Popup toast uses a weighted city list (same dampening as the ticker) and
  // a separate name pool. The client picks a random city from the weights
  // and a random name from the pool on each popup appearance.
  const popupCities = buildPopupCityWeights(state);

  console.log(`[geo] ip=${ip} state=${state} code=${stateCode} country=${country} src=${lookupSource} err=${lookupError || 'none'}`);

  return {
    state,
    stateCode,
    mapSvg,
    ticker,
    popupCities,
    popupNames: POPUP_NAMES,
    debug: debug ? { ip, state, stateCode, country, lookupSource, lookupError, raw, headers: Object.fromEntries(request.headers) } : null,
  };
}
