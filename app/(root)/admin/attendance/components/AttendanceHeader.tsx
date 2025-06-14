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
  onDownloadCsv?: () => void;
  onExportToSheets?: () => void;
  isExporting?: boolean;
  isSuperAdmin: boolean;
}

const AttendanceHeader: React.FC<AttendanceHeaderProps> = ({
  queueNumber,
  onQueueNumberChange,
  onQueueNumberSubmit,
  message,
  showScanner,
  onToggleScanner,
  onRefresh,
  onDownloadCsv,
  onExportToSheets,
  isExporting = false,
  isSuperAdmin
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
      {/* Queue Number Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Quick Attendance / 快速出席
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Enter Queue Number 输入排队号码"
              value={queueNumber}
              onChange={(e) => onQueueNumberChange(e.target.value)}
              className="text-lg p-4 h-14 border-2 border-blue-200 focus:border-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && onQueueNumberSubmit()}
            />
          </div>
          <Button 
            onClick={onQueueNumberSubmit} 
            className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 h-14 font-semibold"
            size="lg"
          >
            Mark Attendance 标记出席
          </Button>
        </div>
        
        {message && (
          <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-md">
            <p className="text-sm text-blue-700">{message}</p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
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
    </div>
  );
};

export default AttendanceHeader; 