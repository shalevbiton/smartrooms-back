-- Create a table for storing Passkeys (WebAuthn credentials)
create table if not exists passkeys (
  cred_id text primary key,
  public_key text not null,
  counter bigint default 0,
  transports jsonb,
  user_id uuid references users(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Create a table for storing temporary auth challenges (for serverless compatibility)
create table if not exists auth_challenges (
  user_id uuid primary key references users(id) on delete cascade,
  challenge text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);
