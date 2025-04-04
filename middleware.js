// middleware.js
import { NextResponse } from 'next/server';

export async function middleware(req) {
  return new NextResponse('Middleware reached');
}

export const config = {
  matcher: ['/admin/:path*'],
};
