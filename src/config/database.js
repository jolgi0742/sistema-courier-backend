// itobox-backend/src/config/database.js - CONFIGURACIÓN CORREGIDA
require('dotenv').config();
const mysql = require('mysql2/promise');

// Configuración sin opciones inválidas
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'itobox_courier',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
    // Removidas: acquireTimeout, timeout, reconnect (causan warnings)
};

let pool;

try {
    pool = mysql.createPool(dbConfig);
    console.log('✅ Pool de conexiones MySQL creado');
} catch (error) {
    console.error('❌ Error creando pool MySQL:', error.message);
    // Crear pool mock para evitar errores
    pool = {
        async getConnection() {
            throw new Error('MySQL no disponible');
        },
        async execute() {
            throw new Error('MySQL no disponible');
        }
    };
}

// Función para verificar conexión
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conexión a MySQL exitosa');
        connection.release();
        return true;
    } catch (error) {
        console.log('⚠️ MySQL no disponible, usando modo mock:', error.message);
        return false;
    }
}

module.exports = { pool, testConnection };
};