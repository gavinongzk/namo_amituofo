'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useUser } from "@clerk/nextjs";
import { Loader2 } from 'lucide-react';
import Modal from '@/components/ui/modal';
import AttendanceDetailsCard from '@/components/shared/AttendanceDetails';
import FloatingNavigation from '@/components/shared/FloatingNavigation';

const QrCodeScanner = dynamic(() => import('@/components/shared/QrCodeScanner'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center gap-3 p-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary-500" aria-hidden />
      <span className="text-sm text-grey-600">加载扫描器… Loading scanner…</span>
    </div>
  ),
});
import { cn } from "@/lib/utils";
import crypto from 'crypto';

// Import our new modular components and hooks
import AttendanceHeaderImproved from './components/AttendanceHeaderImproved';
import AttendanceTableImproved from './components/AttendanceTableImproved';
import FloatingActionButton from './components/FloatingActionButton';
import { useAttendanceData } from './hooks/useAttendanceData';
import { attendanceApi } from './services/attendanceApi';
import { 
  Event, 
  AttendanceItem, 
  ConfirmationData, 
  DeleteConfirmationData, 
  ModalType 
} from './types/attendance';

interface AttendanceClientProps {
  event: Event;
}

const AttendanceClient: React.FC<AttendanceClientProps> = ({ event }) => {
  // Use our custom hooks
  const {
    registrations,
    isLoading,
    stats,
    fetchRegistrations,
    markAttendance,
    cancelRegistration,
    deleteRegistration,
  } = useAttendanceData({ eventId: event._id });

  // Initial data fetch
  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  // UI State
  const [queueNumber, setQueueNumber] = useState('');
  const [message, setMessage] = useState('');
  const [searchText, setSearchText] = useState('');
  const [pageSize, setPageSize] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [modalType, setModalType] = useState<ModalType>('loading');
  
  // Confirmation states
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] = useState<ConfirmationData | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteConfirmationData, setDeleteConfirmationData] = useState<DeleteConfirmationData | null>(null);
  
  // Scanner and other states
  const [showScanner, setShowScanner] = useState(false);
  const [recentScans, setRecentScans] = useState<Array<{ queueNumber: string; name: string }>>([]);
  const [taggedUsers, setTaggedUsers] = useState<Record<string, string>>({});
  const [isExporting, setIsExporting] = useState(false);
  const [fastAttendanceMode, setFastAttendanceMode] = useState(false);

  // User permissions
  const { user } = useUser();
  const isSuperAdmin = user?.publicMetadata.role === 'superadmin';

  // Helper function for showing modals
  const showModalWithMessage = useCallback((title: string, message: string, type: ModalType) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setShowModal(true);

    if (type !== 'loading') {
      setTimeout(() => {
        setShowModal(false);
        setModalType('loading');
      }, 2000);
    }
  }, []);

  // Queue number handling
  const handleQueueNumberChange = useCallback((value: string) => {
    setQueueNumber(value);
    setMessage('');
    
    if (value.trim()) {
      const registration = registrations.find(r => 
        r.order.customFieldValues.some(group => group.queueNumber === value.trim())
      );
      
      if (registration) {
        const group = registration.order.customFieldValues.find(g => g.queueNumber === value.trim());
        if (group) {
          const nameField = group.fields.find(field => field.label.toLowerCase().includes('name'));
          const participantName = nameField ? nameField.value : 'N/A';
          const attendanceStatus = group.attendance ? '已出席 (Attended)' : '未出席 (Not Attended)';
          const cancelledStatus = group.cancelled ? '已取消 (Cancelled)' : '有效 (Active)';
          
          setMessage(`找到参加者 Found: ${participantName} - ${attendanceStatus} - ${cancelledStatus}`);
        }
      } else {
        setMessage('未找到此排队号码的报名 Registration not found with this queue number');
      }
    }
  }, [registrations]);

  const handleQueueNumberSubmit = useCallback(async () => {
    const normalizedQueueNumber = queueNumber.trim();
    if (!normalizedQueueNumber) return;

    const registration = registrations.find(r => 
      r.order.customFieldValues.some(group => group.queueNumber === normalizedQueueNumber)
    );
    
    if (registration) {
      const group = registration.order.customFieldValues.find(g => g.queueNumber === normalizedQueueNumber);
      if (group) {
        const nameField = group.fields.find(field => field.label.toLowerCase().includes('name'));

        if (fastAttendanceMode) {
          const nextAttendanceState = !group.attendance;
          showModalWithMessage('Updating / 更新中', 'Updating attendance... 更新出席情况...', 'loading');
          try {
            await markAttendance(registration.id, group.groupId, nextAttendanceState);
            showModalWithMessage(
              'Success / 成功',
              `Attendance ${nextAttendanceState ? 'marked' : 'unmarked'} successfully\n出席情况${nextAttendanceState ? '已标记' : '已取消标记'}`,
              'success'
            );
          } catch (error) {
            console.error('Error updating attendance in fast mode:', error);
            if (error instanceof Error && error.message.includes('CANCELLED_REGISTRATION')) {
              showModalWithMessage(
                'Error / 错误',
                'Cannot mark attendance for cancelled registration. Please uncancel the registration first.\n无法为已取消的报名标记出席。请先取消取消状态。',
                'error'
              );
            } else {
              showModalWithMessage('Error / 错误', 'Failed to update attendance. 更新出席情况失败。', 'error');
            }
          }
          setQueueNumber('');
          return;
        }

        setConfirmationData({
          registrationId: registration.id,
          groupId: group.groupId,
          queueNumber: group.queueNumber || '',
          currentAttendance: !!group.attendance,
          name: nameField ? nameField.value : 'N/A'
        });
        setShowConfirmation(true);
      }
    } else {
      setMessage('Registration not found with this queue number. 未找到此排队号码的报名。');
    }
  }, [fastAttendanceMode, markAttendance, queueNumber, registrations, showModalWithMessage]);

  // Attendance operations
  const handleMarkAttendance = useCallback(async (registrationId: string, groupId: string, attended: boolean) => {
    showModalWithMessage('Updating / 更新中', 'Updating attendance... 更新出席情况...', 'loading');

    try {
      await markAttendance(registrationId, groupId, attended);
      showModalWithMessage(
        'Success / 成功', 
        `Attendance ${attended ? 'marked' : 'unmarked'} successfully\n出席情况${attended ? '已标记' : '已取消标记'}`,
        'success'
      );
      setMessage(`Attendance ${attended ? 'marked' : 'unmarked'} for ${registrationId}, group ${groupId}`);
    } catch (error) {
      console.error('Error updating attendance:', error);
      if (error instanceof Error && error.message.includes('CANCELLED_REGISTRATION')) {
        showModalWithMessage(
          'Error / 错误', 
          'Cannot mark attendance for cancelled registration. Please uncancel the registration first.\n无法为已取消的报名标记出席。请先取消取消状态。',
          'error'
        );
      } else {
        showModalWithMessage('Error / 错误', 'Failed to update attendance. 更新出席情况失败。', 'error');
      }
    }
  }, [markAttendance, showModalWithMessage]);

  const handleCancelRegistration = useCallback(async (
    registrationId: string, 
    groupId: string, 
    queueNumber: string, 
    cancelled: boolean
  ) => {
    showModalWithMessage(
      cancelled ? 'Cancelling / 取消中' : 'Uncancelling / 恢复中',
      cancelled ? 'Cancelling registration... 取消报名中...' : 'Uncancelling registration... 恢复报名中...',
      'loading'
    );

    try {
      await cancelRegistration(registrationId, groupId, queueNumber, cancelled);
      showModalWithMessage(
        'Success / 成功',
        `Registration ${cancelled ? 'cancelled' : 'uncancelled'} successfully\n报名${cancelled ? '已取消' : '已恢复'}`,
        'success'
      );
    } catch (error) {
      console.error('Error cancelling/uncancelling registration:', error);
      showModalWithMessage(
        'Error / 错误',
        `Failed to ${cancelled ? 'cancel' : 'uncancel'} registration. 操作失败。`,
        'error'
      );
    }
  }, [cancelRegistration, showModalWithMessage]);

  const handleDeleteRegistration = useCallback((registrationId: string, groupId: string, queueNumber: string) => {
    setDeleteConfirmationData({ registrationId, groupId, queueNumber });
    setShowDeleteConfirmation(true);
  }, []);

  const confirmDeleteRegistration = useCallback(async () => {
    if (!deleteConfirmationData) return;

    const { queueNumber } = deleteConfirmationData;
    setShowDeleteConfirmation(false);
    showModalWithMessage('Deleting / 删除中', 'Deleting registration... 删除报名中...', 'loading');

    try {
      await deleteRegistration(queueNumber);
      showModalWithMessage(
        'Success / 成功',
        `Registration deleted for queue number ${queueNumber}\n队列号 ${queueNumber} 的报名已删除`,
        'success'
      );
    } catch (error) {
      console.error('Error deleting registration:', error);
      showModalWithMessage('Error / 错误', 'Failed to delete registration. 删除报名失败。', 'error');
    }
  }, [deleteConfirmationData, deleteRegistration, showModalWithMessage]);

  // QR Scanner handling
  const handleScan = useCallback(async (decodedText: string) => {
    const [eventId, queueNumber, registrationHash] = decodedText.split('_');
    if (!eventId || !queueNumber || !registrationHash) {
      showModalWithMessage(
        'Error / 错误',
        'Invalid QR code format for this event\n此活动的二维码格式无效',
        'error'
      );
      return;
    }

    // Find and verify registration
    const registration = registrations.find(r => 
      r.order.customFieldValues.some(group => {
        const hasMatchingQueue = group.queueNumber === queueNumber;
        if (!hasMatchingQueue) return false;

        const phoneField = group.fields.find(field => 
          field.label.toLowerCase().includes('phone') || 
          field.type === 'phone'
        );
        const phoneNumber = phoneField?.value || '';

        const computedHash = crypto
          .createHash('sha256')
          .update(`${phoneNumber}_${queueNumber}_${eventId}`)
          .digest('hex')
          .slice(0, 16);

        return computedHash === registrationHash;
      })
    );

    if (registration) {
      const group = registration.order.customFieldValues.find(g => g.queueNumber === queueNumber);
      if (group) {
        const nameField = group.fields.find(field => field.label.toLowerCase().includes('name'));
        const name = nameField ? nameField.value : 'Unknown';

        if (!group.attendance) {
          new Audio('/assets/sounds/success-beep.mp3').play().catch(e => console.error('Error playing audio:', e));
          await handleMarkAttendance(registration.id, group.groupId, true);
          setRecentScans(prev => [{ queueNumber, name }, ...prev.slice(0, 4)]);
        } else {
          showModalWithMessage(
            'Already Marked / 已标记',
            `Attendance already marked for: ${name} (${queueNumber})\n${name} (${queueNumber}) 的出席已经被标记`,
            'error'
          );
        }
      }
    } else {
      showModalWithMessage(
        'Error / 错误',
        `Registration not found for: ${queueNumber}\n未找到队列号 ${queueNumber} 的报名`,
        'error'
      );
    }
  }, [registrations, handleMarkAttendance, showModalWithMessage]);

  // Data transformation for table
  const tableData = useMemo((): AttendanceItem[] => {
    const phoneGroups: { [key: string]: { id: string; queueNumber: string }[] } = {};
    
    // Group by phone number for duplicate detection
    registrations.forEach(registration => {
      registration.order.customFieldValues.forEach(group => {
        const phoneField = group.fields.find(field => 
          field.label.toLowerCase().includes('phone') || field.type === 'phone'
        );
        if (phoneField) {
          if (!phoneGroups[phoneField.value]) {
            phoneGroups[phoneField.value] = [];
          }
          phoneGroups[phoneField.value].push({
            id: `${registration.id}_${group.groupId}`,
            queueNumber: group.queueNumber || ''
          });
        }
      });
    });

    return registrations.flatMap(registration => 
      registration.order.customFieldValues.map(group => {
        const nameField = group.fields.find(field => field.label.toLowerCase().includes('name'));
        const phoneField = group.fields.find(field => 
          field.label.toLowerCase().includes('phone') || field.type === 'phone'
        );
        const walkField = group.fields.find(field => 
          field.label.toLowerCase().includes('walk')
        );
        const postalField = group.fields.find(field => field.type === 'postal');
        const phoneNumber = phoneField ? phoneField.value : '';
        const isDuplicate = isSuperAdmin && phoneGroups[phoneNumber] && phoneGroups[phoneNumber].length > 1;
        const cannotWalk = walkField && ['no', '否', 'false'].includes(walkField.value.toLowerCase());
        
        return {
          registrationId: registration.id,
          groupId: group.groupId,
          queueNumber: group.queueNumber || '',
          name: nameField ? nameField.value : 'N/A',
          phoneNumber,
          isDuplicate,
          cannotWalk,
          attendance: !!group.attendance,
          cancelled: !!group.cancelled,
          remarks: taggedUsers[phoneNumber] || '',
          postalCode: postalField ? postalField.value : '',
        };
      })
    );
  }, [registrations, isSuperAdmin, taggedUsers]);

  // Export functions
  const handleExportToSheets = useCallback(async () => {
    setIsExporting(true);
    try {
      const result = await attendanceApi.exportToGoogleSheets(event._id, searchText);
      if (result.success) {
        window.open(`https://docs.google.com/spreadsheets/d/${result.spreadsheetId}`, '_blank');
        showModalWithMessage(
          'Success / 成功',
          'Successfully exported to Google Sheets\n成功导出到Google表格',
          'success'
        );
      }
    } catch (error) {
      console.error('Error exporting to Google Sheets:', error);
      showModalWithMessage(
        'Error / 错误',
        'Failed to export to Google Sheets\n导出到Google表格失败',
        'error'
      );
    } finally {
      setIsExporting(false);
    }
  }, [event._id, searchText, showModalWithMessage]);

  const handleDownloadCsv = useCallback(() => {
    const queryParams = new URLSearchParams({
      eventId: event._id || '',
      searchText: searchText || '',
    }).toString();
    window.open(`/api/download-csv?${queryParams}`, '_blank');
  }, [event._id, searchText]);

  // Remarks handling
  const handleRemarksUpdate = useCallback(async (
    registrationId: string, 
    phoneNumber: string, 
    name: string, 
    remarks: string
  ) => {
    try {
      await attendanceApi.updateRemarks(phoneNumber, name, remarks);
      setTaggedUsers(prev => ({ ...prev, [phoneNumber]: remarks }));
      showModalWithMessage('Success / 成功', 'Remarks saved successfully. 备注已成功保存。', 'success');
    } catch (error) {
      console.error('Error updating remarks:', error);
      showModalWithMessage('Error / 错误', 'Failed to save remarks. 备注保存失败。', 'error');
    }
  }, [showModalWithMessage]);

  const handleUpdateMaxSeats = useCallback(async (newMaxSeats: number) => {
    showModalWithMessage('Updating / 更新中', 'Updating max seats... 更新最大座位数...', 'loading');
    try {
      await attendanceApi.updateMaxSeats(event._id, newMaxSeats);
      event.maxSeats = newMaxSeats;
      showModalWithMessage(
        'Success / 成功',
        'Max seats updated successfully\n最大座位数已更新',
        'success'
      );
    } catch (error) {
      console.error('Error updating max seats:', error);
      showModalWithMessage(
        'Error / 错误',
        'Failed to update max seats\n更新最大座位数失败',
        'error'
      );
    }
  }, [event, showModalWithMessage]);

  const handleConfirmAttendance = useCallback(async () => {
    if (confirmationData) {
      await handleMarkAttendance(confirmationData.registrationId, confirmationData.groupId, !confirmationData.currentAttendance);
      setQueueNumber('');
      setShowConfirmation(false);
    }
  }, [confirmationData, handleMarkAttendance]);

  return (
    <div className="wrapper my-8">
      <AttendanceDetailsCard 
        event={event}
        totalRegistrations={stats.totalRegistrations}
        attendedUsersCount={stats.attendedUsersCount}
        cannotReciteAndWalkCount={stats.cannotReciteAndWalkCount}
        cancelledUsersCount={stats.cancelledUsersCount}
        isSuperAdmin={isSuperAdmin}
        onUpdateMaxSeats={handleUpdateMaxSeats}
      />

      <div className="mt-8">
        <AttendanceHeaderImproved
          queueNumber={queueNumber}
          onQueueNumberChange={handleQueueNumberChange}
          onQueueNumberSubmit={handleQueueNumberSubmit}
          message={message}
          showScanner={showScanner}
          onToggleScanner={() => setShowScanner(!showScanner)}
          onRefresh={fetchRegistrations}
          onDownloadCsv={isSuperAdmin ? handleDownloadCsv : undefined}
          onExportToSheets={isSuperAdmin ? handleExportToSheets : undefined}
          isExporting={isExporting}
          isSuperAdmin={isSuperAdmin}
          fastAttendanceMode={fastAttendanceMode}
          onToggleFastAttendanceMode={() => setFastAttendanceMode((prev) => !prev)}
        />

        {showScanner && (
          <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm border mb-4 sm:mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              <div className="lg:col-span-2">
                <QrCodeScanner onScan={handleScan} onClose={() => setShowScanner(false)} />
              </div>
              <div className="lg:col-span-1">
                <h4 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 flex items-center gap-2">
                  <span className="text-base sm:text-lg">📋</span>
                  Recent Scans
                </h4>
                <div className="space-y-1.5 sm:space-y-2 max-h-[200px] sm:max-h-none overflow-y-auto">
                  {recentScans.length > 0 ? (
                    recentScans.map((scan, index) => (
                      <div key={index} className="p-1.5 sm:p-2 bg-grey-50 rounded text-xs sm:text-sm">
                        <div className="font-medium truncate">{scan.name}</div>
                        <div className="text-grey-500">Queue: {scan.queueNumber}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-grey-500 text-xs sm:text-sm italic">No recent scans</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <AttendanceTableImproved
          data={tableData}
          searchText={searchText}
          onSearchChange={setSearchText}
          pageSize={pageSize}
          currentPage={currentPage}
          onPageSizeChange={setPageSize}
          onPageChange={setCurrentPage}
          onAttendanceChange={handleMarkAttendance}
          onCancelRegistration={handleCancelRegistration}
          onDeleteRegistration={isSuperAdmin ? handleDeleteRegistration : undefined}
          onRemarksUpdate={isSuperAdmin ? handleRemarksUpdate : undefined}
          isSuperAdmin={isSuperAdmin}
          isLoading={isLoading}
          taggedUsers={taggedUsers}
        />

        <FloatingNavigation
          currentPage={currentPage}
          totalPages={Math.ceil(tableData.length / pageSize)}
          onPageChange={setCurrentPage}
          position="bottom-left"
          showPagination={true}
          showScrollButtons={true}
        />

        {/* Modal Components */}
        {showModal && (
          <Modal>
            <div className={cn(
              "p-6 rounded-lg",
              modalType === 'success' ? 'bg-green-100' : 
              modalType === 'error' ? 'bg-red-100' : 'bg-white'
            )}>
              <h3 className={cn(
                "text-lg font-semibold mb-4",
                modalType === 'success' ? 'text-green-800' : 
                modalType === 'error' ? 'text-red-800' : 'text-grey-900'
              )}>
                {modalTitle}
              </h3>
              <p className={cn(
                "mb-4 whitespace-pre-line",
                modalType === 'success' ? 'text-green-700' : 
                modalType === 'error' ? 'text-red-700' : 'text-grey-700'
              )}>
                {modalMessage}
              </p>
              {modalType === 'loading' && (
                <div className="flex justify-end">
                  <button 
                    onClick={() => setShowModal(false)} 
                    className="px-4 py-2 border border-grey-300 rounded-md hover:bg-grey-50"
                  >
                    Close / 关闭
                  </button>
                </div>
              )}
            </div>
          </Modal>
        )}

        {showDeleteConfirmation && deleteConfirmationData && (
          <Modal>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Confirm Deletion / 确认删除</h3>
              <p className="mb-4">Are you sure you want to delete the registration for queue number {deleteConfirmationData.queueNumber}?</p>
              <p className="mb-4">您确定要删除队列号 {deleteConfirmationData.queueNumber} 的报名吗？</p>
              <div className="flex justify-end space-x-4">
                <button 
                  onClick={() => setShowDeleteConfirmation(false)} 
                  className="px-4 py-2 border border-grey-300 rounded-md hover:bg-grey-50"
                >
                  Cancel / 取消
                </button>
                <button 
                  onClick={confirmDeleteRegistration} 
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete / 删除
                </button>
              </div>
            </div>
          </Modal>
        )}

        {showConfirmation && confirmationData && (
          <Modal>
            <div className="p-6 bg-white rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Confirm Attendance Change / 确认出席变更</h3>
              <p className="mb-4">
                {confirmationData.currentAttendance
                  ? `Unmark attendance for ${confirmationData.name} | queue number ${confirmationData.queueNumber}?`
                  : `Mark attendance for ${confirmationData.name} | queue number ${confirmationData.queueNumber}?`}
              </p>
              <p className="mb-4">
                {confirmationData.currentAttendance
                  ? `您确定要取消标记 ${confirmationData.name} | 队列号 ${confirmationData.queueNumber} 的出席吗？`
                  : `您确定要标记 ${confirmationData.name} | 队列号 ${confirmationData.queueNumber} 的出席吗？`}
              </p>
              <div className="flex justify-end space-x-4">
                <button 
                  onClick={() => setShowConfirmation(false)} 
                  className="px-4 py-2 border border-grey-300 rounded-md hover:bg-grey-50"
                >
                  Cancel / 取消
                </button>
                <button 
                  onClick={handleConfirmAttendance} 
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Confirm / 确认
                </button>
              </div>
            </div>
          </Modal>
        )}

        {/* Floating Action Button for Quick Access */}
        <FloatingActionButton
          onQuickAttendance={() => {
            // Focus on queue number input for quick access
            const input = document.querySelector('input[placeholder*="Queue Number"]') as HTMLInputElement;
            if (input) {
              input.focus();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          onToggleScanner={() => setShowScanner(!showScanner)}
          onRefresh={fetchRegistrations}
          onExport={isSuperAdmin ? handleDownloadCsv : undefined}
          showScanner={showScanner}
          isSuperAdmin={isSuperAdmin}
        />
      </div>
    </div>
  );
};

export default AttendanceClient;
