import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { cn } from "@/lib/utils";
import { AttendanceItem, SortConfig } from '../types/attendance';

interface AttendanceTableProps {
  data: AttendanceItem[];
  searchText: string;
  onSearchChange: (text: string) => void;
  pageSize: number;
  currentPage: number;
  onPageSizeChange: (size: number) => void;
  onPageChange: (page: number) => void;
  onAttendanceChange: (registrationId: string, groupId: string, attended: boolean) => void;
  onCancelRegistration: (registrationId: string, groupId: string, queueNumber: string, cancelled: boolean) => void;
  onDeleteRegistration?: (registrationId: string, groupId: string, queueNumber: string) => void;
  onRemarksUpdate?: (registrationId: string, phoneNumber: string, name: string, remarks: string) => void;
  isSuperAdmin: boolean;
  isLoading: boolean;
  taggedUsers: Record<string, string>;
}

const AttendanceTable: React.FC<AttendanceTableProps> = ({
  data,
  searchText,
  onSearchChange,
  pageSize,
  currentPage,
  onPageSizeChange,
  onPageChange,
  onAttendanceChange,
  onCancelRegistration,
  onDeleteRegistration,
  onRemarksUpdate,
  isSuperAdmin,
  isLoading,
  taggedUsers
}) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'queueNumber', direction: 'asc' });
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [modifiedRemarks, setModifiedRemarks] = useState<Set<string>>(new Set());

  // Filter and sort data
  const filteredData = useMemo(() => {
    return data.filter(item => 
      item.name.toLowerCase().includes(searchText.toLowerCase()) ||
      item.phoneNumber.includes(searchText)
    );
  }, [data, searchText]);

  const sortedData = useMemo(() => {
    let sortableItems = [...filteredData];
    if (sortConfig.key) {
      sortableItems.sort((a: AttendanceItem, b: AttendanceItem) => {
        if ((a[sortConfig.key] ?? '') < (b[sortConfig.key] ?? '')) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if ((a[sortConfig.key] ?? '') > (b[sortConfig.key] ?? '')) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  const requestSort = (key: keyof AttendanceItem) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const renderHeader = (label: string, key: keyof AttendanceItem) => (
    <th className="py-2 px-3 border-b border-r text-left font-semibold text-gray-700 bg-gray-100 whitespace-normal">
      <Button
        variant="ghost"
        onClick={() => requestSort(key)}
        className="hover:bg-gray-200 transition-colors duration-200 w-full text-left p-0"
      >
        <span className="block text-xs">{label}</span>
        {sortConfig.key === key && (
          <span className="ml-1">
            {sortConfig.direction === 'asc' ? '▲' : '▼'}
          </span>
        )}
      </Button>
    </th>
  );

  const handleRemarkChange = (registrationId: string, value: string) => {
    setRemarks(prev => ({ ...prev, [registrationId]: value }));
    setModifiedRemarks(prev => new Set(prev).add(registrationId));
  };

  const handleRemarksSubmit = (registrationId: string, phoneNumber: string, name: string) => {
    const remarkValue = remarks[registrationId];
    if (onRemarksUpdate && remarkValue !== undefined) {
      onRemarksUpdate(registrationId, phoneNumber, name, remarkValue);
      setModifiedRemarks(prev => {
        const next = new Set(prev);
        next.delete(registrationId);
        return next;
      });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header with search and controls */}
      <div className="p-6 border-b">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <h4 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-2xl">👥</span>
            Registered Users 报名用户
          </h4>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 min-w-[300px]">
              <Input
                placeholder="Search by name or phone number 按名字或电话号码搜索"
                value={searchText}
                onChange={(e) => onSearchChange(e.target.value)}
                className="h-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <select
                value={pageSize}
                onChange={(e) => {
                  onPageSizeChange(Number(e.target.value));
                  onPageChange(1);
                }}
                className="border rounded px-3 py-2 h-10 bg-white"
              >
                {[100, 200, 300].map(size => (
                  <option key={size} value={size}>
                    Show {size}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
                className="h-8 px-3"
              >
                {'<<'}
              </Button>
              <Button
                variant="outline"
                onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
                className="h-8 px-3"
              >
                {'<'}
              </Button>
              <Button
                variant="outline"
                onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="h-8 px-3"
              >
                {'>'}
              </Button>
              <Button
                variant="outline"
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="h-8 px-3"
              >
                {'>>'}
              </Button>
            </div>

            <span className="text-sm text-gray-600">
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                {renderHeader('Queue 排队号', 'queueNumber')}
                {renderHeader('Name 名字', 'name')}
                {isSuperAdmin && renderHeader('Phone 电话', 'phoneNumber')}
                {isSuperAdmin && renderHeader('Postal Code 邮区编号', 'postalCode')}
                <th className="py-2 px-3 border-b border-r text-left font-semibold text-gray-700 bg-gray-100">
                  <span className="block text-xs">Remarks 备注</span>
                </th>
                <th className="py-2 px-3 border-b border-r text-left font-semibold text-gray-700 bg-gray-100">
                  <span className="block text-xs">Attendance 出席</span>
                </th>
                <th className="py-2 px-3 border-b border-r text-left font-semibold text-gray-700 bg-gray-100">
                  <span className="block text-xs">Cancelled 已取消</span>
                </th>
                {isSuperAdmin && onDeleteRegistration && (
                  <th className="py-2 px-3 border-b text-left font-semibold text-gray-700 bg-gray-100">
                    <span className="block text-xs">Delete 删除</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row) => (
                <tr 
                  key={`${row.registrationId}_${row.groupId}`}
                  className={cn(
                    "hover:bg-gray-50 transition-colors duration-150",
                    row.cancelled ? 'bg-red-50 line-through text-gray-500' :
                    (isSuperAdmin && row.isDuplicate) ? 'bg-green-50' : ''
                  )}
                >
                  <td className="py-3 px-4 border-b border-r whitespace-normal">{row.queueNumber}</td>
                  <td className="py-3 px-4 border-b border-r">{row.name}</td>
                  {isSuperAdmin && <td className="py-3 px-4 border-b border-r whitespace-normal">{row.phoneNumber}</td>}
                  {isSuperAdmin && <td className="py-3 px-4 border-b border-r whitespace-normal">{row.postalCode}</td>}
                  <td className="py-3 px-4 border-b border-r">
                    {isSuperAdmin && onRemarksUpdate ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="text"
                          value={remarks[row.registrationId] !== undefined ? remarks[row.registrationId] : (taggedUsers[row.phoneNumber] || '')}
                          onChange={(e) => handleRemarkChange(row.registrationId, e.target.value)}
                          className={cn(
                            "h-8 text-sm min-w-[120px]",
                            modifiedRemarks.has(row.registrationId) && "border-yellow-500"
                          )}
                          placeholder="Add remarks"
                        />
                        <Button
                          onClick={() => handleRemarksSubmit(row.registrationId, row.phoneNumber, row.name)}
                          className="h-8 px-3 bg-blue-500 hover:bg-blue-600 text-white text-sm"
                          size="sm"
                          disabled={!modifiedRemarks.has(row.registrationId)}
                        >
                          Save
                        </Button>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-700">{row.remarks || '—'}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 border-b border-r">
                    <Checkbox
                      checked={row.attendance}
                      onCheckedChange={(checked) => onAttendanceChange(row.registrationId, row.groupId, checked as boolean)}
                    />
                  </td>
                  <td className="py-3 px-4 border-b border-r">
                    <Checkbox
                      checked={row.cancelled}
                      onCheckedChange={(checked) => onCancelRegistration(row.registrationId, row.groupId, row.queueNumber, checked as boolean)}
                    />
                  </td>
                  {isSuperAdmin && onDeleteRegistration && (
                    <td className="py-3 px-4 border-b">
                      <button
                        onClick={() => onDeleteRegistration(row.registrationId, row.groupId, row.queueNumber)}
                        className="text-red-500 hover:text-red-700 transition-colors duration-200"
                      >
                        <Image src="/assets/icons/delete.svg" alt="delete" width={20} height={20} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default React.memo(AttendanceTable); 