import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

export default async function sitemap() {
  const base = 'https://eosarchive.app';
  const now = new Date().toISOString();

  const staticRoutes = [
    '',
    '/map',
    '/spaces',
    '/conversations',
    '/leico',
    '/about',
  ].map((p) => ({
    url: `${base}${p}`,
    lastModified: now,
    changeFrequency: p === '' ? 'weekly' : 'monthly',
    priority: p === '' ? 1 : 0.7,
  }));

  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });
  const { data } = await supabase
    .from('conversations')
    .select('slug, updated_at')
    .eq('status', 'published');

  const convRoutes = (data || []).map((c) => ({
    url: `${base}/conversations/${c.slug}`,
    lastModified: c.updated_at || now,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticRoutes, ...convRoutes];
}
