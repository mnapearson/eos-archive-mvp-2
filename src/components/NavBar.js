'use client';

import { Suspense, useState, useEffect, useContext, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import Menu from './Menu'; // Import the Menu component
import Wordmark from './Wordmark';
import { FilterContext } from '@/contexts/FilterContext'; // Import filter context
import useUserProfile from '@/hooks/useUserProfile';
import { getSupabaseBrowserClient } from '@/lib/supabaseBrowserClient';

export default function NavBar(props) {
  return (
    <Suspense fallback={null}>
      <NavBarContent {...props} />
    </Suspense>
  );
}

function NavBarContent() {
  const { setSelectedFilters } = useContext(FilterContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile } = useUserProfile();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const desktopSearchInputRef = useRef(null);

  useEffect(() => {
    if (searchOpen) {
      desktopSearchInputRef.current?.focus();
    }
  }, [searchOpen]);

  // Sync search input with current query string
  const currentSearchValue = searchParams.get('search') || '';

  useEffect(() => {
    setSearchTerm(currentSearchValue);
  }, [currentSearchValue]);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const openMenu = () => setMenuOpen(true);

  useEffect(() => {
    function handleMenuToggle(event) {
      const { open = true } = event?.detail || {};
      if (open) {
        openMenu();
      } else {
        setMenuOpen(false);
      }
    }

    window.addEventListener('ea:menu-toggle', handleMenuToggle);
    return () => window.removeEventListener('ea:menu-toggle', handleMenuToggle);
  }, []);

  // When the user clicks the logo (if you decide to have one) you can reset filters:
  const handleLogoClick = () => {
    setSelectedFilters({
      city: [],
      space: [],
      date: [],
      category: [],
      designer: [],
    });
  };

  // Handle search submission: redirect to homepage with the search query.
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmed = searchTerm.trim();
    if (trimmed.length > 0) {
      router.push(`/?search=${encodeURIComponent(trimmed)}`);
      setSearchTerm(trimmed);
    } else {
      router.push('/');
      setSearchTerm('');
    }
    setSearchOpen(false);
  };

  const isSpaceUser = profile?.role === 'space';
  const isGeneralUser = profile?.role === 'member';
  const loginHref = isSpaceUser
    ? '/spaces/admin?tab=events'
    : isGeneralUser
    ? '/account'
    : '/login';
  const loginLabel = isSpaceUser ? 'Submit' : isGeneralUser ? 'Account' : 'Log in';

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Failed to sign out', error);
      return;
    }
    setMenuOpen(false);
    router.push('/');
    router.refresh();
  };

  return (
    <>
      {/* Skip link for keyboard users */}
      <a
        href='#main'
        className='sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-[var(--foreground)] focus:text-[var(--background)] focus:px-3 focus:py-2'>
        Skip to content
      </a>

      {/* Desktop/tablet: the same bar as the mobile bottom bar below, just
          docked to the top instead of the bottom — flat icon/text items,
          no pill button chrome, search expands inline from its own icon
          instead of opening a separate row. */}
      <header className='!hidden sm:!block fixed top-0 inset-x-0 z-50 border-b border-[var(--foreground)]/12 bg-[var(--background)]/92 backdrop-blur-xl'>
        <div className='mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 lg:max-w-5xl'>
          <div className='flex items-center gap-3'>
            <Link
              href='/'
              onClick={handleLogoClick}
              className='flex-shrink-0'
              aria-label='eos archive home'>
              <Wordmark />
            </Link>

            <button
              type='button'
              onClick={toggleMenu}
              aria-label='Open menu'
              aria-controls='primary-menu'
              className='nav-flat-item h-8 w-8'>
              <MenuIcon />
            </button>
          </div>

          <div className='flex flex-none items-center'>
            <form
              onSubmit={handleSearchSubmit}
              className={`nav-search-inline ${searchOpen ? 'nav-search-inline--open' : ''}`}
              role='search'>
              <button
                type='button'
                onClick={() => setSearchOpen((open) => !open)}
                aria-label={searchOpen ? 'Close search' : 'Search'}
                aria-expanded={searchOpen}
                className='nav-flat-item h-8 w-8 flex-shrink-0'>
                <SearchIcon />
              </button>
              <input
                ref={desktopSearchInputRef}
                type='search'
                name='search'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder='Search the archive'
                className='nav-search-inline__input'
                aria-label='Search archived events'
                data-testid='search-input'
                tabIndex={searchOpen ? 0 : -1}
              />
            </form>

            <Link
              href={loginHref}
              className='nav-flat-item ml-4 text-sm font-medium'>
              {loginLabel}
            </Link>

            {user ? (
              <button
                type='button'
                onClick={handleSignOut}
                className='nav-flat-item nav-flat-item--accent ml-4 text-sm'>
                Disconnect
              </button>
            ) : (
              <Link
                href='/signup'
                className='nav-flat-item nav-flat-item--accent ml-4 text-sm'>
                Sign up
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Small screens: fixed bottom bar, like the app's own tab bar. */}
      <nav
        aria-label='Primary'
        className='sm:!hidden fixed bottom-0 inset-x-0 z-50 flex items-center justify-around border-t border-[var(--foreground)]/12 bg-[var(--background)]/94 backdrop-blur-xl px-2 pb-[env(safe-area-inset-bottom)]'>
        <Link
          href='/'
          onClick={handleLogoClick}
          aria-label='eos archive home'
          className='nav-bottom-bar__item nav-flat-item'>
          <span
            className='h-2 w-2 rounded-full'
            style={{ background: 'var(--chrome)', boxShadow: '0 0 8px var(--chrome-glow)' }}
          />
        </Link>

        <button
          type='button'
          onClick={() => setSearchOpen((open) => !open)}
          aria-label={searchOpen ? 'Close search' : 'Search'}
          aria-expanded={searchOpen}
          className='nav-bottom-bar__item nav-flat-item'>
          <SearchIcon />
        </button>

        <button
          type='button'
          onClick={toggleMenu}
          aria-label='Open menu'
          aria-controls='primary-menu'
          className='nav-bottom-bar__item nav-flat-item'>
          <MenuIcon />
        </button>

        <Link
          href={loginHref}
          className='nav-bottom-bar__item nav-flat-item nav-bottom-bar__item--label'>
          {loginLabel}
        </Link>

        {user ? (
          <button
            type='button'
            onClick={handleSignOut}
            className='nav-bottom-bar__item nav-flat-item nav-flat-item--accent nav-bottom-bar__item--label'>
            Disconnect
          </button>
        ) : (
          <Link
            href='/signup'
            className='nav-bottom-bar__item nav-flat-item nav-flat-item--accent nav-bottom-bar__item--label'>
            Sign up
          </Link>
        )}
      </nav>

      {searchOpen && (
        <div className='sm:!hidden fixed inset-x-0 z-40 border-t border-[var(--foreground)]/12 bg-[var(--background)]/98 backdrop-blur-xl px-4 py-3 nav-bottom-bar__search'>
          <form
            onSubmit={handleSearchSubmit}
            className='nav-search flex items-center justify-between'
            role='search'>
            <input
              type='search'
              name='search'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder='Search the archive'
              className='nav-search__input'
              aria-label='Search archived events'
              autoFocus
            />
            <button
              type='submit'
              className='nav-search__submit'
              aria-label='Search'>
              <SearchIcon />
            </button>
          </form>
        </div>
      )}

      {/* Menu Component */}
      <Menu
        menuOpen={menuOpen}
        toggleMenu={toggleMenu}
        onSignOut={handleSignOut}
      />
    </>
  );
}

function SearchIcon() {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width='18'
      height='18'
      viewBox='0 0 24 24'
      aria-hidden='true'>
      <path
        fill='currentColor'
        d='M9.539 15.23q-2.398 0-4.065-1.666Q3.808 11.899 3.808 9.5t1.666-4.065T9.539 3.77t4.064 1.666T15.269 9.5q0 1.042-.369 2.017t-.97 1.668l5.909 5.907q.14.14.15.345q.009.203-.15.363q-.16.16-.354.16t-.354-.16l-5.908-5.908q-.75.639-1.725.989t-1.96.35m0-1q1.99 0 3.361-1.37q1.37-1.37 1.37-3.361T12.9 6.14T9.54 4.77q-1.991 0-3.361 1.37T4.808 9.5t1.37 3.36t3.36 1.37'
      />
    </svg>
  );
}

function MenuIcon({ className = '' }) {
  return (
    <svg
      className={className}
      width='18'
      height='18'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      aria-hidden='true'>
      <line
        x1='4'
        y1='6'
        x2='20'
        y2='6'
      />
      <line
        x1='4'
        y1='12'
        x2='20'
        y2='12'
      />
      <line
        x1='4'
        y1='18'
        x2='20'
        y2='18'
      />
    </svg>
  );
}
