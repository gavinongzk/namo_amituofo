import { getWhatsAppLink } from '@/lib/utils';

interface PhoneLinkProps {
  phoneNumber: string;
  className?: string;
}

export function PhoneLink({ phoneNumber, className = '' }: PhoneLinkProps) {
  return (
    <a 
      href={getWhatsAppLink(phoneNumber)}
      target="_blank"
      rel="noopener noreferrer"
      className={`text-blue-600 hover:text-blue-800 underline ${className}`}
    >
      {phoneNumber}
    </a>
  );
}
