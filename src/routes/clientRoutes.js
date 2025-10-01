const express = require('express');
const router = express.Router();
const Client = require('../models/Client');

// GET /api/clients - Obtener todos los clientes
router.get('/', async (req, res) => {
  try {
    console.log('👥 GET /api/clients - Obteniendo clientes');
    
    const { search, status } = req.query;
    const filters = {};
    
    if (search) filters.search = search;
    if (status && status !== 'all') filters.status = status;

    const clients = await Client.findAllWithDetails(filters);

    res.json({
      clients,
      total: clients.length
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

    const client = await Client.findByIdWithDetails(parseInt(id));

    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }

    res.json({
      success: true,
      client
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
    const { name, email, phone, address, city, country, company, contact_person } = req.body;

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
    const existing = await Client.findByEmail(email);
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'El email ya está en uso'
      });
    }

    // Separar nombre en first_name y last_name
    const nameParts = name.split(' ');
    const first_name = nameParts[0];
    const last_name = nameParts.slice(1).join(' ') || '';

    // Crear cliente
    const newClient = await Client.create({
      first_name,
      last_name,
      email,
      phone: phone || '',
      address: address || '',
      city: city || '',
      country: country || 'Costa Rica',
      company_name: company || null,
      business_type: company ? 'Comercial' : 'Individual',
      tax_id: null,
      credit_limit: 1000.00,
      preferred_delivery_time: 'Horario comercial (8AM-5PM)',
      preferred_payment_method: 'Transferencia bancaria'
    });

    console.log(`✅ Cliente creado exitosamente: ${name} (ID: ${newClient.id})`);

    res.status(201).json({
      success: true,
      message: 'Cliente creado exitosamente',
      client: newClient
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
    const { name, email, phone, address, city, country, company, active } = req.body;

    console.log(`👥 PUT /api/clients/${id} - Actualizando cliente`);

    // Validaciones básicas
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        error: 'Nombre y email son requeridos'
      });
    }

    // Verificar si el cliente existe
    const clientExists = await Client.findById(parseInt(id));
    if (!clientExists) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }

    // Verificar si el email está en uso por otro cliente
    const emailExists = await Client.findByEmail(email);
    if (emailExists && emailExists.id !== parseInt(id)) {
      return res.status(409).json({
        success: false,
        error: 'El email ya está en uso por otro cliente'
      });
    }

    // Separar nombre
    const nameParts = name.split(' ');
    const first_name = nameParts[0];
    const last_name = nameParts.slice(1).join(' ') || '';

    // Actualizar cliente
    const updatedClient = await Client.update(parseInt(id), {
      first_name,
      last_name,
      email,
      phone: phone || '',
      address: address || '',
      city: city || '',
      country: country || 'Costa Rica',
      company_name: company || null,
      ...(active !== undefined && { is_active: active })
    });

    console.log(`✅ Cliente actualizado exitosamente: ${name} (ID: ${id})`);

    res.json({
      success: true,
      message: 'Cliente actualizado exitosamente',
      client: updatedClient
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

    const client = await Client.findById(parseInt(id));
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Cliente no encontrado'
      });
    }

    // En producción verificarías paquetes asociados aquí
    
    // Eliminar cliente (soft delete sería mejor)
    await Client.update(parseInt(id), { is_active: false });

    console.log(`✅ Cliente eliminado exitosamente: ${client.first_name} ${client.last_name} (ID: ${id})`);

    res.json({
      success: true,
      message: 'Cliente eliminado exitosamente',
      deletedClient: {
        id: client.id,
        name: `${client.first_name} ${client.last_name}`,
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
router.get('/stats/summary', async (req, res) => {
  try {
    console.log('📊 GET /api/clients/stats - Obteniendo estadísticas');

    const stats = await Client.getStatistics();

    res.json({
      success: true,
      stats
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