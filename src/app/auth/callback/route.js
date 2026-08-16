import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const type = requestUrl.searchParams.get('type');

  let accountType = null;
  if (code) {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    const { data } = await supabase.auth.exchangeCodeForSession(code);
    accountType = data?.session?.user?.user_metadata?.account_type ?? null;
  }

  // Password reset confirmations should continue to the reset form
  if (type === 'recovery') {
    return NextResponse.redirect(new URL('/reset-password', requestUrl.origin));
  }

  // Space signups still need their space record created — the registration
  // call was deferred (and the form data stashed in localStorage) until a
  // session actually exists, since it didn't exist yet at signup time when
  // email confirmation is required.
  if (accountType === 'space') {
    return NextResponse.redirect(new URL('/spaces/signup/complete', requestUrl.origin));
  }

  // Email confirmations (signup) land on the account page
  return NextResponse.redirect(new URL('/account', requestUrl.origin));
}
