// backend/src/controllers/quoteController.js
const { Quote, QuoteStatusHistory } = require('../models/Quote');
const { Op } = require('sequelize');

// Tarifas base del sistema (puedes mover esto a configuración)
const PRICING_CONFIG = {
  baseCost: 1500, // Costo base en colones
  weightRate: 250, // Colones por kg
  distanceRate: 20, // Colones por km
  serviceMultipliers: {
    standard: 1.0,
    express: 1.5,
    overnight: 2.0,
    same_day: 2.5
  },
  urgencyMultipliers: {
    normal: 1.0,
    urgent: 1.25,
    emergency: 1.5
  },
  pickupCosts: {
    office: 0,
    home: 500,
    remote: 1500
  },
  insuranceRate: 0.02, // 2% del valor declarado
  taxRate: 0.13 // IVA 13%
};

class QuoteController {
  
  // Crear nueva cotización
  static async createQuote(req, res) {
    try {
      const {
        origin,
        destination,
        weight,
        dimensions,
        declared_value = 0,
        service_type = 'standard',
        urgency = 'normal',
        pickup_type = 'office',
        client_name,
        client_email,
        notes,
        special_instructions
      } = req.body;

      const user = req.user;
      
      // Validaciones básicas
      if (!origin || !destination || !weight) {
        return res.status(400).json({
          success: false,
          message: 'Origen, destino y peso son requeridos'
        });
      }

      if (weight <= 0 || weight > 1000) {
        return res.status(400).json({
          success: false,
          message: 'El peso debe ser entre 0.1 y 1000 kg'
        });
      }

      // Calcular distancia (simulada por ahora)
      const distance_km = await calculateDistance(origin, destination);
      
      // Calcular costos
      const costCalculation = calculateQuoteCosts({
        weight: parseFloat(weight),
        distance_km,
        declared_value: parseFloat(declared_value),
        service_type,
        urgency,
        pickup_type
      });

      // Crear cotización
      const quote = await Quote.create({
        user_id: user.id,
        user_role: user.role,
        client_name: client_name || user.name,
        client_email: client_email || user.email,
        agent_id: user.role === 'agent' ? user.id : null,
        
        origin,
        destination,
        weight: parseFloat(weight),
        dimensions,
        declared_value: parseFloat(declared_value),
        service_type,
        urgency,
        pickup_type,
        
        distance_km,
        ...costCalculation,
        
        notes,
        special_instructions
      });

      // Registrar en historial
      await QuoteStatusHistory.create({
        quote_id: quote.id,
        old_status: null,
        new_status: 'pending',
        changed_by: user.id,
        reason: 'Cotización creada'
      });

      res.status(201).json({
        success: true,
        message: 'Cotización creada exitosamente',
        data: quote
      });

    } catch (error) {
      console.error('Error creando cotización:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }

  // Obtener cotizaciones del usuario
  static async getQuotes(req, res) {
    try {
      const user = req.user;
      const { page = 1, limit = 10, status, search } = req.query;
      
      const offset = (page - 1) * limit;
      
      // Construir filtros según el rol del usuario
      let whereCondition = {};
      
      if (user.role === 'client') {
        whereCondition.user_id = user.id;
      } else if (user.role === 'agent') {
        whereCondition = {
          [Op.or]: [
            { user_id: user.id },
            { agent_id: user.id }
          ]
        };
      }
      // Admin puede ver todas las cotizaciones
      
      // Filtro por estado
      if (status) {
        whereCondition.status = status;
      }
      
      // Filtro de búsqueda
      if (search) {
        whereCondition[Op.or] = [
          { quote_number: { [Op.like]: `%${search}%` } },
          { origin: { [Op.like]: `%${search}%` } },
          { destination: { [Op.like]: `%${search}%` } },
          { client_name: { [Op.like]: `%${search}%` } }
        ];
      }

      const quotes = await Quote.findAndCountAll({
        where: whereCondition,
        include: [
          {
            model: require('../models/User'),
            as: 'user',
            attributes: ['id', 'name', 'email']
          },
          {
            model: require('../models/User'),
            as: 'agent',
            attributes: ['id', 'name', 'email']
          }
        ],
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: {
          quotes: quotes.rows,
          pagination: {
            total: quotes.count,
            page: parseInt(page),
            pages: Math.ceil(quotes.count / limit),
            limit: parseInt(limit)
          }
        }
      });

    } catch (error) {
      console.error('Error obteniendo cotizaciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Obtener cotización específica
  static async getQuoteById(req, res) {
    try {
      const { id } = req.params;
      const user = req.user;

      const quote = await Quote.findByPk(id, {
        include: [
          {
            model: require('../models/User'),
            as: 'user',
            attributes: ['id', 'name', 'email']
          },
          {
            model: require('../models/User'),
            as: 'agent',
            attributes: ['id', 'name', 'email']
          },
          {
            model: QuoteStatusHistory,
            as: 'statusHistory',
            include: [{
              model: require('../models/User'),
              as: 'changedBy',
              attributes: ['id', 'name']
            }],
            order: [['created_at', 'DESC']]
          }
        ]
      });

      if (!quote) {
        return res.status(404).json({
          success: false,
          message: 'Cotización no encontrada'
        });
      }

      // Verificar permisos
      if (user.role === 'client' && quote.user_id !== user.id) {
        return res.status(403).json({
          success: false,
          message: 'No autorizado para ver esta cotización'
        });
      }

      if (user.role === 'agent' && quote.user_id !== user.id && quote.agent_id !== user.id) {
        return res.status(403).json({
          success: false,
          message: 'No autorizado para ver esta cotización'
        });
      }

      res.json({
        success: true,
        data: quote
      });

    } catch (error) {
      console.error('Error obteniendo cotización:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Actualizar estado de cotización
  static async updateQuoteStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      const user = req.user;

      // Solo admin puede cambiar estados
      if (user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Solo administradores pueden cambiar el estado de cotizaciones'
        });
      }

      const quote = await Quote.findByPk(id);
      if (!quote) {
        return res.status(404).json({
          success: false,
          message: 'Cotización no encontrada'
        });
      }

      const oldStatus = quote.status;
      quote.status = status;
      await quote.save();

      // Registrar cambio en historial
      await QuoteStatusHistory.create({
        quote_id: quote.id,
        old_status: oldStatus,
        new_status: status,
        changed_by: user.id,
        reason: reason || `Estado cambiado a ${status}`
      });

      res.json({
        success: true,
        message: 'Estado de cotización actualizado',
        data: quote
      });

    } catch (error) {
      console.error('Error actualizando estado:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Estadísticas de cotizaciones
  static async getQuoteStats(req, res) {
    try {
      const user = req.user;
      
      let whereCondition = {};
      if (user.role === 'client') {
        whereCondition.user_id = user.id;
      } else if (user.role === 'agent') {
        whereCondition = {
          [Op.or]: [
            { user_id: user.id },
            { agent_id: user.id }
          ]
        };
      }

      const stats = await Quote.findAll({
        where: whereCondition,
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_value']
        ],
        group: ['status'],
        raw: true
      });

      const totalQuotes = await Quote.count({ where: whereCondition });
      const recentQuotes = await Quote.count({
        where: {
          ...whereCondition,
          created_at: {
            [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Últimos 30 días
          }
        }
      });

      res.json({
        success: true,
        data: {
          byStatus: stats,
          totalQuotes,
          recentQuotes
        }
      });

    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}

// Función para calcular costos de cotización
function calculateQuoteCosts({ weight, distance_km, declared_value, service_type, urgency, pickup_type }) {
  const base_cost = PRICING_CONFIG.baseCost;
  const weight_cost = weight * PRICING_CONFIG.weightRate;
  const distance_cost = distance_km * PRICING_CONFIG.distanceRate;
  const service_cost = base_cost * (PRICING_CONFIG.serviceMultipliers[service_type] - 1);
  const urgency_cost = base_cost * (PRICING_CONFIG.urgencyMultipliers[urgency] - 1);
  const pickup_cost = PRICING_CONFIG.pickupCosts[pickup_type];
  const insurance_cost = declared_value * PRICING_CONFIG.insuranceRate;
  
  const subtotal = base_cost + weight_cost + distance_cost + service_cost + urgency_cost + pickup_cost + insurance_cost;
  const tax_amount = subtotal * PRICING_CONFIG.taxRate;
  const total_amount = subtotal + tax_amount;
  
  return {
    base_cost,
    weight_cost,
    distance_cost,
    service_cost,
    urgency_cost,
    pickup_cost,
    insurance_cost,
    subtotal: Math.round(subtotal * 100) / 100,
    tax_amount: Math.round(tax_amount * 100) / 100,
    total_amount: Math.round(total_amount * 100) / 100
  };
}

// Función simulada para calcular distancia (reemplazar con Google Maps API)
async function calculateDistance(origin, destination) {
  // Simulación simple basada en ciudades comunes de Costa Rica
  const distances = {
    'san_jose_cartago': 25.5,
    'san_jose_puntarenas': 115.0,
    'san_jose_limon': 160.0,
    'san_jose_guanacaste': 230.0,
    'cartago_limon': 120.0,
    'puntarenas_guanacaste': 180.0
  };
  
  const key = `${origin.toLowerCase().replace(/[^a-z]/g, '_')}_${destination.toLowerCase().replace(/[^a-z]/g, '_')}`;
  const reverseKey = `${destination.toLowerCase().replace(/[^a-z]/g, '_')}_${origin.toLowerCase().replace(/[^a-z]/g, '_')}`;
  
  return distances[key] || distances[reverseKey] || 50.0; // Default 50km
}

module.exports = QuoteController;