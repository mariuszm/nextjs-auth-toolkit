/**
 * These methods can be used in server components,
 * server actions and API routes. So basically anything server-side.
 *
 * For client components use hooks.
 */

import { auth } from '@/auth';

export const currentUser = async () => {
  const session = await auth();

  return session?.user;
};

export const currentRole = async () => {
  const session = await auth();

  return session?.user.role;
};
