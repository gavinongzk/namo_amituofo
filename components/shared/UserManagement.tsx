'use client'

import { useState, useEffect, useCallback } from 'react';
import { getAllUniquePhoneNumbers } from '@/lib/actions/user.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';

type User = {
  phoneNumber: string;
  name: string;
  isNewUser: boolean;
  remarks?: string;
};

const UserManagement = ({ country }: { country: string }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [customDate, setCustomDate] = useState('');
  const [message, setMessage] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const formattedDate = oneWeekAgo.toISOString().split('T')[0];
    setCustomDate(formattedDate);
    fetchUsers(formattedDate);
  }, []);

  const fetchUsers = async (date?: string) => {
    setIsLoading(true);
    try {
      const fetchedUsers = await getAllUniquePhoneNumbers(country, date);
      const taggedUsers = await fetch('/api/tagged-users').then(res => res.json());
      
      const updatedUsers = fetchedUsers.map(user => {
        const taggedUser = taggedUsers.find((tu: User) => tu.phoneNumber === user.phoneNumber);
        return { ...user, remarks: taggedUser?.remarks || '' };
      });
      
      setUsers(updatedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage('Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRemarks = async (phoneNumber: string, name: string, remarks: string) => {
    setIsLoading(true);
    try {
      await fetch('/api/tagged-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, name, remarks }),
      });
      await fetchUsers(customDate);
      setEditingUser(null);
    } catch (error) {
      console.error('Error updating remarks:', error);
      setMessage('Failed to update remarks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPhoneNumbers = () => {
    setIsDownloading(true);
    window.location.href = '/api/download-users-csv';
    setTimeout(() => setIsDownloading(false), 3000); // Reset after 3 seconds
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomDate(e.target.value);
  };

  const handleApplyDate = () => {
    fetchUsers(customDate);
  };

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    try {
      const data = await readExcelFile(file);
      const response = await fetch('/api/tagged-users/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: data })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error);
      }

      setMessage(result.message);
      await fetchUsers(customDate); // Refresh the list
    } catch (error: unknown) {
      console.error('Error uploading file:', error);
      setMessage(error instanceof Error ? error.message : 'Failed to upload file');
    } finally {
      setIsLoading(false);
    }
  };

  const readExcelFile = (file: File): Promise<Array<{ phoneNumber: string; name: string }>> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];

          // Check if the file has any data
          if (jsonData.length === 0) {
            throw new Error('File is empty');
          }

          // Get the first row to check headers
          const headers = Object.keys(jsonData[0]);
          const phoneNumberHeader = headers.find(h => 
            h.toLowerCase().includes('phone') || 
            h.toLowerCase() === 'phonenumber' || 
            h.toLowerCase() === 'contact'
          );
          const nameHeader = headers.find(h => 
            h.toLowerCase().includes('name')
          );

          if (!phoneNumberHeader) {
            throw new Error(
              'Missing phone number column. Expected one of these headers: ' +
              '"Phone Number", "PhoneNumber", "Contact Number", "Phone", "Contact"'
            );
          }
          
          const formattedData = jsonData.map((row: any) => ({
            phoneNumber: row[phoneNumberHeader]?.toString() || '',
            name: nameHeader ? row[nameHeader]?.toString() || 'Unknown' : 'Unknown'
          }));
          
          resolve(formattedData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleFileUpload(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    multiple: false
  });

  return (
    <div>
      <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Button onClick={handleDownloadPhoneNumbers} disabled={isDownloading}>
          {isDownloading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Downloading...
            </>
          ) : (
            'Download Phone Numbers'
          )}
        </Button>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Input
            type="date"
            value={customDate}
            onChange={handleDateChange}
            className="w-full sm:w-auto"
          />
          <Button onClick={handleApplyDate} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Apply Date'
            )}
          </Button>
        </div>
      </div>
      <div className="mb-4">
        <div className="p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary-500 transition-colors" {...getRootProps()}>
          <input {...getInputProps()} />
          <div className="text-center">
            {isDragActive ? (
              <p>Drop the Excel file here...</p>
            ) : (
              <p>Drag and drop an Excel file here, or click to select file</p>
            )}
            <div className="mt-2 text-sm text-gray-500">
              <p>Accepted column headers:</p>
              <ul className="list-disc list-inside mt-1">
                <li>
                  <strong>Phone Number</strong> (required) - Any of these:
                  <br />
                  "Phone Number", "PhoneNumber", "Contact Number", "Phone", "Contact"
                </li>
                <li>
                  <strong>Name</strong> (optional) - Any of these:
                  <br />
                  "Name", "Full Name", "Customer Name"
                </li>
              </ul>
              <p className="mt-1">Supports .xlsx, .xls, and .csv files</p>
            </div>
          </div>
        </div>
        {message && (
          <p className={`mt-2 text-sm ${message.includes('Error') || message.includes('Failed') ? 'text-red-600' : 'text-green-600'}`}>
            {message}
          </p>
        )}
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : (
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border-b text-left">Name</th>
              <th className="py-2 px-4 border-b text-left">Phone Number</th>
              <th className="py-2 px-4 border-b text-left">Status</th>
              <th className="py-2 px-4 border-b text-left">Remarks</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={index} className={`hover:bg-gray-50 ${user.isNewUser ? 'bg-yellow-100' : ''}`}>
                <td className="py-2 px-4 border-b text-left">{user.name}</td>
                <td className="py-2 px-4 border-b text-left">{user.phoneNumber}</td>
                <td className="py-2 px-4 border-b text-left">{user.isNewUser ? 'New' : 'Existing'}</td>
                <td className="py-2 px-4 border-b text-left">
                  {editingUser === user.phoneNumber ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={user.remarks || ''}
                        onChange={(e) => {
                          setUsers(users.map(u => 
                            u.phoneNumber === user.phoneNumber ? { ...u, remarks: e.target.value } : u
                          ));
                        }}
                        className="w-full"
                      />
                      <Button 
                        onClick={() => handleUpdateRemarks(user.phoneNumber, user.name, user.remarks || '')}
                        disabled={isLoading}
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span>{user.remarks || 'No remarks'}</span>
                      <Button variant="outline" onClick={() => setEditingUser(user.phoneNumber)}>
                        Edit
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default UserManagement;