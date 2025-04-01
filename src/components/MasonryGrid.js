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
        <p className='text-center py-16'>
          <b>No more events to display.</b>
        </p>
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
