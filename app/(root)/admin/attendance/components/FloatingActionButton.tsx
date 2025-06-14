import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, QrCode, RefreshCw, Download, X, Zap } from 'lucide-react';
import { cn } from "@/lib/utils";
import Image from 'next/image';

interface FloatingActionButtonProps {
  onQuickAttendance: () => void;
  onToggleScanner: () => void;
  onRefresh: () => void;
  onExport?: () => void;
  showScanner: boolean;
  isSuperAdmin: boolean;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onQuickAttendance,
  onToggleScanner,
  onRefresh,
  onExport,
  showScanner,
  isSuperAdmin
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      icon: Zap,
      label: 'Quick Attendance',
      onClick: () => {
        onQuickAttendance();
        setIsOpen(false);
      },
      className: 'bg-blue-600 hover:bg-blue-700',
      primary: true
    },
    {
      icon: QrCode,
      label: showScanner ? 'Hide Scanner' : 'QR Scanner',
      onClick: () => {
        onToggleScanner();
        setIsOpen(false);
      },
      className: showScanner ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
    },
    {
      icon: RefreshCw,
      label: 'Refresh Data',
      onClick: () => {
        onRefresh();
        setIsOpen(false);
      },
      className: 'bg-purple-600 hover:bg-purple-700'
    }
  ];

  if (isSuperAdmin && onExport) {
    actions.push({
      icon: Download,
      label: 'Export Data',
      onClick: () => {
        onExport();
        setIsOpen(false);
      },
      className: 'bg-orange-600 hover:bg-orange-700'
    });
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Action buttons */}
      {isOpen && (
        <div className="flex flex-col gap-3 mb-4">
          {actions.map((action, index) => (
            <div key={index} className="flex items-center gap-3">
              <span className="bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-90">
                {action.label}
              </span>
              <Button
                onClick={action.onClick}
                className={cn(
                  "w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200",
                  action.className
                )}
                size="sm"
              >
                <action.icon className="h-5 w-5" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Main FAB */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-16 h-16 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300",
          isOpen 
            ? "bg-red-600 hover:bg-red-700 rotate-45" 
            : "bg-blue-600 hover:bg-blue-700"
        )}
        size="lg"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Image src="/assets/icons/edit.svg" alt="Edit" width={24} height={24} />
        )}
      </Button>
    </div>
  );
};

export default FloatingActionButton; 