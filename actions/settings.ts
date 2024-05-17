'use server';

import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { unstable_update } from '@/auth';
import { getUserByEmail, getUserById } from '@/data/user';
import { currentUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { sendVerificationEmail } from '@/lib/mail';
import { generateVerificationToken } from '@/lib/tokens';
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

  // send the verification token only if the user is trying to update an email
  if (values.email && values.email !== user.email) {
    // confirm that the new email isn't used by another user
    const existingUser = await getUserByEmail(values.email);

    // confirm that we are not that user
    if (existingUser && existingUser.id !== user.id) {
      return { error: 'Email already in use!' };
    }

    const verificationToken = await generateVerificationToken(values.email);
    await sendVerificationEmail(
      verificationToken.email,
      verificationToken.token,
    );
    // NOTE: sending a verification email will work AFTER a domain is added
    // to your mailing system to send emails to anyone else

    return { success: 'Verification email sent!' };
  }

  if (values.password && values.newPassword && dbUser.password) {
    // check if user entered a correct password
    const passwordsMatch = await bcrypt.compare(
      values.password,
      dbUser.password,
    );

    if (!passwordsMatch) {
      return { error: 'Incorrect password!' };
    }

    const hashedPassword = await bcrypt.hash(values.newPassword, 10);

    values.password = hashedPassword;
    values.newPassword = undefined;
  }

  const updatedUser = await db.user.update({
    where: { id: dbUser.id },
    data: {
      ...values,
    },
  });

  /**
   * TODO: improve the code when stable version is released.
   * BTW this is not necessary. Just wanted to try out the server-side way
   */
  await unstable_update({
    user: {
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      isTwoFactorEnabled: updatedUser.isTwoFactorEnabled,
    },
  });

  return { success: 'Settings updated!' };
};
