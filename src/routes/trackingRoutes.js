// itobox-backend/src/routes/trackingRoutes.js - VERSIÓN CORREGIDA
const express = require('express');
const router = express.Router();

// Importar middleware de autorización opcional
const authorize = require('../middleware/authorize');

// ================================
// DATOS MOCK DE TRACKING
// ================================
let trackingEvents = [
  {
    id: '1',
    trackingNumber: 'ITB001234567',
    packageId: '1',
    events: [
      {
        id: 'e1',
        status: 'created',
        location: 'San José, Costa Rica',
        description: 'Paquete creado en el sistema',
        timestamp: '2024-06-15T08:00:00Z',
        operator: 'Sistema'
      },
      {
        id: 'e2',
        status: 'picked_up',
        location: 'San José, Costa Rica',
        description: 'Paquete recolectado por courier',
        timestamp: '2024-06-15T10:30:00Z',
        operator: 'Juan Courier'
      },
      {
        id: 'e3',
        status: 'in_transit',
        location: 'Centro de Distribución',
        description: 'En tránsito hacia destino',
        timestamp: '2024-06-15T14:00:00Z',
        operator: 'Sistema'
      }
    ],
    currentStatus: 'in_transit',
    estimatedDelivery: '2024-06-16T18:00:00Z'
  },
  {
    id: '2',
    trackingNumber: 'ITB001234568',
    packageId: '2',
    events: [
      {
        id: 'e4',
        status: 'created',
        location: 'Cartago, Costa Rica',
        description: 'Paquete creado en el sistema',
        timestamp: '2024-06-15T09:00:00Z',
        operator: 'Sistema'
      }
    ],
    currentStatus: 'pending',
    estimatedDelivery: '2024-06-17T18:00:00Z'
  }
];

// ================================
// FUNCIONES AUXILIARES
// ================================

const findTrackingByNumber = (trackingNumber) => {
  return trackingEvents.find(track => 
    track.trackingNumber.toLowerCase() === trackingNumber.toLowerCase()
  );
};

const addTrackingEvent = (trackingNumber, eventData) => {
  const tracking = findTrackingByNumber(trackingNumber);
  if (!tracking) return null;

  const newEvent = {
    id: `e${Date.now()}`,
    ...eventData,
    timestamp: new Date().toISOString()
  };

  tracking.events.push(newEvent);
  tracking.currentStatus = eventData.status;
  
  return tracking;
};

// ================================
// RUTAS DE LA API
// ================================

// Health check
router.get('/health', (req, res) => {
  console.log('🏥 Health check - Tracking API');
  res.json({
    status: 'OK',
    service: 'Tracking API',
    timestamp: new Date().toISOString(),
    totalTracking: trackingEvents.length
  });
});

