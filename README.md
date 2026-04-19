# GitAnalytics 🔭

> **GitHub Profile Intelligence** — Analyze any GitHub user's repositories, stats, and language trends with a beautiful glassmorphism dashboard.

![Dark Theme](https://img.shields.io/badge/theme-dark-0d1117?style=flat-square)
![Vanilla JS](https://img.shields.io/badge/built%20with-Vanilla%20JS-f1e05a?style=flat-square)
![GitHub API](https://img.shields.io/badge/powered%20by-GitHub%20API-6e56cf?style=flat-square)

---

## ✨ Features

| Feature | Details |
|---|---|
| 👤 **Profile Card** | Avatar, bio, location, company, blog, join date |
| 📊 **Analytics Cards** | Total stars, forks, top repo, top language |
| 📈 **Language Chart** | Animated bar chart of top 10 languages |
| 📁 **Repository Grid** | Cards with stars, forks, language, time ago |
| 🔍 **Search & Filter** | Real-time search + language filter dropdown |
| 🔃 **Sort** | Sort by stars, forks, name, or last updated |
| 📄 **Pagination** | 9 repos per page with smart page numbering |
| 📥 **JSON Export** | Download structured JSON or copy to clipboard |
| 🔗 **Deep Links** | URL updates with `?user=` for shareable links |
| ✅ **Error Handling** | Rate limit, 404, network error messages |

---

## 🚀 Getting Started

### Run locally (no build step needed)

```bash
# Option 1: serve (recommended)
npx serve . --listen 5500

# Option 2: VS Code Live Server — open index.html
```

Then open **http://localhost:5500** in your browser.

---

## 📁 Project Structure

```
GitAnalytics/
├── index.html          # App shell & markup
├── css/
│   └── style.css       # Complete stylesheet (dark theme + glassmorphism)
├── js/
│   ├── app.js          # Main controller (state, events, orchestration)
│   ├── api.js          # GitHub REST API service (fetch + error handling)
│   ├── analytics.js    # Data processing, language colors, export builder
│   └── ui.js           # All DOM rendering functions
└── README.md
```

---

## 🛠️ Tech Stack

- **HTML5** — semantic markup, ARIA roles
- **Vanilla CSS** — custom properties, glassmorphism, animations
- **Vanilla JS (ES Modules)** — `async/await`, `fetch`, modular architecture
- **GitHub REST API v3** — `/users/{username}` + `/users/{username}/repos`

---

## 📤 Export Format

```json
{
  "generatedAt": "2026-04-19T...",
  "profile": { "login": "...", "name": "...", "followers": 0, ... },
  "analytics": {
    "totalStars": 0,
    "totalForks": 0,
    "topRepository": "...",
    "languageDistribution": [{ "name": "JavaScript", "percentage": "45.2" }]
  },
  "repositories": [{ "name": "...", "stargazers_count": 0, ... }]
}
```

---

## ⚠️ API Rate Limits

The GitHub API allows **60 unauthenticated requests/hour** per IP. For users with many repos, multiple paginated calls are made. If you hit the limit, the app will display a friendly error with the reset time.

---

## 📸 Screenshots

| Hero | Dashboard |
|---|---|
| Search for any GitHub user | Profile, stats, charts & repos |
