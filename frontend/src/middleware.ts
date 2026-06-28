import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { isClerkMocked } from '@/lib/auth-helper';

const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)', '/', '/api/v1(.*)']);

export default function middleware(request: NextRequest, event: any) {
  // If Clerk is mocked (placeholder credentials), immediately bypass Clerk Middleware
  if (isClerkMocked()) {
    return NextResponse.next();
  }
  
  // Otherwise, invoke Clerk authentication middleware
  return clerkMiddleware(async (auth, req) => {
    if (!isPublicRoute(req)) {
      await auth.protect();
    }
  })(request, event);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.[\\w]+$|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
