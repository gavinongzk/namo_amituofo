'use client'

import { useState, useEffect } from 'react';
import { updateUserRole } from '@/lib/actions/user.actions';

type User = {
  id: string;
  name: string;
  role: 'user' | 'admin' | 'superadmin';
};

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);

  // Fetch users...
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        const data: User[] = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };

    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin' | 'superadmin') => {
    try {
      await updateUserRole(userId, newRole);
      // Update local state or refetch users
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
    } catch (error) {
      console.error('Failed to update user role:', error);
    }
  };

  return (
    <div>
      {users.map((user) => (
        <div key={user.id}>
          <span>{user.name}</span>
          <select
            value={user.role}
            onChange={(e) =>
              handleRoleChange(user.id, e.target.value as 'user' | 'admin' | 'superadmin')
            }
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="superadmin">Superadmin</option>
          </select>
        </div>
      ))}
    </div>
  );
};

export default UserManagement;
