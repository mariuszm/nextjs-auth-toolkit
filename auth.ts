import { PrismaAdapter } from '@auth/prisma-adapter';
import NextAuth from 'next-auth';

import authConfig from '@/auth.config';
import { db } from '@/lib/db';

import { getUserById } from './data/user';

// destruct data to be used server components/actions
export const { auth, handlers, signIn, signOut } = NextAuth({
  callbacks: {
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
