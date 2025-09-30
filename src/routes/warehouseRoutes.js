// itobox-backend/src/routes/warehouseRoutes.js - VERSIÓN CORREGIDA
const express = require('express');
const router = express.Router();

// ================================
// SIMULACIÓN DE BASE DE DATOS WHR
// ================================
let whrPackages = [
  {
    id: '1',
    whrNumber: 'WHR24121601',
    trackingNumber: 'TRK123456789',
    consigneeName: 'Maria Rodriguez',
    consigneePhone: '+506 8888-9999',
    consigneeEmail: 'maria.rodriguez@email.com',
    consigneeAddress: '123 Main St, San José, Costa Rica',
    shipperName: 'Electronics USA Corp',
    shipperPhone: '+1-305-555-0123',
    shipperAddress: '456 Tech Ave, Miami, FL 33166',
    pieces: 3,
    weight: 12.5,
    dimensions: { length: 30, width: 20, height: 15 },
    description: 'Electronic devices and accessories',
    status: 'received',
    location: 'A-01-15',
    receivedDate: '2024-06-15',
    createdDate: '2024-06-14',
    classification: 'AWB',
    emailSent: true,
    declaredValue: 850.00,
    notes: 'Handle with care - fragile electronics'
  },
  {
    id: '2',
    whrNumber: 'WHR24121602',
    trackingNumber: 'TRK987654321',
    consigneeName: 'Carlos Mendez',
    consigneePhone: '+506 7777-1234',
    consigneeEmail: 'carlos.mendez@email.com',
    consigneeAddress: '456 Oak Ave, Cartago, Costa Rica',
    shipperName: 'Fashion Direct LLC',
    shipperPhone: '+1-305-555-0456',
    shipperAddress: '789 Fashion Blvd, Miami, FL 33166',
    pieces: 5,
    weight: 8.3,
    dimensions: { length: 40, width: 25, height: 10 },
    description: 'Clothing and textiles',
    status: 'processed',
    location: 'B-02-08',
    receivedDate: '2024-06-16',
    createdDate: '2024-06-15',
    classification: 'BL',
    emailSent: false,
    declaredValue: 320.00,
    notes: 'Fashion items - check for damage'
  }
];

let whrCounter = whrPackages.length;

// ================================
// FUNCIONES AUXILIARES
// ================================

const generateWHRNumber = () => {
  const today = new Date();
  const dateStr = today.getFullYear().toString().slice(-2) + 
                (today.getMonth() + 1).toString().padStart(2, '0') + 
                today.getDate().toString().padStart(2, '0');
  const sequence = (++whrCounter).toString().padStart(4, '0');
  return `WHR${dateStr}${sequence}`;
};

const calculateVolumeWeight = (dimensions) => {
  if (!dimensions || !dimensions.length || !dimensions.width || !dimensions.height) return 0;
  const volumeM3 = (dimensions.length * dimensions.width * dimensions.height) * 0.000578746;
  return volumeM3 * 10.4;
};

// ================================
// RUTAS DE LA API
// ================================

// Health check
router.get('/health', (req, res) => {
  console.log('🏥 Health check - Warehouse API');
  res.json({
    status: 'OK',
    service: 'Warehouse API',
    timestamp: new Date().toISOString(),
    totalWHRs: whrPackages.length,
    database: 'Memory Storage'
  });
});

