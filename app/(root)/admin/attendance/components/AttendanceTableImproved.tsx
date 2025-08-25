import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

import { Loader2, Search, ChevronUp, ChevronDown, MoreHorizontal, Save, Trash2, X } from 'lucide-react';
import { cn } from "@/lib/utils";
import { AttendanceItem, SortConfig } from '../types/attendance';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AttendanceTableImprovedProps {
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

const AttendanceTableImproved: React.FC<AttendanceTableImprovedProps> = ({
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
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Filter and sort data
  const filteredData = useMemo(() => {
    return data.filter(item => 
      item.name.toLowerCase().includes(searchText.toLowerCase()) ||
      item.phoneNumber.includes(searchText) ||
      item.queueNumber.includes(searchText)
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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = paginatedData.map(row => `${row.registrationId}_${row.groupId}`);
      setSelectedRows(new Set(allIds));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleSelectRow = (rowId: string, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(rowId);
    } else {
      newSelected.delete(rowId);
    }
    setSelectedRows(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const renderSortableHeader = (label: string, key: keyof AttendanceItem) => (
    <th className="py-3 px-4 border-b text-left font-semibold text-gray-700 bg-gray-50">
      <button
        onClick={() => requestSort(key)}
        className="flex items-center gap-2 hover:text-gray-900 transition-colors group w-full text-left"
      >
        <span className="text-sm">{label}</span>
        <div className="flex flex-col">
          <ChevronUp 
            className={cn(
              "h-3 w-3 transition-colors",
              sortConfig.key === key && sortConfig.direction === 'asc' 
                ? 'text-blue-600' 
                : 'text-gray-400 group-hover:text-gray-600'
            )} 
          />
          <ChevronDown 
            className={cn(
              "h-3 w-3 -mt-1 transition-colors",
              sortConfig.key === key && sortConfig.direction === 'desc' 
                ? 'text-blue-600' 
                : 'text-gray-400 group-hover:text-gray-600'
            )} 
          />
        </div>
      </button>
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

  const handleBulkAction = (action: 'mark' | 'unmark' | 'cancel' | 'uncancel') => {
    // Bulk actions implementation
    const selectedItems = paginatedData.filter(row => 
      selectedRows.has(`${row.registrationId}_${row.groupId}`)
    );
    
    selectedItems.forEach(item => {
      switch (action) {
        case 'mark':
          onAttendanceChange(item.registrationId, item.groupId, true);
          break;
        case 'unmark':
          onAttendanceChange(item.registrationId, item.groupId, false);
          break;
        case 'cancel':
          onCancelRegistration(item.registrationId, item.groupId, item.queueNumber, true);
          break;
        case 'uncancel':
          onCancelRegistration(item.registrationId, item.groupId, item.queueNumber, false);
          break;
      }
    });
    
    setSelectedRows(new Set());
    setShowBulkActions(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Enhanced Header */}
      <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <div>
            <h4 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-2xl">👥</span>
              <div>
                <div>Users / 用户</div>
                <div className="text-sm font-normal text-gray-600">
                  {filteredData.length} of {data.length}
                </div>
              </div>
            </h4>
          </div>
          
          {/* Enhanced Search */}
          <div className="flex flex-col sm:flex-row gap-3 min-w-0 lg:min-w-[400px]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search..."
                value={searchText}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 h-11 border-2 border-gray-200 focus:border-blue-500"
              />
              {searchText && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <select
              value={pageSize}
              onChange={(e) => {
                onPageSizeChange(Number(e.target.value));
                onPageChange(1);
              }}
              className="border-2 border-gray-200 rounded-md px-3 py-2 h-11 bg-white focus:border-blue-500"
            >
              {[50, 100, 200, 300].map(size => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {showBulkActions && (
          <div className="flex items-center justify-between p-3 bg-blue-100 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-blue-900">
                {selectedRows.size} selected
              </span>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => handleBulkAction('mark')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Mark
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleBulkAction('unmark')}
                >
                  Unmark
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => handleBulkAction('cancel')}
                >
                  Cancel
                </Button>
              </div>
            </div>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => {
                setSelectedRows(new Set());
                setShowBulkActions(false);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Simplified Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
              >
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages}
              >
                Last
              </Button>
            </div>

            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
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
          <table className="min-w-full">
            <thead>
              <tr>
                {/* Bulk select */}
                {isSuperAdmin && (
                  <th className="py-3 px-4 border-b bg-gray-50 w-12">
                    <Checkbox
                      checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                )}
                {renderSortableHeader('Queue 排队号', 'queueNumber')}
                {renderSortableHeader('Name 名字', 'name')}
                {isSuperAdmin && renderSortableHeader('Phone 电话', 'phoneNumber')}
                {isSuperAdmin && renderSortableHeader('Postal 邮区', 'postalCode')}
                <th className="py-3 px-4 border-b text-left font-semibold text-gray-700 bg-gray-50">
                  <span className="text-sm">Remarks 备注</span>
                </th>
                <th className="py-3 px-4 border-b text-left font-semibold text-gray-700 bg-gray-50">
                  <span className="text-sm">Attendance 出席</span>
                </th>
                <th className="py-3 px-4 border-b text-left font-semibold text-gray-700 bg-gray-50">
                  <span className="text-sm">Status 状态</span>
                </th>
                {isSuperAdmin && (
                  <th className="py-3 px-4 border-b text-left font-semibold text-gray-700 bg-gray-50 w-16">
                    <span className="text-sm">Actions</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((row) => {
                const rowId = `${row.registrationId}_${row.groupId}`;
                const isSelected = selectedRows.has(rowId);
                
                return (
                  <tr 
                    key={rowId}
                    className={cn(
                      "hover:bg-gray-50 transition-colors duration-150 border-b",
                      row.cancelled ? 'bg-red-50 text-gray-500' :
                      (isSuperAdmin && row.isDuplicate) ? 'bg-yellow-50' : '',
                      isSelected && 'bg-blue-50'
                    )}
                  >
                    {/* Bulk select checkbox */}
                    {isSuperAdmin && (
                      <td className="py-3 px-4">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectRow(rowId, checked as boolean)}
                        />
                      </td>
                    )}
                    
                    <td className="py-3 px-4 font-mono text-sm">{row.queueNumber}</td>
                    <td className="py-3 px-4 font-medium">{row.name}</td>
                    {isSuperAdmin && <td className="py-3 px-4 text-sm">{row.phoneNumber}</td>}
                    {isSuperAdmin && <td className="py-3 px-4 text-sm">{row.postalCode}</td>}
                    
                    {/* Remarks */}
                    <td className="py-3 px-4">
                      {isSuperAdmin && onRemarksUpdate ? (
                        <div className="flex items-center gap-2 max-w-xs">
                          <Input
                            type="text"
                            value={remarks[row.registrationId] !== undefined ? remarks[row.registrationId] : (taggedUsers[row.phoneNumber] || '')}
                            onChange={(e) => handleRemarkChange(row.registrationId, e.target.value)}
                            className={cn(
                              "h-8 text-sm",
                              modifiedRemarks.has(row.registrationId) && "border-yellow-400 bg-yellow-50"
                            )}
                            placeholder="Remarks..."
                          />
                          {modifiedRemarks.has(row.registrationId) && (
                            <Button
                              onClick={() => handleRemarksSubmit(row.registrationId, row.phoneNumber, row.name)}
                              size="sm"
                              className="h-8 px-2"
                            >
                              <Save className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-700">{row.remarks || '—'}</span>
                      )}
                    </td>
                    
                    {/* Attendance */}
                    <td className="py-3 px-4">
                      <Checkbox
                        checked={row.attendance}
                        onCheckedChange={(checked) => onAttendanceChange(row.registrationId, row.groupId, checked as boolean)}
                      />
                    </td>
                    
                    {/* Status */}
                    <td className="py-3 px-4">
                      <Checkbox
                        checked={row.cancelled}
                        onCheckedChange={(checked) => onCancelRegistration(row.registrationId, row.groupId, row.queueNumber, checked as boolean)}
                      />
                    </td>
                    
                    {/* Actions */}
                    {isSuperAdmin && onDeleteRegistration && (
                      <td className="py-3 px-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => onDeleteRegistration(row.registrationId, row.groupId, row.queueNumber)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Registration
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default React.memo(AttendanceTableImproved); 