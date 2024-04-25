import { auth, signOut } from '@/auth';

const SettingsPage = async () => {
  const session = await auth();

  return (
    <div>
      {JSON.stringify(session)}
      <form
        action={async () => {
          'use server';

          await signOut({ redirectTo: '/auth/login' }); // redirectTo needed to properly update the address bar
        }}
      >
        <button type="submit">Sign out</button>
      </form>
    </div>
  );
};

export default SettingsPage;
