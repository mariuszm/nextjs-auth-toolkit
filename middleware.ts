import { NextResponse } from 'next/server';
import NextAuth from 'next-auth';

import authConfig from '@/auth.config';
import {
  apiAuthPrefix,
  authRoutes,
  DEFAULT_LOGIN_REDIRECT,
  publicRoutes,
} from '@/routes';

const { auth } = NextAuth(authConfig);

export default auth(req => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);

  /**
   * TODO: add tests for these use cases:
   * 1. isApiAuthRoute - allow access to API auth route (should be always accessible, eg. /api/auth/providers)
   * 2. isPublicRoute - allow access to public routes.
   * The order matters: check isAuthRoute before to avoid infinite redirect loop
   * 3. isAuthRoute - handle auth routes:
   * a) if the user is already logged in and tries to access toe login screen,
   *   we are not gonna allow that (redirect him back to the /settings page instead)
   * b) do the opposite if the user is logged out
   *
   * When not logged in, you should be able to see normally:
   * - /auth/login
   * - /auth/register
   * - /api/auth/providers
   * except /settings - instead immediately redirected back to login page
   */

  if (isApiAuthRoute) return undefined;

  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, nextUrl));
    }
    return undefined;
  }

  // don't allow access to protected routes unless logged in
  if (!isLoggedIn && !isPublicRoute) {
    /**
     * Store the last place the user has visited on log out,
     * and after logging back redirect to that path again
     */
    let callbackUrl = nextUrl.pathname;
    if (nextUrl.search) {
      callbackUrl += nextUrl.search;
    }

    const encodedCallbackUrl = encodeURIComponent(callbackUrl);
    return NextResponse.redirect(
      new URL(`/auth/login?callbackUrl=${encodedCallbackUrl}`, nextUrl),
    );
  }

  return undefined;
});

// Optionally, don't invoke Middleware on some paths
export const config = {
  /**
   * Invoke the middleware with following match
   * (basically every single route except specific next.js static files/images).
   * Reason: to invoke a middleware everywhere
   * (both on authorized routes, routes used login, private routes, public routes).
   * And then in the middleware we can decide what to do with those routes.
   *
   * This way the entire app is protected by default (like most of modern apps).
   * You're most likely gonna have fewer public routes than private routes. So it doesn't
   * make sense to write every single private route. Instead, let's consider the entire
   * app to be fully protected and need to be authorized to access it. And then we can
   * separate just a couple of routes like the landing page, documentation, etc. to be able
   * to be accessed for non-authorized users.
   * We don't care about which future routes/subroutes could be added, so with the regexp
   * we invoke middleware every single time when any of those routes is being touched.
   *
   */
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};
