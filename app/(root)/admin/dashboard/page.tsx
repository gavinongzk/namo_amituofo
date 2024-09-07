import Link from 'next/link';
import { currentUser } from '@clerk/nextjs';
import AdminActions from '@/components/shared/AdminActions';

const AdminDashboard = async () => {
  const user = await currentUser();
  const isAdmin = user?.publicMetadata?.role === 'admin' || user?.publicMetadata?.role === 'superadmin';

  if (!isAdmin) {
    return <div>You do not have access to this page.</div>;
  }

  return (
    <div className="wrapper my-8">
      <section className="bg-primary-50 bg-dotted-pattern bg-cover bg-center py-5 md:py-10">
        <h3 className="wrapper h3-bold text-center sm:text-left">Admin Dashboard</h3>
      </section>

      <AdminActions />
    </div>
  );
};

export default AdminDashboard;
