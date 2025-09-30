// scripts/syncUsers.js
// Script para sincronizar usuarios entre entorno local y producción

const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

// Configuraciones de base de datos
const DB_CONFIGS = {
  local: {
    host: 'localhost',
    user: 'root',
    password: 'Siccosa$742',
    database: 'itobox_courier',
    port: 3306
  },
  production: {
    // Configurar con los datos de su BD en producción
    // Por ejemplo, si usa PlanetScale o Railway
    host: 'aws.connect.psdb.cloud',
    user: 'username',
    password: 'password',
    database: 'itobox_courier',
    port: 3306,
    ssl: {
      rejectUnauthorized: false
    }
  }
};

// Usuarios estándar del sistema
const SYSTEM_USERS = [
  {
    email: 'admin@itobox.com',
    password: 'password123',
    role: 'admin',
    name: 'Admin Demo',
    phone: '+506 2000-0000',
    status: 'active'
  },
  {
    email: 'client@itobox.com', 
    password: 'password123',
    role: 'client',
    name: 'Cliente Demo',
    phone: '+506 8888-7777',
    status: 'active'
  },
  {
    email: 'courier@itobox.com',
    password: 'password123', 
    role: 'courier',
    name: 'Courier Demo',
    phone: '+506 7777-6666',
    status: 'active'
  },
  {
    email: 'agent@itobox.com',
    password: 'password123',
    role: 'agent', 
    name: 'Agente Demo',
    phone: '+506 6666-5555',
    status: 'active'
  }
];

/**
 * Crear conexión a base de datos
 */
async function createConnection(environment) {
  try {
    const config = DB_CONFIGS[environment];
    console.log(`Conectando a base de datos ${environment}...`);
    
    const connection = await mysql.createConnection(config);
    console.log(`✅ Conexión exitosa a ${environment}`);
    return connection;
  } catch (error) {
    console.error(`❌ Error conectando a ${environment}:`, error.message);
    throw error;
  }
}

/**
 * Verificar si existe tabla users
 */
async function checkUsersTable(connection, environment) {
  try {
    const [rows] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'users'
    `);
    
    const tableExists = rows[0].count > 0;
    console.log(`📋 Tabla users en ${environment}: ${tableExists ? 'EXISTE' : 'NO EXISTE'}`);
    
    if (!tableExists) {
      console.log(`🔧 Creando tabla users en ${environment}...`);
      await createUsersTable(connection);
    }
    
    return tableExists;
  } catch (error) {
    console.error(`❌ Error verificando tabla en ${environment}:`, error.message);
    throw error;
  }
}

/**
 * Crear tabla users si no existe
 */
async function createUsersTable(connection) {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('admin', 'client', 'courier', 'agent') NOT NULL,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      status ENUM('active', 'inactive') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `;
  
  await connection.execute(createTableSQL);
  console.log('✅ Tabla users creada exitosamente');
}

/**
 * Obtener usuarios existentes
 */
async function getExistingUsers(connection, environment) {
  try {
    const [rows] = await connection.execute('SELECT email, role, name FROM users');
    console.log(`👥 Usuarios existentes en ${environment}: ${rows.length}`);
    
    rows.forEach(user => {
      console.log(`   - ${user.email} (${user.role}) - ${user.name}`);
    });
    
    return rows;
  } catch (error) {
    console.error(`❌ Error obteniendo usuarios de ${environment}:`, error.message);
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
 * Insertar o actualizar usuario
 */
async function upsertUser(connection, user, environment) {
  try {
    const hashedPassword = await hashPassword(user.password);
    
    const insertSQL = `
      INSERT INTO users (email, password, role, name, phone, status)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        password = VALUES(password),
        role = VALUES(role),
        name = VALUES(name),
        phone = VALUES(phone),
        status = VALUES(status),
        updated_at = CURRENT_TIMESTAMP
    `;
    
    await connection.execute(insertSQL, [
      user.email,
      hashedPassword,
      user.role,
      user.name,
      user.phone,
      user.status
    ]);
    
    console.log(`✅ Usuario ${user.email} sincronizado en ${environment}`);
  } catch (error) {
    console.error(`❌ Error insertando ${user.email} en ${environment}:`, error.message);
    throw error;
  }
}

/**
 * Sincronizar usuarios en un entorno
 */
async function syncUsersToEnvironment(environment) {
  let connection = null;
  
  try {
    console.log(`\n🔄 === SINCRONIZANDO ${environment.toUpperCase()} ===`);
    
    // Conectar
    connection = await createConnection(environment);
    
    // Verificar/crear tabla
    await checkUsersTable(connection, environment);
    
    // Mostrar usuarios existentes
    await getExistingUsers(connection, environment);
    
    // Sincronizar cada usuario del sistema
    console.log(`\n🔧 Sincronizando ${SYSTEM_USERS.length} usuarios del sistema...`);
    
    for (const user of SYSTEM_USERS) {
      await upsertUser(connection, user, environment);
    }
    
    // Verificar resultado
    console.log(`\n📊 Resultado final en ${environment}:`);
    await getExistingUsers(connection, environment);
    
    console.log(`✅ Sincronización completa en ${environment}`);
    
  } catch (error) {
    console.error(`❌ Error en sincronización de ${environment}:`, error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log(`🔌 Conexión cerrada para ${environment}`);
    }
  }
}

/**
 * Verificar credenciales después de la sincronización
 */
async function verifyCredentials(environment) {
  let connection = null;
  
  try {
    console.log(`\n🔐 === VERIFICANDO CREDENCIALES EN ${environment.toUpperCase()} ===`);
    
    connection = await createConnection(environment);
    
    for (const user of SYSTEM_USERS) {
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
    }
    
  } catch (error) {
    console.error(`❌ Error verificando credenciales en ${environment}:`, error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 INICIANDO SINCRONIZACIÓN DE USUARIOS - ITOBOX COURIER');
  console.log('============================================================');
  
  try {
    // Sincronizar local
    await syncUsersToEnvironment('local');
    
    // Verificar credenciales locales
    await verifyCredentials('local');
    
    // Preguntar si sincronizar producción
    console.log('\n⚠️  IMPORTANTE: Para sincronizar producción, actualice DB_CONFIGS.production con sus datos reales');
    console.log('   Luego descomente las siguientes líneas:\n');
    
    // Descomentar estas líneas cuando tenga configuración de producción:
    // await syncUsersToEnvironment('production');
    // await verifyCredentials('production');
    
    console.log('\n🎉 SINCRONIZACIÓN COMPLETADA');
    console.log('\n📋 CREDENCIALES FINALES:');
    console.log('   admin@itobox.com / password123');
    console.log('   client@itobox.com / password123');
    console.log('   courier@itobox.com / password123');
    console.log('   agent@itobox.com / password123');
    
  } catch (error) {
    console.error('💥 Error en sincronización:', error.message);
    process.exit(1);
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = {
  syncUsersToEnvironment,
  verifyCredentials,
  SYSTEM_USERS
};