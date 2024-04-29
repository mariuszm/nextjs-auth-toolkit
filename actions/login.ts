'use server';

import { AuthError } from 'next-auth';
import { z } from 'zod';

import { signIn } from '@/auth';
import { getUserByEmail } from '@/data/user';
import { sendVerificationEmail } from '@/lib/mail';
import { generateVerificationToken } from '@/lib/tokens';
import { DEFAULT_LOGIN_REDIRECT } from '@/routes';
import { LoginSchema } from '@/schemas';

export const login = async (values: z.infer<typeof LoginSchema>) => {
  const validatedFields = LoginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: 'Invalid fields!' };
  }

  const { email, password } = validatedFields.data;

  const existingUser = await getUserByEmail(email);

  // TODO: tests - disable login for not existing credential/oauth users
  if (!existingUser || !existingUser.email || !existingUser.password) {
    // existingUser.password === false -> oauth login
    return { error: 'Email does not exist!' };
  }

  // don't allow login if the user still haven't verified his email
  // and show him another confirmation message
  // TODO: tests - disable login for not credential users without verified email (check for error messages)
  if (!existingUser.emailVerified) {
    const verificationToken = await generateVerificationToken(
      existingUser.email,
    );

    await sendVerificationEmail(
      verificationToken.email,
      verificationToken.token,
    );

    return { success: 'Confirmation email sent!' };
  }

  // NOTE: remember to put equivalent things (from above) inside of auth.js callbacks

  try {
    // TODO: tests - redirect to /settings after successful login
    await signIn('credentials', {
      email,
      password,
      redirectTo: DEFAULT_LOGIN_REDIRECT,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        // TODO: tests - invalid credentials
        case 'CredentialsSignin':
          return { error: 'Invalid credentials!' };
        default:
          return { error: 'Something went wrong!' };
      }
    }

    throw error; // throw error to make redirect actually work
  }
};
