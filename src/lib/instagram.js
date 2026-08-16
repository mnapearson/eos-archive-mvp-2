// Validates a URL as a real instagram.com/p/... or instagram.com/reel/...
// post link before it's saved as instagram_post_url — shared by both the
// event-creation and event-editing forms so the rule can't drift between
// them.
export function isValidInstagramPostUrl(value) {
  if (!value) return false;
  try {
    const url = new URL(value.trim());
    if (!/(^|\.)instagram\.com$/i.test(url.hostname)) return false;
    return /^\/(p|reel)\/[^/]+/i.test(url.pathname);
  } catch {
    return false;
  }
}
