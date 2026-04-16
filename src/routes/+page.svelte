<script>
  import { onMount } from 'svelte';

  let { data } = $props();

  let selectedAmount = $state(null);
  let showCta = $state(false);
  let showSticky = $state(false);
  let headlineEl;
  let urgencyCount = $state(Math.floor(Math.random() * 30) + 25);
  let geoRevealed = $state(false);

  const CTA_URL = 'https://t.emergencycashpro.com/lc';

  function selectAmount(amount) {
    if (selectedAmount === amount) {
      window.location.href = CTA_URL;
      return;
    }
    selectedAmount = amount;
    showCta = true;
  }

  // Dynamically size the geo-headline so it always renders as exactly 2 lines.
  // Each line is a `display:block; white-space:nowrap` span, so its
  // scrollWidth at any font size tells us the natural rendered width. We
  // measure both lines at a known baseline, take the wider one, then scale
  // the headline font so that wider line fills ~96% of the container width.
  // Result: state names of any length (Washington -> District of Columbia)
  // get a custom-fit font size that maxes out the available space without
  // ever wrapping to a 3rd line.
  function fitHeadline() {
    if (!headlineEl) return;
    if (!data.state) return; // only the geo variant has the .headline-line spans
    const lines = headlineEl.querySelectorAll('.headline-line');
    if (!lines.length) return;

    const containerWidth = headlineEl.clientWidth;
    if (containerWidth <= 0) return;

    const baselineSize = 64;
    headlineEl.style.fontSize = `${baselineSize}px`;

    let maxLineWidth = 0;
    lines.forEach((l) => {
      if (l.scrollWidth > maxLineWidth) maxLineWidth = l.scrollWidth;
    });
    if (maxLineWidth <= 0) return;

    // Per-breakpoint cap matches the original tailwind sizes (text-3xl /
    // text-4xl / text-5xl). Short state names hit the cap and look "normal"
    // — only longer state names ("Massachusetts", "District of Columbia")
    // shrink below it to fit on 2 lines.
    const vw = window.innerWidth;
    const maxAllowed = vw >= 1024 ? 48 : vw >= 640 ? 36 : 30;
    const minAllowed = 18;
    const targetFill = 0.92;

    const ideal = (containerWidth * targetFill * baselineSize) / maxLineWidth;
    const finalSize = Math.max(minAllowed, Math.min(maxAllowed, ideal));
    headlineEl.style.fontSize = `${finalSize}px`;
  }

  onMount(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        showSticky = !entry.isIntersecting;
      });
    }, { threshold: 0 });

    if (headlineEl) observer.observe(headlineEl);

    // Hold the scanning animation for ~1.2s so the reveal feels intentional,
    // even though the state is already known server-side.
    const t = setTimeout(() => { geoRevealed = true; }, 1200);

    // Dynamic 2-line headline fit
    fitHeadline();
    let resizeTimer;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(fitHeadline, 80);
    };
    window.addEventListener('resize', onResize);
    // Inter loads async via Google Fonts; metrics shift once it's ready.
    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(fitHeadline).catch(() => {});
    }

    return () => {
      observer.disconnect();
      clearTimeout(t);
      window.removeEventListener('resize', onResize);
      clearTimeout(resizeTimer);
    };
  });
</script>

<svelte:head>
  <title>Secure Your Personal Loan - Up to $40,000</title>
</svelte:head>