// GET - Listar todos los WHRs
router.get('/whr', (req, res) => {
  try {
    console.log(`📦 GET /api/warehouse/whr - Retornando ${whrPackages.length} WHRs`);
    
    const { search, status, classification } = req.query;
    let filteredWHRs = [...whrPackages];
    
    // Filtros
    if (search) {
      const searchLower = search.toLowerCase();
      filteredWHRs = filteredWHRs.filter(whr =>
        whr.whrNumber.toLowerCase().includes(searchLower) ||
        whr.consigneeName.toLowerCase().includes(searchLower) ||
        whr.trackingNumber?.toLowerCase().includes(searchLower) ||
        whr.location.toLowerCase().includes(searchLower)
      );
    }
    
    if (status && status !== 'all') {
      filteredWHRs = filteredWHRs.filter(whr => whr.status === status);
    }
    
    if (classification && classification !== 'all') {
      filteredWHRs = filteredWHRs.filter(whr => whr.classification === classification);
    }
    
    res.json({
      success: true,
      data: filteredWHRs,
      total: filteredWHRs.length
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo WHRs:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST - Crear nuevo WHR
router.post('/whr', (req, res) => {
  try {
    console.log('📦 POST /api/warehouse/whr - Creando nuevo WHR');
    
    const whrNumber = generateWHRNumber();
    const volumeWeight = calculateVolumeWeight(req.body.dimensions);
    
    const newWHR = {
      id: Date.now().toString(),
      whrNumber,
      trackingNumber: req.body.trackingNumber || `TRK${Date.now()}`,
      ...req.body,
      volumeWeight: Number(volumeWeight.toFixed(2)),
      createdDate: new Date().toISOString().split('T')[0],
      status: req.body.status || 'pending',
      classification: req.body.classification || 'pending',
      emailSent: false
    };
    
    whrPackages.unshift(newWHR);
    
    console.log(`✅ WHR GUARDADO: ${whrNumber} (Total: ${whrPackages.length})`);
    
    res.status(201).json({
      success: true,
      message: 'WHR creado exitosamente',
      data: newWHR
    });
    
  } catch (error) {
    console.error('❌ Error creando WHR:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando WHR'
    });
  }
});

// PUT - Actualizar WHR
router.put('/whr/:id', (req, res) => {
  try {
    const { id } = req.params;
    const whrIndex = whrPackages.findIndex(whr => whr.id === id);
    
    if (whrIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'WHR no encontrado'
      });
    }
    
    whrPackages[whrIndex] = {
      ...whrPackages[whrIndex],
      ...req.body,
      id: whrPackages[whrIndex].id,
      whrNumber: whrPackages[whrIndex].whrNumber,
      createdDate: whrPackages[whrIndex].createdDate
    };
    
    console.log(`✅ WHR ${whrPackages[whrIndex].whrNumber} actualizado`);
    
    res.json({
      success: true,
      message: 'WHR actualizado exitosamente',
      data: whrPackages[whrIndex]
    });
    
  } catch (error) {
    console.error('❌ Error actualizando WHR:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando WHR'
    });
  }
});

// DELETE - Eliminar WHR
router.delete('/whr/:id', (req, res) => {
  try {
    const { id } = req.params;
    const whrIndex = whrPackages.findIndex(whr => whr.id === id);
    
    if (whrIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'WHR no encontrado'
      });
    }
    
    const deletedWHR = whrPackages[whrIndex];
    whrPackages.splice(whrIndex, 1);
    
    console.log(`✅ WHR ${deletedWHR.whrNumber} eliminado`);
    
    res.json({
      success: true,
      message: 'WHR eliminado exitosamente'
    });
    
  } catch (error) {
    console.error('❌ Error eliminando WHR:', error);
    res.status(500).json({
      success: false,
      message: 'Error eliminando WHR'
    });
  }
});

// PUT - Clasificar WHR
router.put('/whr/:id/classify', (req, res) => {
  try {
    const { id } = req.params;
    const { classification } = req.body;
    
    const whrIndex = whrPackages.findIndex(whr => whr.id === id);
    
    if (whrIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'WHR no encontrado'
      });
    }
    
    whrPackages[whrIndex].classification = classification;
    
    console.log(`✅ WHR ${whrPackages[whrIndex].whrNumber} clasificado como ${classification}`);
    
    res.json({
      success: true,
      message: 'Clasificación actualizada exitosamente',
      data: whrPackages[whrIndex]
    });
    
  } catch (error) {
    console.error('❌ Error clasificando WHR:', error);
    res.status(500).json({
      success: false,
      message: 'Error clasificando WHR'
    });
  }
});

// POST - Enviar email
router.post('/whr/:id/email', (req, res) => {
  try {
    const { id } = req.params;
    const whrIndex = whrPackages.findIndex(whr => whr.id === id);
    
    if (whrIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'WHR no encontrado'
      });
    }
    
    whrPackages[whrIndex].emailSent = true;
    
    console.log(`📧 REAL: Enviando email para WHR ${whrPackages[whrIndex].whrNumber}`);
    
    res.json({
      success: true,
      message: 'Email enviado exitosamente',
      data: whrPackages[whrIndex]
    });
    
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    res.status(500).json({
      success: false,
      message: 'Error enviando email'
    });
  }
});

// GET - Estadísticas
router.get('/stats', (req, res) => {
  try {
    const stats = {
      total: whrPackages.length,
      pending: whrPackages.filter(whr => whr.status === 'pending').length,
      received: whrPackages.filter(whr => whr.status === 'received').length,
      processed: whrPackages.filter(whr => whr.status === 'processed').length,
      shipped: whrPackages.filter(whr => whr.status === 'shipped').length,
      delivered: whrPackages.filter(whr => whr.status === 'delivered').length,
      totalWeight: whrPackages.reduce((sum, whr) => sum + whr.weight, 0),
      totalValue: whrPackages.reduce((sum, whr) => sum + (whr.declaredValue || 0), 0)
    };
    
    res.json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas'
    });
  }
});

// GET - Test endpoint
router.get('/test', (req, res) => {
  console.log('🧪 TEST /api/warehouse/test');
  res.json({
    success: true,
    message: 'Warehouse API funcionando correctamente',
    timestamp: new Date().toISOString(),
    totalWHRs: whrPackages.length
  });
});

module.exports = router;