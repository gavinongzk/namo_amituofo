'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface DownloadButtonProps {
  eventId: string;
  searchText: string;
}

const DownloadCsvButton: React.FC<DownloadButtonProps> = ({ eventId, searchText }) => {
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadCsv = () => {
    const queryParams = new URLSearchParams({
      eventId: eventId || '',
      searchText: searchText || '',
    }).toString();

    // Navigate to the API route
    router.push(`/api/download-csv?${queryParams}`);
  };

  const handleExportToSheets = async () => {
    setIsExporting(true);
    try {
      const queryParams = new URLSearchParams({
        eventId: eventId || '',
        searchText: searchText || '',
      }).toString();

      const response = await fetch(`/api/google-sheets?${queryParams}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to export to Google Sheets');
      }

      const data = await response.json();
      if (data.success) {
        // Open the Google Sheets document in a new tab
        window.open(`https://docs.google.com/spreadsheets/d/${data.spreadsheetId}`, '_blank');
      }
    } catch (error) {
      console.error('Error exporting to Google Sheets:', error);
      alert('Failed to export to Google Sheets. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button onClick={handleDownloadCsv} className="bg-blue-500 hover:bg-blue-600 text-white">
        Download CSV
      </Button>
      <Button 
        onClick={handleExportToSheets} 
        className="bg-green-500 hover:bg-green-600 text-white"
        disabled={isExporting}
      >
        {isExporting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Exporting...
          </>
        ) : (
          'Export to Sheets'
        )}
      </Button>
    </div>
  );
};

export default DownloadCsvButton;
