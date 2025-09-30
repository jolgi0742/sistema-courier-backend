const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const router = express.Router();

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'itobox-courier-secret-key-2025';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

console.log('=== ARCHIVO AUTH.JS CARGADO EXITOSAMENTE ===');

// Middleware para manejar errores de validacion
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Errores de validacion',
      errors: errors.array()
    });
  }
  next();
};

// Validaciones para login
const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Debe ser un email valido'),
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
];

// LOGIN DIRECTO CON DEBUG COMPLETO
router.post('/login', 
  loginValidation,
  handleValidationErrors,
  async (req, res) => {
    console.log('=== INICIO LOGIN ENDPOINT ===');
    
    try {
        const { email, password } = req.body;

        console.log('STEP 1: DATOS RECIBIDOS');
        console.log('- Email:', email);
        console.log('- Password length:', password ? password.length : 0);
        console.log('- Body completo:', JSON.stringify(req.body, null, 2));

        if (!email || !password) {
            console.log('ERROR: Campos vacios');
            return res.status(400).json({
                success: false,
                message: 'Email y contraseña son requeridos'
            });
        }

        console.log('STEP 2: VERIFICANDO CONEXION BD');
        try {
            const [testResult] = await pool.execute('SELECT 1 as test');
            console.log('BD CONECTADA OK:', testResult[0]);
        } catch (dbError) {
            console.log('BD ERROR:', dbError.message);
            return res.status(500).json({
                success: false,
                message: 'Error de conexion a base de datos'
            });
        }

        console.log('STEP 3: BUSCANDO USUARIO');
        const [users] = await pool.execute(
            'SELECT id, email, password, role, first_name, last_name, name FROM users WHERE email = ?',
            [email]
        );

        console.log('USUARIOS ENCONTRADOS:', users.length);

        if (users.length === 0) {
            console.log('USUARIO NO EXISTE:', email);
            
            // Mostrar usuarios disponibles para debug
            const [allUsers] = await pool.execute('SELECT email, role FROM users LIMIT 5');
            console.log('USUARIOS DISPONIBLES:', allUsers.map(u => u.email + ' (' + u.role + ')'));
            
            return res.status(401).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const user = users[0];
        console.log('STEP 4: USUARIO ENCONTRADO');
        console.log('- ID:', user.id);
        console.log('- Email:', user.email);
        console.log('- Role:', user.role);
        console.log('- Tiene password:', !!user.password);
        console.log('- Password hash inicio:', user.password ? user.password.substring(0, 20) : 'NULL');

        if (!user.password) {
            console.log('ERROR: Usuario sin password en BD');
            return res.status(401).json({
                success: false,
                message: 'Usuario sin contraseña configurada'
            });
        }

        console.log('STEP 5: VERIFICANDO PASSWORD');
        console.log('- Input password:', password);
        console.log('- Hash completo:', user.password);

        const isValidPassword = await bcrypt.compare(password, user.password);
        console.log('- BCRYPT RESULTADO:', isValidPassword);

        if (!isValidPassword) {
            console.log('PASSWORD INCORRECTO');
            
            // Test con password conocido
            const knownHash = '$2a$10$3wRKK7VSAelT2sdioEDF.OEb9l9aPlDuMxMj4kiPRNIwNFqrfEOAu';
            const testKnown = await bcrypt.compare('password123', knownHash);
            console.log('- Test password123 con hash conocido:', testKnown);
            
            const testInput = await bcrypt.compare(password, knownHash);
            console.log('- Test input password con hash conocido:', testInput);
            
            return res.status(401).json({
                success: false,
                message: 'Contraseña incorrecta'
            });
        }

        console.log('STEP 6: PASSWORD CORRECTO - GENERANDO TOKEN');

        const tokenPayload = {
            userId: user.id,
            email: user.email,
            role: user.role,
            firstName: user.first_name || user.name,
            lastName: user.last_name || ''
        };

        console.log('- Token payload:', JSON.stringify(tokenPayload, null, 2));

        const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        console.log('STEP 7: TOKEN GENERADO OK');
        console.log('=== LOGIN EXITOSO PARA:', email, 'ROLE:', user.role, '===');

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

        console.log('STEP 8: ENVIANDO RESPUESTA');
        console.log('Response:', JSON.stringify(response, null, 2));
        
        res.json(response);

    } catch (error) {
        console.log('=== ERROR CRITICO EN LOGIN ===');
        console.log('Error:', error.message);
        console.log('Stack:', error.stack);
        
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            debug: error.message
        });
    }
  }
);

// Otros endpoints basicos
router.post('/register', (req, res) => {
  console.log('Register endpoint llamado');
  res.status(501).json({ success: false, message: 'No implementado' });
});

router.post('/refresh-token', (req, res) => {
  console.log('RefreshToken endpoint llamado');
  res.status(501).json({ success: false, message: 'No implementado' });
});

router.get('/me', (req, res) => {
  console.log('GetCurrentUser endpoint llamado');
  res.status(501).json({ success: false, message: 'No implementado' });
});

router.post('/logout', (req, res) => {
  console.log('Logout endpoint llamado');
  res.json({ success: true, message: 'Logout exitoso' });
});

module.exports = router;