<div class="bg-white text-gray-900 overflow-x-hidden max-w-[100vw]">

  {#if data.debug}
    <pre class="fixed top-2 right-2 z-[9999] max-w-lg max-h-[80vh] overflow-auto bg-black/90 text-green-300 text-xs p-3 rounded shadow-2xl whitespace-pre-wrap break-words">{JSON.stringify(data.debug, null, 2)}</pre>
  {/if}

  <!-- APPROVAL TICKER (top of page) — 10 rolling entries, city-weighted
       by population within the visitor's detected state. Built server-side
       in +page.server.js via buildStateTicker(). Duplicated inline so the
       scroll loop has enough content to seamlessly repeat. -->
  <div class="bg-gray-900 py-3 overflow-hidden">
    <div class="flex whitespace-nowrap">
      <div class="ticker-scroll flex gap-8 text-sm text-gray-300">
        {#each data.ticker as item}
          <span class="flex items-center gap-2"><span class="h-2 w-2 rounded-full bg-green-400"></span> {item.name} ({item.city}) approved for {item.amount} &mdash; {item.time}</span>
        {/each}
        {#each data.ticker as item}
          <span class="flex items-center gap-2"><span class="h-2 w-2 rounded-full bg-green-400"></span> {item.name} ({item.city}) approved for {item.amount} &mdash; {item.time}</span>
        {/each}
      </div>
    </div>
  </div>

  <!-- HERO SECTION -->
  <section class="relative overflow-hidden bg-gradient-to-br from-indigo-100 via-purple-100 to-blue-100 min-h-screen md:min-h-0">
    <div class="absolute left-0 top-0 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-blue-300/20 to-indigo-400/20 blur-3xl pointer-events-none" aria-hidden="true"></div>
    <div class="absolute right-0 top-20 h-96 w-96 rounded-full bg-gradient-to-br from-purple-300/20 to-pink-300/20 blur-3xl pointer-events-none" aria-hidden="true"></div>

    <div class="relative mx-auto max-w-7xl px-4 py-6 md:py-14">
      <div class="flex flex-col items-center gap-5 lg:flex-row lg:gap-12">

        <!-- LEFT: Copy + Form -->
        <div class="flex-1 text-center lg:text-left">
          <h1 bind:this={headlineEl} class="mb-2 font-black leading-tight tracking-tight text-gray-900 {data.state ? 'state-headline' : 'text-4xl md:text-5xl lg:text-6xl'}">
            {#if data.state}
              <span class="headline-line"><span class="text-indigo-600">{data.state}</span> residents</span>
              <span class="headline-line">can secure up to <span class="text-indigo-600 glisten-text">$40,000</span></span>
            {:else}
              Secure Up To<br class="md:hidden"><span class="hidden md:inline"> </span><span class="text-indigo-600 glisten-text">$40,000</span>
            {/if}
          </h1>

          <p class="mb-4 text-lg text-gray-600 md:text-xl">
            Banks can't deny you from applying.<br>Get approved in minutes.
          </p>

          <div class="geo-pill {geoRevealed ? 'revealed' : ''} mb-2 inline-flex items-center gap-2.5 rounded-lg bg-indigo-50 border border-indigo-300 px-4 py-1.5 text-sm font-medium text-indigo-700">
            <span class="radar-dot"></span>
            {#if !geoRevealed}
              <span class="geo-scanning-text">Checking availability<span class="scanning-dots"></span></span>
            {:else if data.state}
              <span class="geo-state-text">Now available in <strong>{data.state}</strong></span>
            {:else}
              <span class="geo-state-text">Available nationwide</span>
            {/if}
          </div>

          <div class="mb-4 inline-flex items-center gap-2 rounded-lg bg-orange-50 border border-orange-300 px-4 py-1.5 text-sm font-medium text-orange-700">
            <span class="pulse-dot inline-block h-2 w-2 rounded-full bg-orange-500"></span>
            <span><strong>{urgencyCount} people</strong> checking their amount right now</span>
          </div>

          <!-- MICRO-FORM -->
          <div class="mb-4 rounded-2xl bg-white p-5 shadow-2xl border border-gray-300 relative z-10" id="loan-form">
            <p class="mb-2 text-base font-semibold text-gray-800">How much do you need?</p>
            <div class="flex gap-2">
              {#each [10000, 20000, 30000, 40000] as amount}
                <button
                  class="amount-btn flex-1 rounded-lg border-2 py-3 text-center font-bold text-2xl {selectedAmount === amount ? 'selected border-indigo-600 bg-indigo-600 text-white' : 'border-indigo-200 bg-indigo-50 text-indigo-700'}"
                  onclick={() => selectAmount(amount)}
                >
                  ${(amount / 1000).toFixed(0)}k
                </button>
              {/each}
            </div>

            <a href={CTA_URL} class="main-cta cta-pulse block w-full rounded-xl bg-indigo-600 px-8 text-center text-lg font-bold text-white shadow-lg hover:bg-indigo-700 transition-colors {showCta ? 'show' : ''}">
              Check If You Qualify <span class="ml-1">&rarr;</span>
            </a>

            <div class="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-gray-500">
              <span class="flex items-center gap-1"><svg class="h-3.5 w-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd"/></svg> Low credit approvals</span>
              <span class="flex items-center gap-1"><svg class="h-3.5 w-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd"/></svg> Free to apply</span>
              <span class="flex items-center gap-1"><svg class="h-3.5 w-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd"/></svg> 256-bit encrypted</span>
            </div>
          </div>
        </div>

        <!-- RIGHT: Social proof card -->
        <div class="flex-1 max-w-md w-full">
          <div class="rounded-2xl bg-white p-5 shadow-2xl border border-gray-300 relative z-10">
            <!-- Google Maps embed centered on visitor's state -->
            <div class="mb-4">
              <div class="relative rounded-xl overflow-hidden border border-indigo-100 shadow-sm" style="aspect-ratio: 16 / 11;">
                {#if data.state}
                  <iframe
                    title="Map of {data.state}"
                    src="https://www.google.com/maps?q={encodeURIComponent(data.state + ' State, USA')}&t=&z=5&ie=UTF8&iwloc=&output=embed"
                    class="absolute inset-0 w-full h-full border-0"
                    loading="lazy"
                    referrerpolicy="no-referrer-when-downgrade"
                  ></iframe>
                  <div class="pointer-events-none absolute top-2 right-2 rounded-full bg-white/95 backdrop-blur px-2.5 py-0.5 text-[11px] font-bold text-indigo-700 shadow border border-indigo-200">
                    {data.stateCode}
                  </div>
                {:else}
                  <iframe
                    title="Map of United States"
                    src="https://www.google.com/maps?q=United+States&t=&z=4&ie=UTF8&iwloc=&output=embed"
                    class="absolute inset-0 w-full h-full border-0"
                    loading="lazy"
                    referrerpolicy="no-referrer-when-downgrade"
                  ></iframe>
                {/if}
              </div>
              <p class="mt-2 text-center text-sm font-semibold text-gray-700">
                {#if data.state}
                  <span class="text-indigo-600">{data.state}</span> residents qualify for up to <span class="text-indigo-600">$40,000</span>
                {:else}
                  Available in all 50 states
                {/if}
              </p>
            </div>
            <div class="space-y-2">
              <div class="flex items-center justify-between rounded-xl bg-green-50 px-4 py-2.5">
                <span class="text-sm font-medium text-gray-700">Loan Amount</span>
                <span class="text-lg font-bold text-green-600">Up to $40,000</span>
              </div>
              <div class="flex items-center justify-between rounded-xl bg-green-50 px-4 py-2.5">
                <span class="text-sm font-medium text-gray-700">Funds Available</span>
                <span class="text-lg font-bold text-green-600">48 hours</span>
              </div>
              <div class="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-2.5">
                <span class="text-sm font-medium text-gray-700">Credit Required</span>
                <span class="text-lg font-bold text-green-600">Low credit OK</span>
              </div>
            </div>
            <div class="mt-3 rounded-xl bg-gray-50 border border-gray-200 p-3 lg:hidden">
              <div class="flex items-start gap-3">
                <div class="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-bold text-indigo-600">SM</div>
                <div>
                  <div class="flex items-center gap-1 mb-1">
                    <span class="text-yellow-400 text-sm">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
                  </div>
                  <p class="text-sm text-gray-700">"Got approved for $15,000 in literally 5 minutes. Couldn't believe it."</p>
                  <p class="text-xs text-gray-500 mt-1.5 font-medium">Sarah M. &mdash; Texas</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- CONTENT SECTION -->
  <div class="relative overflow-hidden bg-gradient-to-br from-indigo-100 via-purple-100 to-blue-100">
    <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-blue-300/30 to-indigo-400/30 blur-3xl pointer-events-none" aria-hidden="true"></div>
    <div class="absolute left-1/2 top-1/2 -translate-x-1/3 -translate-y-1/3 h-[500px] w-[500px] rounded-full bg-gradient-to-br from-purple-300/25 to-pink-300/25 blur-3xl pointer-events-none" aria-hidden="true"></div>

    <!-- STATS BAND -->
    <div class="relative bg-indigo-600 py-5 md:py-6">
      <div class="mx-auto max-w-5xl px-4">
        <div class="flex justify-around items-center">
          <div class="text-center">
            <p class="text-lg sm:text-2xl md:text-4xl font-black text-white leading-tight">Low Credit</p>
            <p class="mt-0.5 text-xs sm:text-sm md:text-base font-medium text-indigo-200">Scores Approved</p>
          </div>
          <div class="hidden sm:block w-px h-10 bg-indigo-400/50"></div>
          <div class="text-center">
            <p class="text-lg sm:text-2xl md:text-4xl font-black text-white leading-tight">5 Min</p>
            <p class="mt-0.5 text-xs sm:text-sm md:text-base font-medium text-indigo-200">Fast Approval</p>
          </div>
          <div class="hidden sm:block w-px h-10 bg-indigo-400/50"></div>
          <div class="text-center">
            <p class="text-lg sm:text-2xl md:text-4xl font-black text-white leading-tight">48 Hrs</p>
            <p class="mt-0.5 text-xs sm:text-sm md:text-base font-medium text-indigo-200">Funds Available</p>
          </div>
        </div>
      </div>
    </div>

    <!-- TESTIMONIALS -->
    <div class="relative pb-14 md:pb-20">
      <div class="mx-auto max-w-7xl px-8 md:px-4">
        <h2 class="mb-8 text-center text-2xl font-bold text-gray-900 md:text-3xl">Real People. Real Approvals.</h2>
        <div class="grid gap-5 md:grid-cols-3 max-w-xs mx-auto md:max-w-none">
          <div class="rounded-2xl bg-white p-5 shadow-xl border border-gray-200">
            <div class="flex items-center gap-1 mb-2 text-yellow-400 text-sm">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
            <p class="text-gray-700 mb-4 text-sm">"I was drowning in credit card debt and my score was 580. Got matched with a lender in 5 minutes and had $20,000 deposited in 2 days."</p>
            <div class="flex items-center gap-3 border-t border-gray-100 pt-3">
              <div class="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">JR</div>
              <div>
                <p class="font-semibold text-gray-900 text-sm">James R.</p>
                <p class="text-xs text-gray-500">Florida &mdash; Approved $20,000</p>
              </div>
            </div>
          </div>
          <div class="rounded-2xl bg-white p-5 shadow-xl border border-gray-200">
            <div class="flex items-center gap-1 mb-2 text-yellow-400 text-sm">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
            <p class="text-gray-700 mb-4 text-sm">"I thought I'd get denied because I'm behind on my car payment. Checked my amount anyway and got approved for $12,000. Total game changer."</p>
            <div class="flex items-center gap-3 border-t border-gray-100 pt-3">
              <div class="h-9 w-9 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-600">LP</div>
              <div>
                <p class="font-semibold text-gray-900 text-sm">Linda P.</p>
                <p class="text-xs text-gray-500">Ohio &mdash; Approved $12,000</p>
              </div>
            </div>
          </div>
          <div class="rounded-2xl bg-white p-5 shadow-xl border border-gray-200">
            <div class="flex items-center gap-1 mb-2 text-yellow-400 text-sm">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
            <p class="text-gray-700 mb-4 text-sm">"My bank said no. This site connected me to a lender that said yes in minutes. No hard credit check, no stress. Wish I found this sooner."</p>
            <div class="flex items-center gap-3 border-t border-gray-100 pt-3">
              <div class="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-600">MW</div>
              <div>
                <p class="font-semibold text-gray-900 text-sm">Marcus W.</p>
                <p class="text-xs text-gray-500">Georgia &mdash; Approved $35,000</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- TRUST BADGES -->
    <div class="relative pb-12">
      <div class="mx-auto max-w-md md:max-w-7xl px-4">
        <div class="grid grid-cols-2 gap-4 md:flex md:flex-wrap md:items-center md:justify-center md:gap-12">
          <div class="flex items-center justify-center gap-1.5 text-gray-500">
            <svg class="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd"/></svg>
            <span class="text-xs md:text-sm font-medium">SSL Secure</span>
          </div>
          <div class="flex items-center justify-center gap-1.5 text-gray-500">
            <svg class="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 2.5c-1.31 0-2.526.386-3.546 1.051a.75.75 0 01-.908-1.194A8.459 8.459 0 0110 1c1.51 0 2.934.394 4.165 1.083a.75.75 0 11-.739 1.305A6.959 6.959 0 0010 2.5zM10 7a3 3 0 100 6 3 3 0 000-6zm-4.5 3a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0z" clip-rule="evenodd"/></svg>
            <span class="text-xs md:text-sm font-medium">Privacy Protected</span>
          </div>
          <div class="flex items-center justify-center gap-1.5 text-gray-500">
            <svg class="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M1 4a1 1 0 011-1h16a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V4zm12 4a3 3 0 11-6 0 3 3 0 016 0zM4 9a1 1 0 100-2 1 1 0 000 2zm12-1a1 1 0 11-2 0 1 1 0 012 0z" clip-rule="evenodd"/></svg>
            <span class="text-xs md:text-sm font-medium">No Hidden Fees</span>
          </div>
          <div class="flex items-center justify-center gap-1.5 text-gray-500">
            <svg class="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd"/></svg>
            <span class="text-xs md:text-sm font-medium">Low Credit OK</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- BOTTOM CTA -->
  <section class="bg-indigo-600 py-12 md:py-20">
    <div class="mx-auto max-w-lg md:max-w-3xl px-8 text-center">
      <h2 class="mb-3 text-2xl font-bold text-white md:text-4xl">Don't let your bank decide your future.</h2>
      <p class="mb-6 text-sm md:text-lg text-indigo-200">Join thousands already approved.<br class="md:hidden"> Check your amount in minutes.</p>
      <a href={CTA_URL} class="inline-block rounded-xl bg-white px-8 py-3.5 text-base md:text-lg font-bold text-indigo-600 shadow-lg hover:bg-gray-100 transition-colors">
        Check If You Qualify &rarr;
      </a>
    </div>
  </section>

  <!-- FOOTER -->
  <footer class="bg-gray-900 py-8">
    <div class="mx-auto max-w-4xl px-4 text-center text-xs text-gray-500 leading-relaxed">
      <p>This website is not a lender and does not make loans or credit decisions. We connect consumers with independent third-party lenders. Loan terms, rates, and approval are determined by individual lenders based on your application.</p>
    </div>
  </footer>

  <!-- STICKY CTA -->
  <div class="sticky-cta fixed bottom-0 left-0 w-full z-50 bg-white/95 backdrop-blur border-t border-gray-200 py-3 px-4 shadow-2xl {showSticky ? 'visible' : ''}">
    <div class="flex flex-col items-center">
      <a href={CTA_URL} class="rounded-xl bg-indigo-600 px-10 py-3.5 text-base font-bold text-white shadow-lg hover:bg-indigo-700 transition-colors">
        Check If You Qualify &rarr;
      </a>
      <p class="mt-1.5 text-xs text-gray-400">Free to apply &bull; Low credit approvals</p>
    </div>
  </div>
</div>
