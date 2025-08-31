import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, QrCode, RefreshCw, Download, FileSpreadsheet, ChevronDown, RotateCcw } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AttendanceHeaderImprovedProps {
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

const AttendanceHeaderImproved: React.FC<AttendanceHeaderImprovedProps> = ({
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

  // Full page refresh function
  const handleFullPageRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
      {/* Primary Action - Queue Number Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
          <span className="text-lg">⚡</span>
          Quick Attendance / 快速出席
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Enter Queue Number 输入排队号码"
              value={queueNumber}
              onChange={(e) => onQueueNumberChange(e.target.value)}
              className="text-lg p-4 h-14 border-2 border-blue-200 focus:border-blue-500 transition-all duration-200 shadow-sm"
              onKeyDown={(e) => e.key === 'Enter' && onQueueNumberSubmit()}
            />
          </div>
          <Button 
            onClick={onQueueNumberSubmit} 
            className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 h-14 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            size="lg"
          >
            Mark Attendance 标记出席
          </Button>
        </div>
        
        {/* Enhanced Message display */}
        {message && (
          <div className="mt-3 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-md shadow-sm">
            <p className="text-sm text-blue-700 font-medium">{message}</p>
          </div>
        )}
      </div>

      {/* Enhanced Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
        
        {/* Left: Core Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={onToggleScanner}
            variant={showScanner ? "default" : "outline"}
            className={`${showScanner ? 'bg-green-600 hover:bg-green-700 shadow-md' : 'hover:bg-green-50 hover:border-green-300'} transition-all duration-200 transform hover:scale-105`}
          >
            <QrCode className="h-4 w-4 mr-2" />
            {showScanner ? 'Hide QR Scanner' : 'Open QR Scanner'}
          </Button>
          
          {/* Data Refresh Button */}
          <Button
            onClick={onRefresh}
            variant="outline"
            className="hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 transform hover:scale-105"
            title="Refresh data from server"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>

          {/* Full Page Refresh Button */}
          <Button
            onClick={handleFullPageRefresh}
            variant="outline"
            className="hover:bg-orange-50 hover:border-orange-300 transition-all duration-200 transform hover:scale-105"
            title="Full page refresh (reloads everything)"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Full Refresh
          </Button>
        </div>

        {/* Right: Export Actions (Grouped) */}
        <div className="flex items-center gap-3">
          {/* Export dropdown for superadmin */}
          {isSuperAdmin && (onDownloadCsv || onExportToSheets) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 transform hover:scale-105">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {onDownloadCsv && (
                  <DropdownMenuItem onClick={onDownloadCsv} className="cursor-pointer">
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Download as CSV
                  </DropdownMenuItem>
                )}
                {onExportToSheets && (
                  <DropdownMenuItem onClick={onExportToSheets} disabled={isExporting} className="cursor-pointer">
                    {isExporting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Exporting to Google Sheets...
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Export to Google Sheets
                      </>
                    )}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Quick Tips Section */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start gap-2">
          <span className="text-yellow-600 text-lg">💡</span>
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">Quick Tips:</p>
            <ul className="space-y-1 text-xs">
              <li>• Use <strong>Refresh Data</strong> to update attendance information</li>
              <li>• Use <strong>Full Refresh</strong> to reload the entire page</li>
              <li>• QR Scanner works best in well-lit environments</li>
              <li>• You can search by name, phone number, or queue number</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceHeaderImproved; 