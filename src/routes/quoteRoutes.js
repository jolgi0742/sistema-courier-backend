const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Sistema de cotizaciones funcionando',
    data: []
  });
});

router.post('/', (req, res) => {
  const { origin, destination, weight } = req.body;
  
  if (!origin || !destination || !weight) {
    return res.status(400).json({
      success: false,
      message: 'Faltan datos requeridos'
    });
  }
  
  const total = 1500 + (parseFloat(weight) * 250);
  
  res.status(201).json({
    success: true,
    message: 'Cotizacion creada',
    data: {
      id: Date.now(),
      origin: origin,
      destination: destination,
      weight: parseFloat(weight),
      total: total
    }
  });
});

module.exports = router;