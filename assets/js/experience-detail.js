document.addEventListener('DOMContentLoaded', async () => {
  const slug = document.body.dataset.experienceSlug;
  const root = document.getElementById('experience-detail-root');
  if (!slug || !root) return;

  const { loadExperiences, inquiryUrl, escapeHtml } = window.RishvelExperiences;

  let experiences;
  try {
    experiences = await loadExperiences();
  } catch (err) {
    console.error(err);
    root.innerHTML = '<p class="text-center text-brand-muted py-24">Unable to load this experience. <a href="/experiences/" class="text-brand-terracotta underline">View all experiences</a></p>';
    return;
  }

  const exp = experiences.find((e) => e.slug === slug);
  if (!exp) {
    root.innerHTML = '<p class="text-center text-brand-muted py-24">Experience not found. <a href="/experiences/" class="text-brand-terracotta underline">View all experiences</a></p>';
    return;
  }

  const planHref = inquiryUrl(exp);
  try {
    root.innerHTML = buildDetailHtml(exp, planHref);
    injectStructuredData(exp);
    initStickyCta(planHref);
    const storiesSection = root.querySelector('[data-traveller-stories]');
    if (storiesSection && window.RishvelReviews) {
      window.RishvelReviews.initTravellerStoriesSection(storiesSection);
    }
  } catch (err) {
    console.error(err);
    root.innerHTML =
      '<p class="text-center text-brand-muted py-24">Something went wrong loading this page. Please refresh or <a href="/experiences/" class="text-brand-terracotta underline">view all experiences</a>.</p>';
  }
});

