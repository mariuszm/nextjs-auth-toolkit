'use server';

import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { getPasswordResetTokenByToken } from '@/data/password-reset-token';
import { getUserByEmail } from '@/data/user';
import { db } from '@/lib/db';
import { NewPasswordSchema } from '@/schemas';

export const newPassword = async (
  values: z.infer<typeof NewPasswordSchema>,
  token?: string | null,
) => {
  if (!token) {
    return { error: 'Missing token!' };
  }

  const validatedFields = NewPasswordSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: 'Invalid fields!' };
  }

  const { password } = validatedFields.data;

  const existingToken = await getPasswordResetTokenByToken(token);

  if (!existingToken) {
    return { error: 'Invalid token!' };
  }

  const hasExpired = new Date(existingToken.expires) < new Date();

  if (hasExpired) {
    return { error: 'Token has expired!' };
  }

  const existingUser = await getUserByEmail(existingToken.email);

  if (!existingUser) {
    return { error: 'Email does not exist!' };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const updateUser = db.user.update({
      where: { id: existingUser.id },
      data: { password: hashedPassword },
    });

    const deletePasswordResetToken = db.passwordResetToken.delete({
      where: { id: existingToken.id },
    });

    await db.$transaction([updateUser, deletePasswordResetToken]);

    return { success: 'Password updated!' };
  } catch (error) {
    return { error: 'Something went wrong!' };
  }
};
