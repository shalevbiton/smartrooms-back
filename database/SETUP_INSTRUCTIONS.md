# Supabase Database Setup Instructions

## Step 1: Run the SQL Schema

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Open the file `schema.sql` from this directory
4. Copy the entire SQL content
5. Paste it into the SQL Editor
6. Click **Run** to execute the schema

This will create:
- `users` table
- `rooms` table  
- `bookings` table
- Indexes for performance
- Row Level Security (RLS) policies
- Triggers for `updated_at` timestamps

## Step 2: Verify Tables

After running the schema, verify the tables were created:
1. Go to **Table Editor** in Supabase dashboard
2. You should see three tables: `users`, `rooms`, `bookings`

## Step 3: Test Connection

The application will automatically connect to Supabase using the environment variables configured in `.env` files.

## Important Notes

- The schema includes constraints to prevent overlapping bookings for the same room
- Row Level Security (RLS) is enabled but allows service role access (used by backend)
- All timestamps use `TIMESTAMP WITH TIME ZONE` for proper timezone handling
- UUIDs are used as primary keys for better scalability

