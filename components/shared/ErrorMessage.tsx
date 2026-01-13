'use client';

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface ErrorMessageProps {
  message?: string;
  messageZh?: string;
}

const ErrorMessage = ({ 
  message = 'Unable to load events. Please try again later.',
  messageZh = '无法加载活动。请稍后再试。'
}: ErrorMessageProps) => {
  return (
    <div className="flex justify-center py-6 px-4">
      <Alert variant="destructive" className="max-w-2xl">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>错误 / Error</AlertTitle>
        <AlertDescription>
          <p className="mt-1">{message}</p>
          <p className="mt-1">{messageZh}</p>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default ErrorMessage;