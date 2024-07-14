'use client';

import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { Button } from '../ui/button';
import Link from 'next/link';

export default function Nav() {
  const pathname = usePathname();
  if (pathname.includes('room')) return null;
  const isOnSignInPage = pathname.includes('sign-in');
  const isOnSignUpPage = pathname.includes('sign-up');
  return (
    <div className="fixed top-0 h-16 bg-opacity-90 bg-gray-50 w-full">
      <div className="h-full flex items-center justify-between px-2 container">
        <Link href="/">
          <h1 className="bg-gradient-to-r from-blue-500 to-purple-400 text-3xl bg-clip-text text-transparent font-semibold">
            Pictionary With Friends
          </h1>
        </Link>

        <div>
          {!isOnSignUpPage && (
            <SignedIn>
              <UserButton />
            </SignedIn>
          )}

          {!isOnSignInPage && (
            <SignedOut>
              <Button asChild>
                <SignInButton>Sign In</SignInButton>
              </Button>
            </SignedOut>
          )}
        </div>
      </div>
    </div>
  );
}
