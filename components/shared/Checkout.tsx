import React, { useState } from 'react'
import { IEvent } from '@/lib/database/models/event.model';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { createOrder } from '@/lib/actions/order.actions';

const Checkout = ({ event, userId }: { event: IEvent, userId: string }) => {
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string | boolean>>({});

  const onCheckout = async () => {
    const order = {
      eventId: event._id,
      buyerId: userId,
      createdAt: new Date(),
      customFieldValues,
    }

    await createOrder(order);
  }

  const handleCustomFieldChange = (fieldId: string, value: string | boolean) => {
    setCustomFieldValues(prev => ({ ...prev, [fieldId]: value }));
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); onCheckout(); }} className="space-y-4">
      {event.customFields && event.customFields.map((field) => (
        <div key={field.id.toString()}>
          <label htmlFor={field.id.toString()} className="block text-sm font-medium text-gray-700">
            {field.label}
          </label>
          {field.type === 'boolean' ? (
            <Checkbox
              id={field.id.toString()}
              checked={!!customFieldValues[field.id]}
              onCheckedChange={(checked) => handleCustomFieldChange(field.id, checked)}
            />
          ) : (
            <Input
              type={field.type}
              id={field.id.toString()}
              onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
              required
            />
          )}
        </div>
      ))}
      <Button type="submit" role="link" size="lg" className="button sm:w-fit">
        Register for Event
      </Button>
    </form>
  )
}

export default Checkout