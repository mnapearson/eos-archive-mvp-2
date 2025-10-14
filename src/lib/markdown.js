import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

const ADDITIONAL_TAGS = ['img', 'figure', 'figcaption', 'h1', 'h2', 'h3', 'pre', 'code'];
const ALLOWED_TAGS = sanitizeHtml.defaults.allowedTags.concat(ADDITIONAL_TAGS);

const ALLOWED_ATTRIBUTES = {
  ...sanitizeHtml.defaults.allowedAttributes,
  a: ['href', 'name', 'target', 'rel'],
  img: ['src', 'alt', 'title', 'width', 'height'],
  '*': ['class', 'id'],
};

const TRANSFORM_TAGS = {
  a: sanitizeHtml.simpleTransform('a', {
    rel: 'nofollow noopener noreferrer',
    target: '_blank',
  }),
};

export function normalizeMdParagraphs(md = '') {
  if (!md) return '';
  let text = md.replace(/\r\n/g, '\n');
  const parts = text.split(/```/);
  for (let i = 0; i < parts.length; i += 2) {
    parts[i] = parts[i].replace(
      /([^\n])\n(?=(?!\n)(?!\s*[-*+]\s)(?!\s*\d+\.\s)(?!\s*>)(?!\s*#{1,6}\s)(?!\s*\|))/g,
      '$1\n\n'
    );
  }
  return parts.join('```');
}

export function markdownToSafeHtml(md = '') {
  const normalized = normalizeMdParagraphs(md);
  const raw = marked.parse(normalized, { gfm: true, breaks: false });
  return sanitizeHtml(raw, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    transformTags: TRANSFORM_TAGS,
  });
}

export function htmlToSafeHtml(html = '') {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    transformTags: TRANSFORM_TAGS,
  });
}

export function stringLooksLikeHtml(value = '') {
  return /<\s*([a-zA-Z]+)(\s|>)/.test(value);
}
