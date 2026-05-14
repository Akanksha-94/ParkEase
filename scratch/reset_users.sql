-- Delete corrupted pallavi user and recreate
DELETE FROM parkease_auth_db.users WHERE email = 'pallavi@gmail.com';

INSERT INTO parkease_auth_db.users (full_name, email, password_hash, role, vehicle_plate, is_active)
VALUES ('Pallavi Manager', 'pallavi@gmail.com', '$2a$10$ToTMWasv5H5HvVJ4/Yyqxe1cr1NBl.E1xFObMw1q07Ga6dluuvZ7S', 'MANAGER', 'XYZ-1234', 1);

-- Also fix any other test users
UPDATE parkease_auth_db.users SET password_hash = '$2a$10$ToTMWasv5H5HvVJ4/Yyqxe1cr1NBl.E1xFObMw1q07Ga6dluuvZ7S' 
WHERE email = 'akku@gmail.com' OR email = 'managertest@parkease.net';
