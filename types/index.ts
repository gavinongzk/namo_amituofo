import { ObjectId } from 'mongodb'; // Add this import


// ====== USER PARAMS
export type CreateUserParams = {
  clerkId: string
  email: string
  phoneNumber: string
}

export type UpdateUserParams = {
  email: string
  phoneNumber: string
}

// ====== EVENT PARAMS
export type CreateEventParams = {
  userId: string
  event: {
    title: string
    description: string
    location: string
    imageUrl: string
    startDateTime: Date
    endDateTime: Date
    categoryId: string
    customFields: CustomField[]
  }
  path: string
}

export type UpdateEventParams = {
  userId: string
  event: {
    _id: string
    title: string
    imageUrl: string
    description: string
    location: string
    startDateTime: Date
    endDateTime: Date
    categoryId: string
    customFields: CustomField[]
  }
  path: string
}

export type DeleteEventParams = {
  eventId: string
  path: string
}

export type GetAllEventsParams = {
  query: string
  category: string
  limit: number
  page: number
}

export type GetEventsByUserParams = {
  userId: string
  limit?: number
  page: number
}

export type GetRelatedEventsByCategoryParams = {
  categoryId: string
  eventId: string
  limit?: number
  page: number | string
}

export type Event = {
  _id: string
  title: string
  description: string
  imageUrl: string
  location: string
  startDateTime: Date
  endDateTime: Date
  organizer: {
    _id: string
  }
  category: {
    _id: string
    name: string
  }
  customFields: CustomField[]
}

// ====== CATEGORY PARAMS
export type CreateCategoryParams = {
  categoryName: string
}

// ====== ORDER PARAMS
export type CheckoutOrderParams = {
  eventTitle: string
  eventId: string
}

export interface CreateOrderParams {
  eventId: string;
  createdAt: Date;
  customFieldValues: CustomFieldGroup[];
}

export type GetOrdersByEventParams = {
  eventId: string
  searchString?: string
}

export type GetOrdersByUserParams = {
  userId: string | null
  limit?: number
  page: string | number | null
}

// ====== URL QUERY PARAMS
export type UrlQueryParams = {
  params: string
  key: string
  value: string | null
}

export type RemoveUrlQueryParams = {
  params: string
  keysToRemove: string[]
}

export type SearchParamProps = {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export type CustomField = {
  id: string;
  label: string;
  type: "boolean" | "text" | "phone" | "radio";
  value?: string | boolean;
  options?: { value: string; label: string }[];
};

export interface IRegistration {
  event: {
    _id: string;
    title: string;
    imageUrl?: string;
    startDateTime?: Date;
    endDateTime?: Date;
    organizer: { _id: string };
    orderId?: string;
    customFieldValues: {
      groupId: string;
      fields: {
        id: string;
        label: string;
        type: string;
        value: string | boolean;
        options?: { value: string; label: string }[];
      }[];
    }[];
    queueNumber?: string;
    attendeeCount?: number;
  };
  registrations: {
    queueNumber?: string;
    name?: string;
  }[];
}

export interface CustomFieldGroup {
  groupId: string;
  fields: CustomField[];
  __v?: number;
  queueNumber?: string;
  attendance?: boolean;
}

// Add this type definition
export type UniquePhoneNumber = {
  phoneNumber: string;
  isNewUser: boolean;
  name: string;
};