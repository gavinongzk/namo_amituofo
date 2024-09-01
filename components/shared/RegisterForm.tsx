// components/shared/RegisterForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from 'zod'
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { IEvent } from '@/lib/database/models/event.model'
import { createOrder } from '@/lib/actions/order.actions'
import { useUser } from '@clerk/nextjs'
import { CreateOrderParams } from "@/types"

const RegisterForm = ({ event }: { event: IEvent }) => {
  const router = useRouter()
  const { user } = useUser()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const formSchema = z.object({
    ...Object.fromEntries(
      (event.customFields ?? []).map(field => [
        field.id,
        field.type === 'boolean'
          ? z.boolean()
          : z.string().min(1, { message: "This field is required" })
      ])
    )
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: Object.fromEntries(
      (event.customFields ?? []).map(field => [field.id, field.type === 'boolean' ? false : ''])
    ),
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    try {
      const customFieldValues = Object.entries(values).map(([key, value]) => ({
        label: key,
        type: (typeof value === 'boolean' ? 'boolean' : 'text') as 'boolean' | 'text', // Type assertion
        value: String(value),
      }));
  
      const order: CreateOrderParams = {
        eventId: event._id,
        buyerId: user?.id || '', // Ensure buyerId is always a string
        createdAt: new Date(),
        customFieldValues,
      };

      await createOrder(order)
      router.push('/thank-you')
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {event.customFields?.map((field) => (
          <FormField
            key={field.id}
            control={form.control}
            name={field.id}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}</FormLabel>
                <FormControl>
                  {field.type === 'boolean' ? (
                    <Checkbox
                      checked={formField.value as boolean}
                      onCheckedChange={formField.onChange}
                    />
                  ) : (
                    <Input {...formField}  value={String(formField.value)} />
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Register'}
        </Button>
      </form>
    </Form>
  )
}

export default RegisterForm