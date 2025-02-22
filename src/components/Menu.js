'use client';

import { useContext } from 'react';
import Link from 'next/link';
import { FilterContext } from '@/contexts/FilterContext';

export default function Menu({ menuOpen, toggleMenu }) {
  const {
    selectedFilters,
    setSelectedFilters,
    cityOptions,
    spaceOptions,
    dateOptions,
    categoryOptions,
    designerOptions,
  } = useContext(FilterContext);

  // Toggle a value in an array-based filter (add/remove)
  function toggleValue(category, value) {
    setSelectedFilters((prev) => {
      const current = prev[category] || [];
      if (current.includes(value)) {
        // remove it
        return {
          ...prev,
          [category]: current.filter((v) => v !== value),
        };
      } else {
        // add it
        return {
          ...prev,
          [category]: [...current, value],
        };
      }
    });
  }

  // Clear all filter selections
  function handleClear() {
    setSelectedFilters({
      city: [],
      space: [],
      date: [],
      category: [],
      designer: [],
    });
  }

  // "Save" could simply close the menu. You could also push a new route if desired.
  function handleSave() {
    toggleMenu();
  }

  return (
    <div
      className={`fixed inset-0 z-50 transition-all duration-300 ${
        menuOpen
          ? 'bg-[var(--background)]/90 opacity-100'
          : 'opacity-0 pointer-events-none'
      }`}>
      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-80 bg-[var(--background)] text-[var(--foreground)] p-6 border-r border-gray-300 transform transition-transform duration-300 ease-in-out ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
        {/* Header Row: FILTER (left) | CLEAR & SAVE (right) */}
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-md font-semibold italic'>FILTER</h2>
          <div className='flex gap-4'>
            <button
              onClick={handleClear}
              className='underline text-sm'>
              CLEAR
            </button>
            <button
              onClick={handleSave}
              className='underline text-sm'>
              SAVE
            </button>
          </div>
        </div>

        {/* CITY Filter */}
        <div className='mb-4'>
          <h3 className='font-bold mb-2'>CITY</h3>
          {cityOptions.map((city) => (
            <label
              key={city}
              className='block cursor-pointer mb-1'>
              <input
                type='checkbox'
                checked={selectedFilters.city.includes(city)}
                onChange={() => toggleValue('city', city)}
                className='mr-2'
              />
              {city}
            </label>
          ))}
        </div>

        {/* SPACE Filter */}
        <div className='mb-4'>
          <h3 className='font-bold mb-2'>SPACE</h3>
          {spaceOptions.map((space) => (
            <label
              key={space}
              className='block cursor-pointer mb-1'>
              <input
                type='checkbox'
                checked={selectedFilters.space.includes(space)}
                onChange={() => toggleValue('space', space)}
                className='mr-2'
              />
              {space}
            </label>
          ))}
        </div>

        {/* DATE Filter */}
        <div className='mb-4'>
          <h3 className='font-bold mb-2'>DATE</h3>
          {dateOptions.map((date) => (
            <label
              key={date}
              className='block cursor-pointer mb-1'>
              <input
                type='checkbox'
                checked={selectedFilters.date.includes(date)}
                onChange={() => toggleValue('date', date)}
                className='mr-2'
              />
              {date}
            </label>
          ))}
        </div>

        {/* CATEGORY Filter */}
        <div className='mb-4'>
          <h3 className='font-bold mb-2'>CATEGORY</h3>
          {categoryOptions.map((cat) => (
            <label
              key={cat}
              className='block cursor-pointer mb-1'>
              <input
                type='checkbox'
                checked={selectedFilters.category.includes(cat)}
                onChange={() => toggleValue('category', cat)}
                className='mr-2'
              />
              {cat}
            </label>
          ))}
        </div>

        {/* DESIGNER Filter */}
        <div className='mb-4'>
          <h3 className='font-bold mb-2'>DESIGNER</h3>
          {designerOptions.map((designer) => (
            <label
              key={designer}
              className='block cursor-pointer mb-1'>
              <input
                type='checkbox'
                checked={selectedFilters.designer.includes(designer)}
                onChange={() => toggleValue('designer', designer)}
                className='mr-2'
              />
              {designer}
            </label>
          ))}
        </div>

        {/* Navigation Links */}
        <div className='mt-6'>
          <Link
            href='/news'
            className='block py-1 underline'>
            NEWS
          </Link>
          <Link
            href='/about'
            className='block py-1 underline'>
            ABOUT
          </Link>
          <Link
            href='/contact'
            className='block py-1 underline'>
            CONTACT US
          </Link>
          <Link
            href='/submission'
            className='block py-1 underline'>
            SUBMIT EVENT
          </Link>
        </div>
      </div>

      {/* Clicking outside the menu closes it */}
      {menuOpen && (
        <div
          className='w-full h-full'
          onClick={toggleMenu}
          aria-hidden='true'
        />
      )}
    </div>
  );
}
