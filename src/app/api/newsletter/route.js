export const runtime = 'nodejs'; // ensure Node runtime for crypto

import crypto from 'crypto';

function md5HexLower(str) {
  return crypto
    .createHash('md5')
    .update(String(str).trim().toLowerCase(), 'utf8')
    .digest('hex');
}

export async function POST(req) {
  try {
    const { email, tag } = await req.json().catch(() => ({}));

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return Response.json(
        { error: 'Invalid email address.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.MAILCHIMP_API_KEY;
    const inferredDc = apiKey?.split('-')?.[1];
    const dc = process.env.MAILCHIMP_SERVER_PREFIX || inferredDc;
    const listId = process.env.MAILCHIMP_AUDIENCE_ID;
    const doubleOpt =
      String(process.env.MAILCHIMP_DOUBLE_OPTIN || '').toLowerCase() === 'true';

    if (!apiKey)
      return Response.json(
        { error: 'Missing MAILCHIMP_API_KEY' },
        { status: 400 }
      );
    if (!dc)
      return Response.json(
        {
          error:
            'Missing server prefix (MAILCHIMP_SERVER_PREFIX or key must end with -usX)',
        },
        { status: 400 }
      );
    if (!listId)
      return Response.json(
        { error: 'Missing MAILCHIMP_AUDIENCE_ID' },
        { status: 400 }
      );

    const memberHash = md5HexLower(email);
    const auth =
      'Basic ' + Buffer.from(`anystring:${apiKey}`).toString('base64');

    // Idempotent create/update
    const memberUrl = `https://${dc}.api.mailchimp.com/3.0/lists/${listId}/members/${memberHash}`;
    const mcRes = await fetch(memberUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: auth },
      body: JSON.stringify({
        email_address: email,
        status_if_new: doubleOpt ? 'pending' : 'subscribed',
        status: doubleOpt ? 'pending' : 'subscribed',
      }),
      cache: 'no-store',
    });

    // Try to parse JSON; tolerate empty body
    let mcData = {};
    try {
      mcData = await mcRes.json();
    } catch {}

    if (!mcRes.ok) {
      const title = mcData.title || '';
      const detail = mcData.detail || 'Mailchimp error';

      if (title.includes('Member Exists')) {
        // Treat as success for UX
        return Response.json({ ok: true, status: 'existing' }, { status: 200 });
      }
      if (title.includes('Compliance')) {
        return Response.json(
          { ok: false, status: 'compliance', error: detail },
          { status: 400 }
        );
      }
      if (title.includes('Invalid Resource')) {
        return Response.json(
          {
            error:
              'Mailchimp Invalid Resource. Check Audience ID and data center (usX).',
            detail,
          },
          { status: 400 }
        );
      }
      return Response.json(
        { error: detail, title: mcData.title, type: mcData.type },
        { status: 400 }
      );
    }

    // Optional: tag after subscribe (don’t let tag failures crash)
    if (tag) {
      const tagsUrl = `https://${dc}.api.mailchimp.com/3.0/lists/${listId}/members/${memberHash}/tags`;
      try {
        await fetch(tagsUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: auth },
          body: JSON.stringify({ tags: [{ name: tag, status: 'active' }] }),
          cache: 'no-store',
        });
      } catch {}
    }

    const status = mcData.status || (doubleOpt ? 'pending' : 'subscribed');
    return Response.json({ ok: true, status }, { status: 200 });
  } catch (err) {
    console.error('Newsletter API error:', err);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
