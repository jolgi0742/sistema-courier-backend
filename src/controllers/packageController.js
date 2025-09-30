// src/controllers/packageController.js - VERSIÓN COMPLETA CON TODOS LOS MÉTODOS

// Datos simulados para desarrollo
const mockPackages = [
  {
    id: '1',
    tracking_number: 'ITB12345678',
    sender_name: 'Juan Pérez',
    sender_phone: '+506 8888-1111',
    sender_address: 'San José, Costa Rica',
    recipient_name: 'María González',
    recipient_phone: '+506 8888-2222',
    recipient_address: 'Cartago, Costa Rica',
    status: 'in_transit',
    service_type: 'express',
    weight: 2.5,
    dimensions: { length: 30, width: 20, height: 10 },
    declared_value: 150.00,
    created_at: '2024-12-01T10:00:00Z',
    updated_at: '2024-12-05T14:30:00Z',
    estimated_delivery: '2024-12-08T17:00:00Z',
    description: 'Documentos importantes',
    courier_id: 'courier_1'
  },
  {
    id: '2',
    tracking_number: 'ITB87654321',
    sender_name: 'Ana Rodríguez',
    sender_phone: '+506 8888-3333',
    sender_address: 'Alajuela, Costa Rica',
    recipient_name: 'Carlos Méndez',
    recipient_phone: '+506 8888-4444',
    recipient_address: 'Heredia, Costa Rica',
    status: 'pending',
    service_type: 'standard',
    weight: 1.2,
    dimensions: { length: 25, width: 15, height: 8 },
    declared_value: 89.99,
    created_at: '2024-11-25T09:15:00Z',
    updated_at: '2024-12-02T16:45:00Z',
    estimated_delivery: '2024-12-10T12:00:00Z',
    description: 'Ropa y accesorios',
    courier_id: null
  },
  {
    id: '3',
    tracking_number: 'ITB55566677',
    sender_name: 'Luis Vargas',
    sender_phone: '+506 8888-5555',
    sender_address: 'Puntarenas, Costa Rica',
    recipient_name: 'Sofia Castro',
    recipient_phone: '+506 8888-6666',
    recipient_address: 'Limón, Costa Rica',
    status: 'delivered',
    service_type: 'economy',
    weight: 0.8,
    dimensions: { length: 20, width: 12, height: 5 },
    declared_value: 45.50,
    created_at: '2024-11-20T14:30:00Z',
    updated_at: '2024-12-01T11:20:00Z',
    estimated_delivery: '2024-12-15T16:00:00Z',
    description: 'Libros y material educativo',
    courier_id: 'courier_2'
  }
];

// ===== FUNCIONES HELPER =====

function calculateDeliveryProgress(pkg) {
  const now = new Date();
  const created = new Date(pkg.created_at);
  const estimated = new Date(pkg.estimated_delivery);
  
  if (pkg.status === 'delivered') return 100;
  if (pkg.status === 'pending') return 10;
  
  const totalTime = estimated.getTime() - created.getTime();
  const elapsedTime = now.getTime() - created.getTime();
  
  const progress = Math.min(Math.max((elapsedTime / totalTime) * 100, 10), 95);
  return Math.round(progress);
}

function formatPackage(pkg) {
  return {
    ...pkg,
    deliveryProgress: calculateDeliveryProgress(pkg),
    formattedWeight: `${pkg.weight} kg`,
    formattedValue: `₡${pkg.declared_value.toLocaleString()}`,
    statusLabel: getStatusLabel(pkg.status),
    serviceLabel: getServiceLabel(pkg.service_type)
  };
}

function getStatusLabel(status) {
  const labels = {
    'pending': 'Pendiente',
    'picked_up': 'Recolectado',
    'in_transit': 'En Tránsito',
    'out_for_delivery': 'En Reparto',
    'delivered': 'Entregado',
    'returned': 'Devuelto'
  };
  return labels[status] || status;
}

function getServiceLabel(service) {
  const labels = {
    'express': 'Express',
    'standard': 'Estándar',
    'economy': 'Económico'
  };
  return labels[service] || service;
}

