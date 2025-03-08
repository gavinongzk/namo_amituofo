"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { eventFormSchema } from "@/lib/validator"
import * as z from 'zod'
import { eventDefaultValues } from "@/constants"
import Dropdown from "./Dropdown"
import { Textarea } from "@/components/ui/textarea"
import { FileUploader } from "./FileUploader"
import { useState, useEffect } from "react"
import Image from "next/image"
import DatePicker from "react-datepicker";
import { useUploadThing } from '@/lib/uploadthing'
import { useFieldArray } from "react-hook-form";
import { CustomField } from "@/types";
import { formatBilingualDateTime } from '@/lib/utils';

import "react-datepicker/dist/react-datepicker.css";
import { Checkbox } from "../ui/checkbox"
import { useRouter } from "next/navigation"
import { createEvent, updateEvent } from "@/lib/actions/event.actions"
import { IEvent } from "@/lib/database/models/event.model"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"


type EventFormProps = {
  userId: string
  type: "Create" | "Update"
  event?: IEvent,
  eventId?: string
}

const EventForm = ({ userId, type, event, eventId }: EventFormProps) => {
  const [files, setFiles] = useState<File[]>([])
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null);

  const formatDateForPicker = (date: Date) => {
    const bilingualDate = formatBilingualDateTime(date);
    const chineseWeekday = date.toLocaleString('zh-CN', { weekday: 'long' });
    const englishWeekday = date.toLocaleString('en-US', { weekday: 'short' });
    const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()} (${chineseWeekday} ${englishWeekday})`;
    const hour = date.getHours();
    const minute = date.getMinutes().toString().padStart(2, '0');
    const period = hour < 12 ? '上午' : '下午';
    const hour12 = hour % 12 || 12;
    const formattedTime = `${period}${hour12}.${minute}`;
    return `${formattedDate} ${formattedTime}`;
  };

  const form = useForm<z.infer<typeof eventFormSchema>>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: event && type === 'Update'
      ? {
          ...event,
          country: event.country || "Singapore",
          startDateTime: new Date(event.startDateTime),
          endDateTime: new Date(event.endDateTime),
          categoryId: event.category._id,
          customFields: event.customFields.map(field => ({
            id: field.id,
            label: field.label,
            type: field.type as 'boolean' | 'text' | 'phone' | 'radio',
            value: field.value,
            options: field.options?.map(option => 
              typeof option === 'string' ? option : option.value
            )
          })) || [],
        }
      : { ...eventDefaultValues }
  })

  useEffect(() => {
    const detectCountry = async () => {
      try {
        const response = await fetch('https://get.geojs.io/v1/ip/country.json');
        const data = await response.json();
        const country = data.country === 'SG' ? 'Singapore' : data.country === 'MY' ? 'Malaysia' : null;
        if (country && !form.getValues('country')) {
          form.setValue('country', country);
        }
      } catch (error) {
        console.error('Error detecting country:', error);
      }
    };

    detectCountry();
  }, [form]);

  const router = useRouter()

  const { startUpload } = useUploadThing('imageUploader')

  const { fields: customFields, append, remove } = useFieldArray({
    control: form.control,
    name: "customFields",
  });

  async function onSubmit(values: z.infer<typeof eventFormSchema>) {
    console.log("Form submitted with values:", values);
    
    // Ensure country is set
    if (!values.country) {
      console.log("Country is required but not set");
      // Set a default country if not provided
      values.country = "Singapore";
      console.log("Set default country to Singapore");
    }
    
    let uploadedImageUrl = values.imageUrl || ''; // Ensure it's always a string

    if(files.length > 0) {
      console.log("Uploading files...");
      const uploadedImages = await startUpload(files)

      if(!uploadedImages) {
        console.error("File upload failed");
        return
      }

      uploadedImageUrl = uploadedImages[0].url
      console.log("File uploaded successfully:", uploadedImageUrl);
    }

    if(type === 'Create') {
      try {
        console.log("Attempting to create event with data:", {
          event: { 
            ...values, 
            imageUrl: uploadedImageUrl,
            customFields: values.customFields,
            country: values.country // Explicitly include country
          },
          userId,
          path: '/profile'
        });
        
        const newEvent = await createEvent({
          event: { 
            ...values, 
            imageUrl: uploadedImageUrl, 
            customFields: values.customFields.map(field => ({
              ...field,
              value: field.value || '' // Ensure value is never undefined
            })) as CustomField[]
          },
          userId,
          path: '/profile'
        })
        
        console.log("newEvent created:", newEvent);

        if(newEvent) {
          form.reset();
          router.push(`/events/details/${newEvent._id}`)
        } else {
          console.error("Event creation failed: newEvent is undefined or null");
        }
      } catch (error) {
        console.error("Error creating event:", error);
      }
    }

    if(type === 'Update') {
      if(!eventId) {
        router.back()
        return;
      }

      try {
        const updatedEvent = await updateEvent({
          userId,
          event: { 
            ...values, 
            imageUrl: uploadedImageUrl, 
            _id: eventId,
            customFields: values.customFields.map(field => ({
              ...field,
              value: field.value || '' // Ensure value is never undefined
            })) as CustomField[]
          },
          path: `/events/details/${eventId}`
        })

        if(updatedEvent) {
          form.reset();
          router.push(`/events/details/${updatedEvent._id}`)
        }
      } catch (error) {
        console.log(error);
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div className="flex flex-col gap-5 md:flex-row">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormControl>
                  <Input placeholder="Event title" {...field} className="input-field" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormControl>
                  <Dropdown onChangeHandler={field.onChange} value={field.value} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col gap-5 md:flex-row">
          <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormControl className="h-72">
                    <Textarea placeholder="Description" {...field} className="textarea rounded-2xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel className="text-grey-600">Event Image (Optional)</FormLabel>
                  <FormControl className="h-72">
                    <FileUploader 
                      onFieldChange={field.onChange}
                      imageUrl={field.value}
                      setFiles={setFiles}
                    />
                  </FormControl>
                  <FormDescription>
                    You can upload an image now or add it later
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>

        <div className="flex flex-col gap-5 md:flex-row">
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormControl>
                  <div className="flex-center h-[54px] w-full overflow-hidden rounded-full bg-grey-50 px-4 py-2">
                    <Image
                      src="/assets/icons/location-grey.svg"
                      alt="country"
                      width={24}
                      height={24}
                      className="filter-grey mr-3"
                    />
                    <p className="mr-3 whitespace-nowrap text-grey-600">Country:</p>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="w-full bg-transparent border-none focus:outline-none">
                        <SelectValue placeholder="Select Country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Singapore">Singapore</SelectItem>
                        <SelectItem value="Malaysia">Malaysia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormControl>
                  <div className="flex-center h-[54px] w-full overflow-hidden rounded-full bg-grey-50 px-4 py-2">
                    <Image
                      src="/assets/icons/location-grey.svg"
                      alt="location"
                      width={24}
                      height={24}
                    />
                    <Input placeholder="Event Address or Online" {...field} className="input-field bg-transparent border-none focus:outline-none" />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-col gap-5 md:flex-row">
          <FormField
              control={form.control}
              name="startDateTime"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormControl>
                    <div className="flex-center h-[54px] w-full overflow-hidden rounded-full bg-grey-50 px-4 py-2">
                      <Image
                        src="/assets/icons/calendar.svg"
                        alt="calendar"
                        width={24}
                        height={24}
                        className="filter-grey"
                      />
                      <p className="ml-3 whitespace-nowrap text-grey-600">Start Date:</p>
                      <DatePicker 
                        selected={field.value} 
                        onChange={(date: Date) => {
                          const tzOffset = 8 * 60; // GMT+8 offset in minutes
                          const localOffset = date.getTimezoneOffset();
                          const totalOffset = tzOffset + localOffset;
                          const adjustedDate = new Date(date.getTime() + totalOffset * 60000);
                          field.onChange(adjustedDate);
                        }} 
                        showTimeSelect
                        timeInputLabel="Time:"
                        dateFormat="dd-MM-yyyy (EEEE eee) aa h.mm"
                        wrapperClassName="datePicker"
                      />
                    </div>

                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        
          <FormField
              control={form.control}
              name="endDateTime"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormControl>
                    <div className="flex-center h-[54px] w-full overflow-hidden rounded-full bg-grey-50 px-4 py-2">
                      <Image
                        src="/assets/icons/calendar.svg"
                        alt="calendar"
                        width={24}
                        height={24}
                        className="filter-grey"
                      />
                      <p className="ml-3 whitespace-nowrap text-grey-600">End Date:</p>
                      <DatePicker 
                        selected={field.value} 
                        onChange={(date: Date) => {
                          const tzOffset = 8 * 60; // GMT+8 offset in minutes
                          const localOffset = date.getTimezoneOffset();
                          const totalOffset = tzOffset + localOffset;
                          const adjustedDate = new Date(date.getTime() + totalOffset * 60000);
                          field.onChange(adjustedDate);
                        }} 
                        showTimeSelect
                        timeInputLabel="Time:"
                        dateFormat="dd-MM-yyyy (EEEE eee) aa h.mm"
                        wrapperClassName="datePicker"
                      />
                    </div>

                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>

        <div className="flex flex-col gap-5 md:flex-row">
          <FormField
            control={form.control}
            name="maxSeats"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormControl>
                  <div className="flex-center h-[54px] w-full overflow-hidden rounded-full bg-grey-50 px-4 py-2">
                    <Image
                      src="/assets/icons/seats.svg"
                      alt="seats"
                      width={24}
                      height={24}
                      className="filter-grey mr-3"
                    />
                    <p className="mr-3 whitespace-nowrap text-grey-600">Max Seats:</p>
                    <Input
                      placeholder="Enter number"
                      type="number"
                      {...field}
                      className="input-field bg-transparent border-none focus:outline-none"
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>


        <div className="flex flex-col gap-5">
          <h3 className="text-lg font-medium">Custom Questions</h3>
          {customFields.map((field, index) => (
            <div key={field.id} className="flex flex-col gap-5">
              <FormField
                control={form.control}
                name={`customFields.${index}.label`}
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl>
                      <Input placeholder="Question" {...field} className="input-field" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`customFields.${index}.type`}
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormControl>
                      <select {...field} className="input-field rounded-full bg-grey-50 px-4 py-2">
                        <option value="text">Text</option>
                        <option value="boolean">Boolean</option>
                        <option value="phone">Phone Number</option>
                        <option value="radio">Radio</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {field.type === 'radio' && (
                <FormField
                  control={form.control}
                  name={`customFields.${index}.options`}
                  render={({ field: optionsField }) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <Input
                          placeholder="Options (comma-separated)"
                          value={Array.isArray(optionsField.value) ? optionsField.value.join(', ') : String(optionsField.value ?? '')}
                          onChange={(e) => {
                            const inputValue = e.target.value;
                            const optionsArray = inputValue.split(',').map(option => option.trim()).filter(Boolean);
                            optionsField.onChange(optionsArray);
                          }}
                          onBlur={optionsField.onBlur}
                          name={optionsField.name}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <Button type="button" onClick={() => remove(index)} className="small-button bg-red-500 hover:bg-red-600 text-white rounded-md">Remove Question</Button>
            </div>
          ))}
          <Button type="button" onClick={() => append({ id: Date.now().toString(), label: "", type: "text" })} className="small-button bg-blue-500 hover:bg-blue-600 text-white rounded-md">
            Add Question
          </Button>
        </div>


        <Button 
          type="submit"
          size="lg"
          disabled={form.formState.isSubmitting}
          className="button col-span-2 w-full"
        >
          {form.formState.isSubmitting ? (
            'Submitting...'
          ): `${type} Event `}</Button>
      </form>
    </Form>
  )
}

export default EventForm