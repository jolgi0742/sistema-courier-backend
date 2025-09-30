const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
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

// GET /api/users - Obtener todos los usuarios con filtros
router.get('/', async (req, res) => {
  try {
    console.log('📋 GET /api/users - Obteniendo usuarios');
    
    const { search, role, status } = req.query;

    let query = 'SELECT id, name, email, role, phone, active, created_at, updated_at FROM users WHERE 1=1';
    let params = [];

    // Filtro por búsqueda
    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Filtro por rol
    if (role && role !== 'all') {
      query += ' AND role = ?';
      params.push(role);
    }

    // Filtro por estado
    if (status && status !== 'all') {
      query += ' AND active = ?';
      params.push(status === 'active' ? 1 : 0);
    }

    // Ordenar por fecha de creación
    query += ' ORDER BY created_at DESC';

    console.log('🔍 Query:', query);
    console.log('🔍 Params:', params);

    const [rows] = await pool.execute(query, params);

    res.json({
      users: rows,
      pagination: {
        page: 1,
        limit: 50,
        total: rows.length,
        pages: 1
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo usuarios:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
});

// GET /api/users/:id - Obtener usuario específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`👤 GET /api/users/${id} - Obteniendo usuario específico`);

    const [rows] = await pool.execute(
      'SELECT id, name, email, role, phone, active, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      user: rows[0]
    });

  } catch (error) {
    console.error('❌ Error obteniendo usuario:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor' 
    });
  }
});

// POST /api/users - Crear nuevo usuario
router.post('/', async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    console.log(`➕ POST /api/users - Creando usuario: ${email}`);

    // Validaciones básicas
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        error: 'Nombre, email, contraseña y rol son requeridos'
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

    // Validar rol
    const validRoles = ['admin', 'client', 'courier', 'agent'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Rol inválido. Debe ser: admin, client, courier o agent'
      });
    }

    // Verificar si el email ya existe
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'El email ya está en uso'
      });
    }

    // Encriptar contraseña
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insertar usuario
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password, role, phone, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())',
      [name, email, hashedPassword, role, phone || null]
    );

    // Obtener el usuario creado
    const [newUser] = await pool.execute(
      'SELECT id, name, email, role, phone, active, created_at, updated_at FROM users WHERE id = ?',
      [result.insertId]
    );

    console.log(`✅ Usuario creado exitosamente: ${email} (ID: ${result.insertId})`);

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      user: newUser[0]
    });

  } catch (error) {
    console.error('❌ Error creando usuario:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
});

// PUT /api/users/:id - Actualizar usuario
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, phone, active } = req.body;
    console.log(`✏️ PUT /api/users/${id} - Actualizando usuario`);

    // Validaciones básicas
    if (!name || !email || !role) {
      return res.status(400).json({
        success: false,
        error: 'Nombre, email y rol son requeridos'
      });
    }

    // Verificar si el usuario existe
    const [userExists] = await pool.execute(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );

    if (userExists.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    // Verificar si el email ya está en uso por otro usuario
    const [emailExists] = await pool.execute(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, id]
    );

    if (emailExists.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'El email ya está en uso por otro usuario'
      });
    }

    // Preparar query de actualización
    let updateQuery = 'UPDATE users SET name = ?, email = ?, role = ?, phone = ?, updated_at = NOW()';
    let params = [name, email, role, phone || null];

    // Si se incluye el estado activo
    if (active !== undefined) {
      updateQuery += ', active = ?';
      params.push(active ? 1 : 0);
    }

    // Si se proporciona nueva contraseña
    if (password && password.trim() !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateQuery += ', password = ?';
      params.push(hashedPassword);
      console.log(`🔐 Actualizando contraseña para usuario ${id}`);
    }

    updateQuery += ' WHERE id = ?';
    params.push(id);

    // Ejecutar actualización
    await pool.execute(updateQuery, params);

    // Obtener usuario actualizado
    const [updatedUser] = await pool.execute(
      'SELECT id, name, email, role, phone, active, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );

    console.log(`✅ Usuario actualizado exitosamente: ${email} (ID: ${id})`);

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      user: updatedUser[0]
    });

  } catch (error) {
    console.error('❌ Error actualizando usuario:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
});

// DELETE /api/users/:id - Eliminar usuario
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🗑️ DELETE /api/users/${id} - Eliminando usuario`);

    // Verificar si el usuario existe
    const [userExists] = await pool.execute(
      'SELECT id, name, email FROM users WHERE id = ?',
      [id]
    );

    if (userExists.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    const user = userExists[0];

    // Prevenir eliminación del único admin (opcional)
    const [adminCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM users WHERE role = "admin" AND active = 1'
    );

    if (user.role === 'admin' && adminCount[0].count <= 1) {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar el único administrador del sistema'
      });
    }

    // Eliminar usuario
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);

    console.log(`✅ Usuario eliminado exitosamente: ${user.email} (ID: ${id})`);

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente',
      deletedUser: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('❌ Error eliminando usuario:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor',
      message: error.message 
    });
  }
});

// PUT /api/users/:id/toggle-status - Activar/Desactivar usuario
router.put('/:id/toggle-status', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔄 PUT /api/users/${id}/toggle-status - Cambiando estado`);

    // Verificar si el usuario existe
    const [userExists] = await pool.execute(
      'SELECT id, name, email, role, active FROM users WHERE id = ?',
      [id]
    );

    if (userExists.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      });
    }

    const user = userExists[0];
    const newStatus = !user.active;

    // Prevenir desactivación del único admin activo
    if (user.role === 'admin' && user.active && !newStatus) {
      const [activeAdminCount] = await pool.execute(
        'SELECT COUNT(*) as count FROM users WHERE role = "admin" AND active = 1'
      );

      if (activeAdminCount[0].count <= 1) {
        return res.status(400).json({
          success: false,
          error: 'No se puede desactivar el único administrador activo'
        });
      }
    }

    // Cambiar estado
    await pool.execute(
      'UPDATE users SET active = ?, updated_at = NOW() WHERE id = ?',
      [newStatus ? 1 : 0, id]
    );

    // Obtener usuario actualizado
    const [updatedUser] = await pool.execute(
      'SELECT id, name, email, role, phone, active, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );

    console.log(`✅ Estado de usuario cambiado: ${user.email} -> ${newStatus ? 'Activo' : 'Inactivo'}`);

    res.json({
      success: true,
      message: `Usuario ${newStatus ? 'activado' : 'desactivado'} exitosamente`,
      user: updatedUser[0]
    });

  } catch (error) {
    console.error('❌ Error cambiando estado de usuario:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor' 
    });
  }
});

module.exports = router;