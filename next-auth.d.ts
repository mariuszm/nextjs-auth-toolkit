// https://authjs.dev/getting-started/typescript#module-augmentation
import type { UserRole } from '@prisma/client';
import type { DefaultSession } from 'next-auth';
import type { DefaultJWT } from 'next-auth/jwt';

export type ExtendedUser = DefaultSession['user'] & {
  email: Extract<DefaultSession['user']['email'], string>;
  role: UserRole;
  isTwoFactorEnabled: boolean;
  isOAuth: boolean;
};

declare module 'next-auth' {
  interface Session {
    user: ExtendedUser;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    email: Extract<DefaultJWT['email'], string>;
    role?: UserRole;
    isTwoFactorEnabled: boolean;
    isOAuth: boolean;
  }
}
