'use client';

import { FaGithub } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';

import { Button } from '@/components/ui/button';
import { DEFAULT_LOGIN_REDIRECT } from '@/routes';

export const Social = () => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');

  const onClick = (provider: 'google' | 'github') => () => {
    // signIn() imported like this is the way to be used in client components only
    signIn(provider, {
      callbackUrl: callbackUrl || DEFAULT_LOGIN_REDIRECT,
    });
  };
  return (
    <div className="flex w-full items-center gap-x-2">
      <Button
        className="w-full"
        size="lg"
        variant="outline"
        onClick={onClick('google')}
      >
        <FcGoogle className="h-5 w-5" />
      </Button>
      <Button
        className="w-full"
        size="lg"
        variant="outline"
        onClick={onClick('github')}
      >
        <FaGithub className="h-5 w-5" />
      </Button>
    </div>
  );
};
