// scripts/syncUsersFixed.js
// Script corregido para trabajar con la estructura existente de la tabla users

const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

// Configuración de base de datos local
const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: 'Siccosa$742',
  database: 'itobox_courier',
  port: 3306
};

// Usuarios estándar del sistema (sin campo status)
const SYSTEM_USERS = [
  {
    email: 'admin@itobox.com',
    password: 'password123',
    role: 'admin',
    name: 'Admin Demo'
  },
  {
    email: 'client@itobox.com', 
    password: 'password123',
    role: 'client',
    name: 'Cliente Demo'
  },
  {
    email: 'courier@itobox.com',
    password: 'password123', 
    role: 'courier',
    name: 'Courier Demo'
  },
  {
    email: 'agent@itobox.com',
    password: 'password123',
    role: 'agent', 
    name: 'Agente Demo'
  }
];

/**
 * Crear conexión a base de datos
 */
async function createConnection() {
  try {
    console.log('Conectando a base de datos local...');
    const connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Conexión exitosa');
    return connection;
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    throw error;
  }
}

/**
 * Verificar estructura de tabla users
 */
async function checkTableStructure(connection) {
  try {
    const [columns] = await connection.execute('DESCRIBE users');
    console.log('📋 Estructura de tabla users:');
    columns.forEach(col => {
      console.log(`   - ${col.Field} (${col.Type})`);
    });
    return columns.map(col => col.Field);
  } catch (error) {
    console.error('❌ Error verificando estructura:', error.message);
    throw error;
  }
}

/**
 * Obtener usuarios existentes
 */
async function getExistingUsers(connection) {
  try {
    const [rows] = await connection.execute('SELECT email, role, name FROM users');
    console.log(`👥 Usuarios existentes: ${rows.length}`);
    
    rows.forEach(user => {
      console.log(`   - ${user.email} (${user.role}) - ${user.name}`);
    });
    
    return rows;
  } catch (error) {
    console.error('❌ Error obteniendo usuarios:', error.message);
    return [];
  }
}

/**
 * Hashear password
 */
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

/**
 * Insertar o actualizar usuario (sin campo status)
 */
async function upsertUser(connection, user) {
  try {
    const hashedPassword = await hashPassword(user.password);
    
    // SQL sin campo status
    const insertSQL = `
      INSERT INTO users (email, password, role, name)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        password = VALUES(password),
        role = VALUES(role),
        name = VALUES(name)
    `;
    
    await connection.execute(insertSQL, [
      user.email,
      hashedPassword,
      user.role,
      user.name
    ]);
    
    console.log(`✅ Usuario ${user.email} sincronizado`);
  } catch (error) {
    console.error(`❌ Error insertando ${user.email}:`, error.message);
    throw error;
  }
}

/**
 * Verificar credenciales después de la sincronización
 */
async function verifyCredentials(connection) {
  console.log('\n🔐 === VERIFICANDO CREDENCIALES ===');
  
  for (const user of SYSTEM_USERS) {
    try {
      const [rows] = await connection.execute(
        'SELECT email, password, role FROM users WHERE email = ?',
        [user.email]
      );
      
      if (rows.length > 0) {
        const dbUser = rows[0];
        const isValid = await bcrypt.compare(user.password, dbUser.password);
        console.log(`${isValid ? '✅' : '❌'} ${user.email} - Password ${isValid ? 'VÁLIDO' : 'INVÁLIDO'}`);
      } else {
        console.log(`❌ ${user.email} - NO ENCONTRADO`);
      }
    } catch (error) {
      console.log(`❌ ${user.email} - ERROR: ${error.message}`);
    }
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 SINCRONIZACIÓN DE USUARIOS - VERSIÓN CORREGIDA');
  console.log('==================================================');
  
  let connection = null;
  
  try {
    // Conectar
    connection = await createConnection();
    
    // Verificar estructura de tabla
    const columns = await checkTableStructure(connection);
    
    // Mostrar usuarios existentes
    console.log('\n📊 ESTADO INICIAL:');
    await getExistingUsers(connection);
    
    // Sincronizar usuarios
    console.log(`\n🔧 Sincronizando ${SYSTEM_USERS.length} usuarios del sistema...`);
    
    for (const user of SYSTEM_USERS) {
      await upsertUser(connection, user);
    }
    
    // Verificar resultado
    console.log('\n📊 ESTADO FINAL:');
    await getExistingUsers(connection);
    
    // Verificar credenciales
    await verifyCredentials(connection);
    
    console.log('\n🎉 SINCRONIZACIÓN COMPLETADA EXITOSAMENTE');
    console.log('\n📋 CREDENCIALES PARA LOGIN:');
    console.log('   admin@itobox.com / password123    (Admin completo)');
    console.log('   client@itobox.com / password123   (Portal cliente)');
    console.log('   courier@itobox.com / password123  (Portal courier)');
    console.log('   agent@itobox.com / password123    (Portal agente)');
    
  } catch (error) {
    console.error('💥 Error en sincronización:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Función para resetear passwords si es necesario
async function resetAllPasswords() {
  console.log('🔄 RESETEANDO TODAS LAS CONTRASEÑAS...');
  
  let connection = null;
  
  try {
    connection = await createConnection();
    
    for (const user of SYSTEM_USERS) {
      const hashedPassword = await hashPassword(user.password);
      
      await connection.execute(
        'UPDATE users SET password = ? WHERE email = ?',
        [hashedPassword, user.email]
      );
      
      console.log(`✅ Password actualizado para ${user.email}`);
    }
    
    console.log('✅ Todos los passwords han sido reseteados');
    
  } catch (error) {
    console.error('❌ Error reseteando passwords:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar función principal
if (require.main === module) {
  // Si quiere solo resetear passwords, descomente la siguiente línea:
  // resetAllPasswords();
  
  // Función principal de sincronización:
  main();
}

module.exports = {
  main,
  resetAllPasswords,
  verifyCredentials
};