'use client';

import Masonry from 'react-masonry-css';
import InfiniteScroll from 'react-infinite-scroll-component';
import Link from 'next/link';

export default function MasonryGrid({ items, fetchMoreData, hasMore }) {
  // Adjust breakpoints as needed for your design.
  const breakpointColumnsObj = {
    default: 4,
    1100: 3,
    500: 2,
  };

  return (
    <div className='w-screen min-h-screen overflow-hidden'>
      <InfiniteScroll
        dataLength={items.length}
        next={fetchMoreData}
        hasMore={hasMore}
        loader={<p className='text-center py-4'>Loading more items...</p>}
        endMessage={
          <p className='text-center py-16'>
            <b>No more events to display.</b>
          </p>
        }
        scrollableTarget='__next'>
        <Masonry
          breakpointCols={breakpointColumnsObj}
          className='flex w-full'
          columnClassName='p-1'>
          {items.map((item) => (
            <div
              key={item.id}
              className='m-1'>
              <Link href={`/events/${item.id}`}>
                <div className='overflow-hidden rounded-lg shadow-md transition-none'>
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
    </div>
  );
}
