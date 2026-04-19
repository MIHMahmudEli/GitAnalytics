/**
 * ui.js — DOM rendering and UI update functions
 */

import { getLangColor, formatNumber } from './analytics.js';

// ── Profile ─────────────────────────────────────────────────────────────────

/**
 * Render the profile card
 * @param {Object} profile - raw GitHub user object
 */
export function renderProfile(profile) {
  _set('profileAvatar', null, { src: profile.avatar_url || '', alt: `${profile.login}'s avatar` });
  _set('profileName',     profile.name     || profile.login);
  _set('profileUsername', `@${profile.login}`);
  _set('profileBio',      profile.bio      || 'No bio provided.');
  _set('profileJoined',   `Joined ${_formatDate(profile.created_at)}`);

  const profileLink = _el('profileLink');
  if (profileLink) profileLink.href = profile.html_url;

  // Stats
  _set('statRepos',     formatNumber(profile.public_repos));
  _set('statFollowers', formatNumber(profile.followers));
  _set('statFollowing', formatNumber(profile.following));

  // Optional meta fields
  _toggleMeta('profileLocation', 'locationText', profile.location);
  _toggleMeta('profileCompany',  'companyText',  profile.company);

  if (profile.blog) {
    const blogWrap = _el('profileBlog');
    const blogLink = _el('blogLink');
    if (blogWrap && blogLink) {
      const url = profile.blog.startsWith('http') ? profile.blog : `https://${profile.blog}`;
      blogLink.href = url;
      blogLink.textContent = profile.blog.replace(/^https?:\/\//, '');
      blogWrap.style.display = 'flex';
    }
  }
}

function _toggleMeta(wrapId, textId, value) {
  const wrap = _el(wrapId);
  const text = _el(textId);
  if (!wrap || !text) return;
  if (value) {
    text.textContent = value;
    wrap.style.display = 'flex';
  } else {
    wrap.style.display = 'none';
  }
}

// ── Analytics Cards ──────────────────────────────────────────────────────────

/**
 * Render the four analytics summary cards
 * @param {Object} analytics
 */
export function renderAnalyticsCards(analytics) {
  _set('totalStars', formatNumber(analytics.totalStars));
  _set('totalForks', formatNumber(analytics.totalForks));
  _set('topRepo',    analytics.topRepo || '—');
  _set('topLang',    analytics.topLanguage || '—');
}

// ── Language Chart ───────────────────────────────────────────────────────────

/**
 * Render the language distribution bar chart + legend
 * @param {Array} languages - [{name, count, percentage, color}]
 */
export function renderLangChart(languages) {
  const chart  = _el('langChart');
  const legend = _el('langLegend');
  if (!chart || !legend) return;

  const top = languages.slice(0, 10);

  if (top.length === 0) {
    chart.innerHTML  = '<p style="color:var(--text-muted);font-size:0.9rem;">No language data available.</p>';
    legend.innerHTML = '';
    return;
  }

  // Bars
  chart.innerHTML = top.map((lang) => `
    <div class="lang-bar-row">
      <span class="lang-bar-label" title="${lang.name}">${lang.name}</span>
      <div class="lang-bar-track">
        <div
          class="lang-bar-fill"
          style="background:${lang.color}; width:0%"
          data-width="${lang.percentage}"
          role="progressbar"
          aria-valuenow="${lang.percentage}"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label="${lang.name}: ${lang.percentage}%"
        ></div>
      </div>
      <span class="lang-bar-pct">${lang.percentage}%</span>
    </div>
  `).join('');

  // Animate bars after paint
  requestAnimationFrame(() => {
    chart.querySelectorAll('.lang-bar-fill').forEach((bar) => {
      setTimeout(() => { bar.style.width = bar.dataset.width + '%'; }, 50);
    });
  });

  // Legend dots
  legend.innerHTML = top.map((lang) => `
    <div class="legend-item">
      <span class="legend-dot" style="background:${lang.color}"></span>
      <span>${lang.name}</span>
      <span style="color:var(--text-muted);font-family:var(--font-mono);font-size:0.75rem">${lang.count}</span>
    </div>
  `).join('');
}

// ── Repositories ─────────────────────────────────────────────────────────────

/**
 * Render a page of repository cards
 * @param {Array} repos - filtered + sorted repos for current page
 * @param {number} totalCount - total filtered count
 */
export function renderRepos(repos, totalCount) {
  const grid = _el('reposGrid');
  if (!grid) return;

  _set('repoCountBadge', totalCount);

  if (repos.length === 0) {
    grid.innerHTML = `
      <div class="no-results" role="status">
        <div class="no-results-icon">🔍</div>
        <p>No repositories match your filters.</p>
      </div>`;
    return;
  }

  grid.innerHTML = repos.map((repo) => _buildRepoCard(repo)).join('');

  // Stagger animation
  grid.querySelectorAll('.repo-card').forEach((card, i) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(12px)';
    setTimeout(() => {
      card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, i * 40);
  });
}

function _buildRepoCard(repo) {
  const color = getLangColor(repo.language);
  const updated = _timeAgo(repo.pushed_at || repo.updated_at);
  const desc = repo.description
    ? _escapeHtml(repo.description)
    : '<em style="color:var(--text-muted)">No description</em>';

  const forkBadge = repo.fork
    ? `<span class="repo-fork-badge">
         <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="10" height="10"><circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/><path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9"/><line x1="12" y1="15" x2="12" y2="12"/></svg>
         Fork
       </span>`
    : '';

  const archivedBadge = repo.archived
    ? `<span class="repo-fork-badge" style="background:rgba(251,191,36,0.1);border-color:rgba(251,191,36,0.25);color:var(--color-warning)">
         Archived
       </span>`
    : '';

  return `
    <a
      href="${repo.html_url}"
      target="_blank"
      rel="noopener noreferrer"
      class="repo-card-link"
      aria-label="Open ${_escapeHtml(repo.name)} on GitHub"
    >
      <article class="repo-card" aria-label="Repository: ${_escapeHtml(repo.name)}">
        <div class="repo-card-header">
          <span class="repo-name" title="${_escapeHtml(repo.name)}">
            ${_escapeHtml(repo.name)}
            <svg class="repo-external-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12" aria-hidden="true">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </span>
          <div style="display:flex;gap:6px;align-items:center;flex-shrink:0">
            ${forkBadge}
            ${archivedBadge}
          </div>
        </div>

        <p class="repo-description">${desc}</p>

        <div class="repo-card-footer">
          ${repo.language ? `
            <span class="repo-stat">
              <span class="repo-lang-dot" style="background:${color}"></span>
              ${_escapeHtml(repo.language)}
            </span>` : ''}

          <span class="repo-stat" title="${repo.stargazers_count} stars">
            <svg viewBox="0 0 24 24" fill="currentColor" style="color:var(--color-warning)">
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
            </svg>
            ${formatNumber(repo.stargazers_count)}
          </span>

          <span class="repo-stat" title="${repo.forks_count} forks">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><circle cx="18" cy="6" r="3"/>
              <path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9"/><line x1="12" y1="15" x2="12" y2="12"/>
            </svg>
            ${formatNumber(repo.forks_count)}
          </span>

          <span class="repo-stat" title="Updated ${updated}" style="margin-left:auto;color:var(--text-muted);font-size:0.75rem">
            ${updated}
          </span>
        </div>
      </article>
    </a>
  `;
}

// ── Pagination ────────────────────────────────────────────────────────────────

/**
 * Render pagination controls
 * @param {number} currentPage  - 1-indexed
 * @param {number} totalPages
 */
export function renderPagination(currentPage, totalPages) {
  const prevBtn     = _el('prevPage');
  const nextBtn     = _el('nextPage');
  const pageNumbers = _el('pageNumbers');
  const pagination  = _el('pagination');

  if (!pagination) return;

  // Hide pagination if only one page
  if (totalPages <= 1) {
    pagination.style.display = 'none';
    return;
  }
  pagination.style.display = 'flex';

  if (prevBtn) prevBtn.disabled = currentPage <= 1;
  if (nextBtn) nextBtn.disabled = currentPage >= totalPages;

  if (!pageNumbers) return;

  const pages = _buildPageRange(currentPage, totalPages);
  pageNumbers.innerHTML = pages.map((p) =>
    p === '…'
      ? `<span style="color:var(--text-muted);padding:0 4px">…</span>`
      : `<button
           class="page-num ${p === currentPage ? 'active' : ''}"
           data-page="${p}"
           aria-label="Page ${p}"
           aria-current="${p === currentPage ? 'page' : 'false'}"
         >${p}</button>`
  ).join('');
}

function _buildPageRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const result = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) result.push('…');
    result.push(p);
    prev = p;
  }
  return result;
}

