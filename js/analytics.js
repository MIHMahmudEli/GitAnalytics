/**
 * analytics.js — Data processing and analytics computation
 */

/**
 * Language color map (GitHub-style colors)
 */
export const LANG_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python:     '#3572A5',
  Java:       '#b07219',
  'C++':      '#f34b7d',
  C:          '#555555',
  'C#':       '#178600',
  Ruby:       '#701516',
  Go:         '#00ADD8',
  Rust:       '#dea584',
  PHP:        '#4F5D95',
  Swift:      '#F05138',
  Kotlin:     '#A97BFF',
  HTML:       '#e34c26',
  CSS:        '#563d7c',
  SCSS:       '#c6538c',
  Shell:      '#89e051',
  Dart:       '#00B4AB',
  Vue:        '#41b883',
  Svelte:     '#ff3e00',
  Lua:        '#000080',
  R:          '#198CE7',
  MATLAB:     '#e16737',
  Scala:      '#c22d40',
  Elixir:     '#6e4a7e',
  Haskell:    '#5e5086',
  Clojure:    '#db5855',
  Perl:       '#0298c3',
  Assembly:   '#6E4C13',
  Dockerfile: '#384d54',
};

/**
 * Get a color for a language (fallback to generated color)
 * @param {string} lang
 * @returns {string} hex color
 */
export function getLangColor(lang) {
  if (!lang) return '#64748b';
  return LANG_COLORS[lang] || stringToColor(lang);
}

/**
 * Generate a consistent color from a string
 */
function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 60%, 55%)`;
}

/**
 * Compute all analytics from repos array
 * @param {Array} repos
 * @returns {Object} analytics
 */
export function computeAnalytics(repos) {
  const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
  const totalForks = repos.reduce((sum, r) => sum + (r.forks_count || 0), 0);
  const totalWatchers = repos.reduce((sum, r) => sum + (r.watchers_count || 0), 0);

  // Language distribution (by repo count)
  const langMap = {};
  repos.forEach((r) => {
    if (r.language) {
      langMap[r.language] = (langMap[r.language] || 0) + 1;
    }
  });

  const totalLangRepos = Object.values(langMap).reduce((s, v) => s + v, 0);
  const languages = Object.entries(langMap)
    .sort(([, a], [, b]) => b - a)
    .map(([name, count]) => ({
      name,
      count,
      percentage: totalLangRepos > 0 ? ((count / totalLangRepos) * 100).toFixed(1) : '0',
      color: getLangColor(name),
    }));

  // Most starred repo
  const topRepo = repos.reduce(
    (best, r) => (r.stargazers_count > (best?.stargazers_count || -1) ? r : best),
    null
  );

  // Most forked repo
  const topForked = repos.reduce(
    (best, r) => (r.forks_count > (best?.forks_count || -1) ? r : best),
    null
  );

  // Repos with descriptions
  const withDescription = repos.filter((r) => r.description && r.description.trim()).length;

  // Forked vs original
  const forkedCount = repos.filter((r) => r.fork).length;
  const originalCount = repos.length - forkedCount;

  return {
    totalStars,
    totalForks,
    totalWatchers,
    languages,
    topLanguage: languages[0]?.name ?? '—',
    topRepo: topRepo?.name ?? '—',
    topRepoStars: topRepo?.stargazers_count ?? 0,
    topRepoUrl: topRepo?.html_url ?? '#',
    topForked: topForked?.name ?? '—',
    totalRepos: repos.length,
    withDescription,
    forkedCount,
    originalCount,
  };
}

/**
 * Format a number with K/M suffix
 * @param {number} num
 * @returns {string}
 */
export function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  return num.toString();
}

/**
 * Build the structured export data
 * @param {Object} profile - raw GitHub user object
 * @param {Array}  repos   - raw repos array
 * @param {Object} analytics
 * @returns {Object} exportable JSON
 */
export function buildExportData(profile, repos, analytics) {
  return {
    generatedAt: new Date().toISOString(),
    profile: {
      id: profile.id,
      login: profile.login,
      name: profile.name,
      bio: profile.bio,
      avatar_url: profile.avatar_url,
      html_url: profile.html_url,
      location: profile.location,
      company: profile.company,
      blog: profile.blog,
      email: profile.email,
      twitter_username: profile.twitter_username,
      public_repos: profile.public_repos,
      public_gists: profile.public_gists,
      followers: profile.followers,
      following: profile.following,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    },
    analytics: {
      totalStars: analytics.totalStars,
      totalForks: analytics.totalForks,
      totalWatchers: analytics.totalWatchers,
      topRepository: analytics.topRepo,
      topRepositoryStars: analytics.topRepoStars,
      topLanguage: analytics.topLanguage,
      totalOriginalRepos: analytics.originalCount,
      totalForkedRepos: analytics.forkedCount,
      languageDistribution: analytics.languages,
    },
    repositories: repos.map((r) => ({
      id: r.id,
      name: r.name,
      full_name: r.full_name,
      description: r.description,
      html_url: r.html_url,
      language: r.language,
      stargazers_count: r.stargazers_count,
      forks_count: r.forks_count,
      watchers_count: r.watchers_count,
      open_issues_count: r.open_issues_count,
      fork: r.fork,
      archived: r.archived,
      disabled: r.disabled,
      topics: r.topics,
      created_at: r.created_at,
      updated_at: r.updated_at,
      pushed_at: r.pushed_at,
      license: r.license?.name ?? null,
      default_branch: r.default_branch,
    })),
  };
}
