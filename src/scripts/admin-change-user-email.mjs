// src/scripts/admin-change-user-email.mjs
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve repo root and load .env.local first, then .env (if present)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../../');
dotenv.config({ path: path.join(repoRoot, '.env.local') });
dotenv.config({ path: path.join(repoRoot, '.env') }); // secondary fallback

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error(
    'Missing envs.\n' +
      'Ensure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE in .env.local or .env at the repo root.\n' +
      'Examples:\n' +
      '  NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co\n' +
      '  SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...\n'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const [, , userId, newEmailRaw] = process.argv;
if (!userId || !newEmailRaw) {
  console.error(
    'Usage: node src/scripts/admin-change-user-email.mjs <user-id> <new-email>'
  );
  process.exit(1);
}

// Domains are case-insensitive; normalize just in case.
const newEmail = String(newEmailRaw).trim();

try {
  const { data, error } = await supabase.auth.admin.updateUserById(userId, {
    email: newEmail,
    // If your project disallows this flag, remove it and the user will get a confirmation email instead.
    email_confirm: true,
  });
  if (error) throw error;

  console.log(`✅ Updated user ${data.user.id} → ${data.user.email}`);

  // Optional: generate a recovery link immediately so you can DM it
  const { data: linkData, error: linkErr } =
    await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: newEmail,
      options: {
        redirectTo: `${
          process.env.NEXT_PUBLIC_SITE_URL || 'https://eosarchive.app'
        }/reset-password`,
      },
    });
  if (linkErr) {
    console.warn(
      '⚠️ Could not generate recovery link automatically:',
      linkErr.message
    );
  } else {
    console.log(
      '🔗 One-time recovery link (expires ~60 min):',
      linkData.properties.action_link
    );
  }
} catch (e) {
  console.error('❌ Failed to change email:', e.message || e);
  process.exit(1);
}