// ── Language Filter Dropdown ─────────────────────────────────────────────────

/**
 * Populate the language filter <select> with all unique languages
 * @param {Array} repos
 */
export function populateLangFilter(repos) {
  const select = _el('langFilter');
  if (!select) return;

  const langs = [...new Set(repos.map((r) => r.language).filter(Boolean))].sort();
  select.innerHTML =
    `<option value="all">All Languages</option>` +
    langs.map((l) => `<option value="${_escapeHtml(l)}">${_escapeHtml(l)}</option>`).join('');
}

// ── UI State Helpers ─────────────────────────────────────────────────────────

export function showLoading()  {
  _el('loadingSection')?.classList.remove('hidden');
  _el('dashboard')?.classList.add('hidden');
  _el('errorBanner')?.classList.add('hidden');
}

export function hideLoading()  { _el('loadingSection')?.classList.add('hidden'); }

export function showDashboard() { _el('dashboard')?.classList.remove('hidden'); }

export function showError(message) {
  const banner = _el('errorBanner');
  const msg    = _el('errorMessage');
  if (!banner || !msg) return;
  msg.textContent = message;
  banner.classList.remove('hidden');
  _el('loadingSection')?.classList.add('hidden');
}

export function hideError() { _el('errorBanner')?.classList.add('hidden'); }

