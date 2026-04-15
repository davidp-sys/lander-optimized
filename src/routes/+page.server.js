// Server-side geo detection. Runs on every request, reads the visitor's IP
// from x-forwarded-for (Railway sits behind a proxy), and resolves the US
// state via ipwho.is. Falls back to null if anything fails — page still renders.

export const prerender = false;

export async function load({ request, getClientAddress, fetch }) {
  let ip = '';
  const xff = request.headers.get('x-forwarded-for');
  if (xff) {
    ip = xff.split(',')[0].trim();
  } else {
    try { ip = getClientAddress(); } catch (_) { ip = ''; }
  }

  // Skip lookups for local / private IPs during dev
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

  return { state, stateCode };
}
