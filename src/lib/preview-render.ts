import sharp from "sharp";
import { DEFAULT_PAGE_NAME, isPlaceholderPageName } from "./config";
import { fontStack } from "./composer";
import { escapeXml } from "./sanitize";
import { readUpload } from "./store";
import { patternById, patternChrome } from "./ui-source";
import { themeRuleWeight, type Asset, type Project, type SiteSection, type SiteSpec } from "./types";

const WIDTH = 390;
const PAD = 20;

function wrap(text: string, width: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > width) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 6);
}

function textBlock(x: number, y: number, lines: string[], size: number, fill: string, font: string, weight = 500) {
  return lines
    .map(
      (line, index) =>
        `<text x="${x}" y="${y + index * (size + 6)}" font-size="${size}" fill="${fill}" font-family="${font}" font-weight="${weight}">${escapeXml(line)}</text>`,
    )
    .join("");
}

function sectionBlock(
  section: SiteSection,
  x: number,
  y: number,
  width: number,
  spec: SiteSpec,
  font: string,
): { svg: string; height: number } {
  const title = wrap(section.title, 22);
  const body = wrap(section.body, 32);
  const weight = themeRuleWeight(spec.theme);
  const titleY = y + 20 + weight;
  const svg = [
    `<line x1="${x}" y1="${y + weight / 2}" x2="${x + width}" y2="${y + weight / 2}" stroke="${spec.theme.ink}" stroke-opacity="0.14" stroke-width="${weight}" />`,
    textBlock(x, titleY, title, 18, spec.theme.ink, font, 600),
    textBlock(x, titleY + title.length * 24, body, 13, spec.theme.muted, font, 400),
  ].join("");
  return { svg, height: 40 + weight + title.length * 24 + body.length * 18 };
}

function bagIcon(x: number, y: number, color: string) {
  return `<g transform="translate(${x} ${y})" fill="none" stroke="${color}" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round">
    <path d="M3.2 6.2h13.6l-1 11.2H4.2L3.2 6.2z"/>
    <path d="M7 6.2V4.8a3 3 0 0 1 6 0v1.4"/>
  </g>`;
}

function chromeFor(spec: SiteSpec) {
  const pattern = patternById(spec.patternId);
  const fromPattern = pattern ? patternChrome(pattern) : null;
  return {
    tabs: spec.navTabs?.length ? spec.navTabs : fromPattern?.tabs ?? ["Home", "About", "Contact"],
    showLogin: spec.showLogin ?? fromPattern?.showLogin ?? true,
    showCheckout: spec.showCheckout ?? fromPattern?.showCheckout ?? false,
  };
}

function mobileChrome(spec: SiteSpec, font: string): { svg: string; height: number } {
  const { tabs, showLogin, showCheckout } = chromeFor(spec);
  const parts: string[] = [];
  parts.push(`<rect x="0" y="0" width="${WIDTH}" height="96" fill="${spec.theme.bg}" />`);
  const rawName = isPlaceholderPageName(spec.name) ? DEFAULT_PAGE_NAME : spec.name;
  const wordmark = rawName.length > 22 ? `${rawName.slice(0, 20)}…` : rawName;
  parts.push(
    `<text x="${PAD}" y="32" font-size="13" font-weight="650" fill="${spec.theme.ink}" font-family="${font}">${escapeXml(wordmark)}</text>`,
  );

  let right = WIDTH - PAD;
  if (showCheckout) {
    parts.push(bagIcon(right - 18, 16, spec.theme.ink));
    right -= 28;
  }
  if (showLogin) {
    parts.push(
      `<text x="${right}" y="32" text-anchor="end" font-size="12" fill="${spec.theme.ink}" font-family="${font}">Log in</text>`,
    );
  }

  parts.push(
    `<line x1="${PAD}" y1="46" x2="${WIDTH - PAD}" y2="46" stroke="${spec.theme.ink}" stroke-opacity="0.12" />`,
  );

  const tabWidth = (WIDTH - PAD * 2) / Math.max(tabs.length, 1);
  tabs.forEach((tab, index) => {
    const x = PAD + index * tabWidth;
    const active = index === 0;
    parts.push(
      `<text x="${x}" y="72" font-size="11" font-weight="${active ? 600 : 400}" fill="${active ? spec.theme.ink : spec.theme.muted}" font-family="${font}">${escapeXml(tab)}</text>`,
    );
    if (active) {
      parts.push(
        `<rect x="${x}" y="80" width="${Math.min(36, tabWidth - 8)}" height="2" fill="${spec.theme.accent}" />`,
      );
    }
  });
  parts.push(
    `<line x1="0" y1="96" x2="${WIDTH}" y2="96" stroke="${spec.theme.ink}" stroke-opacity="0.1" />`,
  );
  return { svg: parts.join(""), height: 96 };
}

async function embedAsset(project: Project, assetId?: string): Promise<string | null> {
  if (!assetId) return null;
  const asset = project.assets.find((item: Asset) => item.id === assetId);
  if (!asset) return null;
  const bytes = await readUpload(project.id, asset.id);
  if (!bytes) return null;
  const png = await sharp(bytes).png().toBuffer();
  return `data:image/png;base64,${png.toString("base64")}`;
}

