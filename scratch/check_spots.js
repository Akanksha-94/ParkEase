const mysql = require('mysql2/promise');

async function checkSpots() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'parkease_parking_spot_db'
  });

  try {
    const [rows] = await connection.execute('SELECT lot_id, COUNT(*) as count FROM parking_spots GROUP BY lot_id');
    console.log('Spots per lot:', rows);
    
    const [allSpots] = await connection.execute('SELECT * FROM parking_spots');
    console.log('All spots:', allSpots);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await connection.end();
  }
}

checkSpots();
