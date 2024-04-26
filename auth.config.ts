import bcrypt from 'bcryptjs';
import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

import { getUserByEmail } from '@/data/user';
import { LoginSchema } from '@/schemas';

/**
 * Credentials provider:
 * Covering a case when users bypass our server action (login.ts) and not use the login screen at all.
 * They can manually send information to the app/api/auth if they want,
 * thus we have to do the LoginSchema check here in the providers.
 *
 * NOTE: we can use Prisma (eg. getUserByEmail) inside of Providers because
 * it doesn't run on the Edge, but simply run once the user tries to sign in.
 */

export default {
  providers: [
    Credentials({
      async authorize(credentials) {
        const validatedFields = LoginSchema.safeParse(credentials);

        if (validatedFields.success) {
          const { email, password } = validatedFields.data;

          const user = await getUserByEmail(email);
          if (!user || !user.password) return null; // e.g. no password = attemp to log in via google/github

          // compare hashed passwords (user password with db password)
          const passwordsMatch = await bcrypt.compare(password, user.password);

          if (passwordsMatch) return user;
        }

        return null;
      },
    }),
  ],
} satisfies NextAuthConfig;
