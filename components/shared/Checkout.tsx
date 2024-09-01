import React, { useState } from 'react'
import { IEvent } from '@/lib/database/models/event.model';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Checkbox } from '../ui/checkbox';
import { createOrder } from '@/lib/actions/order.actions';
import CustomFieldsPopup from './CustomFieldsPopup';
import { CustomField } from '@/types';


const Checkout = ({ event, userId }: { event: IEvent, userId: string }) => {
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string | boolean>>({});
  const [showPopup, setShowPopup] = useState(false);

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
    <>
      <Button onClick={() => setShowPopup(true)} role="link" size="lg" className="button sm:w-fit">
        Register for Event
      </Button>

      {showPopup && (
        <CustomFieldsPopup
          onClose={() => setShowPopup(false)}
          onSave={(fields: CustomField[]) => {
            const fieldValues = Object.fromEntries(
              fields.map(field => [field.id, field.value])
            ) as Record<string, string | boolean>;
            setCustomFieldValues(fieldValues);
            onCheckout();
          }}
          initialFields={event.customFields as CustomField[]}
        />
      )}
    </>
  )
}

export default Checkout