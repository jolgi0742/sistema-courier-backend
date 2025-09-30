// src/models/index.js - ÍNDICE DE MODELOS SIN SEQUELIZE

const Package = require('./Package');
const Courier = require('./Courier');
const Client = require('./Client');
const User = require('./User');
const WHR = require('./whr');

// Función para inicializar todos los modelos
const initializeModels = async () => {
    try {
        console.log('📦 Inicializando modelos del sistema...');
        
        // Verificar que todos los modelos estén disponibles
        const models = {
            Package,
            Courier,
            Client,
            User,
            WHR
        };

        // Verificar estadísticas iniciales
        const packageStats = await Package.getStatistics();
        const courierStats = await Courier.getStatistics();
        const clientStats = await Client.getStatistics();
        const userStats = await User.getStatistics();

        console.log('✅ Modelos inicializados correctamente:');
        console.log(`   📦 Paquetes: ${packageStats.total}`);
        console.log(`   🚛 Couriers: ${courierStats.total}`);
        console.log(`   👥 Clientes: ${clientStats.total}`);
        console.log(`   👤 Usuarios: ${userStats.total}`);

        return models;
    } catch (error) {
        console.error('❌ Error inicializando modelos:', error);
        throw error;
    }
};

// Función para obtener estadísticas generales del sistema
const getSystemStats = async () => {
    try {
        const packageStats = await Package.getStatistics();
        const courierStats = await Courier.getStatistics();
        const clientStats = await Client.getStatistics();
        const userStats = await User.getStatistics();

        return {
            packages: packageStats,
            couriers: courierStats,
            clients: clientStats,
            users: userStats,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error obteniendo estadísticas del sistema:', error);
        return null;
    }
};

// Función para verificar la salud de todos los modelos
const healthCheck = async () => {
    try {
        const checks = {
            Package: false,
            Courier: false,
            Client: false,
            User: false,
            WHR: false
        };

        // Verificar Package
        try {
            await Package.getStatistics();
            checks.Package = true;
        } catch (error) {
            console.error('Health check failed for Package:', error.message);
        }

        // Verificar Courier
        try {
            await Courier.getStatistics();
            checks.Courier = true;
        } catch (error) {
            console.error('Health check failed for Courier:', error.message);
        }

        // Verificar Client
        try {
            await Client.getStatistics();
            checks.Client = true;
        } catch (error) {
            console.error('Health check failed for Client:', error.message);
        }

        // Verificar User
        try {
            await User.getStatistics();
            checks.User = true;
        } catch (error) {
            console.error('Health check failed for User:', error.message);
        }

        // Verificar WHR
        try {
            if (typeof WHR.getStatistics === 'function') {
                await WHR.getStatistics();
            }
            checks.WHR = true;
        } catch (error) {
            console.error('Health check failed for WHR:', error.message);
        }

        const allHealthy = Object.values(checks).every(check => check);
        
        return {
            healthy: allHealthy,
            checks,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Error en health check:', error);
        return {
            healthy: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
};

// Exportar todos los modelos y funciones de utilidad
module.exports = {
    // Modelos principales
    Package,
    Courier,
    Client,
    User,
    WHR,
    
    // Funciones de utilidad
    initializeModels,
    getSystemStats,
    healthCheck
};