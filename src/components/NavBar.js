'use client';

import { Suspense, useState, useEffect, useContext, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Menu from './Menu'; // Import the Menu component
import { FilterContext } from '@/contexts/FilterContext'; // Import filter context
import useSupabaseUser from '@/hooks/useSupabaseUser';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function NavBar(props) {
  return (
    <Suspense fallback={null}>
      <NavBarContent {...props} />
    </Suspense>
  );
}

function NavBarContent() {
  const { setSelectedFilters } = useContext(FilterContext);
  const [theme, setTheme] = useState('dawn');
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useSupabaseUser();
  const supabase = useMemo(() => createClientComponentClient(), []);

  const pathname = usePathname();

  // Sync search input with current query string
  const currentSearchValue = searchParams.get('search') || '';

  useEffect(() => {
    setSearchTerm(currentSearchValue);
  }, [currentSearchValue]);

  // Load saved theme or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia(
        '(prefers-color-scheme: dark)'
      ).matches;
      setTheme(prefersDark ? 'dusk' : 'dawn');
    }
  }, []);

  // Apply theme classes to the document element
  useEffect(() => {
    document.documentElement.classList.remove('dusk', 'dawn');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'dawn' ? 'dusk' : 'dawn');
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
    const mobileSearch = document.getElementById('nav-mobile-search');
    mobileSearch?.classList.add('hidden');
  };

  const primaryLinks = [
    {
      href: '/',
      label: 'Explore',
      isActive: pathname === '/',
    },
    {
      href: '/map',
      label: 'Spaces',
      isActive: pathname.startsWith('/map') || pathname.startsWith('/spaces'),
    },
    {
      href: '/conversations',
      label: 'Conversations',
      isActive: pathname.startsWith('/conversations'),
    },
  ];

  const themeToggleLabel =
    theme === 'dawn' ? 'Switch to dusk mode' : 'Switch to dawn mode';
  const loginHref = user ? '/spaces/admin?tab=events' : '/login';
  const loginLabel = user ? 'Submit' : 'Login';
  const registerHref = '/spaces/signup';
  const registerLabel = 'Register a space';

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
      <header className='fixed top-0 inset-x-0 z-50 border-b border-[var(--foreground)]/12 bg-[var(--background)]/92 backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.08)]'>
        {/* Skip link for keyboard users */}
        <a
          href='#main'
          className='sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-[var(--foreground)] focus:text-[var(--background)] focus:px-3 focus:py-2'>
          Skip to content
        </a>

        <div className='mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-2 sm:py-3 md:flex-row md:items-center md:gap-4 lg:max-w-5xl'>
          <div className='flex w-full items-center gap-2 flex-wrap md:flex-nowrap md:gap-3 md:flex-1'>
            <button
              type='button'
              onClick={toggleMenu}
              aria-label='Open menu'
              aria-controls='primary-menu'
              className='nav-action'>
              Menu
            </button>

            <nav
              aria-label='Primary'
              className='hidden lg:flex items-center gap-2'>
              {primaryLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-pill ${
                    item.isActive ? 'nav-pill--active' : ''
                  }`}
                  prefetch={false}>
                  {item.label}
                </Link>
              ))}
            </nav>

            <form
              onSubmit={handleSearchSubmit}
              className='nav-search flex items-center justify-between flex-1 md:max-w-sm'
              role='search'>
              <input
                type='search'
                name='search'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder='Search the archive'
                className='nav-search__input'
                aria-label='Search archived events'
              />
              <button
                type='submit'
                className='nav-search__submit'
                aria-label='Search'>
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
              </button>
            </form>

            <div className='flex items-center gap-2 text-xs sm:text-sm flex-shrink-0'>
              <Link
                href={loginHref}
                className='nav-action'>
                {loginLabel}
              </Link>
              {user ? (
                <button
                  type='button'
                  onClick={handleSignOut}
                  className='nav-cta hidden sm:inline-flex'>
                  Disconnect
                </button>
              ) : (
                <Link
                  href={registerHref}
                  className='nav-cta hidden sm:inline-flex'>
                  {registerLabel}
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Menu Component */}
      <Menu
        menuOpen={menuOpen}
        toggleMenu={toggleMenu}
        theme={theme}
        toggleTheme={toggleTheme}
        themeLabel={themeToggleLabel}
      />
    </>
  );
}