export async function renderProjectSvg(project: Project): Promise<string> {
  const spec = project.spec;
  const font = fontStack(spec);
  const photo = await embedAsset(project, spec.sections.find((s) => s.imageId)?.imageId || spec.backgroundAssetId);
  const firstPhoto = project.assets[0] ? await embedAsset(project, project.assets[0].id) : null;

  const parts: string[] = [];
  const chrome = mobileChrome(spec, font);
  parts.push(chrome.svg);
  let y = chrome.height;

  const header = spec.theme.headerStyle;
  if (header === "split") {
    parts.push(`<rect x="0" y="${y}" width="${WIDTH}" height="8" fill="${spec.theme.accent}" />`);
    y += 8;
    parts.push(`<rect x="0" y="${y}" width="${WIDTH}" height="220" fill="${spec.theme.bg}" />`);
    parts.push(textBlock(PAD, y + 48, wrap(spec.hero.headline, 16), 26, spec.theme.ink, font, 650));
    parts.push(textBlock(PAD, y + 130, wrap(spec.hero.subhead, 28), 13, spec.theme.muted, font, 400));
    parts.push(
      `<rect x="${PAD}" y="${y + 176}" width="140" height="32" fill="${spec.theme.ink}" /><text x="${PAD + 70}" y="${y + 197}" text-anchor="middle" fill="${spec.theme.bg}" font-size="12" font-family="${font}">${escapeXml(spec.hero.cta)}</text>`,
    );
    y += 236;
  } else if (header === "centered") {
    parts.push(`<rect x="0" y="${y}" width="${WIDTH}" height="240" fill="${spec.theme.bg}" />`);
    wrap(spec.hero.headline, 16).forEach((line, i) => {
      parts.push(
        `<text x="${WIDTH / 2}" y="${y + 56 + i * 32}" text-anchor="middle" font-size="26" font-weight="650" fill="${spec.theme.ink}" font-family="${font}">${escapeXml(line)}</text>`,
      );
    });
    wrap(spec.hero.subhead, 30).forEach((line, i) => {
      parts.push(
        `<text x="${WIDTH / 2}" y="${y + 140 + i * 18}" text-anchor="middle" font-size="13" fill="${spec.theme.muted}" font-family="${font}">${escapeXml(line)}</text>`,
      );
    });
    parts.push(
      `<rect x="${WIDTH / 2 - 70}" y="${y + 188}" width="140" height="32" fill="${spec.theme.accent}" /><text x="${WIDTH / 2}" y="${y + 209}" text-anchor="middle" fill="${spec.theme.bg}" font-size="12" font-family="${font}">${escapeXml(spec.hero.cta)}</text>`,
    );
    y += 248;
  } else if (header === "minimal") {
    parts.push(`<rect x="0" y="${y}" width="${WIDTH}" height="180" fill="${spec.theme.bg}" />`);
    parts.push(textBlock(PAD, y + 40, wrap(spec.hero.headline, 18), 24, spec.theme.ink, font, 500));
    parts.push(textBlock(PAD, y + 110, wrap(spec.hero.subhead, 30), 13, spec.theme.muted, font, 400));
    y += 196;
  } else {
    const weight = themeRuleWeight(spec.theme);
    parts.push(`<rect x="0" y="${y}" width="${WIDTH}" height="220" fill="${spec.theme.bg}" />`);
    parts.push(
      `<line x1="${PAD}" y1="${y + 28}" x2="${WIDTH - PAD}" y2="${y + 28}" stroke="${spec.theme.ink}" stroke-opacity="0.14" stroke-width="${weight}" />`,
    );
    parts.push(textBlock(PAD, y + 58, wrap(spec.hero.headline, 16), 26, spec.theme.ink, font, 650));
    parts.push(textBlock(PAD, y + 150, wrap(spec.hero.subhead, 30), 13, spec.theme.muted, font, 400));
    y += 228;
  }

  const imageHref = photo && photo.startsWith("data:image") ? photo : firstPhoto && firstPhoto.length > 40 ? firstPhoto : null;
  if (imageHref) {
    parts.push(
      `<image href="${imageHref}" x="${PAD}" y="${y}" width="${WIDTH - PAD * 2}" height="180" preserveAspectRatio="xMidYMid slice" />`,
    );
    y += 196;
  }

  for (const section of spec.sections) {
    const block = sectionBlock(section, PAD, y, WIDTH - PAD * 2, spec, font);
    parts.push(block.svg);
    y += block.height + 20;
  }

  parts.push(
    `<text x="${WIDTH / 2}" y="${y + 20}" text-anchor="middle" fill="${spec.theme.muted}" font-size="11" font-family="${font}">${escapeXml(spec.footer)}</text>`,
  );
  y += 56;

  const height = Math.max(760, y + 24);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}">
  <rect width="${WIDTH}" height="${height}" fill="${spec.theme.bg}" />
  ${parts.join("\n")}
  <text x="${WIDTH - 12}" y="${height - 14}" text-anchor="end" fill="${spec.theme.muted}" font-size="9" font-family="${font}" opacity="0.7">PageBuilder preview · not source</text>
</svg>`;
}

export async function renderProjectPng(project: Project): Promise<Buffer> {
  const svg = await renderProjectSvg(project);
  return sharp(Buffer.from(svg)).png({ compressionLevel: 8 }).toBuffer();
}
