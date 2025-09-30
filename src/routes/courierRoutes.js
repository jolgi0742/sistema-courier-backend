const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

// Configuración de base de datos (ajusta si es diferente)
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Siccosa$742',
  database: 'itobox_courier',
  charset: 'utf8mb4'
};

// GET /api/couriers - Obtener todos los couriers
router.get('/', async (req, res) => {
  try {
    console.log('📍 Obteniendo lista de couriers...');
    
    const connection = await mysql.createConnection(dbConfig);
    const [couriers] = await connection.execute(`
      SELECT id, name, email, phone, address, city, vehicle_type, 
             license_plate, active, available, rating, created_at
      FROM couriers 
      WHERE active = 1
      ORDER BY created_at DESC
    `);
    await connection.end();

    console.log(`✅ ${couriers.length} couriers encontrados`);
    
    res.json({
      success: true,
      data: couriers,
      total: couriers.length
    });
  } catch (error) {
    console.error('❌ Error obteniendo couriers:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/couriers/stats - Estadísticas de couriers
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 Obteniendo estadísticas de couriers...');
    
    const connection = await mysql.createConnection(dbConfig);
    
    const [totalResult] = await connection.execute('SELECT COUNT(*) as total FROM couriers');
    const [activeResult] = await connection.execute('SELECT COUNT(*) as active FROM couriers WHERE active = 1');
    const [availableResult] = await connection.execute('SELECT COUNT(*) as available FROM couriers WHERE available = 1 AND active = 1');

    await connection.end();

    const stats = {
      total: totalResult[0].total,
      active: activeResult[0].active,
      available: availableResult[0].available,
      busy: activeResult[0].active - availableResult[0].available,
      inactive: totalResult[0].total - activeResult[0].active
    };

    console.log('✅ Estadísticas obtenidas:', stats);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;