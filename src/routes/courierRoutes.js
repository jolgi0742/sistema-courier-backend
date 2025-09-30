const express = require('express');
const router = express.Router();
const Courier = require('../models/Courier');

// Obtener todos los couriers
router.get('/', async (req, res) => {
  try {
    const couriers = await Courier.findAll();
    res.json(couriers);
  } catch (error) {
    console.error('Error al obtener couriers:', error);
    res.status(500).json({ error: 'Error al obtener couriers' });
  }
});

// Obtener courier por ID
router.get('/:id', async (req, res) => {
  try {
    const courier = await Courier.findById(parseInt(req.params.id));
    if (!courier) {
      return res.status(404).json({ error: 'Courier no encontrado' });
    }
    res.json(courier);
  } catch (error) {
    console.error('Error al obtener courier:', error);
    res.status(500).json({ error: 'Error al obtener courier' });
  }
});

// Crear nuevo courier
router.post('/', async (req, res) => {
  try {
    const newCourier = await Courier.create(req.body);
    res.status(201).json(newCourier);
  } catch (error) {
    console.error('Error al crear courier:', error);
    res.status(400).json({ error: error.message });
  }
});

// Actualizar courier
router.put('/:id', async (req, res) => {
  try {
    const updated = await Courier.update(parseInt(req.params.id), req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Courier no encontrado' });
    }
    res.json(updated);
  } catch (error) {
    console.error('Error al actualizar courier:', error);
    res.status(400).json({ error: error.message });
  }
});

// Eliminar courier
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Courier.delete(parseInt(req.params.id));
    if (!deleted) {
      return res.status(404).json({ error: 'Courier no encontrado' });
    }
    res.json({ message: 'Courier eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar courier:', error);
    res.status(500).json({ error: 'Error al eliminar courier' });
  }
});

// Obtener couriers disponibles
router.get('/available/list', async (req, res) => {
  try {
    const couriers = await Courier.findAll();
    const available = couriers.filter(c => c.available);
    res.json(available);
  } catch (error) {
    console.error('Error al obtener couriers disponibles:', error);
    res.status(500).json({ error: 'Error al obtener couriers disponibles' });
  }
});

// Actualizar estado de disponibilidad
router.patch('/:id/availability', async (req, res) => {
  try {
    const { available } = req.body;
    const courier = await Courier.findById(parseInt(req.params.id));
    
    if (!courier) {
      return res.status(404).json({ error: 'Courier no encontrado' });
    }

    const updated = await Courier.update(parseInt(req.params.id), { available });
    res.json(updated);
  } catch (error) {
    console.error('Error al actualizar disponibilidad:', error);
    res.status(500).json({ error: 'Error al actualizar disponibilidad' });
  }
});

module.exports = router;