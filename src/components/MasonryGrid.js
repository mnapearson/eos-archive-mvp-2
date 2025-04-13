'use client';

import Masonry from 'react-masonry-css';
import InfiniteScroll from 'react-infinite-scroll-component';
import Link from 'next/link';

export default function MasonryGrid({ items, fetchMoreData, hasMore }) {
  const breakpointColumnsObj = {
    default: 5,
    1100: 4,
    500: 3, // Ensure a minimum of 2 columns on small screens
  };

  return (
    <InfiniteScroll
      dataLength={items.length}
      next={fetchMoreData}
      hasMore={hasMore}
      loader={<p className='text-center py-4'>Loading more items...</p>}
      endMessage={
        <div>
          <p className='text-sm italic mt-4'>No more events found.</p>
          <p className='mt-20 text-lg'>
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
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className='flex w-full gap-3'>
        {items.map((item) => (
          <div
            key={item.id}
            className='mb-3'>
            <Link href={`/events/${item.id}`}>
              <div className='overflow-hidden rounded-sm transition-none'>
                <img
                  src={item.image_url || '/placeholder.jpg'}
                  alt={item.title}
                  className='w-full h-auto object-cover'
                />
              </div>
            </Link>
          </div>
        ))}
      </Masonry>
    </InfiniteScroll>
  );
}
