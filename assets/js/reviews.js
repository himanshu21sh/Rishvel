(function (global) {
  const REVIEWS_URL = '/data/reviews.json';
  let cache = null;
  let instagramScriptRequested = false;

  async function loadReviews() {
    if (cache) return cache;
    const res = await fetch(REVIEWS_URL);
    if (!res.ok) throw new Error('Failed to load reviews');
    cache = await res.json();
    return cache;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function parseInstagramReelUrl(url) {
    try {
      const parsed = new URL(url);
      const match = parsed.pathname.match(/\/reel\/([^/]+)/i);
      if (!match) return null;
      const reelId = match[1];
      const profileMatch = parsed.pathname.match(/^\/([^/]+)\/reel\//i);
      const profile = profileMatch && profileMatch[1] !== 'reel' ? profileMatch[1] : null;
      const canonicalUrl = profile
        ? `https://www.instagram.com/${profile}/reel/${reelId}/`
        : `https://www.instagram.com/reel/${reelId}/`;
      return {
        reelId,
        canonicalUrl,
        embedUrl: `https://www.instagram.com/reel/${reelId}/embed`,
      };
    } catch {
      return null;
    }
  }

  function isPublishedReview(review) {
    return review.published !== false;
  }

  function getReviewsForContext(allReviews, options) {
    const { experienceSlug, homepage } = options || {};
    return allReviews.filter(isPublishedReview).filter((r) => {
      if (experienceSlug) {
        return (r.experiences || []).includes(experienceSlug);
      }
      if (homepage) return r.showOnHomepage === true;
      return true;
    });
  }

  function filterReviewsByTab(reviews, tab) {
    if (tab === 'photos') return reviews.filter((r) => r.mediaType === 'photo');
    if (tab === 'videos') return reviews.filter((r) => r.mediaType === 'video');
    return reviews;
  }

  function renderTextCard(review) {
    return `
      <article class="bg-brand-card p-8 rounded-2xl flex flex-col justify-between h-full" data-review-id="${escapeHtml(review.id)}">
        <p class="text-stone-700 italic mb-6">&ldquo;${escapeHtml(review.quote)}&rdquo;</p>
        <div>
          <h4 class="font-bold">${escapeHtml(review.name)}</h4>
          ${review.location ? `<span class="text-xs text-brand-muted">${escapeHtml(review.location)}</span>` : ''}
        </div>
      </article>`;
  }

  function renderPhotoCard(review) {
    return `
      <article class="bg-brand-card rounded-2xl overflow-hidden flex flex-col h-full" data-review-id="${escapeHtml(review.id)}">
        <img src="${escapeHtml(review.image)}" alt="" class="w-full h-52 object-cover" loading="lazy">
        <div class="p-6 flex flex-col flex-1 justify-between">
          ${review.quote ? `<p class="text-stone-700 italic text-sm mb-4">&ldquo;${escapeHtml(review.quote)}&rdquo;</p>` : ''}
          <div>
            <h4 class="font-bold">${escapeHtml(review.name || '')}</h4>
            ${review.location ? `<span class="text-xs text-brand-muted">${escapeHtml(review.location)}</span>` : ''}
          </div>
        </div>
      </article>`;
  }

  function renderVideoCard(review) {
    const reel = parseInstagramReelUrl(review.url);
    const byline = [review.name, review.handle].filter(Boolean).join(' · ');
    const embedBlock = reel
      ? `<div class="instagram-reel-frame">
            <iframe
              class="instagram-reel-iframe"
              src="${escapeHtml(reel.embedUrl)}"
              title="Instagram reel${review.name ? ` by ${escapeHtml(review.name)}` : ''}"
              loading="lazy"
              allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              allowfullscreen
              referrerpolicy="strict-origin-when-cross-origin"
            ></iframe>
          </div>`
      : `<p class="text-sm text-brand-muted px-4 py-8 text-center">Video unavailable.</p>`;

    const viewLink = reel
      ? `<a href="${escapeHtml(reel.canonicalUrl)}" class="video-review-instagram-link" target="_blank" rel="noopener noreferrer">View on Instagram</a>`
      : review.url
        ? `<a href="${escapeHtml(review.url)}" class="video-review-instagram-link" target="_blank" rel="noopener noreferrer">View on Instagram</a>`
        : '';

    return `
      <article class="bg-brand-card rounded-2xl overflow-hidden flex flex-col h-full" data-review-id="${escapeHtml(review.id)}" data-video-review${reel ? ` data-reel-id="${escapeHtml(reel.reelId)}"` : ''}>
        <div class="video-review-embed-slot">
          ${embedBlock}
        </div>
        ${review.quote ? `<p class="text-stone-700 italic text-sm mt-4 px-4">&ldquo;${escapeHtml(review.quote)}&rdquo;</p>` : ''}
        <div class="px-4 pb-4 mt-2 flex flex-col gap-2">
          ${byline ? `<p class="font-bold text-sm">${escapeHtml(byline)}</p>` : ''}
          ${viewLink}
        </div>
      </article>`;
  }

  function renderReviewCard(review) {
    if (review.mediaType === 'photo') return renderPhotoCard(review);
    if (review.mediaType === 'video') return renderVideoCard(review);
    return renderTextCard(review);
  }

  function travellerStoriesShell(experienceSlug) {
    const slugAttr = experienceSlug ? ` data-experience-slug="${escapeHtml(experienceSlug)}"` : ' data-homepage-stories="true"';
    return `
      <section class="py-24 max-w-7xl mx-auto px-6" data-traveller-stories${slugAttr}>
        <div class="text-center max-w-2xl mx-auto mb-8">
          <span class="text-brand-terracotta font-semibold text-sm uppercase tracking-wider">Traveller Stories</span>
          <h2 class="font-serif text-4xl md:text-5xl font-bold mt-2">What our guests say</h2>
        </div>
        <div class="traveller-stories-filters flex flex-wrap justify-center gap-2 mb-12" role="tablist" aria-label="Filter stories">
          <button type="button" class="traveller-stories-filter is-active" data-review-tab="all" role="tab" aria-selected="true">All</button>
          <button type="button" class="traveller-stories-filter" data-review-tab="photos" role="tab" aria-selected="false">Photos</button>
          <button type="button" class="traveller-stories-filter" data-review-tab="videos" role="tab" aria-selected="false">Videos</button>
        </div>
        <div class="traveller-stories-grid"></div>
        <p class="traveller-stories-empty hidden text-center text-brand-muted py-8 text-sm">No stories in this category yet.</p>
      </section>`;
  }

  function runInstagramProcess() {
    if (global.instgrm && global.instgrm.Embeds) global.instgrm.Embeds.process();
  }

  function loadInstagramScript() {
    if (instagramScriptRequested) {
      runInstagramProcess();
      return;
    }
    instagramScriptRequested = true;
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.instagram.com/embed.js';
    s.onload = () => {
      runInstagramProcess();
      setTimeout(runInstagramProcess, 400);
    };
    document.body.appendChild(s);
  }

  function normalizeInstagramReelFrames(container) {
    container.querySelectorAll('.instagram-reel-frame').forEach((frame) => {
      const iframe = frame.querySelector('iframe.instagram-reel-iframe, iframe');
      if (!iframe) return;
      iframe.setAttribute('loading', 'lazy');
      iframe.style.border = '0';
      iframe.style.display = 'block';
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.maxWidth = '100%';
      iframe.style.minWidth = '0';
    });
  }

  function processInstagramEmbeds(container) {
    normalizeInstagramReelFrames(container);
    if (!container.querySelector('.instagram-media')) return;
    loadInstagramScript();
    runInstagramProcess();
    setTimeout(() => {
      runInstagramProcess();
      normalizeInstagramReelFrames(container);
    }, 600);
  }

  async function initTravellerStoriesSection(section) {
    if (!section || section.dataset.initialized) return;
    section.dataset.initialized = 'true';

    const grid = section.querySelector('.traveller-stories-grid');
    const emptyEl = section.querySelector('.traveller-stories-empty');
    const filters = section.querySelector('.traveller-stories-filters');
    if (!grid) return;

    const experienceSlug = section.getAttribute('data-experience-slug') || null;
    const homepage = section.hasAttribute('data-homepage-stories');

    let allReviews;
    try {
      allReviews = await loadReviews();
    } catch (err) {
      console.error(err);
      section.classList.add('hidden');
      return;
    }

    const contextReviews = getReviewsForContext(allReviews, { experienceSlug, homepage });
    if (!contextReviews.length) {
      section.classList.add('hidden');
      return;
    }

    const hasPhotos = contextReviews.some((r) => r.mediaType === 'photo');
    const hasVideos = contextReviews.some((r) => r.mediaType === 'video');
    filters?.querySelector('[data-review-tab="photos"]')?.classList.toggle('hidden', !hasPhotos);
    filters?.querySelector('[data-review-tab="videos"]')?.classList.toggle('hidden', !hasVideos);

    let activeTab = 'all';

    function render() {
      const list = filterReviewsByTab(contextReviews, activeTab);
      grid.innerHTML = list.map((r) => renderReviewCard(r)).join('');
      emptyEl?.classList.toggle('hidden', list.length > 0);
      processInstagramEmbeds(grid);
    }

    filters?.querySelectorAll('[data-review-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeTab = btn.getAttribute('data-review-tab');
        filters.querySelectorAll('[data-review-tab]').forEach((b) => {
          const on = b === btn;
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        render();
      });
    });

    render();
  }

  function initAllTravellerStories() {
    document.querySelectorAll('[data-traveller-stories]').forEach((section) => {
      initTravellerStoriesSection(section);
    });
  }

  global.RishvelReviews = {
    loadReviews,
    travellerStoriesShell,
    initTravellerStoriesSection,
    initAllTravellerStories
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllTravellerStories);
  } else {
    initAllTravellerStories();
  }
})(typeof window !== 'undefined' ? window : globalThis);
