import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface AttendanceHeaderProps {
  queueNumber: string;
  onQueueNumberChange: (value: string) => void;
  onQueueNumberSubmit: () => void;
  message: string;
  showScanner: boolean;
  onToggleScanner: () => void;
  onRefresh: () => void;
  autoRefreshEnabled: boolean;
  onToggleAutoRefresh: () => void;
  onDownloadCsv?: () => void;
  onExportToSheets?: () => void;
  isExporting?: boolean;
  isSuperAdmin: boolean;
  lastRefreshTime: number;
}

const AttendanceHeader: React.FC<AttendanceHeaderProps> = ({
  queueNumber,
  onQueueNumberChange,
  onQueueNumberSubmit,
  message,
  showScanner,
  onToggleScanner,
  onRefresh,
  autoRefreshEnabled,
  onToggleAutoRefresh,
  onDownloadCsv,
  onExportToSheets,
  isExporting = false,
  isSuperAdmin,
  lastRefreshTime
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
      {/* Queue number input section */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quick Attendance / 快速出席
        </label>
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Enter Queue Number 输入排队号码"
              value={queueNumber}
              onChange={(e) => onQueueNumberChange(e.target.value)}
              className="text-lg p-3 h-12"
            />
          </div>
          <Button 
            onClick={onQueueNumberSubmit} 
            className="bg-blue-500 hover:bg-blue-600 text-white text-lg px-6 h-12 min-w-[200px]"
          >
            Mark Attendance 标记出席
          </Button>
        </div>
      </div>

      {/* Action buttons grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 mb-6">
        <Button
          onClick={onToggleScanner}
          className="bg-green-500 hover:bg-green-600 text-white h-12 flex items-center justify-center gap-2"
        >
          <span className="text-lg">📱</span>
          {showScanner ? 'Hide Scanner' : 'Scan QR Code'}
        </Button>
        
        <Button
          onClick={onRefresh}
          className="bg-gray-500 hover:bg-gray-600 text-white h-12 flex items-center justify-center gap-2"
        >
          <span className="text-lg">🔄</span>
          Refresh 刷新
        </Button>
        
        <Button
          onClick={onToggleAutoRefresh}
          className={`h-12 flex items-center justify-center gap-2 ${
            autoRefreshEnabled 
              ? 'bg-orange-500 hover:bg-orange-600' 
              : 'bg-green-600 hover:bg-green-700'
          } text-white`}
        >
          <span className="text-lg">{autoRefreshEnabled ? '⏸️' : '▶️'}</span>
          {autoRefreshEnabled ? 'Disable Auto-Refresh' : 'Enable Auto-Refresh'}
        </Button>

        {isSuperAdmin && (
          <>
            {onDownloadCsv && (
              <Button
                onClick={onDownloadCsv}
                className="bg-blue-500 hover:bg-blue-600 text-white h-12 flex items-center justify-center gap-2"
              >
                <span className="text-lg">📊</span>
                Download CSV
              </Button>
            )}
            
            {onExportToSheets && (
              <Button 
                onClick={onExportToSheets} 
                className="bg-green-500 hover:bg-green-600 text-white h-12 flex items-center justify-center gap-2"
                disabled={isExporting}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <span className="text-lg">📋</span>
                    Export to Sheets
                  </>
                )}
              </Button>
            )}
          </>
        )}
      </div>

      {/* Auto-refresh status bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${autoRefreshEnabled ? 'bg-green-500' : 'bg-red-500'}`}></span>
            Auto-refresh: {autoRefreshEnabled ? 
              `ON (every ${showScanner ? '10' : '15'} seconds${showScanner ? ' - Scanner Active' : ''})` : 
              'OFF'
            }
          </span>
          {autoRefreshEnabled && lastRefreshTime > 0 && (
            <span className="text-gray-500">
              Last refresh: {new Date(lastRefreshTime).toLocaleTimeString()}
            </span>
          )}
        </div>
        
        {message && (
          <div className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded">
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceHeader; 