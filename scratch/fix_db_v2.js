
const { execSync } = require('child_process');

const hash = '$2a$10$ToTMWasv5H5HvVJ4/Yyqxe1cr1NBl.E1xFObMw1q07Ga6dluuvZ7S';
const sql = `
DELETE FROM parkease_auth_db.users WHERE email = 'pallavi@gmail.com';
INSERT INTO parkease_auth_db.users (full_name, email, password_hash, role, vehicle_plate, is_active)
VALUES ('Pallavi Manager', 'pallavi@gmail.com', '${hash}', 'MANAGER', 'XYZ-1234', 1);
UPDATE parkease_auth_db.users SET password_hash = '${hash}' 
WHERE email = 'akku@gmail.com' OR email = 'managertest@parkease.net';
`.replace(/\$/g, '\\$'); // Escape $ for shell

// Actually, better to write it to a temp file and use < redirection in CMD
const fs = require('fs');
fs.writeFileSync('c:/Users/palla/Desktop/ParkEase-dev/scratch/reset_final.sql', sql.replace(/\\/g, ''));

try {
  execSync('cmd /c "mysql -u root -ppallavi < c:/Users/palla/Desktop/ParkEase-dev/scratch/reset_final.sql"');
  console.log('Success!');
} catch (e) {
  console.error('Failed:', e.message);
}
