# Namo Amituofo Event Registration System

A comprehensive event registration system built with Next.js, featuring real-time attendance tracking, QR code generation, and multi-language support.

## Features

### Core Functionality
- **Event Management**: Create, edit, and manage events with custom fields
- **Registration System**: Multi-participant registration with validation
- **QR Code Integration**: Generate and scan QR codes for attendance tracking
- **Real-time Analytics**: Live attendance tracking and analytics dashboard
- **Multi-language Support**: Bilingual interface (English/Chinese)
- **Mobile Responsive**: Optimized for all device sizes

### Advanced Features
- **Client-Side Error Recovery**: Automatic cache clearing and retry mechanism for registration form errors
- **Offline Support**: Network status detection and offline prevention
- **Queue Number Management**: Automatic queue number generation with uniqueness validation
- **Duplicate Detection**: Phone number duplicate checking with confirmation
- **File Upload**: Bulk registration via CSV upload
- **Export Functionality**: CSV export for registrations and analytics

## Client-Side Error Handling

The registration form includes comprehensive error handling for client-side issues:

### Automatic Cache Clearing
When a client-side error occurs during form submission, the system can:
- Clear all localStorage and sessionStorage
- Clear browser cache and service worker cache
- Clear specific cookies that might cause issues
- Refresh the page to get fresh data

### Retry Mechanism
- **Smart Error Detection**: Automatically identifies client-side vs server-side errors
- **User-Friendly Dialog**: Shows clear error messages with retry options
- **Retry Counter**: Limits retries to prevent infinite loops (max 3 attempts)
- **Bilingual Support**: Error messages in both English and Chinese

### Error Types Handled
- Network connection errors
- Fetch/API request failures
- Cache-related issues
- CORS errors
- Timeout errors
- Unknown client-side errors

### Usage
When a client-side error occurs:
1. User sees a dialog explaining the issue
2. System offers to clear cache and retry
3. If accepted, all client-side cache is cleared
4. Page refreshes with fresh data
5. User can retry the submission

## Installation

```bash
npm install
# or
pnpm install
```

## Development

```bash
npm run dev
# or
pnpm dev
```

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Sentry (Error Tracking)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn

# UploadThing (File Upload)
UPLOADTHING_SECRET=your_uploadthing_secret
UPLOADTHING_APP_ID=your_uploadthing_app_id
```

## API Endpoints

### Events
- `GET /api/events` - List all events
- `POST /api/events` - Create new event
- `GET /api/events/[id]` - Get event details
- `PUT /api/events/[id]` - Update event
- `DELETE /api/events/[id]` - Delete event

### Registrations
- `POST /api/createOrder` - Create registration
- `GET /api/reg/[id]` - Get registration details
- `PUT /api/update-registration` - Update registration status/fields
- `GET /api/reg` - Lookup registrations by phone number

### Analytics
- `GET /api/analytics` - Get analytics data
- `GET /api/events/[id]/counts` - Get event registration counts
- `GET /api/events/[id]/attendees` - Get event attendees

## Database Schema

### Events
- Basic event information (title, description, date, location)
- Custom fields configuration
- Capacity and registration limits
- Category and country settings

### Orders (Registrations)
- Event reference
- Custom field values
- Queue numbers
- Attendance status
- QR code data

### Users
- Clerk user integration
- Role-based access control
- Country preferences

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.


