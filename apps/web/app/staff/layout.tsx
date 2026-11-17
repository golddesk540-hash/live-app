import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { validateSessionToken, isStaffMember } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Server-side authorization layout for /staff preview tool.
 * Protects:
 * - /staff
 * - Any nested staff preview pages.
 *
 * Verifies session via existing validateSessionToken and checks staff clearance via isStaffMember.
 * Unauthenticated visitors and normal members are redirected to /login.
 */
export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const sessionToken = cookieStore.get('poppo_session')?.value;

  if (!sessionToken) {
    redirect('/login');
  }

  const user = await validateSessionToken(sessionToken);

  if (!user || !isStaffMember(user)) {
    redirect('/login');
  }

  return <>{children}</>;
}
