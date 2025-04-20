'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import * as z from 'zod'
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { IEvent } from '@/lib/database/models/event.model'
import { CreateOrderParams, CustomField } from "@/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { toast } from "react-hot-toast"
import { PlusIcon, Loader2Icon } from 'lucide-react'
import { toChineseOrdinal } from '@/lib/utils/chineseNumerals'

const isGroupEmpty = (group: any, customFields: CustomField[]) => {
  const membershipFilled = !!group?.membershipNumber;
  const last4DigitsFilled = !!group?.last4PhoneNumberDigits;

  const otherFieldsFilled = customFields.some(field => {
    if (field.id === 'membershipNumber' || field.id === 'last4PhoneNumberDigits') return false;
    const value = group[field.id];
    return value !== undefined && value !== null && value !== '';
  });

  return !membershipFilled && !last4DigitsFilled && !otherFieldsFilled;
};

interface RegisterFormClientProps {
  event: IEvent & { category: { name: string } }
  initialOrderCount: number
}

const RegisterFormClient = ({ event, initialOrderCount }: RegisterFormClientProps) => {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('');
  const [numberOfFormsToShow, setNumberOfFormsToShow] = useState<number>(1);

  const customFields = event.customFields || [];

  const groupSchema = z.object({
    membershipNumber: z.string().min(1, { message: "会员号码为必填 / Membership number is required" }),
    last4PhoneNumberDigits: z.string()
      .length(4, { message: "最后4个电话号码必须是4位数 / Last 4 digits must be 4 characters" })
      .regex(/^[0-9]+$/, { message: "最后4个电话号码必须是数字 / Last 4 digits must be numeric" }),
    ...Object.fromEntries(
      customFields.map(field => [
        field.id,
        field.required
          ? field.type === 'boolean'
            ? z.boolean()
            : z.string().min(1, { message: field.validationMessage || "此栏位为必填 / This field is required" })
          : field.type === 'boolean'
            ? z.boolean().optional()
            : z.string().optional()
      ])
    )
  });

  const formSchema = z.object({
    groups: z.array(groupSchema)
      .min(1, "Please fill out details for at least one person.")
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      groups: Array(numberOfFormsToShow).fill(null).map(() => ({
        membershipNumber: '',
        last4PhoneNumberDigits: '',
        ...Object.fromEntries(customFields.map(field => [field.id, field.type === 'boolean' ? false : '']))
      }))
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "groups"
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const filledGroups = values.groups.filter(group => !isGroupEmpty(group, customFields));
    if (filledGroups.length === 0) {
      toast.error("请至少填写一位报名者的资料 / Please fill in the details for at least one registrant.");
      return;
    }

    if (filledGroups.length > 1) {
       console.warn("Handling multiple registrations in one submission. Ensure backend supports this.");
    }

    const groupData = filledGroups[0];

    setIsSubmitting(true);
    setMessage('');
    const toastId = toast.loading("处理报名中... / Processing registration...");

    try {
      const { membershipNumber, last4PhoneNumberDigits, ...otherFields } = groupData;

      const customFieldValuesForGroup = [{
        groupId: `group_1`,
        fields: Object.entries(otherFields)
          .map(([key, value]) => {
            const fieldDefinition = customFields.find(f => f.id === key);
            return {
              id: key,
              label: fieldDefinition?.label || key,
              type: fieldDefinition?.type || 'text',
              value: value === null || value === undefined ? '' : String(value),
              options: fieldDefinition?.options || [],
            };
          })
          .filter(field => field.value !== '' || field.type === 'boolean')
      }];

      const orderData: CreateOrderParams = {
        eventId: event._id,
        membershipNumber: membershipNumber,
        last4PhoneNumberDigits: last4PhoneNumberDigits,
        createdAt: new Date(),
        customFieldValues: customFieldValuesForGroup,
      };

      const response = await fetch('/api/createOrder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '报名失败，请稍后再试 / Registration failed, please try again later.');
      }

      setMessage(`报名成功！您的报名编号是 / Registration successful! Your registration ID is: ${result.order?._id}`);
      toast.success(`报名成功！/ Registration successful!`, { id: toastId });

      form.reset({
         groups: Array(numberOfFormsToShow).fill(null).map(() => ({
            membershipNumber: '',
            last4PhoneNumberDigits: '',
            ...Object.fromEntries(customFields.map(field => [field.id, field.type === 'boolean' ? false : '']))
          }))
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '发生错误 / An error occurred';
      console.error('Registration Error:', error);
      setMessage(`报名失败：${errorMessage} / Registration failed: ${errorMessage}`);
      toast.error(`报名失败：${errorMessage} / Registration failed: ${errorMessage}`, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPerson = () => {
    append({
      membershipNumber: '',
      last4PhoneNumberDigits: '',
      ...Object.fromEntries(customFields.map(field => [field.id, field.type === 'boolean' ? false : '']))
    });
     setNumberOfFormsToShow(prev => prev + 1);
  };

   const handleRemovePerson = (index: number) => {
    if (fields.length > 1) {
      remove(index);
       setNumberOfFormsToShow(prev => prev - 1);
    } else {
      toast.error("至少需要一位报名者 / At least one registrant is required.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {fields.map((item, index) => (
          <div key={item.id} className="p-4 border rounded-md space-y-4 relative">
            {fields.length > 1 && (
               <Button
                 type="button"
                 variant="destructive"
                 size="sm"
                 onClick={() => handleRemovePerson(index)}
                 className="absolute top-2 right-2"
               >
                 Remove Person {index + 1}
               </Button>
            )}
            <h3 className="text-lg font-semibold">报名者 {toChineseOrdinal(index + 1)} / Registrant {index + 1}</h3>

            <FormField
              control={form.control}
              name={`groups.${index}.membershipNumber`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>会员号码 / Membership Number <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="输入您的会员号码 / Enter your membership number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name={`groups.${index}.last4PhoneNumberDigits`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>最后4个电话号码 / Last 4 Digits of Phone Number <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input
                      placeholder="输入您注册电话号码的最后4位数 / Enter the last 4 digits of your registered phone number"
                      type="text"
                      maxLength={4}
                      {...field}
                      onChange={(e) => {
                         const numericValue = e.target.value.replace(/D/g, '');
                         field.onChange(numericValue);
                       }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {customFields.map((customField, fieldIndex) => (
              <FormField
                key={`${item.id}-${customField.id}`}
                control={form.control}
                name={`groups.${index}.${customField.id}` as any}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{customField.label} {customField.required ? <span className="text-red-500">*</span> : ''}</FormLabel>
                    <FormControl>
                      {customField.type === 'boolean' ? (
                        <Checkbox
                          checked={field.value as unknown as boolean}
                          onCheckedChange={field.onChange}
                        />
                      ) : customField.type === 'textarea' ? (
                         <Textarea placeholder={customField.placeholder} {...field} value={String(field.value ?? '')} />
                      ): (
                        <Input placeholder={customField.placeholder} {...field} value={String(field.value ?? '')} type={customField.type || 'text'} />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
        ))}

       {('maxRegistrationsPerUser' in event ? event.maxRegistrationsPerUser === undefined || fields.length < event.maxRegistrationsPerUser : true) ? (
        <Button type="button" onClick={handleAddPerson} variant="outline">
          <PlusIcon className="mr-2 h-4 w-4" /> 添加另一位报名者 / Add Another Person
        </Button>
        ) : null}

        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="button w-full sm:w-auto col-span-2"
        >
          {isSubmitting ? (
             <>
              <Loader2Icon className="animate-spin mr-2" />
              处理中... / Processing...
            </>
          ) : ('报名参加 / Register Now')}
        </Button>

        {message && <p className={`mt-4 p-4 rounded ${message.includes('失败') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{message}</p>}
      </form>
    </Form>
  )
}

export default RegisterFormClient