// ===== CONTROLADORES PRINCIPALES =====

// GET /api/packages - Obtener todos los paquetes
const getAllPackages = async (req, res) => {
  try {
    console.log('📦 Obteniendo todos los paquetes...');
    
    const {
      status,
      clientId,
      courierId,
      serviceType,
      dateFrom,
      dateTo,
      search,
      page = 1,
      limit = 10
    } = req.query;
    
    const filters = {
      status,
      clientId,
      courierId,
      serviceType,
      dateFrom,
      dateTo,
      search
    };
    
    console.log('🔍 Filtros aplicados:', filters);
    
    // Simular obtención de paquetes
    let packages = [...mockPackages];
    
    // Aplicar filtros
    if (status) {
      packages = packages.filter(pkg => pkg.status === status);
    }
    
    if (courierId) {
      packages = packages.filter(pkg => pkg.courier_id === courierId);
    }
    
    if (serviceType) {
      packages = packages.filter(pkg => pkg.service_type === serviceType);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      packages = packages.filter(pkg => 
        pkg.tracking_number.toLowerCase().includes(searchLower) ||
        pkg.sender_name.toLowerCase().includes(searchLower) ||
        pkg.recipient_name.toLowerCase().includes(searchLower)
      );
    }
    
    console.log(`✅ ${packages.length} paquetes obtenidos de ${mockPackages.length} total`);
    
    // Formatear paquetes con cálculos adicionales
    const formattedPackages = packages.map(formatPackage);
    
    // Paginación
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedPackages = formattedPackages.slice(startIndex, endIndex);
    
    const response = {
      success: true,
      data: paginatedPackages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: packages.length,
        totalPages: Math.ceil(packages.length / parseInt(limit))
      },
      filters: filters
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error obteniendo paquetes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// GET /api/packages/stats - Obtener estadísticas de paquetes
const getPackageStats = async (req, res) => {
  try {
    console.log('📊 Obteniendo estadísticas de paquetes...');
    
    const total = mockPackages.length;
    const pending = mockPackages.filter(p => p.status === 'pending').length;
    const inTransit = mockPackages.filter(p => p.status === 'in_transit').length;
    const delivered = mockPackages.filter(p => p.status === 'delivered').length;
    const returned = mockPackages.filter(p => p.status === 'returned').length;
    
    const stats = {
      total,
      pending,
      in_transit: inTransit,
      delivered,
      returned,
      total_value: mockPackages.reduce((sum, p) => sum + p.declared_value, 0),
      avg_weight: mockPackages.reduce((sum, p) => sum + p.weight, 0) / total,
      by_service: {
        express: mockPackages.filter(p => p.service_type === 'express').length,
        standard: mockPackages.filter(p => p.service_type === 'standard').length,
        economy: mockPackages.filter(p => p.service_type === 'economy').length
      }
    };
    
    console.log('✅ Estadísticas calculadas exitosamente');
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas',
      error: error.message
    });
  }
};

// GET /api/packages/available - Obtener paquetes disponibles (sin courier asignado)
const getAvailablePackages = async (req, res) => {
  try {
    console.log('📦 Obteniendo paquetes disponibles...');
    
    const availablePackages = mockPackages
      .filter(pkg => !pkg.courier_id && pkg.status === 'pending')
      .map(formatPackage);
    
    res.json({
      success: true,
      data: availablePackages,
      count: availablePackages.length
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo paquetes disponibles:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo paquetes disponibles',
      error: error.message
    });
  }
};

// GET /api/packages/:id - Obtener paquete por ID
const getPackageById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const package = mockPackages.find(p => p.id === id);
    
    if (!package) {
      return res.status(404).json({
        success: false,
        message: 'Paquete no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: formatPackage(package)
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo paquete:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo paquete',
      error: error.message
    });
  }
};