function buildDetailHtml(exp, planHref) {
  const { escapeHtml } = window.RishvelExperiences;
  const itinerary = (exp.itineraries && exp.itineraries[0]) || { stops: [] };

  return `
    <section class="relative min-h-[70vh] md:min-h-[85vh] flex items-end pt-20 overflow-hidden">
      <div class="absolute inset-0 z-0">
        <img src="${escapeHtml(exp.heroImage)}" alt="${escapeHtml(exp.destination)}" class="w-full h-full object-cover" fetchpriority="high">
        <div class="absolute inset-0 bg-gradient-to-t from-stone-900/90 via-stone-900/40 to-stone-900/20"></div>
      </div>
      <div class="max-w-7xl mx-auto px-6 relative z-10 text-white pb-16 md:pb-24 w-full">
        <span class="text-brand-terracotta font-semibold tracking-widest text-xs uppercase bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full inline-block mb-4 border border-white/20">${escapeHtml(exp.category)}</span>
        <h1 class="font-serif text-4xl md:text-6xl lg:text-7xl font-bold leading-tight max-w-3xl mb-4">${escapeHtml(exp.destination)}</h1>
        <p class="text-lg md:text-xl text-stone-200 max-w-2xl mb-8 font-light leading-relaxed">${escapeHtml(exp.tagline)}</p>
        <div class="flex flex-wrap gap-4 text-sm text-stone-300 mb-8">
          <span>${escapeHtml(exp.duration)}</span>
          <span class="opacity-50">·</span>
          <span>From ${escapeHtml(exp.startingLocation)}</span>
        </div>
        <a href="${planHref}" class="hidden md:inline-flex bg-brand-terracotta text-white px-8 py-4 rounded-full font-medium hover:bg-opacity-90 transition-all">Plan This Experience</a>
      </div>
    </section>

    <section class="py-20 md:py-28 max-w-7xl mx-auto px-6">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <span class="text-brand-terracotta font-semibold text-sm uppercase tracking-wider">${escapeHtml((exp.narrative && exp.narrative.heading) || 'The Experience')}</span>
          <h2 class="font-serif text-3xl md:text-4xl font-bold mt-2 mb-6">What this day feels like</h2>
          ${(exp.narrative && exp.narrative.paragraphs || [])
            .map((p) => `<p class="text-brand-muted leading-relaxed mb-4">${escapeHtml(p)}</p>`)
            .join('')}
        </div>
        ${
          exp.narrative && exp.narrative.image
            ? `<div class="rounded-2xl overflow-hidden h-72 md:h-[420px]"><img src="${escapeHtml(exp.narrative.image)}" alt="" class="w-full h-full object-cover" loading="lazy"></div>`
            : ''
        }
      </div>
    </section>

    <section class="py-20 bg-brand-card">
      <div class="max-w-7xl mx-auto px-6">
        <span class="text-brand-terracotta font-semibold text-sm uppercase tracking-wider">Itinerary</span>
        <h2 class="font-serif text-3xl md:text-4xl font-bold mt-2 mb-4">Your day, already planned</h2>
        <p class="text-brand-muted max-w-2xl mb-12">Timing may shift slightly based on traffic and local conditions — your Rishvel host keeps the day smooth.</p>
        <div class="experience-timeline max-w-3xl">
          ${itinerary.stops
            .map(
              (stop) => `
            <div class="experience-timeline-item pl-6">
              <time class="text-xs font-semibold text-brand-terracotta uppercase tracking-wider">${escapeHtml(stop.time)}</time>
              <h3 class="font-serif text-xl font-bold mt-1 mb-2">${escapeHtml(stop.title)}</h3>
              <p class="text-brand-muted text-sm leading-relaxed">${escapeHtml(stop.description)}</p>
              ${
                stop.image
                  ? `<div class="mt-4 rounded-xl overflow-hidden max-w-md"><img src="${escapeHtml(stop.image)}" alt="" class="w-full h-48 object-cover" loading="lazy"></div>`
                  : ''
              }
            </div>`
            )
            .join('')}
        </div>
      </div>
    </section>

    <section class="py-20 md:py-28 max-w-7xl mx-auto px-6">
      <span class="text-brand-terracotta font-semibold text-sm uppercase tracking-wider">Highlights</span>
      <h2 class="font-serif text-3xl md:text-4xl font-bold mt-2 mb-12">What you will remember</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        ${(exp.highlights || [])
          .slice(0, 6)
          .map(
            (h) => `
          <div class="bg-brand-card rounded-2xl p-6">
            <h3 class="font-serif text-xl font-bold mb-2">${escapeHtml(h.title)}</h3>
            <p class="text-brand-muted text-sm">${escapeHtml(h.description)}</p>
          </div>`
          )
          .join('')}
      </div>
    </section>

    ${window.RishvelReviews ? window.RishvelReviews.travellerStoriesShell(exp.slug) : ''}

    <section class="py-20 bg-stone-900 text-white">
      <div class="max-w-3xl mx-auto px-6">
        <span class="text-brand-terracotta font-semibold text-sm uppercase tracking-wider">Practical information</span>
        <h2 class="font-serif text-3xl md:text-4xl font-bold mt-2 mb-8">Before you go</h2>
        <div class="experience-accordion">
          ${(exp.practical || [])
            .map(
              (item) => `
            <details>
              <summary>${escapeHtml(item.title)}</summary>
              <p class="text-stone-400 text-sm leading-relaxed pb-6">${escapeHtml(item.content)}</p>
            </details>`
            )
            .join('')}
        </div>
      </div>
    </section>

    <section class="py-16 max-w-7xl mx-auto px-6">
      <span class="text-brand-terracotta font-semibold text-sm uppercase tracking-wider">Who is this for?</span>
      <h2 class="font-serif text-2xl md:text-3xl font-bold mt-2 mb-6">Travellers like you</h2>
      <div class="flex flex-wrap gap-3">
        ${(exp.audience || [])
          .map(
            (tag) =>
              `<span class="px-4 py-2 rounded-full border border-stone-300 text-sm font-medium text-stone-700 bg-white">${escapeHtml(tag)}</span>`
          )
          .join('')}
      </div>
    </section>

    <section class="py-20 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12">
      <div>
        <span class="text-brand-terracotta font-semibold text-sm uppercase tracking-wider">Included</span>
        <h2 class="font-serif text-3xl font-bold mt-2 mb-6">What&apos;s included</h2>
        <ul class="space-y-3">
          ${(exp.inclusions || [])
            .map((item) => `<li class="flex gap-3 text-brand-muted text-sm"><span class="text-brand-terracotta">✓</span><span>${escapeHtml(item)}</span></li>`)
            .join('')}
        </ul>
      </div>
      <div class="bg-brand-card rounded-2xl p-8 lg:p-10">
        <span class="text-brand-terracotta font-semibold text-sm uppercase tracking-wider">Plan your trip</span>
        <h2 class="font-serif text-3xl font-bold mt-2 mb-4">Ready when you are</h2>
        ${
          exp.pricing && exp.pricing.display
            ? `<p class="font-serif text-2xl font-bold mb-2">${escapeHtml(exp.pricing.display)}</p>
               ${exp.pricing.note ? `<p class="text-brand-muted text-sm mb-6">${escapeHtml(exp.pricing.note)}</p>` : '<div class="mb-6"></div>'}`
            : '<p class="text-brand-muted text-sm mb-6">Share your dates and group size — we will send a tailored quote.</p>'
        }
        <a href="${planHref}" class="inline-flex w-full justify-center bg-brand-terracotta text-white px-8 py-4 rounded-xl font-medium hover:bg-opacity-90 transition-all">Plan This Experience</a>
      </div>
    </section>

    <section class="py-20 bg-brand-card">
      <div class="max-w-3xl mx-auto px-6">
        <span class="text-brand-terracotta font-semibold text-sm uppercase tracking-wider">FAQ</span>
        <h2 class="font-serif text-3xl md:text-4xl font-bold mt-2 mb-8">Common questions</h2>
        <div class="experience-accordion bg-brand-cream rounded-2xl px-6">
          ${(exp.faqs || [])
            .slice(0, 7)
            .map(
              (faq) => `
            <details>
              <summary>${escapeHtml(faq.question)}</summary>
              <p class="text-brand-muted text-sm leading-relaxed pb-6">${escapeHtml(faq.answer)}</p>
            </details>`
            )
            .join('')}
        </div>
      </div>
    </section>

    <div class="experience-sticky-cta" id="experience-sticky-cta" aria-hidden="true">
      <a href="${planHref}" class="flex w-full justify-center bg-brand-terracotta text-white py-3.5 rounded-xl font-medium text-sm">Plan This Experience</a>
    </div>
  `;
}

