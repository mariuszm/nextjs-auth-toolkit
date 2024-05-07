'use server';

import { signOut } from '@/auth';

export const logout = async () => {
  // Why use this server action?
  // If you wanna do some server stuff before the logout
  await signOut();
};
