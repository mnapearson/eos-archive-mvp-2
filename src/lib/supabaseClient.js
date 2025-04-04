import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export function getById(collection, id) {
  return supabase.from(collection).select("*").eq("id", id).single();
}

export function getAll(collection) {
  return supabase.from(collection).select("*");
}
