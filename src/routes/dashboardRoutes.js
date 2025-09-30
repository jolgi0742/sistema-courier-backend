// src/routes/dashboardRoutes.js - CORREGIDO

const express = require('express');
const DashboardController = require('../controllers/dashboardController');
const router = express.Router();

// Dashboard routes corregidas con métodos que existen en el controlador
router.get('/stats', DashboardController.getStats);
router.get('/recent-activity', DashboardController.getRecentActivity);
router.get('/performance-metrics', DashboardController.getPerformanceMetrics);
router.get('/top-couriers', DashboardController.getTopCouriers);
router.get('/system-alerts', DashboardController.getSystemAlerts);

module.exports = router;