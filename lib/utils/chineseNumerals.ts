/**
 * Utility functions for converting numbers to Chinese numerals
 */

const CHINESE_DIGITS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
const CHINESE_UNITS = ['', '十', '百', '千'];
const CHINESE_GROUP_UNITS = ['', '万', '亿', '兆'];

/**
 * Converts a number group (0-9999) to Chinese numerals
 * @param num Number to convert (should be between 0-9999)
 * @returns Chinese numeral string
 */
function convertGroup(num: number): string {
  if (num === 0) return '';
  
  // For single digit numbers, just return the digit without any units
  if (num < 10) {
    return CHINESE_DIGITS[num];
  }
  
  let result = '';
  let hasZero = false;
  let lastWasZero = true;
  
  // Convert each digit with its unit
  for (let i = 3; i >= 0; i--) {
    const digit = Math.floor(num / Math.pow(10, i)) % 10;
    
    if (digit === 0) {
      hasZero = true;
      lastWasZero = true;
    } else {
      // Add zero before if needed
      if (hasZero && lastWasZero && i < 3) {
        result += CHINESE_DIGITS[0];
      }
      result += CHINESE_DIGITS[digit] + CHINESE_UNITS[i];
      hasZero = false;
      lastWasZero = false;
    }
  }
  
  // Special cases for numbers between 10-19
  if (num >= 10 && num < 20 && result.startsWith('一十')) {
    result = result.substring(1);
  }
  
  return result;
}

/**
 * Converts a number to Chinese numerals
 * @param num Number to convert
 * @param options Configuration options
 * @returns Chinese numeral string
 */
export function toChineseNumeral(num: number, options: {
  useTraditional?: boolean; // Use traditional characters (default: false)
  usePositionalUnit?: boolean; // Add 第 prefix and 位 suffix (default: false)
} = {}): string {
  const { useTraditional = false, usePositionalUnit = false } = options;
  
  // Handle negative numbers
  if (num < 0) {
    return '负' + toChineseNumeral(-num, options);
  }
  
  // Handle zero - skip zero for ordinal numbers
  if (num === 0) {
    const zero = useTraditional ? '零' : '零';
    return usePositionalUnit ? `第一位` : zero; // Return 第一位 instead of 第零位 for ordinal numbers
  }
  
  // Convert to groups of 4 digits
  const groups: number[] = [];
  let tempNum = Math.floor(Math.abs(num));
  while (tempNum > 0) {
    groups.push(tempNum % 10000);
    tempNum = Math.floor(tempNum / 10000);
  }
  
  // Convert each group and combine with group units
  let result = '';
  for (let i = groups.length - 1; i >= 0; i--) {
    const groupStr = convertGroup(groups[i]);
    if (groupStr) {
      result += groupStr + CHINESE_GROUP_UNITS[i];
    }
  }
  
  // Convert to traditional characters if requested
  if (useTraditional) {
    result = result
      .replace(/一/g, '壹')
      .replace(/二/g, '貳')
      .replace(/三/g, '參')
      .replace(/四/g, '肆')
      .replace(/五/g, '伍')
      .replace(/六/g, '陸')
      .replace(/七/g, '柒')
      .replace(/八/g, '捌')
      .replace(/九/g, '玖')
      .replace(/十/g, '拾')
      .replace(/百/g, '佰')
      .replace(/千/g, '仟')
      .replace(/万/g, '萬')
      .replace(/亿/g, '億')
      .replace(/零/g, '零');
  }
  
  // Add positional unit if requested
  if (usePositionalUnit) {
    result = `第${result}位`;
  }
  
  return result;
}

/**
 * Converts a number to Chinese ordinal numeral (e.g., 第一, 第二, etc.)
 * @param num Number to convert
 * @param useTraditional Use traditional characters
 * @returns Chinese ordinal numeral string
 */
export function toChineseOrdinal(num: number, useTraditional = false): string {
  return toChineseNumeral(num, { useTraditional, usePositionalUnit: true });
}

// Export the simple array for backward compatibility
export const chineseNumerals = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']; 