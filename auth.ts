import { PrismaAdapter } from '@auth/prisma-adapter';
import NextAuth from 'next-auth';

import authConfig from '@/auth.config';
import { getAccountByUserId } from '@/data/account';
import { getTwoFactorConfirmationByUserId } from '@/data/two-factor-confirmation';
import { getUserById } from '@/data/user';
import { db } from '@/lib/db';

// destruct data to be used server components/actions
export const { auth, handlers, signIn, signOut } = NextAuth({
  pages: {
    signIn: '/auth/login', // next-auth is always gonna redirect to this route, when something goes wrong
    error: '/auth/error', // if something else goes wrong (regardless login) redirect to this custom error page
  },
  events: {
    /**
     * Events don't return a response, used for logs/reporting or handling other side effects
     */
    async linkAccount({ user }) {
      /**
       * whenever a user creates an account using google/github,
       * we're gonna automatically populate the field emailVerified
       * (there's no need to verify an email coming from an OAuth provider)
       */
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
      // TODO: tests - allow everything to login except when using credentials
      if (account?.provider !== 'credentials') return true;

      if (!user.id) return false;

      const existingUser = await getUserById(user.id);

      // TODO: tests - check API login credential users that are not verified (not allowed)
      // prevent sign in without email verification
      if (!existingUser?.emailVerified) return false;

      // TODO: tests - 2FA check for credential users
      if (existingUser.isTwoFactorEnabled) {
        // pay attention not tu use 2FAToken, we need 2FAConfirmation here
        const twoFactorConfirmation = await getTwoFactorConfirmationByUserId(
          existingUser.id,
        );

        if (!twoFactorConfirmation) return false;

        /**
         * Delete 2FA confirmation for next sign in.
         * It's safer for 2FA to be very strict BUT:
         *
         * you can do otherwise - instead of deleting confirmation
         * on every login, just add "expires" (eg. 2 days) field to your
         * TwoFactorConfirmation model in Prisma.
         * And then make it work the same way like for other tokens we use.
         */
        await db.twoFactorConfirmation.delete({
          where: { id: twoFactorConfirmation.id },
        });
      }

      return true;
    },
    async session({ token, session }) {
      // TODO: tests - check if session is successfully extended with token data
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (token.role && session.user) {
        session.user.role = token.role;
      }

      if (session.user) {
        session.user.isTwoFactorEnabled = Boolean(token.isTwoFactorEnabled);
      }

      // manually update the session everytime you change the specific field
      if (session.user) {
        session.user.name = token.name;
        session.user.email = token.email || '';
        session.user.isOAuth = token.isOAuth;
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

      const existingAccount = await getAccountByUserId(exisitingUser.id);

      token.isOAuth = Boolean(existingAccount);
      token.name = exisitingUser.name;
      token.email = exisitingUser.email;
      token.role = exisitingUser.role;
      token.isTwoFactorEnabled = exisitingUser.isTwoFactorEnabled;

      return token;
    },
  },
  adapter: PrismaAdapter(db), // prisma adapter doesn't work on the Edge
  session: { strategy: 'jwt' },
  ...authConfig,
});
