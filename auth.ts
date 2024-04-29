import { PrismaAdapter } from '@auth/prisma-adapter';
import NextAuth from 'next-auth';

import authConfig from '@/auth.config';
import { db } from '@/lib/db';

import { getUserById } from './data/user';

// destruct data to be used server components/actions
export const { auth, handlers, signIn, signOut } = NextAuth({
  pages: {
    signIn: '/auth/login', // next-auth is always gonna redirect to this route, when something goes wrong
    error: '/auth/error', // if something else goes wrong (regardless login) redirect to this custom error page
  },
  events: {
    /**
     * whenever a user creates an account using google/github,
     * we're gonna automatically populate the field emailVerified
     * (there's no need to verify an email coming from an OAuth provider)
     */
    async linkAccount({ user }) {
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    },
  },
  callbacks: {
    /**
     * Callback are powerful function to control what happens when an action is performed.
     *
     * Sometimes auth.js can redirect us to a special page that it generates by itself
     * so from there we don't protect anything.
     * So whatever you do in your login/register functions you also have to do
     * an equivalent in your callbacks (for the sake of total security & user experience).
     * Remember to always have equivalent things inside of NextAuth.
     * Whatever you write in your server actions / api route match that inside of callbacks
     & as much as you can (as a fallback) to highly improve the security of the application.
     */
    async signIn({ user, account }) {
      /**
       * No matter the method (api endpoint / server action) things in callbacks will be run for both.
       * Example: if any of those methods is used for log in, NextAuth is never gonna allow to login
       * if we write that inside of signIn() callback
       */
      // allow OAuth without email verification
      if (account?.provider !== 'credentials') return true;

      if (!user.id) return false;

      const existingUser = await getUserById(user.id);

      if (!existingUser?.emailVerified) return false;

      // TODO: add 2FA check

      return true;
    },
    async session({ token, session }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (token.role && session.user) {
        session.user.role = token.role;
      }

      return session;
    },
    async jwt({ token }) {
      /**
       * Extending the session:
       * We have to pass new data to the token first, because we can get access
       * to the token inside of middleware from the request (req). Then it will be
       * useful to know, whether someone is an admin or not inside of middleware,
       * because then we can add a check like isAdminRoute to create role-based access.
       */
      if (!token.sub) return token; // no sub = logged out

      const exisitingUser = await getUserById(token.sub);

      if (!exisitingUser) return token;

      token.role = exisitingUser.role;

      return token;
    },
  },
  adapter: PrismaAdapter(db), // prisma adapter doesn't work on the Edge
  session: { strategy: 'jwt' },
  ...authConfig,
});
