const express = require('express');
const router = express.Router();
const Package = require('../models/Package');
const Courier = require('../models/Courier');

// Obtener todos los paquetes
router.get('/', async (req, res) => {
  try {
    const packages = await Package.findAll();
    res.json(packages);
  } catch (error) {
    console.error('Error al obtener paquetes:', error);
    res.status(500).json({ error: 'Error al obtener paquetes' });
  }
});

// Obtener paquete por ID
router.get('/:id', async (req, res) => {
  try {
    const pkg = await Package.findById(parseInt(req.params.id));
    if (!pkg) {
      return res.status(404).json({ error: 'Paquete no encontrado' });
    }
    res.json(pkg);
  } catch (error) {
    console.error('Error al obtener paquete:', error);
    res.status(500).json({ error: 'Error al obtener paquete' });
  }
});

// Crear nuevo paquete
router.post('/', async (req, res) => {
  try {
    const newPackage = await Package.create(req.body);
    res.status(201).json(newPackage);
  } catch (error) {
    console.error('Error al crear paquete:', error);
    res.status(400).json({ error: error.message });
  }
});

// Actualizar paquete
router.put('/:id', async (req, res) => {
  try {
    const updated = await Package.update(parseInt(req.params.id), req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Paquete no encontrado' });
    }
    res.json(updated);
  } catch (error) {
    console.error('Error al actualizar paquete:', error);
    res.status(400).json({ error: error.message });
  }
});

// Eliminar paquete
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Package.delete(parseInt(req.params.id));
    if (!deleted) {
      return res.status(404).json({ error: 'Paquete no encontrado' });
    }
    res.json({ message: 'Paquete eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar paquete:', error);
    res.status(500).json({ error: 'Error al eliminar paquete' });
  }
});

// Asignar courier a paquete
router.post('/:id/assign-courier', async (req, res) => {
  try {
    const packageId = parseInt(req.params.id);
    const { courier_id } = req.body;

    // Verificar que el paquete existe
    const pkg = await Package.findById(packageId);
    if (!pkg) {
      return res.status(404).json({ error: 'Paquete no encontrado' });
    }

    // Verificar que el courier existe
    const courier = await Courier.findById(courier_id);
    if (!courier) {
      return res.status(404).json({ error: 'Courier no encontrado' });
    }

    // Verificar que el courier está disponible
    if (!courier.available) {
      return res.status(400).json({ error: 'El courier no está disponible' });
    }

    // Asignar courier al paquete
    const updatedPackage = await Package.update(packageId, {
      courier_id,
      status: 'confirmed'
    });

    // Marcar courier como ocupado
    await Courier.update(courier_id, { available: false });

    res.json({
      message: 'Courier asignado exitosamente',
      package: updatedPackage
    });
  } catch (error) {
    console.error('Error al asignar courier:', error);
    res.status(500).json({ error: 'Error al asignar courier' });
  }
});

// Actualizar estado del paquete
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const packageId = parseInt(req.params.id);
    
    const pkg = await Package.findById(packageId);
    if (!pkg) {
      return res.status(404).json({ error: 'Paquete no encontrado' });
    }

    const updated = await Package.update(packageId, { status });

    // Si el paquete se entregó, liberar al courier
    if (status === 'delivered' && pkg.courier_id) {
      await Courier.update(pkg.courier_id, { available: true });
    }

    res.json(updated);
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
});

// Obtener paquetes por cliente
router.get('/client/:clientId', async (req, res) => {
  try {
    const packages = await Package.findAll();
    const clientPackages = packages.filter(
      p => p.client_id === parseInt(req.params.clientId)
    );
    res.json(clientPackages);
  } catch (error) {
    console.error('Error al obtener paquetes del cliente:', error);
    res.status(500).json({ error: 'Error al obtener paquetes del cliente' });
  }
});

// Obtener paquetes por courier
router.get('/courier/:courierId', async (req, res) => {
  try {
    const packages = await Package.findAll();
    const courierPackages = packages.filter(
      p => p.courier_id === parseInt(req.params.courierId)
    );
    res.json(courierPackages);
  } catch (error) {
    console.error('Error al obtener paquetes del courier:', error);
    res.status(500).json({ error: 'Error al obtener paquetes del courier' });
  }
});

module.exports = router;