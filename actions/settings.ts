'use server';

import { z } from 'zod';

import { getUserById } from '@/data/user';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { SettingsSchema } from '@/schemas';

export const settings = async (values: z.infer<typeof SettingsSchema>) => {
  const user = await currentUser();

  if (!user) {
    return { error: 'Unauthorized' };
  }

  // check if user exist in the db,
  // and it's not some leftover session
  if (!user.id) return;
  const dbUser = await getUserById(user.id);

  if (!dbUser) {
    return { error: 'Unauthorized' };
  }

  /**
   * Check if the user who wants to update the settings,
   * is logged in using credentials or oauth
   *
   * NOTE: if the field is disabled in the api or the server action,
   * it should be also hidden on the client side
   */
  if (user.isOAuth) {
    // these are the fields that oauth users cannot modify
    values.email = undefined; // handled by the provider
    values.password = undefined; // they don't have a password
    values.newPassword = undefined;
    values.isTwoFactorEnabled = undefined; // handled by the provider
  }

  await db.user.update({
    where: { id: dbUser.id },
    data: {
      ...values,
    },
  });

  return { success: 'Settings updated!' };
};
