'use client';

import InfiniteScroll from 'react-infinite-scroll-component';
import Link from 'next/link';

export default function MasonryGrid({ items, fetchMoreData, hasMore }) {
  return (
    <InfiniteScroll
      dataLength={items.length}
      next={fetchMoreData}
      hasMore={hasMore}
      loader={<p className='text-center py-4'>Loading more items...</p>}
      endMessage={
        <div>
          <p className='text-sm italic mt-4 text-center'>
            No more events found.
          </p>
          <p className='mt-20 text-center'>
            Are you part of a subcultural space, and want to become a member of
            eos archive?{' '}
            <a
              href='/spaces/signup'
              className='underline'>
              Register here.
            </a>
          </p>
        </div>
      }>
      <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4'>
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/events/${item.id}`}
            scroll={false}
            className='relative group block overflow-hidden rounded-sm'>
            <img
              src={item.image_url || '/placeholder.jpg'}
              alt={item.title}
              className='w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105'
            />
            <div className='absolute inset-0 bg-black bg-opacity-80 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end space-y-1'>
              <h3 className='text-white font-semibold text-base'>
                {item.title}
              </h3>
              {item.start_date && (
                <p className='text-white text-sm'>
                  {new Date(item.start_date).toLocaleDateString(undefined, {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              )}
              {item.category && (
                <p className='text-white text-sm italic capitalize'>
                  {item.category}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </InfiniteScroll>
  );
}
