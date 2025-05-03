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
            <FormLabel className="text-sm font-normal text-gray-700 cursor-pointer flex flex-col gap-1">
              <div>
                <span>我已阅读并同意本站的</span>
                <Link
                  href="/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 underline font-medium ml-1"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  aria-label="阅读隐私政策"
                >
                  隐私政策
                </Link>
              </div>
              <div>
                <span>I have read and agree to the site's</span>
                <Link
                  href="/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 underline font-medium ml-1"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                  aria-label="Read Privacy Policy"
                >
                  Privacy Policy
                </Link>
              </div>
            </FormLabel>
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  );
}

PdpaConsentCheckbox.displayName = 'PdpaConsentCheckbox'; 