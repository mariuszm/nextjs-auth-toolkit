import { PrismaAdapter } from '@auth/prisma-adapter';
import NextAuth from 'next-auth';

import authConfig from '@/auth.config';
import { db } from '@/lib/db';

export const { auth, handlers } = NextAuth({
  adapter: PrismaAdapter(db), // prisma adapter doesn't work on the Edge
  session: { strategy: 'jwt' },
  ...authConfig,
});
