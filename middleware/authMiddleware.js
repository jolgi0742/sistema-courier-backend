// 🔐 src/middleware/authMiddleware.js - MIDDLEWARE DE AUTENTICACIÓN REAL
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'itobox-courier-secret-key-2025';

// 🔐 MIDDLEWARE DE AUTENTICACIÓN
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Token de autorización requerido'
            });
        }
        
        const token = authHeader.substring(7); // Remover 'Bearer '
        
        // Verificar JWT token
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (jwtError) {
            if (jwtError.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token inválido'
                });
            }
            
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token expirado'
                });
            }
            
            throw jwtError;
        }
        
        // Verificar que el usuario existe y está activo
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE id = ? AND is_active = TRUE',
            [decoded.userId]
        );
        
        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no encontrado o inactivo'
            });
        }
        
        const user = users[0];
        
        // Agregar información del usuario al request
        req.user = {
            userId: user.id,
            email: user.email,
            role: user.role,
            firstName: user.first_name,
            lastName: user.last_name,
            phone: user.phone,
            isActive: user.is_active,
            emailVerified: user.email_verified
        };
        
        // Opcional: Verificar sesión activa
        const tokenHash = require('crypto').createHash('sha256').update(token).digest('hex');
        const [sessions] = await pool.execute(
            'SELECT id FROM user_sessions WHERE user_id = ? AND token_hash = ? AND expires_at > NOW()',
            [user.id, tokenHash]
        );
        
        if (sessions.length === 0) {
            console.log('⚠️ AUTH: Sesión no encontrada o expirada para usuario:', user.email);
            // Comentar las siguientes líneas si no quieres validar sesiones
            // return res.status(401).json({
            //     success: false,
            //     message: 'Sesión expirada'
            // });
        }
        
        next();
        
    } catch (error) {
        console.error('❌ AUTH MIDDLEWARE ERROR:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// 🛡️ MIDDLEWARE PARA VERIFICAR ROLES ESPECÍFICOS
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Autenticación requerida'
            });
        }
        
        const userRoles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
        
        if (!userRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Acceso denegado. Rol requerido: ${userRoles.join(' o ')}`
            });
        }
        
        next();
    };
};

// 👑 MIDDLEWARE SOLO PARA ADMIN
const requireAdmin = requireRole('admin');

// 🚛 MIDDLEWARE PARA ADMIN O COURIER
const requireAdminOrCourier = requireRole(['admin', 'courier']);

// 📦 MIDDLEWARE PARA TODOS LOS ROLES AUTENTICADOS
const requireAuth = authMiddleware;

// 🔓 MIDDLEWARE OPCIONAL (no falla si no hay token)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            req.user = null;
            return next();
        }
        
        const token = authHeader.substring(7);
        
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            
            const [users] = await pool.execute(
                'SELECT * FROM users WHERE id = ? AND is_active = TRUE',
                [decoded.userId]
            );
            
            if (users.length > 0) {
                const user = users[0];
                req.user = {
                    userId: user.id,
                    email: user.email,
                    role: user.role,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    phone: user.phone,
                    isActive: user.is_active,
                    emailVerified: user.email_verified
                };
            } else {
                req.user = null;
            }
        } catch (jwtError) {
            req.user = null;
        }
        
        next();
        
    } catch (error) {
        console.error('❌ OPTIONAL AUTH ERROR:', error);
        req.user = null;
        next();
    }
};

// 🔍 MIDDLEWARE PARA VALIDAR PROPIEDAD DE RECURSOS
const requireOwnership = (resourceField = 'id', userField = 'userId') => {
    return async (req, res, next) => {
        try {
            const resourceId = req.params[resourceField];
            const userId = req.user[userField];
            
            // Los admin pueden acceder a todo
            if (req.user.role === 'admin') {
                return next();
            }
            
            // Verificar propiedad del recurso
            // Este middleware necesita ser personalizado según el recurso
            // Por ahora, permitimos el acceso
            next();
            
        } catch (error) {
            console.error('❌ OWNERSHIP MIDDLEWARE ERROR:', error);
            res.status(500).json({
                success: false,
                message: 'Error verificando permisos'
            });
        }
    };
};

module.exports = {
    authMiddleware,
    requireRole,
    requireAdmin,
    requireAdminOrCourier,
    requireAuth,
    optionalAuth,
    requireOwnership
};