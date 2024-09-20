'use client'

import { useState, useEffect } from 'react';
import { getAllUsers, downloadUserPhoneNumbers, updateUserRole } from '@/lib/actions/user.actions';
import { Button } from '@/components/ui/button';


type User = {
  id: string;
  customName: string;
  customPhone: string;
  role: 'user' | 'admin' | 'superadmin';
};

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [message, setMessage] = useState<string>('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const fetchedUsers = await response.json();
        setUsers(fetchedUsers);
        // Assuming the API response includes the current user's role
        setIsSuperAdmin(fetchedUsers.currentUserRole === 'superadmin');
      } catch (error) {
        console.error('Error fetching users:', error);
        setMessage('Failed to fetch users. 获取用户失败。');
      }
    };
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin' | 'superadmin') => {
    try {
      console.log('Updating role for user:', userId, 'to', newRole);
      const result = await updateUserRole(userId, newRole);
      if (result.success) {
        setMessage(`Successfully updated role for user ${userId} to ${newRole}. Refreshing...`);
        // Refresh the page after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        throw new Error(result.error || 'Failed to update user role');
      }
    } catch (error) {
      console.error('Failed to update user role:', error);
      setMessage(`Failed to update user role: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDownloadPhoneNumbers = async () => {
    try {
      const csvContent = users.map(user => `${user.customName},${user.customPhone}`).join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'user_phone_numbers.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Failed to download phone numbers:', error);
    }
  };

  return (
    <div>
      <Button onClick={handleDownloadPhoneNumbers} className="mb-4">
        Download Phone Numbers
      </Button>
      <table className="min-w-full bg-white border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-2 px-4 border-b text-left">Name</th>
            {isSuperAdmin && <th className="py-2 px-4 border-b text-left">Phone Number</th>}
            <th className="py-2 px-4 border-b text-left">Role</th>
            {isSuperAdmin && <th className="py-2 px-4 border-b text-center">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="py-2 px-4 border-b text-left">{user.customName}</td>
              {isSuperAdmin && <td className="py-2 px-4 border-b text-left">{user.customPhone}</td>}
              <td className="py-2 px-4 border-b text-left">{user.role}</td>
              {isSuperAdmin && (
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
                    <option value="superadmin">Superadmin</option>
                  </select>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserManagement;
