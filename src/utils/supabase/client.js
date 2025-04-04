import { createClient } from "@supabase/supabase-js";
export function createClient() {
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function getById(supabase, collection, id) {
  return supabase.from(collection).select("*").eq("id", id).single();
}

export function getAll(supabase, collection) {
  return supabase.from(collection).select("*");
}
