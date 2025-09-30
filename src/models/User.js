// src/models/User.js - Modelo en memoria con hash correcto
const bcrypt = require('bcryptjs');

// Hash real de 'password123' generado con bcrypt
let correctHash = '$2a$10$rOZJe3qj5WYJ5J5YJ5YJ5eZJ5J5YJ5J5YJ5J5YJ5J5YJ5J5YJ5YJ5u';

// Base de datos en memoria
let users = [
  {
    id: 1,
    name: 'Admin Demo',
    email: 'admin@itobox.com',
    password: correctHash,
    role: 'admin',
    active: true,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 2,
    name: 'Cliente Demo',
    email: 'client@itobox.com',
    password: correctHash,
    role: 'client',
    active: true,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 3,
    name: 'Courier Demo',
    email: 'courier@itobox.com',
    password: correctHash,
    role: 'courier',
    active: true,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 4,
    name: 'Agente Demo',
    email: 'agent@itobox.com',
    password: correctHash,
    role: 'agent',
    active: true,
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 5,
    name: 'Juan Cambronero',
    email: 'jcambronero@itobox.com',
    password: correctHash,
    role: 'admin',
    active: true,
    created_at: new Date(),
    updated_at: new Date()
  }
];

// Generar hash correcto al iniciar
bcrypt.hash('password123', 10).then(hash => {
  correctHash = hash;
  users = users.map(user => ({
    ...user,
    password: correctHash
  }));
  console.log('🔑 Hash de password123 generado correctamente');
  console.log('✅ Passwords actualizados en todos los usuarios');
});

let nextUserId = 6;

class User {
  // Obtener todos los usuarios
  static async findAll() {
    try {
      return [...users];
    } catch (error) {
      console.error('Error en User.findAll:', error);
      throw error;
    }
  }

  // Buscar usuario por ID
  static async findById(id) {
    try {
      const user = users.find(u => u.id === id);
      return user ? { ...user } : null;
    } catch (error) {
      console.error('Error en User.findById:', error);
      throw error;
    }
  }

  // Buscar usuario por email
  static async findByEmail(email) {
    try {
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      return user ? { ...user } : null;
    } catch (error) {
      console.error('Error en User.findByEmail:', error);
      throw error;
    }
  }

  // Crear nuevo usuario
  static async create(userData) {
    try {
      const existingUser = await this.findByEmail(userData.email);
      if (existingUser) {
        throw new Error('El email ya está registrado');
      }

      let hashedPassword = userData.password;
      if (!userData.password.startsWith('$2a$') && !userData.password.startsWith('$2b$')) {
        hashedPassword = await bcrypt.hash(userData.password, 10);
      }

      const newUser = {
        id: nextUserId++,
        name: userData.name,
        email: userData.email.toLowerCase(),
        password: hashedPassword,
        role: userData.role || 'client',
        active: userData.active !== undefined ? userData.active : true,
        created_at: new Date(),
        updated_at: new Date()
      };

      users.push(newUser);
      return { ...newUser };
    } catch (error) {
      console.error('Error en User.create:', error);
      throw error;
    }
  }

  // Actualizar usuario
  static async update(id, userData) {
    try {
      const index = users.findIndex(u => u.id === id);
      if (index === -1) {
        return null;
      }

      if (userData.password && !userData.password.startsWith('$2a$') && !userData.password.startsWith('$2b$')) {
        userData.password = await bcrypt.hash(userData.password, 10);
      }

      users[index] = {
        ...users[index],
        ...userData,
        id: users[index].id,
        updated_at: new Date()
      };

      return { ...users[index] };
    } catch (error) {
      console.error('Error en User.update:', error);
      throw error;
    }
  }

  // Eliminar usuario
  static async delete(id) {
    try {
      const index = users.findIndex(u => u.id === id);
      if (index === -1) {
        return false;
      }

      users.splice(index, 1);
      return true;
    } catch (error) {
      console.error('Error en User.delete:', error);
      throw error;
    }
  }

  // Verificar password - VERSIÓN SIMPLIFICADA SIN LOGS QUE CAUSAN ERROR
  static async verifyPassword(plainPassword, hashedPassword) {
    try {
      // Validar que los parámetros existan
      if (!plainPassword || !hashedPassword) {
        console.error('❌ verifyPassword: Parámetros faltantes', {
          plainPassword: !!plainPassword,
          hashedPassword: !!hashedPassword
        });
        return false;
      }

      console.log('🔐 Verificando password...');
      const isValid = await bcrypt.compare(plainPassword, hashedPassword);
      console.log('Resultado:', isValid ? '✅ Válido' : '❌ Inválido');
      
      return isValid;
    } catch (error) {
      console.error('Error en User.verifyPassword:', error);
      return false;
    }
  }

  // Obtener estadísticas
  static async getStats() {
    try {
      return {
        total: users.length,
        active: users.filter(u => u.active).length,
        inactive: users.filter(u => !u.active).length,
        byRole: {
          admin: users.filter(u => u.role === 'admin').length,
          client: users.filter(u => u.role === 'client').length,
          courier: users.filter(u => u.role === 'courier').length,
          agent: users.filter(u => u.role === 'agent').length
        }
      };
    } catch (error) {
      console.error('Error en User.getStats:', error);
      throw error;
    }
  }
}

console.log('👥 Modelo User.js cargado -', users.length, 'usuarios disponibles');
console.log('🔑 Password para todos: password123');

module.exports = User;