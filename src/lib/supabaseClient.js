// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Use a global variable to enforce a single instance
const globalRef = typeof globalThis !== 'undefined' ? globalThis : window;
if (!globalRef._supabase) {
  globalRef._supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = globalRef._supabase;
