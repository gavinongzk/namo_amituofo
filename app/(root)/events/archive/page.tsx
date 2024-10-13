import { currentUser } from '@clerk/nextjs';
import ArchiveClient from '@/components/shared/ArchiveClient';
import { redirect } from 'next/navigation';

const ArchivePage = async () => {
  const user = await currentUser();
  const isSuperAdmin = user?.publicMetadata?.role === 'superadmin';

  if (!isSuperAdmin) {
    return redirect('/');
  }

  return (
    <div>
      <ArchiveClient />
    </div>
  );
};

export default ArchivePage;

