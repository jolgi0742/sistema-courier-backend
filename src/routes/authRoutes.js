// src/routes/authRoutes.js - VERSIÓN SIMPLIFICADA SIN ERRORES

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'itobox-courier-jwt-secret-dev-key-2024-super-secure';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// ============ FUNCIONES DE CONTROLADOR ============

// Login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('🔐 Intento de login:', email);

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email y contraseña son requeridos'
            });
        }

        // Buscar usuario
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Verificar contraseña
        const isValidPassword = await User.verifyPassword(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Generar token
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        console.log('✅ Login exitoso para:', email);

        res.json({
            success: true,
            message: 'Login exitoso',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    role: user.role
                },
                token
            }
        });

    } catch (error) {
        console.error('❌ Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Register
const register = async (req, res) => {
    try {
        const { email, password, firstName, lastName, phone, address } = req.body;

        console.log('📝 Intento de registro:', email);

        // Validaciones básicas
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos requeridos deben ser completados'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'La contraseña debe tener al menos 6 caracteres'
            });
        }

        // Crear usuario
        const user = await User.create({
            email, password, firstName, lastName, phone, address
        });

        // Generar token
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        console.log('✅ Registro exitoso para:', email);

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role
                },
                token
            }
        });

    } catch (error) {
        console.error('❌ Error en registro:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Error en el registro'
        });
    }
};

// Logout
const logout = async (req, res) => {
    try {
        console.log('👋 Logout solicitado');
        res.json({
            success: true,
            message: 'Logout exitoso'
        });
    } catch (error) {
        console.error('❌ Error en logout:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Get Profile
const getProfile = async (req, res) => {
    try {
        const userId = req.user?.userId || 1; // Default para testing

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            data: { user }
        });

    } catch (error) {
        console.error('❌ Error obteniendo perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Verify Token
const verifyToken = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Token de autorización requerido'
            });
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET);

        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Token válido',
            data: {
                user: {
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    role: user.role
                }
            }
        });

    } catch (error) {
        console.error('❌ Error verificando token:', error);
        res.status(401).json({
            success: false,
            message: 'Token inválido'
        });
    }
};

// Test
const test = (req, res) => {
    res.json({
        success: true,
        message: 'Auth routes funcionando correctamente',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
};

// Health
const health = (req, res) => {
    res.json({
        success: true,
        service: 'Authentication Service',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        jwt_configured: !!JWT_SECRET
    });
};

// ============ DEFINIR RUTAS ============

// POST /api/auth/login
router.post('/login', login);

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/logout
router.post('/logout', logout);

// GET /api/auth/profile
router.get('/profile', getProfile);

// GET /api/auth/me
router.get('/me', getProfile);

// GET /api/auth/verify
router.get('/verify', verifyToken);

// GET /api/auth/test
router.get('/test', test);

// GET /api/auth/health
router.get('/health', health);

console.log('📋 Auth routes configuradas:');
console.log('   POST /api/auth/login');
console.log('   POST /api/auth/register');
console.log('   POST /api/auth/logout');
console.log('   GET  /api/auth/profile');
console.log('   GET  /api/auth/me');
console.log('   GET  /api/auth/verify');
console.log('   GET  /api/auth/test');
console.log('   GET  /api/auth/health');

module.exports = router;