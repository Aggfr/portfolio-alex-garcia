# Alex Garcia — Portfolio

Personal portfolio site for **Alex Garcia**, Product Design Engineer. The site showcases design approach, selected case studies, and background, built as a lightweight, framework-free web experience.

**Live site:** _add your deployed URL here (e.g. GitHub Pages, Vercel, Netlify)_

## Overview

This is a single-page portfolio with dedicated case-study pages for featured projects. It's built with plain HTML, CSS, and JavaScript — no build step, no framework, no dependencies to install. The goal is a fast, portable site that's easy to read, easy to edit, and easy to deploy anywhere that serves static files.

## Tech Stack

- **HTML5** — semantic markup, one file per page
- **CSS3** — custom styles in a single stylesheet (`css/style.css`), no CSS framework
- **Vanilla JavaScript** — no libraries, no bundler (`js/script.js`)
- **Google Fonts** — Roboto, Roboto Condensed, Playfair Display

## Project Structure

```
portfolio-alex-garcia/
├── index.html                       # Home page — Approach, Lab (projects), About, Footer
├── proyecto-ai-assisted-builds.html # Case study: AI-assisted builds
├── proyecto-the-knot-worldwide.html # Case study: The Knot Worldwide
├── css/
│   └── style.css                    # Global stylesheet
├── js/
│   └── script.js                    # Particle background + interactions
├── img/                              # Images used across all pages
└── video/                            # Background and header video assets
```

## Current Lab Projects

| Project | Status |
| --- | --- |
| AI-assisted builds | Live case-study page (`proyecto-ai-assisted-builds.html`) |
| The Knot Worldwide | Live case-study page (`proyecto-the-knot-worldwide.html`) |
| Hellotickets | Listed in the Lab grid, detail page not built yet |

## Getting Started

This project has no dependencies and no build step — any static file server works.

### Option 1: VS Code + Live Server (recommended for local development)

1. Clone the repo and open the folder in VS Code:
   ```bash
   git clone https://github.com/Aggfr/portfolio-alex-garcia.git
   cd portfolio-alex-garcia
   code .
   ```
2. Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension if you don't have it yet.
3. Right-click `index.html` → **Open with Live Server**. The site reloads automatically on save.

### Option 2: Open directly in the browser

Since there's no build step, you can also just open `index.html` directly in a browser. Note that some browsers restrict local video/asset loading under the `file://` protocol, so Live Server (or any local HTTP server) is the more reliable option.

## Adding a New Case Study

Each case study is a standalone HTML page (see `proyecto-ai-assisted-builds.html` or `proyecto-the-knot-worldwide.html` as a template) that reuses the shared `css/style.css`. To add a new one:

1. Duplicate an existing `proyecto-*.html` file and update its content.
2. Add a new card to the **Lab** section in `index.html`, linking to the new page.
3. Drop any new images into `img/`.
4. Reuse the shared `.project-footer` markup (wrapped in `.project-page` when it's not already inside a page using that container, as on the home page) so every page ends with the same footer.
5. Update this README — Project Structure and Current Lab Projects — to reflect the change.

## Deployment

Being fully static, this project deploys to any static hosting provider without configuration — GitHub Pages, Netlify, Vercel, or Cloudflare Pages all work out of the box by pointing to the repository root.

## Author

**Alex Garcia** — Product Design Engineer
