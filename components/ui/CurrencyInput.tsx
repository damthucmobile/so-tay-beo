'use client';

import React from 'react';
import { formatNumberWithDots, parseFormattedNumber } from '@/core/utils/formatters';

export interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number;
  onChange: (value: number) => void;
  currencySymbol?: string;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, currencySymbol = 'đ', className, placeholder = '0', ...props }, ref) => {
    const displayValue = value ? formatNumberWithDots(value) : '';

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawInput = e.target.value;
      const parsedNumber = parseFormattedNumber(rawInput);
      onChange(parsedNumber);
    };

    return (
      <div className="relative flex items-center w-full">
        <input
          ref={ref}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-mono pr-8 ${className || ''}`}
          {...props}
        />
        {currencySymbol && (
          <span className="absolute right-3 text-xs font-semibold text-slate-400 dark:text-slate-500 pointer-events-none select-none">
            {currencySymbol}
          </span>
        )}
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';
