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

// GET /api/clients - Obtener todos los clientes
router.get('/', async (req, res) => {
  try {
    console.log('👥 GET /api/clients - Obteniendo clientes');
    
    const { search, status } = req.query;

    let query = `
      SELECT c.*, 
             COUNT(p.id) as total_packages
      FROM clients c
      LEFT JOIN packages p ON c.id = p.client_id
      WHERE 1=1
    `;
    let params = [];

    // Filtro por búsqueda
    if (search) {
      query += ' AND (c.name LIKE ? OR c.email LIKE ? OR c.company LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Filtro por estado
    if (status && status !== 'all') {
      query += ' AND c.active = ?';
      params.push(status === 'active' ? 1 : 0);
    }

    query += ' GROUP BY c.id ORDER BY c.created_at DESC';

    console.log('🔍 Query:', query);
    console.log('🔍 Params:', params);

    const [rows] = await pool.execute(query, params);

    res.json({
      clients: rows,
      total: rows.length
    });

  } catch (error) {
    console.error('❌ Error obteniendo clientes:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
});

// GET /api/clients/:id - Obtener cliente específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`👥 GET /api/clients/${id} - Obteniendo cliente específico`);

    const [rows] = await pool.execute(`
      SELECT c.*, 
             COUNT(p.id) as total_packages
      FROM clients c
      LEFT JOIN packages p ON c.id = p.client_id
      WHERE c.id = ?
      GROUP BY c.id
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }

    res.json({
      success: true,
      client: rows[0]
    });

  } catch (error) {
    console.error('❌ Error obteniendo cliente:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor' 
    });
  }
});

// POST /api/clients - Crear nuevo cliente
router.post('/', async (req, res) => {
  try {
    const {
      name, email, phone, address, city, country,
      company, contact_person
    } = req.body;

    console.log(`👥 POST /api/clients - Creando cliente: ${name}`);

    // Validaciones básicas
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Nombre y email son requeridos'
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Formato de email inválido'
      });
    }

    // Verificar si el email ya existe
    const [existing] = await pool.execute(
      'SELECT id FROM clients WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'El email ya está en uso'
      });
    }

    // Insertar cliente
    const [result] = await pool.execute(`
      INSERT INTO clients (
        name, email, phone, address, city, country,
        company, contact_person, active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
    `, [
      name, email, phone || '', address || '', city || '',
      country || 'Costa Rica', company || '', contact_person || ''
    ]);

    // Obtener el cliente creado
    const [newClient] = await pool.execute(`
      SELECT c.*, 
             COUNT(p.id) as total_packages
      FROM clients c
      LEFT JOIN packages p ON c.id = p.client_id
      WHERE c.id = ?
      GROUP BY c.id
    `, [result.insertId]);

    console.log(`✅ Cliente creado exitosamente: ${name} (ID: ${result.insertId})`);

    res.status(201).json({
      success: true,
      message: 'Cliente creado exitosamente',
      client: newClient[0]
    });

  } catch (error) {
    console.error('❌ Error creando cliente:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
});

// PUT /api/clients/:id - Actualizar cliente
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, email, phone, address, city, country,
      company, contact_person, active
    } = req.body;

    console.log(`👥 PUT /api/clients/${id} - Actualizando cliente`);

    // Validaciones básicas
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Nombre y email son requeridos'
      });
    }

    // Verificar si el cliente existe
    const [clientExists] = await pool.execute(
      'SELECT id FROM clients WHERE id = ?',
      [id]
    );

    if (clientExists.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }

    // Verificar si el email está en uso por otro cliente
    const [emailExists] = await pool.execute(
      'SELECT id FROM clients WHERE email = ? AND id != ?',
      [email, id]
    );

    if (emailExists.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'El email ya está en uso por otro cliente'
      });
    }

    // Actualizar cliente
    await pool.execute(`
      UPDATE clients SET
        name = ?, email = ?, phone = ?, address = ?, city = ?, country = ?,
        company = ?, contact_person = ?, 
        ${active !== undefined ? 'active = ?,' : ''} updated_at = NOW()
      WHERE id = ?
    `, [
      name, email, phone || '', address || '', city || '', country || 'Costa Rica',
      company || '', contact_person || '',
      ...(active !== undefined ? [active ? 1 : 0] : []), id
    ]);

    // Obtener cliente actualizado
    const [updatedClient] = await pool.execute(`
      SELECT c.*, 
             COUNT(p.id) as total_packages
      FROM clients c
      LEFT JOIN packages p ON c.id = p.client_id
      WHERE c.id = ?
      GROUP BY c.id
    `, [id]);

    console.log(`✅ Cliente actualizado exitosamente: ${name} (ID: ${id})`);

    res.json({
      success: true,
      message: 'Cliente actualizado exitosamente',
      client: updatedClient[0]
    });

  } catch (error) {
    console.error('❌ Error actualizando cliente:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
});

// DELETE /api/clients/:id - Eliminar cliente
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`👥 DELETE /api/clients/${id} - Eliminando cliente`);

    // Verificar si el cliente existe
    const [clientExists] = await pool.execute(
      'SELECT id, name, email FROM clients WHERE id = ?',
      [id]
    );

    if (clientExists.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }

    const client = clientExists[0];

    // Verificar si tiene paquetes asociados
    const [packagesCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM packages WHERE client_id = ?',
      [id]
    );

    if (packagesCount[0].count > 0) {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar el cliente porque tiene paquetes asociados'
      });
    }

    // Eliminar cliente
    await pool.execute('DELETE FROM clients WHERE id = ?', [id]);

    console.log(`✅ Cliente eliminado exitosamente: ${client.name} (ID: ${id})`);

    res.json({
      success: true,
      message: 'Cliente eliminado exitosamente',
      deletedClient: {
        id: client.id,
        name: client.name,
        email: client.email
      }
    });

  } catch (error) {
    console.error('❌ Error eliminando cliente:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
});

// GET /api/clients/stats - Estadísticas de clientes
router.get('/stats', async (req, res) => {
  try {
    console.log('📊 GET /api/clients/stats - Obteniendo estadísticas');

    const [stats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_clients,
        SUM(CASE WHEN active = 1 THEN 1 ELSE 0 END) as active_clients,
        SUM(CASE WHEN active = 0 THEN 1 ELSE 0 END) as inactive_clients,
        COUNT(DISTINCT CASE WHEN packages.id IS NOT NULL THEN clients.id END) as clients_with_packages
      FROM clients
      LEFT JOIN packages ON clients.id = packages.client_id
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