
const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'pallavi',
  database: 'parkease_auth_db'
});

const hash = '$2a$10$ToTMWasv5H5HvVJ4/Yyqxe1cr1NBl.E1xFObMw1q07Ga6dluuvZ7S';

connection.query(
  'DELETE FROM users WHERE email = ?',
  ['pallavi@gmail.com'],
  (err) => {
    if (err) throw err;
    connection.query(
      'INSERT INTO users (full_name, email, password_hash, role, vehicle_plate, is_active) VALUES (?, ?, ?, ?, ?, ?)',
      ['Pallavi Manager', 'pallavi@gmail.com', hash, 'MANAGER', 'XYZ-1234', 1],
      (err) => {
        if (err) throw err;
        console.log('User pallavi@gmail.com reset successfully.');
        
        connection.query(
          'UPDATE users SET password_hash = ? WHERE email IN (?, ?)',
          [hash, 'akku@gmail.com', 'managertest@parkease.net'],
          (err) => {
            if (err) throw err;
            console.log('Other users updated.');
            connection.end();
          }
        );
      }
    );
  }
);
