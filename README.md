# Namo Amituofo Registration

Namo Amituofo Registration is a comprehensive platform designed to facilitate user registrations for various events. Built with modern web technologies, it offers a seamless experience for both users and administrators, ensuring efficient event management and attendance tracking.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Folder Structure](#folder-structure)
- [Contributing](#contributing)
- [License](#license)

## Features

### User Features
- **Event Browsing & Search:** Users can browse through a list of upcoming events, search by keywords, and filter by categories.
- **Event Registration:** Easily register for events by entering a queue number.
- **Profile Management:** View and manage registered events and tickets.
- **Responsive Design:** Optimized for both desktop and mobile devices.

### Admin Features
- **Dashboard:** Overview of event statistics and quick actions.
- **Event Management:** Create, update, and delete events with ease.
- **User Management:** Manage user roles and permissions.
- **Attendance Tracking:** Mark attendance for registered users with real-time updates.
- **File Uploads:** Upload event-related images and documents securely.

## Tech Stack

- **Frontend:**
  - [Next.js 14](https://nextjs.org/)
  - [React 18](https://reactjs.org/)
  - [Tailwind CSS](https://tailwindcss.com/)
  - [Radix UI](https://www.radix-ui.com/)
  - [React Hook Form](https://react-hook-form.com/)
  - [Clerk for Authentication](https://clerk.com/)

- **Backend:**
  - [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
  - [MongoDB & Mongoose](https://mongoosejs.com/)
  - [Uploadthing](https://uploadthing.com/)

- **Other Tools:**
  - [TypeScript](https://www.typescriptlang.org/)
  - [ESLint & Prettier](https://eslint.org/ & https://prettier.io/)
  - [React Paginate](https://www.npmjs.com/package/react-paginate)

## Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/yourusername/namo-amituofo-register.git
   cd namo-amituofo-register
   ```

2. **Install Dependencies:**

   Ensure you have [Node.js](https://nodejs.org/) installed. Then run:

   ```bash
   npm install
   ```

3. **Set Up Environment Variables:**

   Create a `.env.local` file in the root directory and add the following variables:

   ```env
   MONGODB_URI=your_mongodb_connection_string
   NEXT_PUBLIC_CLERK_FRONTEND_API=your_clerk_frontend_api
   CLERK_API_KEY=your_clerk_api_key
   UPLOADTHING_API_KEY=your_uploadthing_api_key
   ```

4. **Run the Development Server:**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Configuration

### Tailwind CSS

Tailwind is configured in `tailwind.config.ts`. You can customize themes, extend utilities, and adjust content paths as needed.

### Clerk Authentication

Clerk is used for handling authentication. Ensure you've set up Clerk correctly and your API keys are added to the environment variables.

### MongoDB

The application uses MongoDB for data persistence. Models are defined using Mongoose in the `lib/database/models` directory.

## Usage

### User Flow

1. **Browse Events:**
   - Navigate to the homepage to view all available events.
   - Use the search bar and category filters to find specific events.

2. **Register for an Event:**
   - Click on an event to view details.
   - Enter your queue number to mark attendance.

3. **Manage Profile:**
   - Access your profile to view registered events and tickets.
   - View details of each order and manage your registrations.

### Admin Flow

1. **Access Admin Dashboard:**
   - Navigate to `/admin/dashboard` after logging in with admin credentials.

2. **Manage Events:**
   - Create new events or update existing ones.
   - Upload event images and documents using the file uploader.

3. **Manage Users:**
   - Navigate to `/admin/users` to view and manage user roles.

4. **Track Attendance:**
   - Select an event to view registered users.
   - Mark attendance using the checkbox interface.

## Folder Structure

```
namo-amituofo-register/
├── app/
│   ├── api/
│   │   ├── createOrder/
│   │   ├── events/
│   │   └── uploadthing/
│   ├── (auth)/
│   ├── (root)/
│   │   ├── admin/
│   │   │   ├── attendance/
│   │   │   ├── dashboard/
│   │   │   └── select-event/
│   │   ├── events/
│   │   ├── orders/
│   │   ├── profile/
│   │   └── ... 
│   ├── components/
│   │   ├── shared/
│   │   └── ui/
│   ├── lib/
│   │   ├── actions/
│   │   ├── database/
│   │   └── utils.ts
│   ├── types/
│   ├── globals.css
│   └── layout.tsx
├── public/
│   ├── assets/
│   └── icons/
├── components.json
├── package.json
├── tailwind.config.ts
└── README.md
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

## License

This project is licensed under the [MIT License](LICENSE).

