import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="h-16 w-16 animate-spin text-primary-500" />
      <p className="mt-4 text-lg font-medium text-gray-600">加载中... / Loading events...</p>
    </div>
  );
}
