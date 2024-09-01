import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CustomField } from '@/types';

type CustomFieldsPopupProps = {
  onSave: (fields: CustomField[]) => void;
  initialFields?: CustomField[];
};

const CustomFieldsPopup: React.FC<CustomFieldsPopupProps> = ({ onSave, initialFields }) => {
  const [fields, setFields] = useState<CustomField[]>(initialFields || [
    { id: '1', label: '（第1位）参加者名字 Participant\'s Name', type: 'text' },
    { id: '2', label: '（第1位）联系号码 Contact number', type: 'text' },
    { id: '3', label: '请问【第1位】要参加绕佛吗？Does the first person want to participate in walking and reciting section?', type: 'boolean' },
    { id: '4', label: '（第2位）参加者名字 Participant\'s Name', type: 'text' },
    { id: '5', label: '（第2位）联系号码 Contact number', type: 'text' },
    { id: '6', label: '请问【第2位】要参加绕佛吗？Does the second person want to participate in walking and reciting section?', type: 'boolean' },
    { id: '7', label: '（第3位）参加者名字 Participant\'s Name', type: 'text' },
    { id: '8', label: '（第3位）联系号码 Contact number', type: 'text' },
    { id: '9', label: '请问【第3位】要参加绕佛吗？Does the third person want to participate in walking and reciting section?', type: 'boolean' },
  ]);

  const handleSave = () => {
    onSave(fields);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Define Custom Fields</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Custom Fields</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {fields.map((field) => (
            <div key={field.id} className="flex items-center gap-2">
              <Input value={field.label} readOnly />
              <span>{field.type}</span>
            </div>
          ))}
        </div>
        <Button onClick={handleSave}>Save Custom Fields</Button>
      </DialogContent>
    </Dialog>
  );
};

export default CustomFieldsPopup;