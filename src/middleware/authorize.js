// itobox-backend/src/middleware/authorize.js - MIDDLEWARE FALTANTE
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'itobox-courier-secret-key';

// Middleware básico de autorización
const authorize = (roles = []) => {
    return (req, res, next) => {
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
            
            // Si se especifican roles, verificar
            if (roles.length > 0 && !roles.includes(decoded.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para acceder a este recurso'
                });
            }
            
            req.user = decoded;
            next();
            
        } catch (error) {
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token inválido'
                });
            }
            
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({
                    success: false,
                    message: 'Token expirado'
                });
            }
            
            return res.status(500).json({
                success: false,
                message: 'Error de autorización'
            });
        }
    };
};

// Middleware opcional (permite acceso sin token)
const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
        }
        
        next();
        
    } catch (error) {
        // Ignorar errores de token en auth opcional
        next();
    }
};

module.exports = authorize;
module.exports.optionalAuth = optionalAuth;