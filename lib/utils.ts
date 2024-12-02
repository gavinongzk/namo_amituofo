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

interface PostalCodeInfo {
  region: string;
  town: string;
}

export function getSingaporePostalInfo(postalCode: string): PostalCodeInfo {
  if (!postalCode || !/^\d{6}$/.test(postalCode)) {
    return { region: 'Unknown', town: 'Unknown' };
  }

  const firstTwoDigits = parseInt(postalCode.substring(0, 2));

  // Singapore postal sector mapping with towns
  // Central Region
  if (firstTwoDigits >= 1 && firstTwoDigits <= 6) {
    return { region: 'Central', town: 'CBD' };
  } else if ([20, 21].includes(firstTwoDigits)) {
    return { region: 'Central', town: 'Bishan' };
  } else if ([22, 23].includes(firstTwoDigits)) {
    return { region: 'Central', town: 'Toa Payoh' };
  } else if ([24, 25].includes(firstTwoDigits)) {
    return { region: 'Central', town: 'Novena' };
  } else if ([26, 27].includes(firstTwoDigits)) {
    return { region: 'Central', town: 'Thomson' };
  } else if ([28].includes(firstTwoDigits)) {
    return { region: 'Central', town: 'Serangoon' };
  } else if ([69, 70, 71].includes(firstTwoDigits)) {
    return { region: 'Central', town: 'Geylang' };
  } else if ([72, 73].includes(firstTwoDigits)) {
    return { region: 'Central', town: 'MacPherson' };
  } else if ([79, 80].includes(firstTwoDigits)) {
    return { region: 'Central', town: 'Braddell' };

  // East Region
  } else if (firstTwoDigits >= 7 && firstTwoDigits <= 8) {
    return { region: 'East', town: 'Paya Lebar' };
  } else if ([29, 30, 31].includes(firstTwoDigits)) {
    return { region: 'East', town: 'Changi' };
  } else if ([32, 33].includes(firstTwoDigits)) {
    return { region: 'East', town: 'Tampines' };
  } else if ([34].includes(firstTwoDigits)) {
    return { region: 'East', town: 'Pasir Ris' };
  } else if ([59, 60, 61].includes(firstTwoDigits)) {
    return { region: 'East', town: 'Marine Parade' };
  } else if ([62, 63, 64].includes(firstTwoDigits)) {
    return { region: 'East', town: 'Bedok' };
  } else if ([65, 66, 67, 68].includes(firstTwoDigits)) {
    return { region: 'East', town: 'Tampines' };

  // North Region
  } else if ([9, 10].includes(firstTwoDigits)) {
    return { region: 'North', town: 'Sembawang' };
  } else if ([17, 18, 19].includes(firstTwoDigits)) {
    return { region: 'North', town: 'Yishun' };
  } else if ([46, 47, 48].includes(firstTwoDigits)) {
    return { region: 'North', town: 'Woodlands' };
  } else if ([77, 78].includes(firstTwoDigits)) {
    return { region: 'North', town: 'Upper Thomson' };

  // Northeast Region
  } else if ([11, 12, 13].includes(firstTwoDigits)) {
    return { region: 'Northeast', town: 'Ang Mo Kio' };
  } else if ([35, 36].includes(firstTwoDigits)) {
    return { region: 'Northeast', town: 'Hougang' };
  } else if ([37].includes(firstTwoDigits)) {
    return { region: 'Northeast', town: 'Upper Serangoon' };
  } else if ([74, 75, 76].includes(firstTwoDigits)) {
    return { region: 'Northeast', town: 'Sengkang' };

  // West Region
  } else if (firstTwoDigits >= 14 && firstTwoDigits <= 16) {
    return { region: 'West', town: 'Bukit Panjang' };
  } else if ([38, 39].includes(firstTwoDigits)) {
    return { region: 'West', town: 'Clementi' };
  } else if ([40, 41].includes(firstTwoDigits)) {
    return { region: 'West', town: 'Jurong' };
  } else if ([42, 43].includes(firstTwoDigits)) {
    return { region: 'West', town: 'Jurong West' };
  } else if ([44, 45].includes(firstTwoDigits)) {
    return { region: 'West', town: 'Jurong East' };
  } else if ([49, 50, 51].includes(firstTwoDigits)) {
    return { region: 'West', town: 'Bukit Batok' };
  } else if ([52, 53, 54].includes(firstTwoDigits)) {
    return { region: 'West', town: 'Jurong East' };
  } else if ([55, 56, 57].includes(firstTwoDigits)) {
    return { region: 'West', town: 'Jurong West' };
  } else if ([58].includes(firstTwoDigits)) {
    return { region: 'West', town: 'Bukit Panjang' };
  } else if ([81, 82].includes(firstTwoDigits)) {
    return { region: 'West', town: 'Bukit Panjang' };
  }

  return { region: 'Unknown', town: 'Unknown' };
}

// Keep the old function for backward compatibility
export function getSingaporeRegion(postalCode: string): string {
  return getSingaporePostalInfo(postalCode).region;
}
