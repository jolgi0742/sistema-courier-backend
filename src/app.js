// 🔧 BACKEND APP.JS ACTUALIZADO - CON SISTEMA DE COTIZACIONES
// itobox-backend/src/app.js

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// CREAR LA INSTANCIA DE APP PRIMERO
const app = express();

// Middleware de seguridad
app.use(helmet());
app.use(compression());

// CORS configurado para el frontend
app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://itobox-courier.vercel.app',
        process.env.FRONTEND_URL
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100 // límite de 100 requests por IP por ventana
});
app.use(limiter);

// Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} - ${req.method} ${req.path}`);
    next();
});

// RUTAS DE PAGOS - FUNCIONALIDAD DE PAGOS
try {
    const paymentRoutes = require('./routes/paymentRoutes');
    app.use('/api/payments', paymentRoutes);
    console.log('✅ paymentRoutes cargado');
} catch (error) {
    console.log('⚠️ paymentRoutes no encontrado:', error.message);
}

// RUTAS DE COTIZACIONES - NUEVA FUNCIONALIDAD
try {
    const quoteRoutes = require('./routes/quoteRoutes');
    app.use('/api/quotes', quoteRoutes);
    console.log('✅ quoteRoutes cargado');
} catch (error) {
    console.log('⚠️ quoteRoutes no encontrado:', error.message);
}

// Importar y usar rutas existentes
try {
    const authRoutes = require('./routes/authRoutes');
    app.use('/api/auth', authRoutes);
    console.log('✅ authRoutes cargado');
} catch (error) {
    console.log('⚠️ authRoutes no encontrado:', error.message);
}

try {
    const clientRoutes = require('./routes/clientRoutes');
    app.use('/api/clients', clientRoutes);
    console.log('✅ clientRoutes cargado');
} catch (error) {
    console.log('⚠️ clientRoutes no encontrado:', error.message);
}

try {
    const userRoutes = require('./routes/userRoutes');
    app.use('/api/users', userRoutes);
    console.log('✅ userRoutes cargado');
} catch (error) {
    console.log('⚠️ userRoutes no encontrado:', error.message);
}

try {
    const packageRoutes = require('./routes/packageRoutes');
    app.use('/api/packages', packageRoutes);
    console.log('✅ packageRoutes cargado');
} catch (error) {
    console.log('⚠️ packageRoutes no encontrado:', error.message);
}

try {
    const trackingRoutes = require('./routes/trackingRoutes');
    app.use('/api/tracking', trackingRoutes);
    console.log('✅ trackingRoutes cargado');
} catch (error) {
    console.log('⚠️ trackingRoutes no encontrado:', error.message);
}

try {
    const dashboardRoutes = require('./routes/dashboardRoutes');
    app.use('/api/dashboard', dashboardRoutes);
    console.log('✅ dashboardRoutes cargado');
} catch (error) {
    console.log('⚠️ dashboardRoutes no encontrado:', error.message);
}

try {
    const courierRoutes = require('./routes/courierRoutes');
    app.use('/api/couriers', courierRoutes);
    console.log('✅ courierRoutes cargado');
} catch (error) {
    console.log('⚠️ courierRoutes no encontrado:', error.message);
}

try {
    const warehouseRoutes = require('./routes/warehouseRoutes');
    app.use('/api/warehouse', warehouseRoutes);
    console.log('✅ warehouseRoutes cargado');
} catch (error) {
    console.log('⚠️ warehouseRoutes no encontrado:', error.message);
}

// Rutas adicionales para el sistema completo
try {
    const billingRoutes = require('./routes/billingRoutes');
    app.use('/api/billing', billingRoutes);
    console.log('✅ billingRoutes cargado');
} catch (error) {
    console.log('⚠️ billingRoutes no encontrado - se puede agregar más tarde');
}

try {
    const notificationRoutes = require('./routes/notificationRoutes');
    app.use('/api/notifications', notificationRoutes);
    console.log('✅ notificationRoutes cargado');
} catch (error) {
    console.log('⚠️ notificationRoutes no encontrado - se puede agregar más tarde');
}

// Ruta de health check principal
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        service: 'ITOBOX Courier API',
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '2.2.0',
        environment: process.env.NODE_ENV || 'development',
        features: {
            payments: true,
            quotes: true,
            tracking: true,
            warehouse: true,
            billing: true
        }
    });
});

// Ruta raíz
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'ITOBOX Courier Backend API',
        version: '2.2.0',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth',
            packages: '/api/packages',
            clients: '/api/clients',
            couriers: '/api/couriers',
            dashboard: '/api/dashboard',
            tracking: '/api/tracking',
            warehouse: '/api/warehouse',
            payments: '/api/payments',
            quotes: '/api/quotes',
            billing: '/api/billing'
        },
        documentation: 'https://docs.itobox.com'
    });
});

// Middleware de manejo de errores 404
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint no encontrado',
        path: req.originalUrl,
        method: req.method,
        timestamp: new Date().toISOString()
    });
});

// Middleware de manejo de errores global
app.use((error, req, res, next) => {
    console.error('❌ Error global capturado:', error);
    
    res.status(error.status || 500).json({
        success: false,
        message: error.message || 'Error interno del servidor',
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && { 
            stack: error.stack,
            details: error 
        })
    });
});

module.exports = app;