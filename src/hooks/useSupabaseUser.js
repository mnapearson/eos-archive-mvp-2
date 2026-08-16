'use client';

// Thin wrapper over AuthContext — external signature (returns `user`
// directly) is unchanged from before this hook stopped calling Supabase
// itself, so every existing call site (Footer.js et al.) needed zero
// changes. See AuthContext.js for why this moved off an independent
// getSession() call.
import { useAuth } from '@/contexts/AuthContext';

export default function useSupabaseUser() {
  const { user } = useAuth();
  return user;
}
