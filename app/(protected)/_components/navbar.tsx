'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { UserButton } from '@/components/auth/user-button';
import { Button } from '@/components/ui/button';

const Navbar = () => {
  const pathname = usePathname();

  return (
    <nav className="flex w-[600px] items-center justify-between rounded-xl bg-secondary p-4 shadow-sm">
      <div className="flex gap-x-2">
        <Button
          variant={pathname === '/server' ? 'default' : 'outline'}
          asChild
        >
          <Link href="/server">Server</Link>
        </Button>
        <Button
          variant={pathname === '/client' ? 'default' : 'outline'}
          asChild
        >
          <Link href="/client">Client</Link>
        </Button>
        <Button variant={pathname === '/admin' ? 'default' : 'outline'} asChild>
          <Link href="/admin">Admin</Link>
        </Button>
        <Button
          variant={pathname === '/settings' ? 'default' : 'outline'}
          asChild
        >
          <Link href="/settings">Settings</Link>
        </Button>
      </div>
      <UserButton />
    </nav>
  );
};

export default Navbar;
