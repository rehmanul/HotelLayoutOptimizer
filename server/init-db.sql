
-- Create default user if it doesn't exist
INSERT INTO users (id, username, password) 
VALUES (1, 'default_user', 'default_password') 
ON CONFLICT (id) DO NOTHING;

-- Reset the sequence to start from 2 for future users
SELECT setval('users_id_seq', GREATEST(1, (SELECT MAX(id) FROM users)));
