import { currentUser } from '@clerk/nextjs';
import { redirect } from 'next/navigation';
import AlwaysAddUsersManager from '@/components/shared/AlwaysAddUsersManager';

const AlwaysAddUsersPage = async () => {
  const user = await currentUser();
  const role = user?.publicMetadata?.role;

  if (role !== 'superadmin') {
    redirect('/');
  }

  return (
    <div className="wrapper my-8">
      <h1 className="h2-bold mb-6">Always Add Users</h1>
      <AlwaysAddUsersManager />
    </div>
  );
};

export default AlwaysAddUsersPage;
