import { DEFAULT_PAGE_NAME, isPlaceholderPageName } from "./config";
import { analyticsSnippet } from "./analytics";
import { fontStack } from "./composer";
import { monetizeSnippet } from "./monetize";
import { stripMarkup } from "./sanitize";
import { siteLoginPath } from "./site-url";
import { readUpload } from "./store";
import { patternById, patternChrome } from "./ui-source";
import { themeRuleWeight, type Project, type SiteSpec } from "./types";

function css(spec: SiteSpec) {
  const rule = themeRuleWeight(spec.theme);
  return `
:root {
  --bg: ${spec.theme.bg};
  --ink: ${spec.theme.ink};
  --accent: ${spec.theme.accent};
  --muted: ${spec.theme.muted};
}
* { box-sizing: border-box; }
html, body { margin: 0; background: var(--bg); color: var(--ink); font-family: ${fontStack(spec)}; }
img { max-width: 100%; display: block; }
.topbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 18px 10px; }
.topbar .wordmark { letter-spacing: 0.08em; text-transform: uppercase; font-size: 12px; color: var(--ink); font-weight: 650; }
.top-actions { display: flex; align-items: center; gap: 14px; font-size: 13px; }
.top-actions a { color: var(--ink); text-decoration: none; }
.tabs { display: flex; gap: 16px; padding: 0 18px 12px; border-bottom: 1px solid color-mix(in srgb, var(--ink) 12%, transparent); overflow-x: auto; }
.tabs a { color: var(--muted); text-decoration: none; font-size: 12px; white-space: nowrap; }
.tabs a.active { color: var(--ink); font-weight: 600; box-shadow: inset 0 -2px 0 var(--accent); padding-bottom: 10px; }
.page { max-width: 920px; margin: 0 auto; padding: 28px 18px 72px; }
.wordmark { letter-spacing: 0.14em; text-transform: uppercase; font-size: 12px; color: var(--muted); }
h1 { font-size: clamp(32px, 8vw, 68px); line-height: 1.05; font-weight: 650; margin: 18px 0 16px; }
.sub { color: var(--muted); font-size: 16px; max-width: 36rem; }
.cta { display: inline-block; margin-top: 22px; background: var(--accent); color: var(--bg); text-decoration: none; padding: 12px 22px; }
.split { display: grid; grid-template-columns: 1.1fr 0.9fr; min-height: 48vh; }
.split .pane { padding: 40px 24px; }
.split .field { background: var(--accent); }
.center { text-align: center; padding: 40px 18px 48px; }
.center .sub { margin: 0 auto; }
.rule { width: 100%; height: ${rule}px; background: color-mix(in srgb, var(--ink) 14%, transparent); border: 0; margin: 0 0 24px; }
section { padding: 40px 0 8px; border-top: ${rule}px solid color-mix(in srgb, var(--ink) 14%, transparent); }
section h2 { font-size: 24px; margin: 0 0 12px; }
section p { color: var(--muted); font-size: 16px; line-height: 1.6; max-width: 40rem; }
footer { margin-top: 56px; color: var(--muted); font-size: 13px; }
.hero-photo { width: 100%; height: 220px; object-fit: cover; margin: 24px 0 8px; }
.login-card { max-width: 420px; margin: 48px auto 0; padding: 28px 24px; border: 1px solid color-mix(in srgb, var(--ink) 12%, transparent); }
.login-card h1 { font-size: 32px; margin: 8px 0 12px; }
.login-card label { display: block; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); margin: 16px 0 6px; }
.login-card input { width: 100%; padding: 10px 12px; border: 1px solid color-mix(in srgb, var(--ink) 18%, transparent); background: var(--bg); color: var(--ink); font: inherit; }
.login-card button { margin-top: 22px; width: 100%; background: var(--accent); color: var(--bg); border: 0; padding: 12px 22px; font: inherit; cursor: pointer; }
.login-note { margin-top: 16px; color: var(--muted); font-size: 13px; line-height: 1.5; }
@media (max-width: 800px) { .split { grid-template-columns: 1fr; } .split .field { min-height: 120px; } }
`;
}

function pageNameOf(spec: SiteSpec) {
  return isPlaceholderPageName(spec.name) ? DEFAULT_PAGE_NAME : spec.name;
}

function trackingSite(project: Project) {
  return project.publishedSlug || `draft-${project.id.slice(-8)}`;
}

function trackingMarkup(project: Project, enabled: boolean) {
  if (!enabled) return "";
  const site = trackingSite(project);
  return `${analyticsSnippet(site)}\n${monetizeSnippet(site)}`;
}

export function loginHref(project: Project): string {
  if (project.loginFeature === "hosted") {
    return project.publishedSlug ? siteLoginPath(project.publishedSlug) : "#login";
  }
  if (project.loginFeature === "code") return "login.html";
  return "";
}

