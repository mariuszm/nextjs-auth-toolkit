import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

import { getPasswordResetTokenByEmail } from '@/data/password-reset-token';
import { getTwoFactorTokenByEmail } from '@/data/two-factor-token';
import { getVerificationTokenByEmail } from '@/data/verification-token';
import { db } from '@/lib/db';

/**
 * Generate (any kind of) tokens and make sure that
 * if an existing token exists, it gets removed
 */

export const generateTwoFactorToken = async (email: string) => {
  const token = crypto.randomInt(100_000, 1_000_000).toString();
  const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

  const existingToken = await getTwoFactorTokenByEmail(email);

  return db.$transaction(async tx => {
    if (existingToken) {
      await tx.twoFactorToken.delete({
        where: { id: existingToken.id },
      });
    }

    const twoFactorToken = await tx.twoFactorToken.create({
      data: {
        email,
        token,
        expires,
      },
    });

    return twoFactorToken;
  });
};

export const generatePasswordResetToken = async (email: string) => {
  const token = uuidv4();
  const expires = new Date(Date.now() + 3600 * 1000); // expire the token in 1 hour

  const existingToken = await getPasswordResetTokenByEmail(email);

  return db.$transaction(async tx => {
    if (existingToken) {
      await tx.passwordResetToken.delete({
        where: { id: existingToken.id },
      });
    }

    const passwordResetToken = await tx.passwordResetToken.create({
      data: {
        email,
        token,
        expires,
      },
    });

    return passwordResetToken;
  });
};

export const generateVerificationToken = async (email: string) => {
  const token = uuidv4();
  const expires = new Date(Date.now() + 3600 * 1000); // expire the token in 1 hour

  // check if we have an existing token already sent from this email
  const existingToken = await getVerificationTokenByEmail(email);

  return db.$transaction(async tx => {
    if (existingToken) {
      await tx.verificationToken.delete({
        where: { id: existingToken.id },
      });
    }

    //  generate new verification token
    const verificationToken = await tx.verificationToken.create({
      data: {
        email,
        token,
        expires,
      },
    });

    return verificationToken;
  });
};
