'use client';

import React from 'react';
import Link from 'next/link';
import { useFormContext } from 'react-hook-form';
import {
  FormField,
  FormItem,
  FormControl,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from '@/lib/utils';

interface PdpaConsentCheckboxProps {
  name: string;
  disabled?: boolean;
  className?: string;
}

export function PdpaConsentCheckbox({ name, disabled, className }: PdpaConsentCheckboxProps) {
  const form = useFormContext();

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={cn("flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm", className)}>
          <FormControl>
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
              className="h-5 w-5 mt-1"
            />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel className="text-sm font-normal text-gray-700 cursor-pointer">
              <span className="block md:inline">我已阅读并同意本站的</span>
              <span className="hidden md:inline"> / </span>
              <span className="block md:inline">I have read and agree to the site's</span>{' '}
              <Link
                href="/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 underline font-medium"
                onClick={(e) => {
                  e.stopPropagation();
                }}
                aria-label="Read Privacy Policy"
              >
                隐私政策 / Privacy Policy
              </Link>
            </FormLabel>
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  );
}

PdpaConsentCheckbox.displayName = 'PdpaConsentCheckbox'; 