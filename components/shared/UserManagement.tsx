'use client'

import { useState, useEffect } from 'react';
import { getAllUniquePhoneNumbers } from '@/lib/actions/user.actions';
import { Button } from '@/components/ui/button';

type User = {
  phoneNumber: string;
  name: string;
  isNewUser: boolean;
};

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const fetchedUsers = await getAllUniquePhoneNumbers();
        setUsers(fetchedUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
        setMessage('Failed to fetch users. 获取用户失败。');
      }
    };
    fetchUsers();
  }, []);

  const handleDownloadPhoneNumbers = () => {
    window.location.href = '/api/download-users-csv';
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
            <th className="py-2 px-4 border-b text-left">Phone Number</th>
            <th className="py-2 px-4 border-b text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user, index) => (
            <tr key={index} className={`hover:bg-gray-50 ${user.isNewUser ? 'bg-yellow-100' : ''}`}>
              <td className="py-2 px-4 border-b text-left">{user.name}</td>
              <td className="py-2 px-4 border-b text-left">{user.phoneNumber}</td>
              <td className="py-2 px-4 border-b text-left">{user.isNewUser ? 'New' : 'Existing'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {message && <p className="mt-4 text-sm text-gray-600">{message}</p>}
    </div>
  );
};

export default UserManagement;
