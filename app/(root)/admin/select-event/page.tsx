import { currentUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import SelectEventClient from './SelectEventClient';

export default async function SelectEventPage() {
  const user = await currentUser();
  const isAdmin = user?.publicMetadata?.role === 'admin' || user?.publicMetadata?.role === 'superadmin';

  if (!isAdmin) {
    return redirect('/');
  }

  return <SelectEventClient />;
}