// ── Toast ────────────────────────────────────────────────────────────────────

let _toastTimer = null;

export function showToast(message, duration = 3000) {
  const toast = _el('toastNotification');
  if (!toast) return;

  clearTimeout(_toastTimer);
  toast.textContent = message;
  toast.classList.remove('hidden');

  _toastTimer = setTimeout(() => {
    toast.classList.add('hidden');
  }, duration);
}

// ── Particles Background ─────────────────────────────────────────────────────

export function initParticles() {
  const container = _el('bgParticles');
  if (!container) return;

  const count = window.innerWidth < 768 ? 20 : 40;
  const colors = ['#6e56cf', '#26c0de', '#f472b6', '#34d399', '#fbbf24'];

  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 4 + 2;
    const color = colors[Math.floor(Math.random() * colors.length)];
    Object.assign(p.style, {
      width:  `${size}px`,
      height: `${size}px`,
      left:   `${Math.random() * 100}%`,
      background: color,
      '--dur':   `${Math.random() * 12 + 8}s`,
      '--delay': `${Math.random() * 10}s`,
    });
    container.appendChild(p);
  }
}

// ── Private Helpers ──────────────────────────────────────────────────────────

function _el(id) { return document.getElementById(id); }

function _set(id, text, attrs) {
  const el = _el(id);
  if (!el) return;
  if (text !== null && text !== undefined) el.textContent = text;
  if (attrs) Object.assign(el, attrs);
}

function _escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function _formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function _timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days  = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years  = Math.floor(days / 365);
  if (years  > 0) return `${years}y ago`;
  if (months > 0) return `${months}mo ago`;
  if (days   > 0) return `${days}d ago`;
  if (hours  > 0) return `${hours}h ago`;
  if (mins   > 0) return `${mins}m ago`;
  return 'just now';
}
