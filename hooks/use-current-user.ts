import { useSession } from 'next-auth/react';

export const useCurrentUser = () => {
  /**
   * TODO: Check with:
   * const { data, status } = useSession({ required: true });
   */
  const session = useSession();

  return session.data?.user;
};