// GET - Buscar tracking por número (público)
router.get('/:trackingNumber', (req, res) => {
  try {
    const { trackingNumber } = req.params;
    console.log(`🔍 GET /api/tracking/${trackingNumber}`);
    
    const tracking = findTrackingByNumber(trackingNumber);
    
    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: 'Número de tracking no encontrado'
      });
    }
    
    // Información pública de tracking
    const publicInfo = {
      trackingNumber: tracking.trackingNumber,
      currentStatus: tracking.currentStatus,
      estimatedDelivery: tracking.estimatedDelivery,
      events: tracking.events.map(event => ({
        status: event.status,
        location: event.location,
        description: event.description,
        timestamp: event.timestamp
      }))
    };
    
    res.json({
      success: true,
      data: publicInfo
    });
    
  } catch (error) {
    console.error('❌ Error buscando tracking:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST - Agregar evento de tracking (requiere autorización)
router.post('/:trackingNumber/events', authorize.optionalAuth, (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const { status, location, description, operator } = req.body;
    
    console.log(`📍 POST /api/tracking/${trackingNumber}/events - Estado: ${status}`);
    
    if (!status || !description) {
      return res.status(400).json({
        success: false,
        message: 'Estado y descripción son requeridos'
      });
    }
    
    const eventData = {
      status,
      location: location || 'No especificado',
      description,
      operator: operator || (req.user ? req.user.name : 'Sistema')
    };
    
    const updatedTracking = addTrackingEvent(trackingNumber, eventData);
    
    if (!updatedTracking) {
      return res.status(404).json({
        success: false,
        message: 'Número de tracking no encontrado'
      });
    }
    
    console.log(`✅ Evento agregado: ${trackingNumber} -> ${status}`);
    
    res.json({
      success: true,
      message: 'Evento de tracking agregado exitosamente',
      data: {
        trackingNumber: updatedTracking.trackingNumber,
        currentStatus: updatedTracking.currentStatus,
        latestEvent: updatedTracking.events[updatedTracking.events.length - 1]
      }
    });
    
  } catch (error) {
    console.error('❌ Error agregando evento de tracking:', error);
    res.status(500).json({
      success: false,
      message: 'Error agregando evento'
    });
  }
});

// GET - Obtener tracking completo (requiere autorización)
router.get('/:trackingNumber/admin', authorize(['admin', 'courier']), (req, res) => {
  try {
    const { trackingNumber } = req.params;
    console.log(`🔐 GET /api/tracking/${trackingNumber}/admin`);
    
    const tracking = findTrackingByNumber(trackingNumber);
    
    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: 'Número de tracking no encontrado'
      });
    }
    
    // Información completa para administradores
    res.json({
      success: true,
      data: tracking
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo tracking admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET - Listar todos los trackings (requiere autorización)
router.get('/', authorize(['admin']), (req, res) => {
  try {
    console.log('📦 GET /api/tracking - Listando todos los trackings');
    
    const { status, limit = 50 } = req.query;
    let filteredTracking = [...trackingEvents];
    
    if (status && status !== 'all') {
      filteredTracking = filteredTracking.filter(track => track.currentStatus === status);
    }
    
    // Limitar resultados
    filteredTracking = filteredTracking.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: filteredTracking,
      total: filteredTracking.length
    });
    
  } catch (error) {
    console.error('❌ Error listando trackings:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST - Crear nuevo tracking
router.post('/', authorize.optionalAuth, (req, res) => {
  try {
    const { trackingNumber, packageId, initialStatus = 'created', location, description } = req.body;
    
    console.log(`📦 POST /api/tracking - Creando tracking: ${trackingNumber}`);
    
    if (!trackingNumber || !packageId) {
      return res.status(400).json({
        success: false,
        message: 'Número de tracking y ID de paquete son requeridos'
      });
    }
    
    // Verificar si ya existe
    const existingTracking = findTrackingByNumber(trackingNumber);
    if (existingTracking) {
      return res.status(409).json({
        success: false,
        message: 'El número de tracking ya existe'
      });
    }
    
    const newTracking = {
      id: Date.now().toString(),
      trackingNumber,
      packageId,
      events: [
        {
          id: `e${Date.now()}`,
          status: initialStatus,
          location: location || 'Centro de procesamiento',
          description: description || 'Paquete creado en el sistema',
          timestamp: new Date().toISOString(),
          operator: req.user ? req.user.name : 'Sistema'
        }
      ],
      currentStatus: initialStatus,
      estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString() // +2 días
    };
    
    trackingEvents.unshift(newTracking);
    
    console.log(`✅ Tracking creado: ${trackingNumber}`);
    
    res.status(201).json({
      success: true,
      message: 'Tracking creado exitosamente',
      data: newTracking
    });
    
  } catch (error) {
    console.error('❌ Error creando tracking:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando tracking'
    });
  }
});

// PUT - Actualizar estimación de entrega
router.put('/:trackingNumber/delivery', authorize(['admin', 'courier']), (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const { estimatedDelivery } = req.body;
    
    console.log(`📅 PUT /api/tracking/${trackingNumber}/delivery`);
    
    const tracking = findTrackingByNumber(trackingNumber);
    
    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: 'Número de tracking no encontrado'
      });
    }
    
    tracking.estimatedDelivery = estimatedDelivery;
    
    console.log(`✅ Estimación actualizada: ${trackingNumber}`);
    
    res.json({
      success: true,
      message: 'Estimación de entrega actualizada',
      data: {
        trackingNumber: tracking.trackingNumber,
        estimatedDelivery: tracking.estimatedDelivery
      }
    });
    
  } catch (error) {
    console.error('❌ Error actualizando estimación:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando estimación'
    });
  }
});

// GET - Estadísticas de tracking
router.get('/stats/summary', (req, res) => {
  try {
    console.log('📊 GET /api/tracking/stats/summary');
    
    const stats = {
      total: trackingEvents.length,
      created: trackingEvents.filter(t => t.currentStatus === 'created').length,
      picked_up: trackingEvents.filter(t => t.currentStatus === 'picked_up').length,
      in_transit: trackingEvents.filter(t => t.currentStatus === 'in_transit').length,
      out_for_delivery: trackingEvents.filter(t => t.currentStatus === 'out_for_delivery').length,
      delivered: trackingEvents.filter(t => t.currentStatus === 'delivered').length,
      totalEvents: trackingEvents.reduce((sum, track) => sum + track.events.length, 0),
      averageEventsPerPackage: trackingEvents.length > 0 ? 
        trackingEvents.reduce((sum, track) => sum + track.events.length, 0) / trackingEvents.length : 0
    };
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas de tracking:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas'
    });
  }
});

// GET - Buscar múltiples trackings
router.post('/search', (req, res) => {
  try {
    const { trackingNumbers } = req.body;
    
    console.log(`🔍 POST /api/tracking/search - ${trackingNumbers?.length || 0} números`);
    
    if (!trackingNumbers || !Array.isArray(trackingNumbers)) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array de números de tracking'
      });
    }
    
    const results = trackingNumbers.map(trackingNumber => {
      const tracking = findTrackingByNumber(trackingNumber);
      
      if (!tracking) {
        return {
          trackingNumber,
          found: false,
          error: 'No encontrado'
        };
      }
      
      return {
        trackingNumber,
        found: true,
        currentStatus: tracking.currentStatus,
        estimatedDelivery: tracking.estimatedDelivery,
        eventsCount: tracking.events.length
      };
    });
    
    res.json({
      success: true,
      data: results,
      summary: {
        total: trackingNumbers.length,
        found: results.filter(r => r.found).length,
        notFound: results.filter(r => !r.found).length
      }
    });
    
  } catch (error) {
    console.error('❌ Error en búsqueda múltiple:', error);
    res.status(500).json({
      success: false,
      message: 'Error en búsqueda múltiple'
    });
  }
});

module.exports = router;