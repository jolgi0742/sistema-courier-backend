// backend/src/controllers/courierController.js

const db = require('../config/database');

// Obtener todos los couriers con filtros
const getAllCouriers = async (req, res) => {
  try {
    const { search, status, vehicle, page = 1, limit = 10 } = req.query;
    
    let query = `
      SELECT 
        id, name, email, phone, city, address, 
        vehicle_type, license_plate, license_number,
        active, available, total_deliveries, created_at
      FROM couriers 
      WHERE 1=1
    `;
    
    const params = [];
    
    // Filtro de búsqueda
    if (search) {
      query += ` AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    // Filtro de estado
    if (status === 'active') {
      query += ` AND active = 1`;
    } else if (status === 'available') {
      query += ` AND active = 1 AND available = 1`;
    } else if (status === 'inactive') {
      query += ` AND active = 0`;
    }
    
    // Filtro de vehículo
    if (vehicle && vehicle !== 'all') {
      query += ` AND vehicle_type = ?`;
      params.push(vehicle);
    }
    
    // Paginación
    const offset = (page - 1) * limit;
    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));
    
    const couriers = await db.query(query, params);
    
    res.json({
      success: true,
      data: couriers
    });
  } catch (error) {
    console.error('Error obteniendo couriers:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener estadísticas de couriers
const getCourierStats = async (req, res) => {
  try {
    console.log('📊 GET /api/couriers/stats - Obteniendo estadísticas de couriers');
    
    // Obtener conexión de base de datos (ajusta según tu configuración)
    const db = req.db || require('../config/database'); // Ajusta la ruta según tu estructura
    
    // Consulta para total de couriers activos
    const [totalResults] = await db.execute(
      'SELECT COUNT(*) as count FROM couriers WHERE active = 1'
    );
    
    // Consulta para couriers disponibles
    const [availableResults] = await db.execute(
      'SELECT COUNT(*) as count FROM couriers WHERE active = 1 AND available = 1'
    );
    
    // Consulta para entregas realizadas
    const [deliveriesResults] = await db.execute(
      `SELECT 
         COUNT(p.id) as total_deliveries,
         COUNT(CASE WHEN p.status = 'delivered' THEN 1 END) as completed_deliveries
       FROM packages p 
       INNER JOIN couriers c ON p.courier_id = c.id 
       WHERE c.active = 1`
    );
    
    // Consulta para rating promedio
    const [avgRatingResults] = await db.execute(
      'SELECT AVG(rating) as avg_rating FROM couriers WHERE active = 1'
    );

    const stats = {
      total_couriers: totalResults[0].count,
      available_couriers: availableResults[0].count,
      busy_couriers: totalResults[0].count - availableResults[0].count,
      total_deliveries: deliveriesResults[0].total_deliveries || 0,
      completed_deliveries: deliveriesResults[0].completed_deliveries || 0,
      average_rating: parseFloat(avgRatingResults[0].avg_rating || 5.0).toFixed(1)
    };

    console.log('📊 Estadísticas calculadas:', stats);
    
    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas de couriers:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Crear nuevo courier
const createCourier = async (req, res) => {
  try {
    const {
      name, email, phone, city, address,
      vehicle_type, license_plate, license_number
    } = req.body;
    
    // Validaciones básicas
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y email son requeridos'
      });
    }
    
    // Verificar email único
    const existingCourier = await db.query(
      'SELECT id FROM couriers WHERE email = ?',
      [email]
    );
    
    if (existingCourier.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un courier con este email'
      });
    }
    
    const insertQuery = `
      INSERT INTO couriers (
        name, email, phone, city, address,
        vehicle_type, license_plate, license_number,
        active, available, total_deliveries
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 0)
    `;
    
    const result = await db.query(insertQuery, [
      name, email, phone, city, address,
      vehicle_type, license_plate, license_number
    ]);
    
    res.status(201).json({
      success: true,
      message: 'Courier creado exitosamente',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error creando courier:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar courier
const updateCourier = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, email, phone, city, address,
      vehicle_type, license_plate, license_number
    } = req.body;
    
    // Verificar que el courier existe
    const existingCourier = await db.query(
      'SELECT id FROM couriers WHERE id = ?',
      [id]
    );
    
    if (existingCourier.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Courier no encontrado'
      });
    }
    
    const updateQuery = `
      UPDATE couriers 
      SET name = ?, email = ?, phone = ?, city = ?, address = ?,
          vehicle_type = ?, license_plate = ?, license_number = ?
      WHERE id = ?
    `;
    
    await db.query(updateQuery, [
      name, email, phone, city, address,
      vehicle_type, license_plate, license_number, id
    ]);
    
    res.json({
      success: true,
      message: 'Courier actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error actualizando courier:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// NUEVA FUNCIÓN: Eliminar courier
const deleteCourier = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el courier existe
    const existingCourier = await db.query(
      'SELECT id, name FROM couriers WHERE id = ?',
      [id]
    );
    
    if (existingCourier.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Courier no encontrado'
      });
    }
    
    // Verificar si el courier tiene paquetes asignados
    const assignedPackages = await db.query(
      'SELECT COUNT(*) as count FROM packages WHERE courier_id = ? AND status NOT IN ("delivered", "returned")',
      [id]
    );
    
    if (assignedPackages[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar el courier porque tiene paquetes asignados pendientes'
      });
    }
    
    // Eliminar courier
    await db.query('DELETE FROM couriers WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: `Courier ${existingCourier[0].name} eliminado exitosamente`
    });
  } catch (error) {
    console.error('Error eliminando courier:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// NUEVA FUNCIÓN: Cambiar disponibilidad del courier
const toggleAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Obtener estado actual del courier
    const courier = await db.query(
      'SELECT id, name, available, active FROM couriers WHERE id = ?',
      [id]
    );
    
    if (courier.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Courier no encontrado'
      });
    }
    
    const currentCourier = courier[0];
    
    // No se puede cambiar disponibilidad si está inactivo
    if (!currentCourier.active) {
      return res.status(400).json({
        success: false,
        message: 'No se puede cambiar la disponibilidad de un courier inactivo'
      });
    }
    
    // Cambiar disponibilidad
    const newAvailability = !currentCourier.available;
    
    await db.query(
      'UPDATE couriers SET available = ? WHERE id = ?',
      [newAvailability, id]
    );
    
    res.json({
      success: true,
      message: `Courier ${currentCourier.name} ahora está ${newAvailability ? 'disponible' : 'ocupado'}`,
      data: {
        id: id,
        available: newAvailability
      }
    });
  } catch (error) {
    console.error('Error cambiando disponibilidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener courier por ID
const getCourierById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const courier = await db.query(
      'SELECT * FROM couriers WHERE id = ?',
      [id]
    );
    
    if (courier.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Courier no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: courier[0]
    });
  } catch (error) {
    console.error('Error obteniendo courier:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getAllCouriers,
  getCourierStats,
  createCourier,
  updateCourier,
  deleteCourier,        // NUEVA
  toggleAvailability,   // NUEVA
  getCourierById
};