function wrapPage(spec: SiteSpec, title: string, body: string, extras = "") {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${stripMarkup(title)}</title>
  <style>${css(spec)}</style>
</head>
<body>
  ${body}
  ${extras}
</body>
</html>`;
}

function chromeFor(spec: SiteSpec) {
  const pattern = patternById(spec.patternId);
  return pattern
    ? patternChrome(pattern)
    : {
        tabs: spec.navTabs ?? ["Home", "About", "Contact"],
        showLogin: spec.showLogin ?? true,
        showCheckout: spec.showCheckout ?? false,
      };
}

function pageNav(project: Project) {
  const spec = project.spec;
  const chrome = chromeFor(spec);
  const tabs = spec.navTabs?.length ? spec.navTabs : chrome.tabs;
  const login = loginHref(project);
  const showLogin = (spec.showLogin ?? chrome.showLogin) && !!login;
  const showCheckout = spec.showCheckout ?? chrome.showCheckout;
  const pageName = pageNameOf(spec);
  const home = project.publishedSlug ? `/${project.publishedSlug}` : "./index.html";

  return `
    <div class="topbar">
      <a class="wordmark" href="${home}" style="text-decoration:none">${stripMarkup(pageName)}</a>
      <div class="top-actions">
        ${showLogin ? `<a href="${login}">Log in</a>` : ""}
        ${showCheckout ? `<a href="#cart" aria-label="Checkout">Bag</a>` : ""}
      </div>
    </div>
    <nav class="tabs">
      ${tabs.map((tab, index) => `<a href="#${stripMarkup(tab).toLowerCase()}" class="${index === 0 ? "active" : ""}">${stripMarkup(tab)}</a>`).join("")}
    </nav>`;
}

export async function exportHtml(project: Project, options?: { tracking?: boolean }): Promise<string> {
  const spec = project.spec;
  const photos: string[] = [];
  for (const asset of project.assets) {
    const bytes = await readUpload(project.id, asset.id);
    if (bytes) photos.push(`data:image/webp;base64,${bytes.toString("base64")}`);
  }

  const heroPhoto = photos[0]
    ? `<img class="hero-photo" src="${photos[0]}" alt="" />`
    : "";

  const sections = spec.sections
    .map(
      (section) => `
      <section>
        <h2>${stripMarkup(section.title)}</h2>
        <p>${stripMarkup(section.body)}</p>
      </section>`,
    )
    .join("\n");

  const pageName = pageNameOf(spec);

  const header =
    spec.theme.headerStyle === "split"
      ? `<div class="split">
          <div class="pane">
            <div class="wordmark">${stripMarkup(pageName)}</div>
            <h1>${stripMarkup(spec.hero.headline)}</h1>
            <p class="sub">${stripMarkup(spec.hero.subhead)}</p>
            <a class="cta" href="#visit">${stripMarkup(spec.hero.cta)}</a>
          </div>
          <div class="field"></div>
        </div>`
      : spec.theme.headerStyle === "centered"
        ? `<header class="center">
            <div class="wordmark">${stripMarkup(pageName)}</div>
            <h1>${stripMarkup(spec.hero.headline)}</h1>
            <p class="sub">${stripMarkup(spec.hero.subhead)}</p>
            <a class="cta" href="#visit">${stripMarkup(spec.hero.cta)}</a>
          </header>`
        : spec.theme.headerStyle === "minimal"
          ? `<header class="page">
              <div class="wordmark">${stripMarkup(pageName)}</div>
              <h1>${stripMarkup(spec.hero.headline)}</h1>
              <p class="sub">${stripMarkup(spec.hero.subhead)}</p>
            </header>`
          : `<header class="page">
              <hr class="rule" />
              <div class="wordmark">${stripMarkup(pageName)}</div>
              <h1>${stripMarkup(spec.hero.headline)}</h1>
              <p class="sub">${stripMarkup(spec.hero.subhead)}</p>
            </header>`;

  const body = `
  ${pageNav(project)}
  ${header}
  <main class="page">
    ${heroPhoto}
    ${sections}
    <footer>${stripMarkup(spec.footer)}</footer>
  </main>`;

  return wrapPage(spec, pageName, body, trackingMarkup(project, options?.tracking === true));
}

export function exportLoginHtml(project: Project, options?: { tracking?: boolean }): string {
  const spec = project.spec;
  const pageName = pageNameOf(spec);
  const hosted = project.loginFeature === "hosted";
  const slug = project.publishedSlug || "";
  const home = slug ? `/${slug}` : "./index.html";
  const note = hosted
    ? "PageBuilder hosts this login for every member who chooses managed login. Visitor accounts will connect here in a later release."
    : "Host this file next to your page. Wire the form to your own auth when you publish it.";

  const body = `
    <div class="topbar">
      <a class="wordmark" href="${home}" style="text-decoration:none">${stripMarkup(pageName)}</a>
    </div>
    <main class="page">
      <div class="login-card">
        <p class="wordmark">${stripMarkup(pageName)}</p>
        <h1>Sign in</h1>
        <p class="sub">Members of this page sign in here.</p>
        <form method="post" action="${hosted ? "/api/sites/auth" : "#"}">
          ${hosted ? `<input type="hidden" name="site" value="${stripMarkup(slug)}" />` : ""}
          <label for="email">Email</label>
          <input id="email" name="email" type="email" autocomplete="username" required />
          <label for="password">Password</label>
          <input id="password" name="password" type="password" autocomplete="current-password" required />
          <button type="submit">Continue</button>
        </form>
        <p class="login-note">${note}</p>
      </div>
    </main>`;

  return wrapPage(spec, `${pageName} · Sign in`, body, trackingMarkup(project, options?.tracking === true));
}
