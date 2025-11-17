export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getStripeClient } from '@/lib/stripe';
import {
  getDefaultDonationCurrency,
  getSupportedCurrencies,
  normalizeCurrency,
} from '@/lib/support-config';

const supportedCurrencies = getSupportedCurrencies();
const defaultCurrency = getDefaultDonationCurrency();

function toMinorUnits(amount, currency) {
  const multiplier = currency === 'jpy' ? 1 : 100;
  return Math.round(Number(amount) * multiplier);
}

export async function POST(req) {
  let stripe;
  try {
    stripe = getStripeClient();
  } catch (error) {
    console.error('Stripe configuration error:', error);
    return NextResponse.json(
      { error: 'Stripe is not configured. Set STRIPE_SECRET_KEY.' },
      { status: 500 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const amountInput = Number(body.amount ?? body.amountUsd);
    const requestedCurrency = normalizeCurrency(
      body.currency || defaultCurrency
    );
    const currency = supportedCurrencies.includes(requestedCurrency)
      ? requestedCurrency
      : null;
    const name = body.name ? String(body.name).trim().slice(0, 120) : '';
    const email = body.email
      ? String(body.email).trim().toLowerCase().slice(0, 320)
      : '';
    const message = body.message
      ? String(body.message).trim().slice(0, 500)
      : '';

    if (!currency) {
      return NextResponse.json(
        { error: 'Unsupported currency requested.' },
        { status: 400 }
      );
    }

    if (!Number.isFinite(amountInput) || amountInput <= 0) {
      return NextResponse.json(
        { error: 'Enter a positive numeric amount.' },
        { status: 400 }
      );
    }

    const amountInCents = toMinorUnits(amountInput, currency);

    const intent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency,
      receipt_email: email || undefined,
      description: `eos archive support`,
      metadata: {
        supporter_name: name || 'Anonymous supporter',
        supporter_message: message,
        form_source: 'support-page',
        environment: process.env.NODE_ENV || 'development',
      },
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json(
      {
        clientSecret: intent.client_secret,
        amount: amountInCents,
        currency,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Payment intent error:', error);
    return NextResponse.json(
      { error: 'Unable to start donation. Please try again.' },
      { status: 500 }
    );
  }
}
