import React, { useCallback, useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { showModalWithMessage } from '@/lib/utils'; // Assume this is a utility to show messages
import { cn } from "@/lib/utils";
import Modal from '@/components/ui/modal';
import { categoryCustomFields } from '@/constants'; // Import the category custom fields
import { getEventCategory } from '@/lib/actions/event.actions';


interface UploadOrdersProps {
  eventId: string; // Define the eventId prop type
}

interface CategoryCustomFields {
    [key: string]: { id: string; label: string; type: string; options?: { value: string; label: string; }[] }[];
}

const UploadOrders: React.FC<UploadOrdersProps> = ({ eventId }) => { // Update component signature
  // State for modal management
  const [modalTitle, setModalTitle] = useState<string>('');
  const [modalMessage, setModalMessage] = useState<string>('');
  const [modalType, setModalType] = useState<'loading' | 'success' | 'error'>('loading');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [eventCategory, setEventCategory] = useState<string | null>(null); // Add state for eventCategory
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // Add state for the selected file

  useEffect(() => {
    const fetchEventCategory = async () => {
      const category = await getEventCategory(eventId);
      setEventCategory(category); // Set the fetched category
    };

    fetchEventCategory(); // Call the function to fetch the category
  }, [eventId]); // Dependency on eventId

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file); // Store the selected file
    }
  };

  const handleUpload = useCallback(async () => { // New function to handle upload
    if (!selectedFile) return; // Ensure a file is selected

    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      try {
        const categoryCustomFields: CategoryCustomFields = {
            default: [
                { id: '1', label: '参加者名字 / Participant\'s Name', type: 'text' },
                { id: '2', label: '联系号码 Contact number', type: 'phone' },
              ],
            '念佛共修': [
                { id: '1', label: '参加者名字 / Participant\'s Name', type: 'text' },
                { id: '2', label: '联系号码 Contact number', type: 'phone' },
                {
                  id: '3',
                  label: '请问要参加绕佛吗？Does the participant want to participate in walking and reciting section?',
                  type: 'radio',
                  options: [
                    { value: 'yes', label: '是 Yes' },
                    { value: 'no', label: '否 No' }
                  ]
                },
              ],
              '念佛｜闻法｜祈福｜超荐': [
                { id: '1', label: '参加者名字 / Participant\'s Name', type: 'text' },
                { id: '2', label: '联系号码 Contact number', type: 'phone' },
              ],
              '外出结缘法会': [
                { id: '1', label: '义工名字 Volunteer\'s Name', type: 'text' },
                { id: '2', label: '联系号码 Contact number', type: 'phone' },
              ],
        };


        const customFields = eventCategory && categoryCustomFields[eventCategory] ? categoryCustomFields[eventCategory] : []; // Check for null

        // Fetch existing queue numbers for the event
        const existingQueueNumbersRes = await fetch(`/api/reg/existing-queue-numbers?eventId=${eventId}`);
        const existingQueueNumbersData = await existingQueueNumbersRes.json();
        const existingQueueNumbers = existingQueueNumbersData.queueNumbers || [];
        const maxExistingQueueNumber = existingQueueNumbers.length > 0
          ? Math.max(...existingQueueNumbers.map((qn: string) => parseInt((qn || '').replace(/^[^\d]*(\d+)/, '$1'))).filter((n: number) => !isNaN(n)))
          : 0;

        const orders = jsonData.map((row: any, index: number) => {
          const customFieldValues = customFields.map(field => ({
            id: field.id,
            label: field.label,
            type: field.type,
            value: row[field.label] || '', // Map the Excel data to the custom field
          }));

          // Assign queue number based on max existing + index
          const paddedNumber = String(maxExistingQueueNumber + index + 1).padStart(3, '0');
          const queueNumber = `U${paddedNumber}`;

          return {
            customFieldValues: [
              {
                groupId: `uploaded_group_${index + 1}`,
                queueNumber, // Use the padded queue number
                fields: customFieldValues,
                attendance: true,
                cancelled: false,
              },
            ],
          };
        });

        console.log('Orders to upload:', orders); // Log the orders before sending

        const response = await fetch('/api/reg/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ eventId, ordersData: orders }), // Change 'orders' to 'ordersData'
        });

        if (!response.ok) {
          throw new Error('Failed to upload orders');
        }

        showModalWithMessage(setModalTitle, setModalMessage, setModalType, setShowModal, 'Success', 'Orders uploaded successfully', 'success');
      } catch (error) {
        console.error('Error uploading orders:', error);
        showModalWithMessage(setModalTitle, setModalMessage, setModalType, setShowModal, 'Error', 'Failed to upload orders', 'error');
      }
    };

    reader.readAsArrayBuffer(selectedFile); // Read the selected file
  }, [eventId, eventCategory, selectedFile]); // Add selectedFile as a dependency

  return (
    <div className="mb-4">
      <h2 className="text-3xl font-bold">Upload Orders</h2>
      <h4 className="font-semibold mb-2">Required Excel File Headers:</h4>
      <table className="min-w-full border-collapse border border-gray-300 mb-4">
        <thead>
          <tr>
            <th className="border border-gray-300 p-2">名字 / Name</th>
            <th className="border border-gray-300 p-2">联系号码 Contact number</th>
            {eventCategory === '念佛共修' && (
              <th className="border border-gray-300 p-2">请问要参加绕佛吗？Does the participant want to participate in walking and reciting section?</th>
            )}
          </tr>
        </thead>
        <tbody>
          {/* You can add example data rows here if needed */}
        </tbody>
      </table>
      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileChange}
        className="block mb-2"
        id="upload-orders"
      />
      <Button 
        className="bg-blue-500 text-white" 
        onClick={handleUpload} // Trigger upload on button click
        disabled={!selectedFile} // Disable button if no file is selected
      >
        Upload Orders Excel
      </Button>
      {showModal && (
        <Modal>
          <div className={cn(
            "p-6 rounded-lg",
            modalType === 'success' ? 'bg-green-100' : 
            modalType === 'error' ? 'bg-red-100' : 'bg-white'
          )}>
            <h3 className={cn(
              "text-lg font-semibold mb-4",
              modalType === 'success' ? 'text-green-800' : 
              modalType === 'error' ? 'text-red-800' : 'text-gray-900'
            )}>
              {modalTitle}
            </h3>
            <p className={cn(
              "mb-4 whitespace-pre-line",
              modalType === 'success' ? 'text-green-700' : 
              modalType === 'error' ? 'text-red-700' : 'text-gray-700'
            )}>
              {modalMessage}
            </p>
            {modalType === 'loading' && (
              <div className="flex justify-end">
                <Button 
                  onClick={() => setShowModal(false)} 
                  variant="outline"
                >
                  Close / 关闭
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default UploadOrders;
