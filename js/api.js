/**
 * api.js — GitHub API service module
 */

const BASE_URL = 'https://api.github.com';

/**
 * Fetch with error handling
 * @param {string} url
 * @returns {Promise<any>}
 */
async function fetchJSON(url) {
  const response = await fetch(url, {
    headers: { Accept: 'application/vnd.github.v3+json' },
  });

  if (response.status === 404) {
    throw new Error('User not found. Please check the username and try again.');
  }
  if (response.status === 403) {
    const resetTime = response.headers.get('X-RateLimit-Reset');
    const resetDate = resetTime
      ? `Resets at ${new Date(parseInt(resetTime, 10) * 1000).toLocaleTimeString()}`
      : '';
    throw new Error(`GitHub API rate limit exceeded. ${resetDate}`);
  }
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Fetch a GitHub user profile
 * @param {string} username
 * @returns {Promise<Object>}
 */
export async function fetchUserProfile(username) {
  return fetchJSON(`${BASE_URL}/users/${encodeURIComponent(username)}`);
}

/**
 * Fetch all repositories for a user (handles pagination)
 * @param {string} username
 * @param {number} maxPages - Max pages to fetch (100 repos per page)
 * @returns {Promise<Array>}
 */
export async function fetchUserRepos(username, maxPages = 5) {
  const allRepos = [];
  let page = 1;

  while (page <= maxPages) {
    const repos = await fetchJSON(
      `${BASE_URL}/users/${encodeURIComponent(username)}/repos?per_page=100&page=${page}&sort=updated`
    );

    if (!repos || repos.length === 0) break;

    allRepos.push(...repos);

    if (repos.length < 100) break; // last page
    page++;
  }

  return allRepos;
}
