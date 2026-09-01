#!/usr/bin/env node
// Generates web's design tokens directly from the mobile app's
// constants/theme.ts — mobile is the reference design (per explicit
// direction: "the mobile app looks great... don't change it... align
// [web] completely"). Rather than hand-maintaining two files that only
// match because someone checked them by hand, this makes drift
// structurally impossible: change theme.ts, run this, web's tokens
// update to match.
//
// Reads a sibling repo (../eos-archive-app) — only possible where both
// repos are checked out side by side, which won't be true in CI or on a
// fresh clone of just this repo. In that case this exits quietly and
// leaves the last-generated files as they are (both are committed), so
// a build never breaks for lack of the sibling repo.
//
// Run manually with `npm run sync-tokens`, or automatically before
// `dev`/`build` via the predev/prebuild npm scripts.

const fs = require('fs');
const path = require('path');

const THEME_PATH = path.resolve(__dirname, '../../eos-archive-app/constants/theme.ts');
const CSS_OUT_PATH = path.resolve(__dirname, '../src/app/tokens.generated.css');
const MARKER_COLORS_OUT_PATH = path.resolve(__dirname, '../src/lib/markerColors.js');

// Pulls out just `export const NAME = { ... }` object literals by name,
// via balanced-brace matching, and ignores everything else in the file
// (functions, other exports, whatever TS syntax they use) — simpler and
// more robust than trying to strip an entire file down to valid JS.
function extractObjectLiteral(source, constName) {
  const marker = `const ${constName}`;
  const markerIndex = source.indexOf(marker);
  if (markerIndex === -1) {
    throw new Error(`Could not find "${marker}" in theme.ts`);
  }
  const braceStart = source.indexOf('{', markerIndex);
  if (braceStart === -1) {
    throw new Error(`Could not find opening brace for ${constName}`);
  }
  let depth = 0;
  let i = braceStart;
  for (; i < source.length; i++) {
    if (source[i] === '{') depth++;
    else if (source[i] === '}') {
      depth--;
      if (depth === 0) break;
    }
  }
  const literal = source.slice(braceStart, i + 1);
  // eslint-disable-next-line no-new-func
  return new Function(`return ${literal};`)();
}

function loadThemeObjects(source) {
  return {
    colors: extractObjectLiteral(source, 'colors'),
    categoryColors: extractObjectLiteral(source, 'categoryColors'),
    fonts: extractObjectLiteral(source, 'fonts'),
  };
}

// Web's CSS variables predate this script and are referenced by these
// names in hundreds of places across the codebase (var(--foreground),
// etc.) — renaming all of those to match theme.ts's own key names
// (colors.text, colors.textSecondary, ...) would be a purely cosmetic,
// high-risk rename for zero visual change. Mapping keeps every existing
// var(--foreground) reference working while the value itself is now
// generated from mobile, not hand-copied.
const COLOR_KEY_TO_CSS_VAR = {
  background: 'background',
  text: 'foreground',
  textSecondary: 'foreground-secondary',
  card: 'card',
  cardBorder: 'card-border',
  input: 'input',
  inputBorder: 'input-border',
  chrome: 'chrome',
  silver: 'silver',
  chromeGlow: 'chrome-glow',
  silverGlow: 'silver-glow',
  danger: 'danger',
  success: 'success',
  // placeholder (mobile-only, used for RN's placeholderTextColor prop,
  // not a themeable surface) has no web CSS equivalent — intentionally
  // not mapped.
};

function generateCss({ colors }) {
  const lines = Object.entries(colors)
    .filter(([key]) => COLOR_KEY_TO_CSS_VAR[key])
    .map(([key, value]) => `  --${COLOR_KEY_TO_CSS_VAR[key]}: ${value};`);
  return `/* GENERATED FILE — do not edit by hand.
 * Source: eos-archive-app/constants/theme.ts (the reference design).
 * Regenerate with \`npm run sync-tokens\` after changing theme.ts.
 */
:root {
${lines.join('\n')}
}
`;
}

function generateMarkerColors({ categoryColors }) {
  const entries = Object.entries(categoryColors).map(
    ([key, value]) => `  '${key.toLowerCase()}': '${value}',`
  );
  return `// GENERATED FILE — do not edit by hand.
// Source: eos-archive-app/constants/theme.ts's categoryColors (the
// reference design). Regenerate with \`npm run sync-tokens\` after
// changing theme.ts. Keys are lowercased from theme.ts's Title Case to
// match this file's existing lookup convention (normalizeType() already
// lowercases whatever category string it's given).
const markerColors = {
${entries.join('\n')}
};

export const CATEGORY_ABBREV = {
  'art space': 'ART',
  bar: 'BAR',
  cafe: 'CAFE',
  club: 'CLUB',
  museum: 'MUS',
  studio: 'STU',
  theatre: 'THE',
  venue: 'VEN',
  other: 'OTH',
};

export function getMarkerTextColor(hex) {
  if (!hex || hex.length < 7) return '#fff';
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#1b1b1b' : '#fff';
}

export default markerColors;
`;
}

function main() {
  if (!fs.existsSync(THEME_PATH)) {
    console.warn(
      `[sync-tokens] ${THEME_PATH} not found (sibling repo eos-archive-app not checked out here) — leaving existing generated files as-is.`
    );
    return;
  }

  const source = fs.readFileSync(THEME_PATH, 'utf8');
  const { colors, categoryColors } = loadThemeObjects(source);

  fs.writeFileSync(CSS_OUT_PATH, generateCss({ colors }));
  fs.writeFileSync(MARKER_COLORS_OUT_PATH, generateMarkerColors({ categoryColors }));

  console.log(`[sync-tokens] wrote ${path.relative(process.cwd(), CSS_OUT_PATH)}`);
  console.log(`[sync-tokens] wrote ${path.relative(process.cwd(), MARKER_COLORS_OUT_PATH)}`);
}

main();
