// src/models/User.js - MODELO SIMPLIFICADO CON CREDENCIALES UNIFICADAS

const bcrypt = require('bcryptjs');

// Base de datos en memoria con credenciales unificadas password123
let users = [
    {
        id: 1,
        email: 'admin@itobox.com',
        password_hash: bcrypt.hashSync('password123', 12),
        first_name: 'Administrador',
        last_name: 'Sistema',
        role: 'admin',
        phone: '+506 2222-3333',
        address: 'San José, Costa Rica',
        is_active: true,
        email_verified: true,
        created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 2,
        email: 'client@itobox.com',
        password_hash: bcrypt.hashSync('password123', 12),
        first_name: 'Cliente',
        last_name: 'Demo',
        role: 'client',
        phone: '+506 3333-4444',
        address: 'Heredia, Costa Rica',
        is_active: true,
        email_verified: true,
        created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 3,
        email: 'courier@itobox.com',
        password_hash: bcrypt.hashSync('password123', 12),
        first_name: 'Courier',
        last_name: 'Demo',
        role: 'courier',
        phone: '+506 4444-5555',
        address: 'Alajuela, Costa Rica',
        is_active: true,
        email_verified: true,
        created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 4,
        email: 'agent@itobox.com',
        password_hash: bcrypt.hashSync('password123', 12),
        first_name: 'Agente',
        last_name: 'Demo',
        role: 'agent',
        phone: '+506 5555-6666',
        address: 'Cartago, Costa Rica',
        is_active: true,
        email_verified: true,
        created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
    }
];

let userIdCounter = users.length + 1;

class User {
    // Crear nuevo usuario
    static async create(userData) {
        const { email, password, firstName, lastName, role = 'client', phone, address } = userData;

        try {
            // Verificar si el email ya existe
            if (users.find(user => user.email === email)) {
                throw new Error('El email ya está registrado');
            }

            // Hash password
            const passwordHash = await bcrypt.hash(password, 12);

            const newUser = {
                id: userIdCounter++,
                email,
                password_hash: passwordHash,
                first_name: firstName,
                last_name: lastName,
                role,
                phone: phone || null,
                address: address || null,
                is_active: true,
                email_verified: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            users.push(newUser);

            // Retornar usuario sin password
            const { password_hash, ...userWithoutPassword } = newUser;
            return userWithoutPassword;

        } catch (error) {
            throw error;
        }
    }

    // Buscar usuario por email
    static async findByEmail(email) {
        return users.find(user => user.email === email && user.is_active) || null;
    }

    // Buscar usuario por ID
    static async findById(id) {
        const user = users.find(user => user.id == id && user.is_active);
        if (user) {
            // Retornar sin password
            const { password_hash, ...userWithoutPassword } = user;
            return userWithoutPassword;
        }
        return null;
    }

    // Verificar contraseña
    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    // Actualizar perfil
    static async updateProfile(userId, updateData) {
        const { firstName, lastName, phone, address } = updateData;

        const userIndex = users.findIndex(user => user.id == userId);
        if (userIndex !== -1) {
            users[userIndex] = {
                ...users[userIndex],
                first_name: firstName || users[userIndex].first_name,
                last_name: lastName || users[userIndex].last_name,
                phone: phone || users[userIndex].phone,
                address: address || users[userIndex].address,
                updated_at: new Date().toISOString()
            };

            return await this.findById(userId);
        }

        return null;
    }

    // Obtener todos los usuarios (para debug)
    static async getAllUsers() {
        return users.map(user => {
            const { password_hash, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });
    }

    // Obtener estadísticas de usuarios
    static async getStatistics() {
        const activeUsers = users.filter(u => u.is_active);
        const total = activeUsers.length;
        const admins = activeUsers.filter(u => u.role === 'admin').length;
        const clients = activeUsers.filter(u => u.role === 'client').length;
        const couriers = activeUsers.filter(u => u.role === 'courier').length;
        const agents = activeUsers.filter(u => u.role === 'agent').length;
        const verified = activeUsers.filter(u => u.email_verified).length;

        return {
            total,
            admins,
            clients,
            couriers,
            agents,
            verified,
            unverified: total - verified,
            verificationRate: total > 0 ? Math.round((verified / total) * 100) : 0
        };
    }
}

// Log de usuarios disponibles al cargar el modelo
console.log('===== USUARIOS DISPONIBLES =====');
console.log('admin@itobox.com / password123 (Admin)');
console.log('client@itobox.com / password123 (Cliente)');
console.log('courier@itobox.com / password123 (Courier)');
console.log('agent@itobox.com / password123 (Agente)');
console.log('==================================');

module.exports = User;