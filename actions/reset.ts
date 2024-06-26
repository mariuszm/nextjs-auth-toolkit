'use server';

import { z } from 'zod';

import { getAccountByUserId } from '@/data/account';
import { getUserByEmail } from '@/data/user';
import { sendPasswordResetEmail } from '@/lib/mail';
import { generatePasswordResetToken } from '@/lib/tokens';
import { ResetSchema } from '@/schemas';

export const reset = async (values: z.infer<typeof ResetSchema>) => {
  const validatedFields = ResetSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: 'Invalid email!' }; // sever-side validation in case they bypass the frontend-side validation
  }

  const { email } = validatedFields.data;

  const existingUser = await getUserByEmail(email);

  if (!existingUser) {
    return { error: 'Email not found!' };
  }

  const isOAuth = await getAccountByUserId(existingUser.id);

  if (isOAuth) {
    return { error: 'Provider account! Change not allowed!' };
  }

  try {
    const passwordResetToken = await generatePasswordResetToken(email);
    await sendPasswordResetEmail(
      passwordResetToken.email,
      passwordResetToken.token,
    );

    return { success: 'Reset email sent!' };
  } catch {
    return { error: 'Something went wrong!' };
  }
};
