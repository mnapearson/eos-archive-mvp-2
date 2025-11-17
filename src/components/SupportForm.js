'use client';

import { useCallback, useMemo, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import {
  getDonationPresets,
  getSupportedCurrencies,
  getDefaultDonationCurrency,
} from '@/lib/support-config';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

const presets = getDonationPresets();
const supportedCurrencies = getSupportedCurrencies();
const defaultCurrency = getDefaultDonationCurrency();

function formatAmountWithCurrency(amount, currencyCode) {
  if (!Number.isFinite(amount)) return '';
  const normalized = String(currencyCode || '').toUpperCase() || 'USD';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: normalized,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${normalized} ${Number(amount).toFixed(2)}`;
  }
}

function PaymentStep({
  amount,
  email,
  name,
  onSuccess,
  onEdit,
  paymentStatus,
  setPaymentStatus,
  formatAmount,
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      if (!stripe || !elements || paymentStatus === 'processing') return;
      setPaymentStatus('processing');
      setErrorMessage('');

      const result = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
        confirmParams: {
          receipt_email: email || undefined,
          payment_method_data: {
            billing_details: {
              email: email || undefined,
              name: name || undefined,
            },
          },
          return_url:
            typeof window !== 'undefined'
              ? `${window.location.origin}/support?intent=complete`
              : undefined,
        },
      });

      if (result.error) {
        setPaymentStatus('ready');
        setErrorMessage(result.error.message || 'Unable to confirm payment.');
        return;
      }

      if (result.paymentIntent?.status === 'succeeded') {
        setPaymentStatus('succeeded');
        onSuccess(result.paymentIntent);
      } else {
        setPaymentStatus('ready');
        setErrorMessage('Payment not completed. Please try again.');
      }
    },
    [elements, email, name, onSuccess, paymentStatus, setPaymentStatus, stripe]
  );

  return (
    <form
      onSubmit={handleSubmit}
      className='space-y-4'>
      <PaymentElement
        options={{
          layout: 'tabs',
          business: { name: 'eos archive' },
        }}
      />

      {errorMessage && (
        <p className='text-sm text-red-500' role='alert'>
          {errorMessage}
        </p>
      )}

      <div className='flex flex-wrap gap-3'>
        <button
          type='submit'
          disabled={!stripe || paymentStatus === 'processing'}
          className='nav-action nav-cta flex-1 rounded-full px-4 py-3 text-center text-sm uppercase tracking-[0.3em]'>
          {paymentStatus === 'processing'
            ? 'Processing...'
            : `Donate ${formatAmount(amount)}`}
        </button>
        <button
          type='button'
          onClick={onEdit}
          className='nav-action flex-1 rounded-full px-4 py-3 text-sm uppercase tracking-[0.3em]'>
          Edit details
        </button>
      </div>
    </form>
  );
}

export default function SupportForm() {
  const initialPreset = presets[2] ?? presets[0] ?? 5;
  const [amount, setAmount] = useState(initialPreset);
  const [selectedPreset, setSelectedPreset] = useState(initialPreset);
  const [customAmount, setCustomAmount] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [currency, setCurrency] = useState(
    supportedCurrencies.includes(defaultCurrency)
      ? defaultCurrency
      : supportedCurrencies[0] || 'usd'
  );
  const [clientSecret, setClientSecret] = useState(null);
  const [prepareError, setPrepareError] = useState('');
  const [isPreparing, setIsPreparing] = useState(false);
  const [detailsLocked, setDetailsLocked] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('idle');
  const [successInfo, setSuccessInfo] = useState(null);

  const hasPublishableKey = Boolean(stripePromise);
  const isAmountValid = Number.isFinite(amount) && amount > 0;

  const formatAmount = useCallback(
    (value, overrideCurrency) =>
      formatAmountWithCurrency(value, overrideCurrency || currency),
    [currency]
  );
  const currencyLabel = currency.toUpperCase();

  const elementOptions = useMemo(() => {
    if (!clientSecret) return undefined;
    return {
      clientSecret,
      appearance: {
        theme: 'stripe',
        labels: 'floating',
        variables: {
          colorPrimary: '#111',
          colorText: '#111',
          colorBackground: '#fff',
        },
      },
    };
  }, [clientSecret]);

  const resetIntent = useCallback(() => {
    setClientSecret(null);
    setDetailsLocked(false);
    setPaymentStatus('idle');
  }, []);

  const handlePresetSelect = (value) => {
    setSelectedPreset(value);
    setCustomAmount('');
    setAmount(value);
    resetIntent();
  };

  const handleCustomAmount = (event) => {
    const value = event.target.value;
    setCustomAmount(value);
    setSelectedPreset(null);
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      setAmount(parsed);
    } else {
      setAmount(0);
    }
    resetIntent();
  };

  const handleCurrencySelect = (code) => {
    const normalized = String(code || '').toLowerCase();
    if (!supportedCurrencies.includes(normalized) || normalized === currency) {
      return;
    }
    setCurrency(normalized);
    resetIntent();
  };

  const handlePreparePayment = async () => {
    if (!isAmountValid) {
      setPrepareError('Enter a positive contribution amount.');
      return;
    }
    if (!hasPublishableKey) {
      setPrepareError(
        'Stripe publishable key missing. Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.'
      );
      return;
    }

    setIsPreparing(true);
    setPrepareError('');

    try {
      const response = await fetch('/api/support/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency,
          name,
          email,
          message,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Unable to start donation.');
      }
      setClientSecret(data.clientSecret);
      setDetailsLocked(true);
      setPaymentStatus('ready');
    } catch (error) {
      setPrepareError(error.message);
    } finally {
      setIsPreparing(false);
    }
  };

  const handleSuccess = (paymentIntent) => {
    setSuccessInfo({
      id: paymentIntent.id,
      amount,
      currency,
    });
  };

  if (!hasPublishableKey) {
    return (
      <div className='rounded-3xl border border-red-200 bg-red-50/60 p-6'>
        <p className='text-sm text-red-600'>
          Stripe is not configured. Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to
          load the embedded checkout.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      <div className='rounded-3xl border border-[var(--foreground)]/10 bg-[var(--background)]/80 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.08)] space-y-6'>
        <div className='space-y-4'>
          <label className='ea-label block'>Choose an amount</label>
          <div className='flex flex-wrap gap-3'>
            {presets.map((preset) => (
              <button
                key={preset}
                type='button'
                onClick={() => handlePresetSelect(preset)}
                className={`nav-pill ${
                  selectedPreset === preset ? 'nav-pill--active' : ''
                }`}>
                {formatAmount(preset)}
              </button>
            ))}
          </div>
          <div className='space-y-2'>
            <label
              className='ea-label ea-label--muted'
              htmlFor='customAmount'>
              Custom amount
            </label>
            <div className='relative'>
              <span className='pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[var(--foreground)]/60'>
                {currencyLabel}
              </span>
              <input
                id='customAmount'
                type='number'
                step='0.01'
                inputMode='decimal'
                value={customAmount}
                onChange={handleCustomAmount}
                className='ea-input pr-20'
                placeholder='Other amount'
                disabled={detailsLocked}
              />
            </div>
          </div>
          {supportedCurrencies.length > 1 && (
            <div className='space-y-2'>
              <label className='ea-label ea-label--muted'>Currency</label>
              <div className='flex flex-wrap gap-3'>
                {supportedCurrencies.map((code) => (
                  <button
                    key={code}
                    type='button'
                    onClick={() => handleCurrencySelect(code)}
                    className={`nav-pill ${
                      currency === code ? 'nav-pill--active' : ''
                    }`}>
                    {code.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className='grid gap-4 md:grid-cols-2'>
          <div className='space-y-2'>
            <label
              className='ea-label ea-label--muted'
              htmlFor='support-name'>
              Name (optional)
            </label>
            <input
              id='support-name'
              type='text'
              className='ea-input'
              placeholder='How should we say thanks?'
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                resetIntent();
              }}
              maxLength={120}
              disabled={detailsLocked}
            />
          </div>
          <div className='space-y-2'>
            <label
              className='ea-label ea-label--muted'
              htmlFor='support-email'>
              Email (for receipt)
            </label>
            <input
              id='support-email'
              type='email'
              className='ea-input'
              placeholder='you@email.com'
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                resetIntent();
              }}
              maxLength={320}
              disabled={detailsLocked}
            />
          </div>
          <div className='space-y-2 md:col-span-2'>
            <label
              className='ea-label ea-label--muted'
              htmlFor='support-message'>
              Note (optional)
            </label>
            <textarea
              id='support-message'
              className='ea-input min-h-[96px]'
              placeholder='Share a dedication, shoutout, or reason for giving.'
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                resetIntent();
              }}
              maxLength={500}
              disabled={detailsLocked}
            />
          </div>
        </div>

        <div className='space-y-3'>
          <button
            type='button'
            onClick={handlePreparePayment}
            disabled={isPreparing || detailsLocked}
            className='nav-action nav-cta w-full rounded-full px-4 py-3 text-sm uppercase tracking-[0.3em]'>
            {detailsLocked
              ? 'Payment form ready'
              : isPreparing
              ? 'Preparing...'
              : 'Continue to payment'}
          </button>
          {prepareError && (
            <p className='text-sm text-red-500' role='alert'>
              {prepareError}
            </p>
          )}
        </div>
      </div>

      {successInfo ? (
        <div className='rounded-3xl border border-emerald-200 bg-emerald-50/70 p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)] space-y-3'>
          <span className='ea-label text-emerald-600'>Thank you</span>
          <p className='text-lg font-semibold text-[var(--foreground)]'>
            Your contribution of{' '}
            {formatAmount(successInfo.amount, successInfo.currency)} keeps the
            living archive online.
          </p>
          <p className='text-sm text-[var(--foreground)]/70'>
            A receipt has been sent to {email || 'your inbox'}. Feel free to
            close this page or explore more flyers.
          </p>
          <button
            type='button'
            className='nav-action mt-4 rounded-full px-4 py-2 text-xs uppercase tracking-[0.28em]'
            onClick={() => {
              setSuccessInfo(null);
              setDetailsLocked(false);
              setClientSecret(null);
              setPaymentStatus('idle');
              setSelectedPreset(initialPreset);
              setAmount(initialPreset);
              setCustomAmount('');
            }}>
            Make another contribution
          </button>
        </div>
      ) : clientSecret && elementOptions ? (
        <Elements
          stripe={stripePromise}
          options={elementOptions}
          key={clientSecret}>
          <div className='rounded-3xl border border-[var(--foreground)]/12 bg-white/90 p-6 shadow-[0_22px_70px_rgba(0,0,0,0.1)] space-y-4'>
            <span className='ea-label'>Payment details</span>
            <PaymentStep
              amount={amount}
              email={email}
              name={name}
              paymentStatus={paymentStatus}
              setPaymentStatus={setPaymentStatus}
              onSuccess={handleSuccess}
              formatAmount={formatAmount}
              onEdit={() => {
                resetIntent();
                setDetailsLocked(false);
              }}
            />
          </div>
        </Elements>
      ) : (
        <div className='rounded-3xl border border-dashed border-[var(--foreground)]/20 p-6 text-sm text-[var(--foreground)]/70'>
          The payment form appears once you continue with a valid amount.
        </div>
      )}
    </div>
  );
}
