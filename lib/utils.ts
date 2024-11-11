import { type ClassValue, clsx } from 'clsx'

import { twMerge } from 'tailwind-merge'
import qs from 'query-string'

import { UrlQueryParams, RemoveUrlQueryParams } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDateTime = (dateString: Date) => {
  const dateTimeOptions: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
    timeZone: 'Asia/Shanghai', // GMT+8
  }

  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    year: 'numeric',
    day: 'numeric',
    timeZone: 'Asia/Shanghai', // GMT+8
  }

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
    timeZone: 'Asia/Shanghai', // GMT+8
  }

  const formattedDateTime: string = new Date(dateString).toLocaleString('en-US', dateTimeOptions)
  const formattedDate: string = new Date(dateString).toLocaleString('en-US', dateOptions)
  const formattedTime: string = new Date(dateString).toLocaleString('en-US', timeOptions)

  return {
    dateTime: formattedDateTime,
    dateOnly: formattedDate,
    timeOnly: formattedTime,
  }
}

export const convertFileToUrl = (file: File) => URL.createObjectURL(file)

export const formatPrice = (price: string) => {
  const amount = parseFloat(price)
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)

  return formattedPrice
}

export function formUrlQuery({ params, key, value }: UrlQueryParams) {
  const currentUrl = qs.parse(params)

  currentUrl[key] = value

  return qs.stringifyUrl(
    {
      url: window.location.pathname,
      query: currentUrl,
    },
    { skipNull: true }
  )
}

export function removeKeysFromQuery({ params, keysToRemove }: RemoveUrlQueryParams) {
  const currentUrl = qs.parse(params)

  keysToRemove.forEach(key => {
    delete currentUrl[key]
  })

  return qs.stringifyUrl(
    {
      url: window.location.pathname,
      query: currentUrl,
    },
    { skipNull: true }
  )
}

export const handleError = (error: unknown) => {
  console.error(error)
  throw new Error(typeof error === 'string' ? error : JSON.stringify(error))
}

// ... existing code ...
export const showModalWithMessage = (
  setModalTitle: React.Dispatch<React.SetStateAction<string>>,
  setModalMessage: React.Dispatch<React.SetStateAction<string>>,
  setModalType: React.Dispatch<React.SetStateAction<'loading' | 'success' | 'error'>>,
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>,
  title: string,
  message: string,
  type: 'loading' | 'success' | 'error'
) => {
  setModalTitle(title);
  setModalMessage(message);
  setModalType(type);
  setShowModal(true);

  // Auto-close the modal after 2 seconds for success and error messages
  if (type !== 'loading') {
    setTimeout(() => {
      setShowModal(false);
      setModalType('loading'); // Reset for next use
    }, 2000);
  }
};
// ... existing code ...

export function isValidPhoneNumber(phoneNumber: string): boolean {
  // Basic format check for SG/MY numbers
  const sgRegex = /^\+65[689][0-9]{7}$/;  // Singapore format
  const myRegex = /^\+60[123456789][0-9]{8,9}$/;  // Malaysia format
  
  return sgRegex.test(phoneNumber) || myRegex.test(phoneNumber);
}

export function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters except '+'
  return phoneNumber.replace(/[^\d+]/g, '');
}

export function convertPhoneNumbersToLinks(text: string): string {
  // Match Singapore phone numbers (+65 XXXX XXXX or +65-XXXX-XXXX)
  const phoneRegex = /(\+65[-\s]?[689]\d{3}[-\s]?\d{4})/g;
  
  return text.replace(phoneRegex, (match) => {
    const cleanNumber = match.replace(/[-\s]/g, '');
    return `<a href="https://wa.me/${cleanNumber.substring(1)}" target="_blank" rel="noopener noreferrer" class="text-primary-500 hover:text-primary-600 transition-colors">${match}</a>`;
  });
}
