import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] w-full py-12">
      <div className="relative flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <div className="absolute h-16 w-16 rounded-full border-4 border-primary/20" />
      </div>
      <p className="mt-6 text-base font-medium text-muted-foreground animate-pulse">
        加载中... / Loading...
      </p>
    </div>
  );
}
