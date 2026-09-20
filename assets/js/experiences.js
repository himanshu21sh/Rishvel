document.addEventListener('DOMContentLoaded', async () => {
  const { loadExperiences, getFeatured, getUniqueCategories, findMatchingExperiences, renderExperienceCard, escapeHtml } =
    window.RishvelExperiences;

  let experiences;
  try {
    experiences = await loadExperiences();
  } catch (err) {
    console.error(err);
    showLoadError(document.getElementById('featured-experiences') || document.getElementById('experiences-catalog'));
    return;
  }

  initFeatured(experiences);
  initCatalog(experiences);
});

function showLoadError(container) {
  if (!container) return;
  container.innerHTML =
    '<p class="text-brand-muted text-sm col-span-full">Experiences could not be loaded. Please refresh the page.</p>';
}

function initFeatured(experiences) {
  const el = document.getElementById('featured-experiences');
  if (!el) return;

  const featured = window.RishvelExperiences.getFeatured(experiences, 3);
  if (!featured.length) {
    el.innerHTML = '<p class="text-brand-muted text-sm col-span-full">Featured experiences coming soon.</p>';
    return;
  }

  el.innerHTML = featured.map((exp) => window.RishvelExperiences.renderExperienceCard(exp)).join('');
}

function initCatalog(experiences) {
  const grid = document.getElementById('experiences-catalog');
  if (!grid) return;

  const searchInput = document.getElementById('experiences-search');
  const filterBar = document.getElementById('experiences-filters');
  const emptyEl = document.getElementById('experiences-empty');
  const filterNote = document.getElementById('experiences-filter-note');

  const params = new URLSearchParams(window.location.search);
  const destinationParam = params.get('destination');

  if (destinationParam) {
    const matches = window.RishvelExperiences.findMatchingExperiences(experiences, destinationParam);
    if (matches.length === 1) {
      window.location.replace(window.RishvelExperiences.experienceUrl(matches[0].slug));
      return;
    }
  }

  let activeCategory = '';
  let searchTerm = '';

  const categories = window.RishvelExperiences.getUniqueCategories(experiences);
  if (filterBar && categories.length) {
    filterBar.innerHTML = [
      `<button type="button" data-category="" class="exp-filter-btn is-active px-4 py-2 rounded-full text-sm font-medium border border-stone-300 bg-brand-dark text-white">All</button>`,
      ...categories.map(
        (cat) =>
          `<button type="button" data-category="${window.RishvelExperiences.escapeHtml(cat)}" class="exp-filter-btn px-4 py-2 rounded-full text-sm font-medium border border-stone-300 bg-white text-stone-700 hover:border-brand-terracotta transition-colors">${window.RishvelExperiences.escapeHtml(cat)}</button>`
      )
    ].join('');

    filterBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.exp-filter-btn');
      if (!btn) return;
      filterBar.querySelectorAll('.exp-filter-btn').forEach((b) => {
        b.classList.remove('is-active', 'bg-brand-dark', 'text-white');
        b.classList.add('bg-white', 'text-stone-700');
      });
      btn.classList.add('is-active', 'bg-brand-dark', 'text-white');
      btn.classList.remove('bg-white', 'text-stone-700');
      activeCategory = btn.getAttribute('data-category') || '';
      render();
    });
  }

  if (destinationParam) {
    const matches = window.RishvelExperiences.findMatchingExperiences(experiences, destinationParam);
    if (matches.length > 1) {
      searchTerm = destinationParam;
      if (searchInput) searchInput.value = destinationParam;
      if (filterNote) {
        filterNote.textContent = `Showing experiences matching “${destinationParam}”.`;
        filterNote.classList.remove('hidden');
      }
    } else if (matches.length === 0 && filterNote) {
      filterNote.textContent = `No exact match for “${destinationParam}”. Browse all experiences below.`;
      filterNote.classList.remove('hidden');
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      searchTerm = searchInput.value.trim();
      render();
    });
  }

  function filterList() {
    let list = [...experiences];

    if (activeCategory) {
      list = list.filter((e) => e.category === activeCategory);
    }

    if (searchTerm) {
      const q = window.RishvelExperiences.normalizeQuery(searchTerm);
      list = list.filter((exp) => {
        const hay = [exp.destination, exp.title, exp.shortDescription, exp.category, exp.slug]
          .join(' ')
          .toLowerCase();
        return hay.includes(q.replace(/-/g, ' ')) || window.RishvelExperiences.experienceMatchesQuery(exp, searchTerm);
      });
    }

    return list.sort((a, b) => (a.featuredOrder || 99) - (b.featuredOrder || 99));
  }

  function render() {
    const list = filterList();
    grid.innerHTML = list.map((exp) => window.RishvelExperiences.renderExperienceCard(exp)).join('');
    if (emptyEl) emptyEl.classList.toggle('hidden', list.length > 0);
  }

  render();
}
