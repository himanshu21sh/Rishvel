(function (global) {
  const DATA_URL = '/data/experiences.json';

  let cache = null;

  async function loadExperiences() {
    if (cache) return cache;
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error('Failed to load experiences');
    cache = await res.json();
    return cache;
  }

  function normalizeQuery(value) {
    return decodeURIComponent(String(value || ''))
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-');
  }

  function experienceMatchesQuery(exp, rawQuery) {
    const q = normalizeQuery(rawQuery);
    if (!q) return false;
    const candidates = [
      exp.slug,
      exp.id,
      exp.destination,
      exp.title,
      exp.inquiryLabel
    ]
      .filter(Boolean)
      .map(normalizeQuery);
    return candidates.some((c) => c === q || c.includes(q) || q.includes(c));
  }

  function findMatchingExperiences(experiences, rawQuery) {
    const q = normalizeQuery(rawQuery);
    if (!q) return [];
    return experiences.filter((exp) => experienceMatchesQuery(exp, q));
  }

  function getFeatured(experiences, limit) {
    return experiences
      .filter((e) => e.featured)
      .sort((a, b) => (a.featuredOrder || 99) - (b.featuredOrder || 99))
      .slice(0, limit ?? 3);
  }

  function getUniqueCategories(experiences) {
    return [...new Set(experiences.map((e) => e.category).filter(Boolean))].sort();
  }

  function experienceUrl(slug) {
    return `/experiences/${slug}/`;
  }

  function inquiryUrl(exp) {
    const label = encodeURIComponent(exp.inquiryLabel || exp.title || exp.destination);
    return `/?experience=${label}#contact`;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderExperienceCard(exp, options) {
    const opts = options || {};
    const cta = opts.ctaLabel || 'Explore Experience';
    const url = experienceUrl(exp.slug);
    const badge = exp.cardBadge || exp.category;

    return `
      <article class="bg-brand-card rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-300 h-full flex flex-col">
        <a href="${url}" class="block relative h-64 overflow-hidden flex-shrink-0">
          <img src="${escapeHtml(exp.heroImage)}" alt="${escapeHtml(exp.destination)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy">
          <span class="absolute top-4 left-4 bg-white/90 backdrop-blur-md text-xs font-semibold px-3 py-1 rounded-full">${escapeHtml(badge)}</span>
        </a>
        <div class="p-6 flex flex-col flex-1">
          <h3 class="font-serif text-2xl font-bold mb-2">
            <a href="${url}" class="hover:text-brand-terracotta transition-colors">${escapeHtml(exp.destination)}</a>
          </h3>
          <p class="text-brand-muted text-sm mb-4 flex-1">${escapeHtml(exp.shortDescription)}</p>
          <div class="flex items-center justify-between pt-4 border-t border-stone-200 mt-auto">
            <span class="text-xs font-medium text-stone-500">${escapeHtml(exp.duration || '')}</span>
            <a href="${url}" class="text-brand-terracotta font-semibold text-sm hover:underline">${escapeHtml(cta)} &rarr;</a>
          </div>
        </div>
      </article>
    `;
  }

  global.RishvelExperiences = {
    loadExperiences,
    normalizeQuery,
    experienceMatchesQuery,
    findMatchingExperiences,
    getFeatured,
    getUniqueCategories,
    experienceUrl,
    inquiryUrl,
    escapeHtml,
    renderExperienceCard
  };
})(typeof window !== 'undefined' ? window : globalThis);
