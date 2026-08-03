// src/app/spaces/[id]/page.js

import SpacePageClient from './SpacePageClient';
import { supabase } from '@/lib/supabaseClient';
import { buildSpaceMetadata } from '@/lib/metadata';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const { data: space, error } = await supabase
    .from('spaces')
    .select(
      'id, name, city_name, city, type, category, description, hero_image_url, image_url'
    )
    .eq('id', id)
    .single();

  if (error || !space) {
    return {};
  }

  return buildSpaceMetadata(space);
}

// This page simply delegates to the client component
export default async function Page({ params }) {
  const { id } = await params;
  return <SpacePageClient spaceId={id} />;
}
