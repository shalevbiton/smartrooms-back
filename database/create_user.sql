-- SQL to manually create a user
-- Replace the values as needed

INSERT INTO users (
  personal_id,
  password,
  name,
  base,
  job_title,
  phone_number,
  role,
  status
) VALUES (
  '9412955',                    -- personal_id (7 digits)
  'hash_123456',                -- password (hashed format: hash_ + password)
  'מנהל מערכת',                  -- name (change as needed)
  'מפקדה',                      -- base (change as needed)
  'מנהל מערכת ראשי',             -- job_title (optional)
  '0500000000',                 -- phone_number (10 digits, optional)
  'ADMIN',                      -- role: 'USER' or 'ADMIN'
  'APPROVED'                     -- status: 'PENDING', 'APPROVED', or 'REJECTED'
);

-- To verify the user was created:
-- SELECT id, personal_id, name, role, status FROM users WHERE personal_id = '9412955';

