'use client';

interface ErrorMessageProps {
  message?: string;
  messageZh?: string;
}

const ErrorMessage = ({ 
  message = 'Unable to load events. Please try again later.',
  messageZh = '无法加载活动。请稍后再试。'
}: ErrorMessageProps) => {
  return (
    <div className="text-center py-4">
      <p className="text-gray-600">{message}</p>
      <p className="text-gray-600">{messageZh}</p>
    </div>
  );
};

export default ErrorMessage;