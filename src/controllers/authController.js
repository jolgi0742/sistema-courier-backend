// src/controllers/authController.js - AUTENTICACIÓN REAL CON DEBUG
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'itobox-courier-secret-key-2025';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

class AuthController {
    
    // LOGIN REAL CON DEBUG COMPLETO
    static async login(req, res) {
        try {
            const { email, password } = req.body;
            
            console.log('🔐 INICIO LOGIN - Email:', email);
            console.log('🔐 Password recibido:', password ? '***' : 'VACÍO');
            
            // Validaciones básicas
            if (!email || !password) {
                console.log('❌ Validación falló: campos vacíos');
                return res.status(400).json({
                    success: false,
                    message: 'Email y contraseña son requeridos'
                });
            }
            
            console.log('✅ Validaciones básicas pasadas');
            
            // Verificar conexión a BD
            try {
                console.log('🔍 Intentando conectar a base de datos...');
                const [testResult] = await pool.execute('SELECT 1 as test');
                console.log('✅ Conexión a BD exitosa:', testResult);
            } catch (dbError) {
                console.log('❌ Error de conexión a BD:', dbError.message);
                return res.status(500).json({
                    success: false,
                    message: 'Error de conexión a base de datos'
                });
            }
            
            // Buscar usuario en base de datos
            console.log('🔍 Buscando usuario en BD...');
            const [users] = await pool.execute(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );
            
            console.log('📊 Usuarios encontrados:', users.length);
            
            if (users.length === 0) {
                console.log('❌ Usuario no encontrado:', email);
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
                });
            }
            
            const user = users[0];
            console.log('✅ Usuario encontrado:', {
                id: user.id,
                email: user.email,
                role: user.role,
                hasPassword: !!user.password
            });
            
            // Verificar contraseña
            console.log('🔐 Verificando contraseña...');
            
            // Debug: mostrar hash almacenado (primeros caracteres)
            console.log('🔐 Hash en BD (primeros 10):', user.password ? user.password.substring(0, 10) + '...' : 'NULL');
            
            const isValidPassword = await bcrypt.compare(password, user.password);
            console.log('🔐 Resultado verificación:', isValidPassword);
            
            if (!isValidPassword) {
                console.log('❌ Contraseña incorrecta para:', email);
                return res.status(401).json({
                    success: false,
                    message: 'Credenciales inválidas'
                });
            }
            
            console.log('✅ Contraseña correcta');
            
            // Generar JWT token
            console.log('🎫 Generando JWT token...');
            const tokenPayload = {
                userId: user.id, 
                email: user.email, 
                role: user.role,
                firstName: user.first_name || user.name,
                lastName: user.last_name || ''
            };
            
            console.log('🎫 Payload del token:', tokenPayload);
            
            const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
            
            console.log('✅ Token generado exitosamente');
            console.log('🎉 LOGIN EXITOSO para:', email, 'Rol:', user.role);
            
            const response = {
                success: true,
                message: 'Login exitoso',
                data: {
                    user: {
                        id: user.id,
                        email: user.email,
                        firstName: user.first_name || user.name,
                        lastName: user.last_name || '',
                        role: user.role
                    },
                    token
                }
            };
            
            console.log('📤 Enviando respuesta exitosa');
            res.json(response);
            
        } catch (error) {
            console.error('💥 ERROR CRÍTICO en login:', error);
            console.error('💥 Stack trace:', error.stack);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                debug: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
    
    // Otros métodos placeholder
    static async register(req, res) {
        console.log('📝 Register endpoint llamado');
        res.status(501).json({ success: false, message: 'No implementado' });
    }
    
    static async refreshToken(req, res) {
        console.log('🔄 RefreshToken endpoint llamado');
        res.status(501).json({ success: false, message: 'No implementado' });
    }
    
    static async getCurrentUser(req, res) {
        console.log('👤 GetCurrentUser endpoint llamado');
        res.status(501).json({ success: false, message: 'No implementado' });
    }
    
    static async logout(req, res) {
        console.log('🚪 Logout endpoint llamado');
        res.json({ success: true, message: 'Logout exitoso' });
    }
}

module.exports = AuthController;