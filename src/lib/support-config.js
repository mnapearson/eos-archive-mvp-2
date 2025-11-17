const isServer = typeof window === 'undefined';

const defaultPresets = [5, 15, 25, 50, 100, 250];
const defaultCurrencies = ['usd', 'eur'];

const publicConfig = {
  presets: process.env.NEXT_PUBLIC_DONATION_PRESETS,
  currencies: process.env.NEXT_PUBLIC_DONATION_CURRENCIES,
  defaultCurrency: process.env.NEXT_PUBLIC_DONATION_CURRENCY,
};

const privateConfig = isServer
  ? {
      presets: process.env.DONATION_PRESETS,
      currencies: process.env.DONATION_CURRENCIES,
      defaultCurrency: process.env.DONATION_CURRENCY,
    }
  : {};

function parsePresetList(value) {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((num) => Number.isFinite(num) && num > 0);
}

function normalizeCurrency(value) {
  if (!value) return '';
  return String(value).trim().toLowerCase();
}

function parseCurrencyList(value) {
  if (!value) return [];
  return value
    .split(',')
    .map((item) => normalizeCurrency(item))
    .filter(Boolean);
}

export function getDonationPresets() {
  const parsed = parsePresetList(
    publicConfig.presets || privateConfig.presets
  );
  return parsed.length > 0 ? parsed : defaultPresets;
}

export function getSupportedCurrencies() {
  const parsed =
    parseCurrencyList(publicConfig.currencies) ||
    parseCurrencyList(privateConfig.currencies);
  const list = parsed.length > 0 ? parsed : defaultCurrencies;
  return Array.from(new Set(list));
}

export function getDefaultDonationCurrency() {
  const preferred = normalizeCurrency(
    publicConfig.defaultCurrency || privateConfig.defaultCurrency
  );
  const supported = getSupportedCurrencies();
  if (preferred && supported.includes(preferred)) {
    return preferred;
  }
  return supported[0] || 'usd';
}

export function isCurrencySupported(currency) {
  const normalized = normalizeCurrency(currency);
  if (!normalized) return false;
  return getSupportedCurrencies().includes(normalized);
}

export { normalizeCurrency };
