export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: 'https://eosarchive.app/sitemap.xml',
    host: 'https://eosarchive.app',
  };
}