function injectStructuredData(exp) {
  const canonical = `https://rishvel.com/experiences/${exp.slug}/`;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: exp.title,
    description: exp.seo && exp.seo.description ? exp.seo.description : exp.shortDescription,
    touristType: exp.audience || [],
    itinerary: {
      '@type': 'ItemList',
      itemListElement: ((exp.itineraries && exp.itineraries[0] && exp.itineraries[0].stops) || []).map((stop, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: `${stop.time} — ${stop.title}`,
        description: stop.description
      }))
    },
    provider: {
      '@type': 'Organization',
      name: 'Rishvel',
      url: 'https://rishvel.com/'
    },
    url: canonical,
    image: (exp.seo && exp.seo.ogImage) || exp.heroImage
  };

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

function initStickyCta(planHref) {
  const bar = document.getElementById('experience-sticky-cta');
  const hero = document.querySelector('#experience-detail-root section');
  if (!bar || !hero) return;

  const observer = new IntersectionObserver(
    ([entry]) => {
      bar.classList.toggle('is-visible', !entry.isIntersecting);
      bar.setAttribute('aria-hidden', entry.isIntersecting ? 'true' : 'false');
    },
    { threshold: 0, rootMargin: '-80px 0px 0px 0px' }
  );
  observer.observe(hero);
}
