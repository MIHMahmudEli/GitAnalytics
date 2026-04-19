/**
 * app.js — Main application controller (GitAnalytics)
 *
 * Orchestrates: API fetching → analytics → UI rendering
 * Features: search, filter, sort, pagination, export (download + clipboard)
 */

import { fetchUserProfile, fetchUserRepos } from './api.js';
import { computeAnalytics, buildExportData, formatNumber } from './analytics.js';
import {
  renderProfile,
  renderWebsitePreview,
  renderAnalyticsCards,
  renderLangChart,
  renderRepos,
  renderPagination,
  populateLangFilter,
  showLoading,
  hideLoading,
  showDashboard,
  showError,
  hideError,
  showToast,
  initParticles,
} from './ui.js';

// ── State ────────────────────────────────────────────────────────────────────

const state = {
  profile:    null,
  repos:      [],     // all repos (raw)
  analytics:  null,
  exportData: null,

  // Filtering / sorting / pagination
  searchQuery:  '',
  sortBy:       'stars',
  langFilter:   'all',
  currentPage:  1,
  perPage:      9,
};

// ── DOM References ────────────────────────────────────────────────────────────

const searchForm      = document.getElementById('searchForm');
const usernameInput   = document.getElementById('usernameInput');
const searchBtn       = document.getElementById('searchBtn');
const errorClose      = document.getElementById('errorClose');
const exportJsonBtn   = document.getElementById('exportJsonBtn');
const copyJsonBtn     = document.getElementById('copyJsonBtn');
const repoSearch      = document.getElementById('repoSearch');
const repoSort        = document.getElementById('repoSort');
const langFilter      = document.getElementById('langFilter');
const prevPage        = document.getElementById('prevPage');
const nextPage        = document.getElementById('nextPage');
const pageNumbers     = document.getElementById('pageNumbers');
const suggestionChips = document.querySelectorAll('.suggestion-chip');

// ── Boot ─────────────────────────────────────────────────────────────────────

initParticles();
bindEvents();

// Pre-fill from URL query param ?user=username
const urlParams = new URLSearchParams(window.location.search);
const prefilledUser = urlParams.get('user');
if (prefilledUser) {
  usernameInput.value = prefilledUser;
  analyzeUser(prefilledUser);
}

// ── Event Binding ─────────────────────────────────────────────────────────────

