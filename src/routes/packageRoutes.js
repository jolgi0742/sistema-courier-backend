const express = require('express');
const mysql = require('mysql2/promise');
const router = express.Router();

// Configuración de conexión MySQL
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Siccosa$742',
  database: process.env.DB_NAME || 'itobox_courier',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para generar código de tracking único
function generateTrackingCode() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substr(2, 4).toUpperCase();
  return `ITO${timestamp}${random}`;
}

// GET /api/packages - Obtener todos los paquetes
router.get('/', async (req, res) => {
  try {
    console.log('📦 GET /api/packages - Obteniendo paquetes');
    
    const { search, status, priority } = req.query;

    let query = `
      SELECT p.*, 
             c.name as client_name, 
             co.name as courier_name,
             co.phone as courier_phone
      FROM packages p
      LEFT JOIN users c ON p.client_id = c.id AND c.role = 'client'
      LEFT JOIN users co ON p.courier_id = co.id AND co.role = 'courier'
      WHERE 1=1
    `;
    let params = [];

    // Filtro por búsqueda
    if (search) {
      query += ' AND (p.tracking_code LIKE ? OR p.sender_name LIKE ? OR p.receiver_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Filtro por estado
    if (status && status !== 'all') {
      query += ' AND p.status = ?';
      params.push(status);
    }

    // Filtro por prioridad
    if (priority && priority !== 'all') {
      query += ' AND p.priority = ?';
      params.push(priority);
    }

    // Ordenar por fecha de creación
    query += ' ORDER BY p.created_at DESC';

    console.log('🔍 Query:', query);
    console.log('🔍 Params:', params);

    const [rows] = await pool.execute(query, params);

    res.json({
      packages: rows,
      total: rows.length
    });

  } catch (error) {
    console.error('❌ Error obteniendo paquetes:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
});

// GET /api/packages/:id - Obtener paquete específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📦 GET /api/packages/${id} - Obteniendo paquete específico`);

    const [rows] = await pool.execute(`
      SELECT p.*, 
             c.name as client_name, c.email as client_email, c.phone as client_phone,
             co.name as courier_name, co.email as courier_email, co.phone as courier_phone
      FROM packages p
      LEFT JOIN users c ON p.client_id = c.id
      LEFT JOIN users co ON p.courier_id = co.id
      WHERE p.id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Paquete no encontrado'
      });
    }

    res.json({
      success: true,
      package: rows[0]
    });

  } catch (error) {
    console.error('❌ Error obteniendo paquete:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor' 
    });
  }
});

// POST /api/packages - Crear nuevo paquete
router.post('/', async (req, res) => {
  try {
    const {
      sender_name, sender_phone, sender_address,
      receiver_name, receiver_phone, receiver_address,
      description, weight, dimensions, priority = 'standard',
      client_id
    } = req.body;

    console.log(`📦 POST /api/packages - Creando paquete para: ${receiver_name}`);

    // Validaciones básicas
    if (!sender_name || !receiver_name || !sender_phone || !receiver_phone) {
      return res.status(400).json({
        success: false,
        error: 'Datos de remitente y destinatario son requeridos'
      });
    }

    // Generar código de tracking único
    const tracking_code = generateTrackingCode();

    // Insertar paquete
    const [result] = await pool.execute(`
      INSERT INTO packages (
        tracking_code, client_id, sender_name, sender_phone, sender_address,
        receiver_name, receiver_phone, receiver_address, description,
        weight, dimensions, priority, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())
    `, [
      tracking_code, client_id || null,
      sender_name, sender_phone, sender_address || '',
      receiver_name, receiver_phone, receiver_address || '',
      description || '', weight || 0, dimensions || '',
      priority
    ]);

    // Obtener el paquete creado
    const [newPackage] = await pool.execute(`
      SELECT p.*, 
             c.name as client_name
      FROM packages p
      LEFT JOIN users c ON p.client_id = c.id
      WHERE p.id = ?
    `, [result.insertId]);

    console.log(`✅ Paquete creado exitosamente: ${tracking_code} (ID: ${result.insertId})`);

    res.status(201).json({
      success: true,
      message: 'Paquete creado exitosamente',
      package: newPackage[0]
    });

  } catch (error) {
    console.error('❌ Error creando paquete:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
});

// PUT /api/packages/:id - Actualizar paquete
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      sender_name, sender_phone, sender_address,
      receiver_name, receiver_phone, receiver_address,
      description, weight, dimensions, priority, status
    } = req.body;

    console.log(`📦 PUT /api/packages/${id} - Actualizando paquete`);

    // Verificar si el paquete existe
    const [packageExists] = await pool.execute(
      'SELECT id FROM packages WHERE id = ?',
      [id]
    );

    if (packageExists.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Paquete no encontrado'
      });
    }

    // Actualizar paquete
    await pool.execute(`
      UPDATE packages SET
        sender_name = ?, sender_phone = ?, sender_address = ?,
        receiver_name = ?, receiver_phone = ?, receiver_address = ?,
        description = ?, weight = ?, dimensions = ?, priority = ?,
        ${status ? 'status = ?,' : ''} updated_at = NOW()
      WHERE id = ?
    `, [
      sender_name, sender_phone, sender_address || '',
      receiver_name, receiver_phone, receiver_address || '',
      description || '', weight || 0, dimensions || '', priority,
      ...(status ? [status] : []), id
    ]);

    // Obtener paquete actualizado
    const [updatedPackage] = await pool.execute(`
      SELECT p.*, 
             c.name as client_name,
             co.name as courier_name
      FROM packages p
      LEFT JOIN users c ON p.client_id = c.id
      LEFT JOIN users co ON p.courier_id = co.id
      WHERE p.id = ?
    `, [id]);

    console.log(`✅ Paquete actualizado exitosamente (ID: ${id})`);

    res.json({
      success: true,
      message: 'Paquete actualizado exitosamente',
      package: updatedPackage[0]
    });

  } catch (error) {
    console.error('❌ Error actualizando paquete:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
});

// DELETE /api/packages/:id - Eliminar paquete
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`📦 DELETE /api/packages/${id} - Eliminando paquete`);

    // Verificar si el paquete existe
    const [packageExists] = await pool.execute(
      'SELECT id, tracking_code, receiver_name FROM packages WHERE id = ?',
      [id]
    );

    if (packageExists.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Paquete no encontrado'
      });
    }

    const pkg = packageExists[0];

    // Eliminar paquete
    await pool.execute('DELETE FROM packages WHERE id = ?', [id]);

    console.log(`✅ Paquete eliminado exitosamente: ${pkg.tracking_code} (ID: ${id})`);

    res.json({
      success: true,
      message: 'Paquete eliminado exitosamente',
      deletedPackage: {
        id: pkg.id,
        tracking_code: pkg.tracking_code,
        receiver_name: pkg.receiver_name
      }
    });

  } catch (error) {
    console.error('❌ Error eliminando paquete:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
});

// GET /api/packages/track/:trackingCode - Tracking público
router.get('/track/:trackingCode', async (req, res) => {
  try {
    const { trackingCode } = req.params;
    console.log(`📍 GET /api/packages/track/${trackingCode} - Tracking público`);

    const [packageRows] = await pool.execute(`
      SELECT p.*, 
             c.name as client_name, c.phone as client_phone,
             co.name as courier_name, co.phone as courier_phone
      FROM packages p
      LEFT JOIN users c ON p.client_id = c.id
      LEFT JOIN users co ON p.courier_id = co.id
      WHERE p.tracking_code = ?
    `, [trackingCode]);

    if (packageRows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Paquete no encontrado' 
      });
    }

    const packageData = packageRows[0];

    // Obtener historial de tracking
    const [trackingRows] = await pool.execute(`
      SELECT * FROM package_tracking 
      WHERE package_id = ? 
      ORDER BY created_at ASC
    `, [packageData.id]);

    res.json({
      success: true,
      package: packageData,
      tracking_history: trackingRows
    });

  } catch (error) {
    console.error('❌ Error en tracking:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor' 
    });
  }
});

// PUT /api/packages/:id/status - Actualizar estado del paquete
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, location, notes } = req.body;

    console.log(`📍 PUT /api/packages/${id}/status - Actualizando estado a: ${status}`);

    // Validar estado
    const validStatuses = ['pending', 'confirmed', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed_delivery', 'returned'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Estado inválido'
      });
    }

    // Verificar que el paquete existe
    const [packageExists] = await pool.execute(
      'SELECT id, tracking_code FROM packages WHERE id = ?',
      [id]
    );

    if (packageExists.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Paquete no encontrado'
      });
    }

    // Actualizar estado del paquete
    await pool.execute(
      'UPDATE packages SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );

    // Insertar evento en historial de tracking
    await pool.execute(`
      INSERT INTO package_tracking (package_id, status, location, description, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `, [id, status, location || '', notes || `Estado actualizado a ${status}`]);

    // Obtener paquete actualizado
    const [updatedPackage] = await pool.execute(`
      SELECT p.*, 
             c.name as client_name,
             co.name as courier_name
      FROM packages p
      LEFT JOIN users c ON p.client_id = c.id
      LEFT JOIN users co ON p.courier_id = co.id
      WHERE p.id = ?
    `, [id]);

    console.log(`✅ Estado actualizado: ${packageExists[0].tracking_code} -> ${status}`);

    res.json({
      success: true,
      message: 'Estado actualizado exitosamente',
      package: updatedPackage[0]
    });

  } catch (error) {
    console.error('❌ Error actualizando estado:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor' 
    });
  }
});

// PUT /api/packages/:id/assign-courier - Asignar courier a paquete
router.put('/:id/assign-courier', async (req, res) => {
  try {
    const { id } = req.params;
    const { courierId } = req.body;

    console.log(`🚚 PUT /api/packages/${id}/assign-courier - Asignando courier: ${courierId}`);

    // Verificar que el paquete existe
    const [packageExists] = await pool.execute(
      'SELECT id, tracking_code FROM packages WHERE id = ?',
      [id]
    );

    if (packageExists.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Paquete no encontrado'
      });
    }

    // Verificar que el courier existe
    const [courierExists] = await pool.execute(
      'SELECT id, name FROM couriers WHERE id = ? AND active = 1',
      [courierId]
    );

    if (courierExists.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Courier no encontrado'
      });
    }

    // Asignar courier al paquete
    await pool.execute(
      'UPDATE packages SET courier_id = ?, status = "confirmed", updated_at = NOW() WHERE id = ?',
      [courierId, id]
    );

    // Insertar evento en historial
    await pool.execute(`
      INSERT INTO package_tracking (package_id, status, description, created_at)
      VALUES (?, "assigned", ?, NOW())
    `, [id, `Paquete asignado a courier: ${courierExists[0].name}`]);

    console.log(`✅ Courier asignado: ${packageExists[0].tracking_code} -> ${courierExists[0].name}`);

    res.json({
      success: true,
      message: 'Courier asignado exitosamente'
    });

  } catch (error) {
    console.error('❌ Error asignando courier:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor' 
    });
  }
});

// GET /api/packages/stats - Estadísticas de paquetes
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 GET /api/packages/stats - Obteniendo estadísticas');

    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_packages,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'in_transit' THEN 1 ELSE 0 END) as in_transit,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered,
        SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) as urgent,
        AVG(weight) as avg_weight,
        SUM(weight) as total_weight
      FROM packages
    `);

    res.json({
      success: true,
      stats: stats[0]
    });

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor' 
    });
  }
});

module.exports = router;