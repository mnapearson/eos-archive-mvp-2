'use client';

// Thin wrapper over AuthContext — external signature (returns { user,
// profile }) is unchanged from before this hook stopped calling Supabase
// itself, so every existing call site (NavBar.js, Menu.js) needed zero
// changes. See AuthContext.js for why this moved off an independent
// getSession()/profiles fetch.
import { useAuth } from '@/contexts/AuthContext';

export default function useUserProfile() {
  const { user, profile } = useAuth();
  return { user, profile };
}
