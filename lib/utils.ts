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

  // District 01: Raffles Place, Cecil, Marina, People's Park
  if ([1, 2, 3, 4, 5, 6].includes(firstTwoDigits)) {
    return { region: 'Central', town: 'Raffles Place/Cecil/Marina/People\'s Park' };
  }
  
  // District 02: Anson, Tanjong Pagar
  if ([7, 8].includes(firstTwoDigits)) {
    return { region: 'Central', town: 'Anson/Tanjong Pagar' };
  }

  // District 03: Queenstown, Tiong Bahru
  if ([14, 15, 16].includes(firstTwoDigits)) {
    return { region: 'Central', town: 'Queenstown/Tiong Bahru' };
  }

  // District 04: Telok Blangah, Harbourfront
  if ([9, 10].includes(firstTwoDigits)) {
    return { region: 'South', town: 'Telok Blangah/Harbourfront' };
  }

  // District 05: Pasir Panjang, Hong Leong Garden, Clementi New Town
  if ([11, 12, 13].includes(firstTwoDigits)) {
    return { region: 'West', town: 'Pasir Panjang/Hong Leong Garden/Clementi New Town' };
  }

  // District 06: High Street, Beach Road
  if ([17].includes(firstTwoDigits)) {
    return { region: 'Central', town: 'High Street/Beach Road' };
  }

  // District 07: Middle Road, Golden Mile
  if ([18, 19].includes(firstTwoDigits)) {
    return { region: 'Central', town: 'Middle Road/Golden Mile' };
  }

  // District 08: Little India
  if ([20, 21].includes(firstTwoDigits)) {
    return { region: 'Central', town: 'Little India' };
  }

  // District 09: Orchard, Cairnhill, River Valley
  if ([22, 23].includes(firstTwoDigits)) {
    return { region: 'Central', town: 'Orchard/Cairnhill/River Valley' };
  }

  // District 10: Ardmore, Bukit Timah, Holland Road, Tanglin
  if ([24, 25, 26, 27].includes(firstTwoDigits)) {
    return { region: 'Central', town: 'Ardmore/Bukit Timah/Holland Road/Tanglin' };
  }

  // District 11: Watten Estate, Novena, Thomson
  if ([28, 29, 30].includes(firstTwoDigits)) {
    return { region: 'Central', town: 'Watten Estate/Novena/Thomson' };
  }

  // District 12: Balestier, Toa Payoh, Serangoon
  if ([31, 32, 33].includes(firstTwoDigits)) {
    return { region: 'Central', town: 'Balestier/Toa Payoh/Serangoon' };
  }

  // District 13: Macpherson, Braddell
  if ([34, 35, 36, 37].includes(firstTwoDigits)) {
    return { region: 'Central', town: 'Macpherson/Braddell' };
  }

  // District 14: Geylang, Eunos
  if ([38, 39, 40, 41].includes(firstTwoDigits)) {
    return { region: 'East', town: 'Geylang/Eunos' };
  }

  // District 15: Katong, Joo Chiat, Amber Road
  if ([42, 43, 44, 45].includes(firstTwoDigits)) {
    return { region: 'East', town: 'Katong/Joo Chiat/Amber Road' };
  }

  // District 16: Bedok, Upper East Coast, Eastwood, Kew Drive
  if ([46, 47, 48].includes(firstTwoDigits)) {
    return { region: 'East', town: 'Bedok/Upper East Coast/Eastwood/Kew Drive' };
  }

  // District 17: Loyang, Changi
  if ([49, 50, 81].includes(firstTwoDigits)) {
    return { region: 'East', town: 'Loyang/Changi' };
  }

  // District 18: Tampines, Pasir Ris
  if ([51, 52].includes(firstTwoDigits)) {
    return { region: 'East', town: 'Tampines/Pasir Ris' };
  }

  // District 19: Serangoon Garden, Hougang, Punggol
  if ([53, 54, 55, 82].includes(firstTwoDigits)) {
    return { region: 'Northeast', town: 'Serangoon Garden/Hougang/Punggol' };
  }

  // District 20: Bishan, Ang Mo Kio
  if ([56, 57].includes(firstTwoDigits)) {
    return { region: 'Central', town: 'Bishan/Ang Mo Kio' };
  }

  // District 21: Upper Bukit Timah, Clementi Park, Ulu Pandan
  if ([58, 59].includes(firstTwoDigits)) {
    return { region: 'West', town: 'Upper Bukit Timah/Clementi Park/Ulu Pandan' };
  }

  // District 22: Jurong
  if ([60, 61, 62, 63, 64].includes(firstTwoDigits)) {
    return { region: 'West', town: 'Jurong' };
  }

  // District 23: Hillview, Dairy Farm, Bukit Panjang, Choa Chu Kang
  if ([65, 66, 67, 68].includes(firstTwoDigits)) {
    return { region: 'West', town: 'Hillview/Dairy Farm/Bukit Panjang/Choa Chu Kang' };
  }

  // District 24: Lim Chu Kang, Tengah
  if ([69, 70, 71].includes(firstTwoDigits)) {
    return { region: 'West', town: 'Lim Chu Kang/Tengah' };
  }

  // District 25: Kranji, Woodgrove
  if ([72, 73].includes(firstTwoDigits)) {
    return { region: 'North', town: 'Kranji/Woodgrove' };
  }

  // District 26: Upper Thomson, Springleaf
  if ([77, 78].includes(firstTwoDigits)) {
    return { region: 'North', town: 'Upper Thomson/Springleaf' };
  }

  // District 27: Yishun, Sembawang
  if ([75, 76].includes(firstTwoDigits)) {
    return { region: 'North', town: 'Yishun/Sembawang' };
  }

  // District 28: Seletar
  if ([79, 80].includes(firstTwoDigits)) {
    return { region: 'North', town: 'Seletar' };
  }

  return { region: 'Unknown', town: 'Unknown' };
}

// Keep the old function for backward compatibility
export function getSingaporeRegion(postalCode: string): string {
  return getSingaporePostalInfo(postalCode).region;
}

export const findPhoneField = (fields: any[]) => {
  return fields.find(field => 
    field.label.toLowerCase().includes('phone') || 
    field.type === 'phone' ||
    field.label.toLowerCase().includes('contact number')
  );
};

export const MODAL_MESSAGES = {
  SUCCESS_ATTENDANCE: (queueNumber: string) => ({
    title: 'Success / 成功',
    message: `Marked attendance for: ${queueNumber}\n为队列号 ${queueNumber} 标记出席`,
    type: 'success' as const
  }),
  ERROR_NOT_FOUND: (queueNumber: string) => ({
    title: 'Error / 错误',
    message: `Registration not found for: ${queueNumber}\n未找到队列号 ${queueNumber} 的注册`,
    type: 'error' as const
  }),
  ERROR_INVALID_QR: {
    title: 'Error / 错误',
    message: 'Invalid QR code for this event\n此活动的二维码无效',
    type: 'error' as const
  }
};

export const debugLog = (component: string, message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔍 [${component}] ${message}`, data || '');
  }
};

export async function validateSingaporePostalCode(postalCode: string): Promise<boolean> {
  if (!/^\d{6}$/.test(postalCode)) {
    return false;
  }

  try {
    const response = await fetch(`https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${postalCode}&returnGeom=N&getAddrDetails=Y`);
    const data = await response.json();
    return data.results && data.results.length > 0;
  } catch (error) {
    console.error('Error validating postal code:', error);
    // Fallback to basic validation if API fails
    return /^\d{6}$/.test(postalCode);
  }
}
