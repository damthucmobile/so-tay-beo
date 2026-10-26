import { format, parseISO, isValid } from 'date-fns';
import { vi } from 'date-fns/locale';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export const formatDate = (dateString?: string, formatStr: string = 'dd/MM/yyyy HH:mm'): string => {
  if (!dateString) return '';
  try {
    const parsed = parseISO(dateString);
    if (!isValid(parsed)) return dateString;
    return format(parsed, formatStr, { locale: vi });
  } catch {
    return dateString;
  }
};

export const formatShortDate = (dateString?: string): string => {
  return formatDate(dateString, 'dd/MM/yyyy');
};

export const formatTime = (dateString?: string): string => {
  return formatDate(dateString, 'HH:mm');
};

/**
 * Định dạng số thành chuỗi phân cách hàng nghìn bằng dấu chấm (VD: 1000000 -> "1.000.000")
 */
export const formatNumberWithDots = (value: number | string): string => {
  if (value === null || value === undefined || value === '') return '';
  const numStr = String(value).replace(/\D/g, '');
  if (!numStr) return '';
  return Number(numStr).toLocaleString('vi-VN');
};

/**
 * Chuyển chuỗi định dạng (VD: "1.000.000") về dạng số thuần (1000000)
 */
export const parseFormattedNumber = (formattedStr: string): number => {
  if (!formattedStr) return 0;
  const numStr = String(formattedStr).replace(/\D/g, '');
  return numStr ? parseInt(numStr, 10) : 0;
};
