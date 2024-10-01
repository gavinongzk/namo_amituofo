CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT,
  phone_number TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('superadmin', 'admin', 'user'))
);
