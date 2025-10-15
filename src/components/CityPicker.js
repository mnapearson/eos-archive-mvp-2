'use client';

import { useEffect, useRef, useState } from 'react';

const MAPBOX_ENDPOINT = 'https://api.mapbox.com/geocoding/v5/mapbox.places/';
const MIN_QUERY_LENGTH = 2;
const FETCH_DELAY = 300;

const toSelection = (feature) => {
  if (!feature) {
    return {
      city: '',
      displayName: '',
      countryCode: '',
      feature: null,
    };
  }

  const context = Array.isArray(feature.context) ? feature.context : [];
  const country =
    context.find((entry) => typeof entry?.id === 'string' && entry.id.startsWith('country.')) ||
    feature;
  const shortCode = country?.short_code || country?.properties?.short_code || '';

  return {
    city: feature.text || '',
    displayName: feature.place_name || feature.text || '',
    countryCode: shortCode ? shortCode.toUpperCase() : '',
    feature,
  };
};

export default function CityPicker({
  id = 'city',
  value,
  onChange,
  required = false,
  placeholder = 'Start typing your city',
  disabled = false,
}) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const [inputValue, setInputValue] = useState(
    value?.displayName || value?.city || ''
  );
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const debounceRef = useRef(null);
  const dismissTimeoutRef = useRef(null);

  useEffect(() => {
    setInputValue(value?.displayName || value?.city || '');
  }, [value?.city, value?.displayName]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!token) {
      setError('Missing Mapbox token.');
      return;
    }

    const trimmed = inputValue.trim();
    if (!trimmed || trimmed.length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setLoading(false);
      setError('');
      return;
    }

    setLoading(true);
    setError('');

    const controller = new AbortController();

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          access_token: token,
          autocomplete: 'true',
          limit: '6',
          types: 'place',
          language: 'en',
        });

        const response = await fetch(
          `${MAPBOX_ENDPOINT}${encodeURIComponent(trimmed)}.json?${params.toString()}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(`Mapbox responded with status ${response.status}`);
        }

        const data = await response.json();
        setSuggestions(Array.isArray(data.features) ? data.features : []);
      } catch (err) {
        if (err.name === 'AbortError') {
          return;
        }
        console.error('City lookup failed', err);
        setError('Unable to fetch city suggestions right now.');
      } finally {
        setLoading(false);
      }
    }, FETCH_DELAY);

    return () => {
      clearTimeout(debounceRef.current);
      controller.abort();
    };
  }, [inputValue, token]);

  const handleSelect = (feature) => {
    const selection = toSelection(feature);
    setInputValue(selection.displayName);
    setSuggestions([]);
    setError('');
    if (dismissTimeoutRef.current) {
      clearTimeout(dismissTimeoutRef.current);
    }
    onChange?.(selection);
  };

  const handleChange = (event) => {
    const nextValue = event.target.value;
    setInputValue(nextValue);
    setError('');
    onChange?.(
      toSelection({
        text: nextValue,
        place_name: nextValue,
      })
    );
  };

  const handleBlur = () => {
    dismissTimeoutRef.current = setTimeout(() => {
      setSuggestions([]);
    }, 150);
  };

  const showDropdown = suggestions.length > 0;

  return (
    <div className='relative'>
      <input
        id={id}
        type='text'
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={() => {
          if (dismissTimeoutRef.current) {
            clearTimeout(dismissTimeoutRef.current);
          }
          if (inputValue.trim().length >= MIN_QUERY_LENGTH && suggestions.length === 0) {
            setSuggestions((current) => current);
          }
        }}
        placeholder={placeholder}
        className='input rounded-2xl border border-[var(--foreground)]/18 bg-[var(--background)]/80 px-4 py-3 text-sm shadow-[0_12px_32px_rgba(0,0,0,0.08)] focus:border-[var(--foreground)]/45 focus:outline-none focus:ring-2 focus:ring-[var(--foreground)]/25'
        required={required}
        disabled={disabled}
        autoComplete='off'
        aria-autocomplete='list'
        aria-expanded={showDropdown}
        aria-controls={`${id}-listbox`}
        role='combobox'
      />

      {showDropdown && (
        <ul
          id={`${id}-listbox`}
          role='listbox'
          className='absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-[var(--foreground)]/12 bg-[var(--background)]/95 shadow-[0_14px_38px_rgba(0,0,0,0.18)] backdrop-blur-md'>
          {suggestions.map((feature) => (
            <li key={feature.id}>
              <button
                type='button'
                className='flex w-full items-start gap-2 px-4 py-3 text-left text-sm hover:bg-[var(--foreground)]/6 focus:bg-[var(--foreground)]/6 focus:outline-none'
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(feature)}
              >
                <span className='font-medium text-[var(--foreground)]'>
                  {feature.text}
                </span>
                <span className='text-xs uppercase tracking-[0.18em] text-[var(--foreground)]/55'>
                  {feature.context
                    ?.filter((ctx) => ctx.id.startsWith('country.') || ctx.id.startsWith('region.'))
                    .map((ctx) => ctx.short_code?.toUpperCase() || ctx.text)
                    .join(' · ')}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className='mt-2 min-h-[1rem] text-xs text-[var(--foreground)]/55'>
        {loading && <span>Looking for matches…</span>}
        {!loading && error && <span>{error}</span>}
      </div>
    </div>
  );
}
