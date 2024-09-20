'use client'

import { useState, useEffect } from 'react';
import { getAllUsers, downloadUserPhoneNumbers } from '@/lib/actions/user.actions';
import { Button } from '@/components/ui/button';

type User = {
  id: string;
  name: string;
  phoneNumbers: string[];
};

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const fetchedUsers = await getAllUsers();
      setUsers(fetchedUsers.map(user => ({
        ...user,
        phoneNumbers: user.phoneNumber ? [user.phoneNumber] : []
      })));
    };
    fetchUsers();
  }, []);

  const handleDownloadPhoneNumbers = async () => {
    try {
      const csvContent = users.flatMap(user => 
        user.phoneNumbers.map(phone => `${user.name},${phone}`)
      ).join('\n');
      
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
            <th className="py-2 px-4 border-b text-left">Phone Numbers</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="py-2 px-4 border-b text-left">{user.name}</td>
              <td className="py-2 px-4 border-b text-left">{user.phoneNumbers.join(', ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserManagement;
