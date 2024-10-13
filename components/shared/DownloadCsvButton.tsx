'use client';

import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

interface DownloadButtonProps {
  eventId: string;
  searchText: string;
}

const DownloadCsvButton: React.FC<DownloadButtonProps> = ({ eventId, searchText }) => {
  const router = useRouter();

  const handleDownloadCsv = () => {
    const queryParams = new URLSearchParams({
      eventId: eventId || '',
      searchText: searchText || '',
    }).toString();

    // Navigate to the API route
    router.push(`/api/download-csv?${queryParams}`);
  };

  return (
    <Button onClick={handleDownloadCsv} className="bg-blue-500 hover:bg-blue-600 text-white">
      Download CSV
    </Button>
  );
};

export default DownloadCsvButton;
