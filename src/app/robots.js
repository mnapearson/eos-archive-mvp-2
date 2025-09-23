export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin'] }],
    sitemap: 'https://eosarchive.app/sitemap.xml',
    host: 'https://eosarchive.app',
  };
}
