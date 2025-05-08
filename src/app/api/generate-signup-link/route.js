// src/app/api/generate-signup-link/route.js
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  const { email, role: incomingRole } = await request.json();

  if (!email) {
    return NextResponse.json({ error: 'Missing email' }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Validate and default role
  const validRoles = ['space', 'organizer', 'supporter'];
  const role = validRoles.includes(incomingRole) ? incomingRole : 'space';

  // Generate a sign-up magic link without sending an email
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'invite',
    email,
    options: {
      redirectTo: `${baseUrl}/signup?role=${role}`,
    },
  });

  if (error) {
    console.error('Error generating sign-up link:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Return the link to the client
  const link =
    data.actionLink ||
    data?.properties?.action_link ||
    data?.properties?.actionLink;

  return NextResponse.json({ link });
}
