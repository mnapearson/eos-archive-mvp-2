// src/app/events/[id]/page.js

import EventPageClient from './EventPageClient';
import { supabase } from '@/lib/supabaseClient';
import { buildEventMetadata } from '@/lib/metadata';

export async function generateMetadata({ params }) {
  // Fetch event + space name for metadata
  const { data: event, error } = await supabase
    .from('events')
    .select('*, space:spaces(id, name)')
    .eq('id', params.id)
    .single();

  if (error || !event) {
    return {};
  }

  // Delegate to your reusable metadata builder
  return buildEventMetadata(event);
}

// This page simply delegates to the client component
export default function Page({ params }) {
  return <EventPageClient eventId={params.id} />;
}
