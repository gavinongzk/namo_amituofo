import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, QrCode, RefreshCw, Download, FileSpreadsheet, Play, Pause, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface AttendanceHeaderImprovedProps {
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

const AttendanceHeaderImproved: React.FC<AttendanceHeaderImprovedProps> = ({
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
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
      {/* Primary Action - Queue Number Input */}
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
            className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 h-14 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            size="lg"
          >
            Mark Attendance 标记出席
          </Button>
        </div>
        
        {/* Message display with better styling */}
        {message && (
          <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-md">
            <p className="text-sm text-blue-700">{message}</p>
          </div>
        )}
      </div>

      {/* Action Bar - Organized into sections */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-4 bg-gray-50 rounded-lg">
        
        {/* Left: Core Actions */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={onToggleScanner}
            variant={showScanner ? "default" : "outline"}
            className={`${showScanner ? 'bg-green-600 hover:bg-green-700' : 'hover:bg-green-50 hover:border-green-300'} transition-all duration-200`}
          >
            <QrCode className="h-4 w-4 mr-2" />
            {showScanner ? 'Hide Scanner' : 'QR Scanner'}
          </Button>
          
          <Button
            onClick={onRefresh}
            variant="outline"
            className="hover:bg-gray-100 transition-all duration-200"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button
            onClick={onToggleAutoRefresh}
            variant={autoRefreshEnabled ? "default" : "outline"}
            className={`${autoRefreshEnabled ? 'bg-orange-500 hover:bg-orange-600' : 'hover:bg-orange-50 hover:border-orange-300'} transition-all duration-200`}
          >
            {autoRefreshEnabled ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            Auto-refresh
          </Button>
        </div>

        {/* Right: Export Actions (Grouped) */}
        <div className="flex items-center gap-3">
          {/* Auto-refresh status */}
          <div className="hidden lg:flex items-center gap-2 text-sm text-gray-600">
            <div className={`w-2 h-2 rounded-full ${autoRefreshEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>
              {autoRefreshEnabled ? 
                `Auto-refresh: ON (${showScanner ? '10s' : '15s'})` : 
                'Auto-refresh: OFF'
              }
            </span>
            {autoRefreshEnabled && lastRefreshTime > 0 && (
              <span className="text-gray-500 ml-2">
                {new Date(lastRefreshTime).toLocaleTimeString()}
              </span>
            )}
          </div>

          {/* Export dropdown for superadmin */}
          {isSuperAdmin && (onDownloadCsv || onExportToSheets) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="hover:bg-blue-50 hover:border-blue-300">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {onDownloadCsv && (
                  <DropdownMenuItem onClick={onDownloadCsv}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Download CSV
                  </DropdownMenuItem>
                )}
                {onExportToSheets && (
                  <DropdownMenuItem onClick={onExportToSheets} disabled={isExporting}>
                    {isExporting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Exporting...
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

          {/* Advanced options toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-gray-500 hover:text-gray-700"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Advanced/Detailed Status (Collapsible) */}
      {showAdvanced && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border-t">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${autoRefreshEnabled ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="font-medium">Auto-refresh:</span>
              <span>{autoRefreshEnabled ? 'ON' : 'OFF'}</span>
            </div>
            
            {autoRefreshEnabled && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Interval:</span>
                <span>{showScanner ? '10 seconds' : '15 seconds'}</span>
              </div>
            )}
            
            {autoRefreshEnabled && lastRefreshTime > 0 && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Last refresh:</span>
                <span>{new Date(lastRefreshTime).toLocaleTimeString()}</span>
              </div>
            )}
            
            {showScanner && (
              <div className="flex items-center gap-2">
                <QrCode className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-600">QR Scanner Active</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceHeaderImproved; 