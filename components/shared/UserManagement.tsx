'use client'

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import Modal from '../ui/modal';
import FloatingNavigation from './FloatingNavigation';

type User = {
  phoneNumber: string;
  name: string;
  isNewUser: boolean;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
};

type SortConfig = { key: keyof User | 'serialNumber', direction: 'asc' | 'desc' };

const UserManagement = ({ country }: { country: string }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [customDate, setCustomDate] = useState('');
  const [dateMonth, setDateMonth] = useState('');
  const [dateDay, setDateDay] = useState('');
  const [dateYear, setDateYear] = useState('');
  const [message, setMessage] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'isNewUser', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [filterText, setFilterText] = useState('');
  const pageSize = 100;

  useEffect(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const formattedDate = oneWeekAgo.toISOString().split('T')[0];
    setCustomDate(formattedDate);
    
    // Initialize separate date fields
    const [year, month, day] = formattedDate.split('-');
    setDateYear(year);
    setDateMonth(month);
    setDateDay(day);
    
    fetchUsers(formattedDate);
  }, []);

  const fetchUsers = async (date?: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/tagged-users/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, country })
      });
      const { users } = await response.json();
      setUsers(users);
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

  const handleDateFieldChange = (field: 'month' | 'day' | 'year', value: string) => {
    // Remove any non-numeric characters
    const numericValue = value.replace(/\D/g, '');
    
    if (field === 'month') {
      // Limit to 2 digits and valid month range
      const month = Math.min(12, Math.max(1, parseInt(numericValue) || 1));
      setDateMonth(month.toString());
    } else if (field === 'day') {
      // Limit to 2 digits and valid day range
      const day = Math.min(31, Math.max(1, parseInt(numericValue) || 1));
      setDateDay(day.toString());
    } else if (field === 'year') {
      // Limit to 4 digits
      const year = numericValue.slice(0, 4);
      setDateYear(year);
    }
  };

  const handleApplyDate = () => {
    // Validate that all fields have values
    if (!dateYear || !dateMonth || !dateDay) {
      setMessage('Please fill in all date fields (Month, Day, Year)');
      return;
    }
    
    // Construct date from individual fields
    const formattedDate = `${dateYear}-${dateMonth.padStart(2, '0')}-${dateDay.padStart(2, '0')}`;
    
    // Validate the date
    const date = new Date(formattedDate);
    if (isNaN(date.getTime())) {
      setMessage('Please enter a valid date');
      return;
    }
    
    setCustomDate(formattedDate);
    fetchUsers(formattedDate);
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

  const handleDeleteUser = async (user: User) => {
    setUserToDelete(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/tagged-users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: userToDelete.phoneNumber }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      setUsers(users.filter(u => u.phoneNumber !== userToDelete.phoneNumber));
      setMessage('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
      setMessage('Failed to delete user');
    } finally {
      setIsLoading(false);
      setShowDeleteModal(false);
      setUserToDelete(null);
    }
  };

  const formatDateTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Shanghai'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const requestSort = (key: keyof User | 'serialNumber') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = useMemo(() => {
    // First filter the items
    const filteredItems = users.filter(user =>
      user.name.toLowerCase().includes(filterText.toLowerCase()) ||
      user.phoneNumber.toLowerCase().includes(filterText.toLowerCase()) ||
      (user.remarks?.toLowerCase() || '').includes(filterText.toLowerCase())
    );

    // Then sort the filtered items
    if (sortConfig.key === 'serialNumber') {
      return sortConfig.direction === 'asc' ? filteredItems : [...filteredItems].reverse();
    }

    return filteredItems.sort((a, b) => {
      const aValue = a[sortConfig.key as keyof User];
      const bValue = b[sortConfig.key as keyof User];
      
      // Handle boolean sorting (for isNewUser)
      if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
        if (sortConfig.direction === 'desc') {
          return aValue === bValue ? 0 : aValue ? -1 : 1; // true values first
        } else {
          return aValue === bValue ? 0 : aValue ? 1 : -1; // false values first
        }
      }
      
      // Handle string sorting for other fields
      const aString = String(aValue || '');
      const bString = String(bValue || '');
      
      return sortConfig.direction === 'asc'
        ? aString.localeCompare(bString)
        : bString.localeCompare(aString);
    });
  }, [users, sortConfig, filterText]);

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterText]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

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
          <div className="flex items-center gap-1">
            <Input
              type="number"
              placeholder="MM"
              value={dateMonth}
              onChange={(e) => handleDateFieldChange('month', e.target.value)}
              className="w-16 text-center"
              min="1"
              max="12"
            />
            <span className="text-gray-500">/</span>
            <Input
              type="number"
              placeholder="DD"
              value={dateDay}
              onChange={(e) => handleDateFieldChange('day', e.target.value)}
              className="w-16 text-center"
              min="1"
              max="31"
            />
            <span className="text-gray-500">/</span>
            <Input
              type="number"
              placeholder="YYYY"
              value={dateYear}
              onChange={(e) => handleDateFieldChange('year', e.target.value)}
              className="w-20 text-center"
              min="1900"
              max="2100"
            />
          </div>
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
        <Input
          placeholder="Filter by name, phone number, or remarks..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="max-w-md"
        />
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
                  &quot;Phone Number&quot;, &quot;PhoneNumber&quot;, &quot;Contact Number&quot;, &quot;Phone&quot;, &quot;Contact&quot;
                </li>
                <li>
                  <strong>Name</strong> (optional) - Any of these:
                  <br />
                  &quot;Name&quot;, &quot;Full Name&quot;, &quot;Customer Name&quot;
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
      {/* Pagination above the table */}
      {totalPages > 1 && (
        <div className="mb-4 flex justify-center items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            title="Previous page"
          >
            ← Previous
          </Button>
          <span className="mx-2">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            title="Next page"
          >
            Next →
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
      ) : (
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border-b text-left">
                <Button
                  variant="ghost"
                  onClick={() => requestSort('serialNumber')}
                  className="hover:bg-gray-200 transition-colors duration-200 w-full text-left p-0"
                >
                  S/N
                  {sortConfig.key === 'serialNumber' && (
                    <span className="ml-1">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                  )}
                </Button>
              </th>
              <th className="py-2 px-4 border-b text-left">
                <Button
                  variant="ghost"
                  onClick={() => requestSort('name')}
                  className="hover:bg-gray-200 transition-colors duration-200 w-full text-left p-0"
                >
                  Name
                  {sortConfig.key === 'name' && (
                    <span className="ml-1">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                  )}
                </Button>
              </th>
              <th className="py-2 px-4 border-b text-left">
                <Button
                  variant="ghost"
                  onClick={() => requestSort('phoneNumber')}
                  className="hover:bg-gray-200 transition-colors duration-200 w-full text-left p-0"
                >
                  Phone Number
                  {sortConfig.key === 'phoneNumber' && (
                    <span className="ml-1">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                  )}
                </Button>
              </th>
              <th className="py-2 px-4 border-b text-left">
                <Button
                  variant="ghost"
                  onClick={() => requestSort('isNewUser')}
                  className="hover:bg-gray-200 transition-colors duration-200 w-full text-left p-0"
                >
                  Status
                  {sortConfig.key === 'isNewUser' && (
                    <span className="ml-1">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                  )}
                </Button>
              </th>
              <th className="py-2 px-4 border-b text-left">
                <Button
                  variant="ghost"
                  onClick={() => requestSort('createdAt')}
                  className="hover:bg-gray-200 transition-colors duration-200 w-full text-left p-0"
                >
                  Created At
                  {sortConfig.key === 'createdAt' && (
                    <span className="ml-1">{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>
                  )}
                </Button>
              </th>
              <th className="py-2 px-4 border-b text-left">Remarks</th>
              <th className="py-2 px-4 border-b text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((user, index) => (
              <tr key={user.phoneNumber} className={`hover:bg-gray-50 ${user.isNewUser ? 'bg-yellow-100' : ''}`}>
                <td className="py-2 px-4 border-b text-left">{((currentPage - 1) * pageSize) + index + 1}</td>
                <td className="py-2 px-4 border-b text-left">{user.name}</td>
                <td className="py-2 px-4 border-b text-left">{user.phoneNumber}</td>
                <td className="py-2 px-4 border-b text-left">{user.isNewUser ? 'New' : 'Existing'}</td>
                <td className="py-2 px-4 border-b text-left">{formatDateTime(user.createdAt)}</td>
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
                <td className="py-2 px-4 border-b text-left">
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDeleteUser(user)}
                    className="ml-2"
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            First
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="mx-2">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            Last
          </Button>
        </div>
      )}
      <div className="mt-2 text-sm text-gray-600">
        Total Records: {sortedData.length}
      </div>

      {/* Floating Navigation */}
      <FloatingNavigation
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        position="bottom-right"
        showPagination={true}
        showScrollButtons={true}
      />

      {showDeleteModal && userToDelete && (
        <Modal>
          <div className="p-6 bg-white rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
            <p className="mb-4">
              Are you sure you want to delete the record for {userToDelete.name} ({userToDelete.phoneNumber})?
            </p>
            <div className="flex justify-end space-x-4">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default UserManagement;