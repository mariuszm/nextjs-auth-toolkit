import { v4 as uuidv4 } from 'uuid';

import { getVerificationTokenByEmail } from '@/data/verification-token';
import { db } from '@/lib/db';

/**
 * Generate (any kind of) tokens and make sure that
 * if an existing token exists, it gets removed
 */

export const generateVerificationToken = async (email: string) => {
  const token = uuidv4();
  const expires = new Date(Date.now() + 3600 * 1000); // expire the token in 1 hour

  // check if we have an existing token already sent from this email
  const existingToken = await getVerificationTokenByEmail(email);

  if (existingToken) {
    await db.verificationToken.delete({
      where: { id: existingToken.id },
    });
  }

  //  generate new verification token
  const verificationToken = await db.verificationToken.create({
    data: {
      email,
      token,
      expires,
    },
  });

  return verificationToken;
};
