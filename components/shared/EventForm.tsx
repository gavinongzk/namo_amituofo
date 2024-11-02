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

// Add this interface to ensure form values match schema
interface EventFormData {
  title: string
  description: string
  location: string
  imageUrl: string
  startDateTime: Date
  endDateTime: Date
  categoryId: string
  maxSeats: number
  customFields: Array<{
    id: string
    label: string
    type: "boolean" | "text" | "phone" | "radio" | "checkbox"
    value?: string | boolean | string[]
    options?: string[]
  }>
  registrationSuccessMessage?: string
  country: string
}

const EventForm = ({ userId, type, event, eventId }: EventFormProps) => {
  const [files, setFiles] = useState<File[]>([])
  const [detectedCountry, setDetectedCountry] = useState<string | null>(null);

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: event && type === 'Update'
      ? {
          ...event,
          country: event.country || "",
          startDateTime: new Date(event.startDateTime),
          endDateTime: new Date(event.endDateTime),
          categoryId: event.category._id,
          customFields: event.customFields.map(field => ({
            id: field.id,
            label: field.label,
            type: field.type as "boolean" | "text" | "phone" | "radio" | "checkbox",
            value: field.value,
            options: field.options?.map(option => 
              typeof option === 'string' ? option : option.value
            )
          })) || [],
          registrationSuccessMessage: event.registrationSuccessMessage || "",
        }
      : { ...eventDefaultValues, country: "" }
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

  async function onSubmit(values: EventFormData) {
    let uploadedImageUrl = values.imageUrl;

    if(files.length > 0) {
      const uploadedImages = await startUpload(files)

      if(!uploadedImages) {
        return
      }

      uploadedImageUrl = uploadedImages[0].url
    }

    if(type === 'Create') {
      try {
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
        
        console.log("newEvent created")

        if(newEvent) {
          form.reset();
          router.push(`/events/${newEvent._id}`)
        }
      } catch (error) {
        console.log(error);
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
          path: `/events/${eventId}`
        })

        if(updatedEvent) {
          form.reset();
          router.push(`/events/${updatedEvent._id}`)
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
                  <FormControl className="h-72">
                    <FileUploader 
                      onFieldChange={field.onChange}
                      imageUrl={field.value}
                      setFiles={setFiles}
                    />
                  </FormControl>
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
                      src="/assets/icons/world.svg"
                      alt="globe"
                      width={24}
                      height={24}
                      className="filter-grey"
                    />
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="border-none bg-transparent focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                        <SelectValue placeholder="Select a country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Singapore">
                          <div className="flex items-center gap-2">
                            <Image src="/assets/flags/sg.svg" alt="Singapore flag" width={20} height={15} />
                            <span>Singapore</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="Malaysia">
                          <div className="flex items-center gap-2">
                            <Image src="/assets/flags/my.svg" alt="Malaysia flag" width={20} height={15} />
                            <span>Malaysia</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </FormControl>
                <FormDescription className="text-xs text-gray-500 mt-1 ml-4">
                  Select the country where the event will take place.
                </FormDescription>
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
                        onChange={(date: Date) => field.onChange(date)} 
                        showTimeSelect
                        timeInputLabel="Time:"
                        dateFormat="MM/dd/yyyy h:mm aa"
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
                        onChange={(date: Date) => field.onChange(date)} 
                        showTimeSelect
                        timeInputLabel="Time:"
                        dateFormat="MM/dd/yyyy h:mm aa"
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
                        <option value="checkbox">Checkbox (Multiple Selection)</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {(field.type === 'radio' || field.type === 'checkbox') && (
                <>
                  <FormField
                    control={form.control}
                    name={`customFields.${index}.options`}
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>Options (one per line)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter each option on a new line"
                            className="input-field min-h-[100px]"
                            value={Array.isArray(field.value) ? field.value.join('\n') : ''}
                            onChange={(e) => {
                              const options = e.target.value
                                .split('\n')
                                .map(option => option.trim())
                                .filter(Boolean);
                              field.onChange(options);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter each option on a new line. For example:
                          {customFields[index].type === 'radio' ? 
                            '\nOption 1\nOption 2' : 
                            '\n[ ] Option 1\n[ ] Option 2'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Preview Section */}
                  <div className="mt-2 p-4 bg-grey-50 rounded-lg">
                    <p className="text-sm font-medium mb-3 text-grey-600">Preview:</p>
                    <div className="space-y-3">
                      {Array.isArray(form.getValues(`customFields.${index}.options`)) && 
                        form.getValues(`customFields.${index}.options`)?.map((option: { label: string } | string, optionIndex) => {
                          const optionLabel = typeof option === 'string' ? option : option?.label;
                          
                          return (
                            <div key={optionIndex} className="flex items-center gap-3">
                              {customFields[index].type === 'radio' ? (
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    disabled
                                    className="h-4 w-4 border-gray-300"
                                  />
                                  <Input 
                                    value={optionLabel}
                                    onChange={(e) => {
                                      const currentOptions = form.getValues(`customFields.${index}.options`) || [];
                                      const newOptions = [...currentOptions];
                                      newOptions[optionIndex] = e.target.value;
                                      form.setValue(`customFields.${index}.options`, newOptions);
                                    }}
                                    className="input-field"
                                    placeholder={`Option ${optionIndex + 1}`}
                                  />
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2">
                                  <Checkbox disabled />
                                  <Input 
                                    value={optionLabel}
                                    onChange={(e) => {
                                      const currentOptions = form.getValues(`customFields.${index}.options`) || [];
                                      const newOptions = [...currentOptions];
                                      newOptions[optionIndex] = e.target.value;
                                      form.setValue(`customFields.${index}.options`, newOptions);
                                    }}
                                    className="input-field"
                                    placeholder={`Option ${optionIndex + 1}`}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })
                      }
                      <Button
                        type="button"
                        onClick={() => {
                          const currentOptions = form.getValues(`customFields.${index}.options`) || [];
                          form.setValue(`customFields.${index}.options`, [...currentOptions, '']);
                        }}
                        className="mt-2 text-sm"
                        variant="outline"
                      >
                        Add Option
                      </Button>
                      {(!form.getValues(`customFields.${index}.options`)?.length) && (
                        <p className="text-sm text-gray-500 italic">No options added yet</p>
                      )}
                    </div>
                  </div>
                </>
              )}
              <Button type="button" onClick={() => remove(index)} className="small-button bg-red-500 hover:bg-red-600 text-white rounded-md">Remove Question</Button>
            </div>
          ))}
          <Button type="button" onClick={() => append({ id: Date.now().toString(), label: "", type: "text", options: [] })} className="small-button bg-blue-500 hover:bg-blue-600 text-white rounded-md">
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