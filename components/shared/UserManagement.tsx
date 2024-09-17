'use client'

import { useState, useEffect } from 'react';
import { updateUserRole, getAllUsers, downloadUserPhoneNumbers } from '@/lib/actions/user.actions';
import { Button } from '@/components/ui/button';

type User = {
  id: string;
  customName: string;
  customPhone: string;
  role: 'user' | 'admin' | 'superadmin';
};

const UserManagement = ({ isSuperAdmin }: { isSuperAdmin: boolean }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const fetchedUsers = await response.json();
        setUsers(fetchedUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
        setMessage('Failed to fetch users. 获取用户失败。');
      }
    };
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin' | 'superadmin') => {
    try {
      await updateUserRole(userId, newRole);
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
    } catch (error) {
      console.error('Failed to update user role:', error);
    }
  };

  const handleDownloadPhoneNumbers = async () => {
    try {
      await downloadUserPhoneNumbers();
    } catch (error) {
      console.error('Failed to download phone numbers:', error);
    }
  };

  return (
    <div>
      {isSuperAdmin && (
        <Button onClick={handleDownloadPhoneNumbers} className="mb-4">
          Download Phone Numbers
        </Button>
      )}
      <table className="min-w-full bg-white border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-2 px-4 border-b text-left">Name</th>
            {isSuperAdmin && <th className="py-2 px-4 border-b text-left">Phone Number</th>}
            <th className="py-2 px-4 border-b text-left">Role</th>
            <th className="py-2 px-4 border-b text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="py-2 px-4 border-b text-left">{user.customName}</td>
              {isSuperAdmin && <td className="py-2 px-4 border-b text-left">{user.customPhone}</td>}
              <td className="py-2 px-4 border-b text-left">{user.role}</td>
              <td className="py-2 px-4 border-b text-center">
                <select
                  value={user.role}
                  onChange={(e) =>
                    handleRoleChange(user.id, e.target.value as 'user' | 'admin' | 'superadmin')
                  }
                  className="border rounded px-2 py-1"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  {isSuperAdmin && <option value="superadmin">Superadmin</option>}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserManagement;
