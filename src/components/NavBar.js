'use client';

import { useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Menu from './Menu'; // Import the Menu component
import { FilterContext } from '@/contexts/FilterContext'; // Import filter context
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
// Custom hook to subscribe to auth state changes
function useUserSimple() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get current session on mount
    const supabase = createClientComponentClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });
    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
  return user;
}

export default function NavBar() {
  const { setSelectedFilters } = useContext(FilterContext);
  const [theme, setTheme] = useState('dawn');
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = useUserSimple();

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
  const loginHref = user ? '/spaces/admin' : '/login';
  const loginLabel = user ? 'Dashboard' : 'Login';

  return (
    <>
      <header className='fixed top-0 inset-x-0 z-50 border-b border-[var(--foreground)]/12 bg-[var(--background)]/92 backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.08)]'>
        {/* Skip link for keyboard users */}
        <a
          href='#main'
          className='sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:bg-[var(--foreground)] focus:text-[var(--background)] focus:px-3 focus:py-2'>
          Skip to content
        </a>

        <div className='mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3'>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <div className='flex items-center gap-3'>
              <button
                type='button'
                onClick={toggleMenu}
                aria-label='Open menu'
                aria-controls='primary-menu'
                className='nav-action'>
                Menu
              </button>
            </div>

            <form
              onSubmit={handleSearchSubmit}
              className='nav-search hidden flex-1 items-center justify-between md:flex'
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
                className='nav-search__submit'>
                Search
              </button>
            </form>

            <div className='flex items-center gap-2'>
              <button
                type='button'
                onClick={toggleTheme}
                className='nav-action'
                aria-label={themeToggleLabel}>
                {theme === 'dawn' ? 'Dawn' : 'Dusk'}
              </button>

              <Link
                href={loginHref}
                className='nav-action'>
                {loginLabel}
              </Link>
            </div>
          </div>

          <div className='flex flex-wrap items-center justify-between gap-3'>
            <nav
              aria-label='Primary'
              className='flex flex-wrap items-center gap-2'>
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
            <a
              href='https://eosarchive.app/spaces/signup'
              className='nav-cta hidden sm:inline-flex'>
              Register a space
            </a>
          </div>
        </div>
      </header>

      {/* Menu Component */}
      <Menu
        title='Open navigation menu'
        menuOpen={menuOpen}
        toggleMenu={toggleMenu}
      />
    </>
  );
}
