// components/shared/RegisterForm.tsx
"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import * as z from 'zod'
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { IEvent } from '@/lib/database/models/event.model'
import { useUser } from '@clerk/nextjs'
import { CreateOrderParams, CustomFieldGroup } from "@/types"
import { getOrderCountByEvent } from '@/lib/actions/order.actions'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { categoryCustomFields, CategoryName } from '@/constants'

const RegisterForm = ({ event }: { event: IEvent & { category: { name: CategoryName } } }) => {
  const router = useRouter();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentRegistrations, setCurrentRegistrations] = useState(0);
  const [groupCount, setGroupCount] = useState(1);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function fetchOrderCount() {
      const count = await getOrderCountByEvent(event._id);
      setCurrentRegistrations(count ?? 0);
    }
    fetchOrderCount();
  }, [event._id]);

  const customFields = categoryCustomFields[event.category.name] || [];

  const formSchema = z.object({
    groups: z.array(
      z.object(
        Object.fromEntries(
          customFields.map(field => [
            field.id,
            field.type === 'boolean'
              ? z.boolean()
              : field.type === 'phone'
                ? z.string().regex(/^\+[1-9]\d{1,14}$/, { message: "Invalid phone number" })
                : z.string().min(1, { message: "This field is required" })
          ])
        )
      )
    )
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      groups: [Object.fromEntries(
        customFields.map(field => [field.id, field.type === 'boolean' ? false : ''])
      )]
    },
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "groups"
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    setMessage(''); // Clear any previous message
    try {
      const customFieldValues: CustomFieldGroup[] = values.groups.map((group, index) => ({
        groupId: `group_${index + 1}`,
        fields: Object.entries(group).map(([key, value]) => {
          const field = customFields.find(f => f.id === key);
          return {
            id: key,
            label: field?.label || key,
            type: field?.type as 'boolean' | 'text' | 'phone',
            value: String(value),
          };
        })
      }));

      const response = await fetch('/api/createOrder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: event._id,
          customFieldValues,
        } as CreateOrderParams),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const data = await response.json();
      router.push(`/events/${event._id}/thank-you?orderId=${data.order._id}`);
    } catch (error) {
      console.error('Error submitting form:', error);
      setMessage('Failed to submit registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFullyBooked = currentRegistrations >= event.maxSeats;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {fields.map((field, index) => (
          <div key={field.id}>
            {customFields.map(customField => (
              <FormField
                key={customField.id}
                name={`groups.${index}.${customField.id}`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{customField.label}</FormLabel>
                    <FormControl>
                      {customField.type === 'boolean' ? (
                        <Checkbox {...field} />
                      ) : customField.type === 'phone' ? (
                        <PhoneInput {...field} />
                      ) : (
                        <Input {...field} />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
        ))}
        <Button type="submit" disabled={isSubmitting || isFullyBooked}>
          {isSubmitting ? 'Submitting...' : isFullyBooked ? 'Fully Booked' : 'Submit'}
        </Button>
        {message && <p>{message}</p>}
      </form>
    </Form>
  );
};

export default RegisterForm;