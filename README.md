# 净土宗报名系统 | Namo Amituofo Registration

净土宗报名系统 | Namo Amituofo Registration is a comprehensive platform designed to facilitate user registrations for various Buddhist events. Built with modern web technologies, it offers a seamless experience for both users and administrators, ensuring efficient event management and attendance tracking.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Folder Structure](#folder-structure)
- [Contributing](#contributing)

## Features

### User Features
- **Event Registration:** 
  - Register for events with unique queue numbers
  - QR code generation for each registration
  - Support for multiple participants per registration
- **Profile Management:** 
  - View registered events and tickets
  - Access QR codes for quick check-in
  - Track registration status
- **Responsive Design:** 
  - Mobile-first approach
  - Optimized for both desktop and mobile devices

### Admin Features
- **Advanced Dashboard:**
  - Real-time statistics and analytics
  - Event attendance tracking
  - User registration trends
- **Event Management:**
  - Create and manage events
  - Customize registration fields
  - Set event categories and capacities
- **Attendance System:**
  - QR code scanning for quick check-in
  - Real-time attendance tracking
  - Bulk attendance management
  - Support for walk-in registrations
- **User Management:**
  - Track new vs returning users
  - Add remarks and notes to user profiles
  - View participation history
- **Data Management:**
  - Bulk import registrations via Excel
  - Export attendance data to CSV/Excel
  - Generate detailed reports
- **Multi-language Support:**
  - Bilingual interface (English/Chinese)
  - Localized error messages and notifications

## Tech Stack

- **Frontend:**
  - Next.js 14 (App Router)
  - React 18 with TypeScript
  - Tailwind CSS & Shadcn UI
  - React Hook Form
  - Clerk Authentication
  - Chart.js for analytics

- **Backend:**
  - Next.js API Routes
  - MongoDB & Mongoose
  - Uploadthing for file handling
  - QR code generation and scanning

- **Development Tools:**
  - TypeScript
  - ESLint & Prettier
  - Jest for testing
  - React Error Boundary

## Installation

1. **Clone and Install:**

   ```bash
   git clone https://github.com/yourusername/namo-amituofo-register.git
   cd namo-amituofo-register
   npm install
   ```

2. **Environment Setup:**
Create a `.env.local` file:
```env
MONGODB_URI=your_mongodb_connection_string
NEXT_PUBLIC_CLERK_FRONTEND_API=your_clerk_frontend_api
CLERK_API_KEY=your_clerk_api_key
UPLOADTHING_API_KEY=your_uploadthing_api_key
```

3. **Development Server:**
```bash
npm run dev
```

## Usage

### Admin Dashboard

1. **Attendance Tracking:**
   - Scan QR codes for instant check-in
   - View real-time attendance statistics
   - Filter and search registrations
   - Add remarks to specific registrations

2. **User Management:**
   - Track new vs returning users
   - Add and manage user remarks
   - View participation history
   - Handle bulk user imports

3. **Data Export:**
   - Export attendance data in multiple formats
   - Generate QR codes for registrations
   - Create detailed event reports

### Event Management

1. **Create Events:**
   - Set event details and capacity
   - Configure custom registration fields
   - Define event categories

2. **Registration Management:**
   - Process walk-in registrations
   - Handle queue number assignments
   - Manage cancellations and updates

## Folder Structure
```
namo-amituofo-register/
├── app/
│   ├── api/           # API routes
│   ├── (auth)/        # Authentication pages
│   ├── (root)/        # Main application pages
│   ├── components/    # Reusable components
│   └── lib/          # Utilities and helpers
├── public/           # Static assets
└── types/           # TypeScript definitions
```

## Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the Repository**
2. **Create a Feature Branch**

   ```bash
   git checkout -b feature/YourFeature
   ```

3. **Commit Your Changes**

   ```bash
   git commit -m "Add your feature"
   ```

4. **Push to the Branch**

   ```bash
   git push origin feature/YourFeature
   ```

5. **Create a Pull Request**

Please ensure your code follows the project's coding standards and includes relevant tests.