function bindEvents() {
  // Search form
  searchForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = usernameInput?.value.trim();
    if (username) analyzeUser(username);
  });

  // Error dismiss
  errorClose?.addEventListener('click', () => hideError());

  // Suggestion chips
  suggestionChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const username = chip.dataset.username;
      if (usernameInput) usernameInput.value = username;
      analyzeUser(username);
    });
  });

  // Repo search (debounced)
  repoSearch?.addEventListener('input', debounce(() => {
    state.searchQuery = repoSearch.value.trim().toLowerCase();
    state.currentPage = 1;
    applyFiltersAndRender();
  }, 250));

  // Sort
  repoSort?.addEventListener('change', () => {
    state.sortBy = repoSort.value;
    state.currentPage = 1;
    applyFiltersAndRender();
  });

  // Language filter
  langFilter?.addEventListener('change', () => {
    state.langFilter = langFilter.value;
    state.currentPage = 1;
    applyFiltersAndRender();
  });

  // Pagination
  prevPage?.addEventListener('click', () => {
    if (state.currentPage > 1) { state.currentPage--; applyFiltersAndRender(); }
  });

  nextPage?.addEventListener('click', () => {
    const filtered   = getFilteredRepos();
    const totalPages = Math.ceil(filtered.length / state.perPage);
    if (state.currentPage < totalPages) { state.currentPage++; applyFiltersAndRender(); }
  });

  pageNumbers?.addEventListener('click', (e) => {
    const btn = e.target.closest('.page-num');
    if (btn?.dataset.page) {
      state.currentPage = parseInt(btn.dataset.page, 10);
      applyFiltersAndRender();
      document.getElementById('reposHeading')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  // Export
  exportJsonBtn?.addEventListener('click', downloadJSON);
  copyJsonBtn?.addEventListener('click', copyJSONToClipboard);
}

// ── Core: Analyze User ────────────────────────────────────────────────────────

async function analyzeUser(username) {
  if (!username) return;

  // Reset state
  state.searchQuery = '';
  state.sortBy      = 'stars';
  state.langFilter  = 'all';
  state.currentPage = 1;
  if (repoSearch)  repoSearch.value  = '';
  if (repoSort)    repoSort.value    = 'stars';
  if (langFilter)  langFilter.value  = 'all';

  hideError();
  showLoading();

  // Update URL
  const url = new URL(window.location.href);
  url.searchParams.set('user', username);
  window.history.replaceState({}, '', url.toString());

  try {
    const [profile, repos] = await Promise.all([
      fetchUserProfile(username),
      fetchUserRepos(username),
    ]);

    state.profile   = profile;
    state.repos     = repos;
    state.analytics = computeAnalytics(repos);
    state.exportData = buildExportData(profile, repos, state.analytics);

    // Render
    renderProfile(profile);
    renderWebsitePreview(profile);
    renderAnalyticsCards(state.analytics);
    renderLangChart(state.analytics.languages);
    populateLangFilter(repos);
    applyFiltersAndRender();

    hideLoading();
    showDashboard();

    // Scroll to dashboard
    document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    showToast(`✅ Loaded ${formatNumber(repos.length)} repos for @${username}`);

  } catch (err) {
    hideLoading();
    showError(err.message || 'An unexpected error occurred. Please try again.');
    console.error('[GitAnalytics]', err);
  }
}

// ── Filter, Sort, Paginate ────────────────────────────────────────────────────

function getFilteredRepos() {
  let repos = [...state.repos];

  // Search filter
  if (state.searchQuery) {
    repos = repos.filter((r) =>
      r.name.toLowerCase().includes(state.searchQuery) ||
      (r.description || '').toLowerCase().includes(state.searchQuery) ||
      (r.language || '').toLowerCase().includes(state.searchQuery)
    );
  }

  // Language filter
  if (state.langFilter !== 'all') {
    repos = repos.filter((r) => r.language === state.langFilter);
  }

  // Sort
  repos.sort((a, b) => {
    switch (state.sortBy) {
      case 'stars':   return (b.stargazers_count || 0) - (a.stargazers_count || 0);
      case 'forks':   return (b.forks_count      || 0) - (a.forks_count      || 0);
      case 'name':    return a.name.localeCompare(b.name);
      case 'updated': return new Date(b.pushed_at || b.updated_at) - new Date(a.pushed_at || a.updated_at);
      default:        return 0;
    }
  });

  return repos;
}

function applyFiltersAndRender() {
  const filtered   = getFilteredRepos();
  const totalPages = Math.ceil(filtered.length / state.perPage) || 1;

  // Clamp current page
  if (state.currentPage > totalPages) state.currentPage = totalPages;

  const start = (state.currentPage - 1) * state.perPage;
  const page  = filtered.slice(start, start + state.perPage);

  renderRepos(page, filtered.length);
  renderPagination(state.currentPage, totalPages);
}

// ── Export ────────────────────────────────────────────────────────────────────

function getExportJSON() {
  if (!state.exportData) return null;
  return JSON.stringify(state.exportData, null, 2);
}

function downloadJSON() {
  const json = getExportJSON();
  if (!json) return;

  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `gitanalytics-${state.profile?.login || 'export'}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  showToast('📥 JSON downloaded successfully!');
}

async function copyJSONToClipboard() {
  const json = getExportJSON();
  if (!json) return;

  try {
    await navigator.clipboard.writeText(json);
    // Visual feedback on button
    const btn = document.getElementById('copyJsonBtn');
    if (btn) {
      const original = btn.innerHTML;
      btn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16">
          <polyline points="20,6 9,17 4,12"/>
        </svg>
        Copied!
      `;
      btn.classList.add('success');
      setTimeout(() => {
        btn.innerHTML = original;
        btn.classList.remove('success');
      }, 2000);
    }
    showToast('📋 JSON copied to clipboard!');
  } catch {
    showToast('⚠️ Could not copy — try downloading instead.');
  }
}

// ── Utility ───────────────────────────────────────────────────────────────────

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
