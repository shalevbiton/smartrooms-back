-- SmartRoom Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable btree_gist extension (required for GIST indexes on UUID)
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  personal_id VARCHAR(7) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  base VARCHAR(100) NOT NULL,
  job_title VARCHAR(100),
  phone_number VARCHAR(10),
  role VARCHAR(20) NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  avatar TEXT,
  custom_background TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rooms Table
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  capacity INTEGER NOT NULL,
  equipment TEXT[] DEFAULT '{}',
  image_url TEXT NOT NULL,
  description TEXT,
  is_available BOOLEAN DEFAULT true,
  is_recorded BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_name VARCHAR(255) NOT NULL,
  title VARCHAR(255) NOT NULL, -- Investigator Name
  investigator_id VARCHAR(255),
  second_investigator_id VARCHAR(255),
  interrogated_name VARCHAR(255),
  offenses TEXT,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED')),
  is_recorded BOOLEAN DEFAULT false,
  checkout_video_url TEXT,
  phone_number VARCHAR(10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT no_overlapping_bookings EXCLUDE USING gist (
    room_id WITH =,
    tstzrange(start_time, end_time) WITH &&
  )
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_personal_id ON users(personal_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_bookings_room_id ON bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_start_time ON bookings(start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings USING gist (tstzrange(start_time, end_time));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view all approved users" ON users
  FOR SELECT USING (status = 'APPROVED' OR auth.uid()::text = id::text);

CREATE POLICY "Service role can manage all users" ON users
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for rooms
CREATE POLICY "Anyone can view available rooms" ON rooms
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage all rooms" ON rooms
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for bookings
CREATE POLICY "Users can view their own bookings" ON bookings
  FOR SELECT USING (auth.uid()::text = user_id::text OR auth.role() = 'service_role');

CREATE POLICY "Users can create their own bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text OR auth.role() = 'service_role');

CREATE POLICY "Users can update their own bookings" ON bookings
  FOR UPDATE USING (auth.uid()::text = user_id::text OR auth.role() = 'service_role');

CREATE POLICY "Service role can manage all bookings" ON bookings
  FOR ALL USING (auth.role() = 'service_role');

-- Note: Since we're using service role key in the backend, RLS policies allow service_role access
-- For frontend, we'll use the anon key with appropriate policies