// GET /api/packages/tracking/:trackingNumber - Obtener paquete por número de tracking
const getTrackingByNumber = async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    
    console.log(`🔍 Buscando paquete con tracking: ${trackingNumber}`);
    
    const package = mockPackages.find(p => p.tracking_number === trackingNumber);
    
    if (!package) {
      return res.status(404).json({
        success: false,
        message: 'Número de tracking no encontrado'
      });
    }
    
    // Agregar información de tracking adicional
    const trackingData = {
      ...formatPackage(package),
      tracking_history: [
        {
          status: 'created',
          timestamp: package.created_at,
          location: 'Centro de Distribución',
          description: 'Paquete recibido en nuestras instalaciones'
        },
        {
          status: 'in_transit',
          timestamp: package.updated_at,
          location: 'En ruta',
          description: 'Paquete en tránsito hacia destino'
        }
      ]
    };
    
    if (package.status === 'delivered') {
      trackingData.tracking_history.push({
        status: 'delivered',
        timestamp: package.updated_at,
        location: package.recipient_address,
        description: 'Paquete entregado exitosamente'
      });
    }
    
    res.json({
      success: true,
      data: trackingData
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo tracking:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo información de tracking',
      error: error.message
    });
  }
};

// POST /api/packages - Crear nuevo paquete
const createPackage = async (req, res) => {
  try {
    const packageData = req.body;
    
    const newPackage = {
      id: (mockPackages.length + 1).toString(),
      tracking_number: `ITB${Date.now()}`,
      ...packageData,
      status: 'pending',
      courier_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    mockPackages.push(newPackage);
    
    console.log(`✅ Paquete creado: ${newPackage.tracking_number}`);
    
    res.status(201).json({
      success: true,
      message: 'Paquete creado exitosamente',
      data: formatPackage(newPackage)
    });
    
  } catch (error) {
    console.error('❌ Error creando paquete:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando paquete',
      error: error.message
    });
  }
};

// PUT /api/packages/:id/status - Actualizar solo el estado del paquete
const updatePackageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, location, notes } = req.body;
    
    const packageIndex = mockPackages.findIndex(p => p.id === id);
    
    if (packageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Paquete no encontrado'
      });
    }
    
    // Actualizar solo el estado
    mockPackages[packageIndex] = {
      ...mockPackages[packageIndex],
      status,
      updated_at: new Date().toISOString(),
      ...(location && { current_location: location }),
      ...(notes && { notes: notes })
    };
    
    console.log(`✅ Estado actualizado: ${mockPackages[packageIndex].tracking_number} → ${status}`);
    
    res.json({
      success: true,
      message: 'Estado del paquete actualizado exitosamente',
      data: formatPackage(mockPackages[packageIndex])
    });
    
  } catch (error) {
    console.error('❌ Error actualizando estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando estado del paquete',
      error: error.message
    });
  }
};

// PUT /api/packages/:id/assign-courier - Asignar courier a paquete
const assignCourier = async (req, res) => {
  try {
    const { id } = req.params;
    const { courierId, courierName } = req.body;
    
    if (!courierId) {
      return res.status(400).json({
        success: false,
        message: 'ID del courier es requerido'
      });
    }
    
    const packageIndex = mockPackages.findIndex(p => p.id === id);
    
    if (packageIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Paquete no encontrado'
      });
    }
    
    // Asignar courier y cambiar estado
    mockPackages[packageIndex] = {
      ...mockPackages[packageIndex],
      courier_id: courierId,
      courier_name: courierName || `Courier ${courierId}`,
      status: 'picked_up',
      updated_at: new Date().toISOString()
    };
    
    console.log(`✅ Courier asignado: ${mockPackages[packageIndex].tracking_number} → ${courierName || courierId}`);
    
    res.json({
      success: true,
      message: 'Courier asignado exitosamente',
      data: formatPackage(mockPackages[packageIndex])
    });
    
  } catch (error) {
    console.error('❌ Error asignando courier:', error);
    res.status(500).json({
      success: false,
      message: 'Error asignando courier',
      error: error.message
    });
  }
};

// ===== EXPORTAR TODOS LOS MÉTODOS =====

module.exports = {
  getAllPackages,
  getPackageStats,
  getAvailablePackages,
  getPackageById,
  getTrackingByNumber,
  createPackage,
  updatePackageStatus,
  assignCourier
};