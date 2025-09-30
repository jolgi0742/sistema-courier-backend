// ==============================================================
// ARCHIVO: src/server.js - CON WEBSOCKET + SISTEMA DE PAGOS + COTIZACIONES
// ==============================================================

require('dotenv').config();

// Clear require cache to force reload
delete require.cache[require.resolve('./app')];

const app = require('./app');
const http = require('http');
const webSocketService = require('./services/websocketService');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        console.log('\n🎉 ITOBOX Courier Backend INICIADO EXITOSAMENTE!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📍 Servidor: http://0.0.0.0:${PORT}`);
        console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
        console.log(`📊 Health Check: http://0.0.0.0:${PORT}/api/health`);
        console.log('🔗 ENDPOINTS COURIER:');
        console.log('   ✅ GET  /api/packages                  - Gestión de paquetes');
        console.log('   ✅ GET  /api/packages/stats            - Estadísticas de paquetes');
        console.log('   ✅ GET  /api/couriers                  - Red de couriers');
        console.log('   ✅ GET  /api/couriers/stats            - Estadísticas de couriers');
        console.log('   ✅ GET  /api/clients                   - Portal de clientes');
        console.log('   ✅ GET  /api/clients/stats             - Estadísticas de clientes');
        console.log('   ✅ GET  /api/dashboard/stats           - Dashboard completo');
        console.log('   ✅ PUT  /api/packages/:id/assign-courier - Asignar couriers');
        console.log('💳 ENDPOINTS DE PAGOS:');
        console.log('   ✅ POST /api/payments/confirm-sinpe    - Confirmar pago SINPE');
        console.log('   ✅ POST /api/payments/confirm-paypal   - Confirmar pago PayPal');
        console.log('   ✅ POST /api/payments/confirm-bank-transfer - Transferencia bancaria');
        console.log('   ✅ GET  /api/payments/payment-methods  - Métodos disponibles');
        console.log('   ✅ GET  /api/payments/payment-status/:id - Estado de pago');
        console.log('💰 NUEVOS ENDPOINTS DE COTIZACIONES:');
        console.log('   ✅ POST /api/quotes                    - Crear cotización');
        console.log('   ✅ GET  /api/quotes                    - Listar cotizaciones');
        console.log('   ✅ GET  /api/quotes/:id                - Ver cotización');
        console.log('   ✅ PUT  /api/quotes/:id/status         - Cambiar estado');
        console.log('   ✅ GET  /api/quotes/stats              - Estadísticas');
        console.log('🔌 WebSocket para tracking en tiempo real');
        console.log('📁 Upload de comprobantes: /uploads/payment-receipts/');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        // Crear directorio para recibos de pago si no existe
        const uploadDir = path.join(__dirname, '../uploads/payment-receipts');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
            console.log('📁 Directorio de recibos creado: ', uploadDir);
        }

        // Crear servidor HTTP
        const server = http.createServer(app);
        
        // Inicializar WebSocket
        webSocketService.initialize(server);
        
        // Servir archivos estáticos de recibos (solo para admin)
        app.use('/uploads', (req, res, next) => {
            // Aquí puedes agregar middleware de autenticación si es necesario
            next();
        }, require('express').static(path.join(__dirname, '../uploads')));

        // AGREGAR RUTAS DE PAGOS
        const paymentRoutes = require('./routes/paymentRoutes');
        app.use('/api/payments', paymentRoutes);

         // ⭐ FUNCIONES GLOBALES PARA NOTIFICACIONES DE COTIZACIONES
        global.notifyQuoteUpdate = function(quoteId, event, data) {
            try {
                if (webSocketService && webSocketService.broadcast) {
                    webSocketService.broadcast('quote_updated', {
                        quoteId,
                        event,
                        data,
                        timestamp: new Date().toISOString()
                    });
                    console.log(`📡 Notificación de cotización enviada: ${quoteId} - ${event}`);
                }
            } catch (error) {
                console.error('❌ Error enviando notificación de cotización:', error);
            }
        };
        
        server.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Servidor courier + pagos + cotizaciones funcionando en puerto ${PORT}`);
            console.log(`📦 Test inmediato: curl http://localhost:${PORT}/api/packages`);
            console.log(`📊 Dashboard stats: curl http://localhost:${PORT}/api/dashboard/stats`);
            console.log(`💳 Test pagos: curl http://localhost:${PORT}/api/payments/payment-methods`);
            console.log(`💰 Test cotizaciones: curl http://localhost:${PORT}/api/quotes`);
            console.log(`🔌 WebSocket disponible en ws://localhost:${PORT}`);
            console.log(`📍 Test WebSocket desde navegador (F12 > Console):`);
            console.log(`   const ws = new WebSocket('ws://localhost:${PORT}');`);
            console.log(`   ws.onopen = () => console.log('Conectado');`);
            console.log('\n💡 CONFIGURACIÓN REQUERIDA EN .env:');
            console.log('   COMPANY_SINPE_PHONE=8888-8888');
            console.log('   COMPANY_BANK_NAME=Banco de Costa Rica');
            console.log('   COMPANY_ACCOUNT_NUMBER=001-0123456-7');
            console.log('   PAYPAL_CLIENT_ID=tu_paypal_client_id (opcional)');
            console.log('   DB_HOST=localhost');
            console.log('   DB_USER=root');
            console.log('   DB_PASSWORD=Siccosa$742');
            console.log('   DB_NAME=itobox_courier');
        });
        
    } catch (error) {
        console.error('❌ Error iniciando servidor:', error);
        process.exit(1);
    }
}

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Manejo de señales de terminación
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    // Cerrar WebSocket connections antes de terminar
    if (webSocketService.wss) {
        webSocketService.wss.close();
    }
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('\nSIGINT received, shutting down gracefully');
    // Cerrar WebSocket connections antes de terminar
    if (webSocketService.wss) {
        webSocketService.wss.close();
    }
    process.exit(0);
});

// Exportar webSocketService para usar en rutas
app.webSocketService = webSocketService;

startServer();