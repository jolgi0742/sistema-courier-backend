// C:\Sistema-Courier\backend\src\services\websocketService.js
const WebSocket = require('ws');

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // userId -> websocket
    this.packageSubscriptions = new Map(); // packageId -> Set(userIds)
  }

  initialize(server) {
    console.log('🚀 Inicializando WebSocket Service...');
    
    try {
      this.wss = new WebSocket.Server({ 
        server,
        path: '/ws'
      });

      this.wss.on('connection', (ws, req) => {
        console.log('📱 Nueva conexión WebSocket establecida');
        
        // Configurar propiedades iniciales
        ws.isAlive = true;
        ws.authenticated = false;
        ws.userId = null;
        ws.role = null;

        // Configurar ping/pong
        ws.on('pong', () => {
          ws.isAlive = true;
        });

        ws.on('message', (message) => {
          try {
            const data = JSON.parse(message);
            console.log('📨 Mensaje recibido:', data);
            this.handleMessage(ws, data);
          } catch (error) {
            console.error('❌ Error parseando mensaje:', error);
            this.sendError(ws, 'Formato de mensaje inválido');
          }
        });

        ws.on('close', () => {
          console.log('📱 Cliente WebSocket desconectado');
          this.handleDisconnection(ws);
        });

        ws.on('error', (error) => {
          console.error('❌ Error en WebSocket:', error);
        });

        // Mensaje de bienvenida
        this.sendMessage(ws, {
          type: 'welcome',
          message: 'Conectado al sistema ITOBOX Courier',
          timestamp: new Date().toISOString()
        });
      });

      // Configurar heartbeat
      this.setupHeartbeat();

      console.log('✅ WebSocket Service inicializado correctamente');
      console.log('🔗 WebSocket disponible en /ws');

    } catch (error) {
      console.error('❌ Error inicializando WebSocket:', error);
    }
  }

  handleMessage(ws, data) {
    switch (data.type) {
      case 'authenticate':
        this.authenticateClient(ws, data);
        break;
      
      case 'subscribe_package':
        if (!ws.authenticated) {
          return this.sendError(ws, 'Cliente no autenticado');
        }
        this.subscribeToPackage(ws, data.packageId);
        break;
      
      case 'unsubscribe_package':
        if (!ws.authenticated) {
          return this.sendError(ws, 'Cliente no autenticado');
        }
        this.unsubscribeFromPackage(ws, data.packageId);
        break;
      
      case 'update_location':
        if (!ws.authenticated) {
          return this.sendError(ws, 'Cliente no autenticado');
        }
        this.updateCourierLocation(ws, data);
        break;
      
      case 'ping':
        this.sendMessage(ws, { type: 'pong', timestamp: new Date().toISOString() });
        break;
      
      case 'test':
        this.sendMessage(ws, {
          type: 'echo',
          original: data,
          message: 'Echo del servidor',
          timestamp: new Date().toISOString()
        });
        break;
      
      default:
        console.log('⚠️ Tipo de mensaje no reconocido:', data.type);
        this.sendError(ws, `Tipo de mensaje no reconocido: ${data.type}`);
    }
  }

  authenticateClient(ws, data) {
    const { userId, role, token } = data;
    
    // Aquí podrías validar el JWT token si necesario
    // Por ahora, aceptamos la autenticación básica
    
    if (!userId || !role) {
      return this.sendError(ws, 'Datos de autenticación incompletos');
    }

    // Configurar cliente
    ws.userId = userId;
    ws.role = role;
    ws.authenticated = true;
    
    // Registrar cliente (remover conexión anterior si existe)
    if (this.clients.has(userId)) {
      const oldWs = this.clients.get(userId);
      if (oldWs && oldWs.readyState === WebSocket.OPEN) {
        oldWs.close();
      }
    }
    this.clients.set(userId, ws);
    
    console.log(`✅ Cliente autenticado: ${userId} (${role})`);
    
    this.sendMessage(ws, {
      type: 'authenticated',
      status: 'success',
      userId: userId,
      role: role,
      timestamp: new Date().toISOString(),
      message: `Autenticado como ${role}`
    });

    // Enviar estadísticas iniciales
    this.sendMessage(ws, {
      type: 'stats',
      connectedClients: this.clients.size,
      activeSubscriptions: this.packageSubscriptions.size,
      timestamp: new Date().toISOString()
    });
  }

  subscribeToPackage(ws, packageId) {
    if (!packageId) {
      return this.sendError(ws, 'Package ID requerido');
    }

    // Crear suscripción
    if (!this.packageSubscriptions.has(packageId)) {
      this.packageSubscriptions.set(packageId, new Set());
    }
    
    this.packageSubscriptions.get(packageId).add(ws.userId);
    
    console.log(`📦 Cliente ${ws.userId} suscrito a paquete ${packageId}`);
    
    this.sendMessage(ws, {
      type: 'subscribed',
      packageId: packageId,
      message: `Suscrito a actualizaciones del paquete ${packageId}`,
      timestamp: new Date().toISOString()
    });

    // Simular envío de datos iniciales del paquete
    setTimeout(() => {
      this.sendMessage(ws, {
        type: 'package_update',
        packageId: packageId,
        status: 'in_transit',
        message: `Datos iniciales del paquete ${packageId}`,
        timestamp: new Date().toISOString()
      });
    }, 1000);
  }

  unsubscribeFromPackage(ws, packageId) {
    if (this.packageSubscriptions.has(packageId)) {
      this.packageSubscriptions.get(packageId).delete(ws.userId);
      
      // Limpiar si no hay más suscriptores
      if (this.packageSubscriptions.get(packageId).size === 0) {
        this.packageSubscriptions.delete(packageId);
      }
    }
    
    console.log(`📦 Cliente ${ws.userId} desuscrito del paquete ${packageId}`);
    
    this.sendMessage(ws, {
      type: 'unsubscribed',
      packageId: packageId,
      timestamp: new Date().toISOString()
    });
  }

  updateCourierLocation(ws, data) {
    if (ws.role !== 'courier' && ws.role !== 'admin') {
      return this.sendError(ws, 'Solo los couriers pueden actualizar ubicación');
    }

    const { latitude, longitude, packageId } = data;
    
    if (!latitude || !longitude) {
      return this.sendError(ws, 'Coordenadas incompletas');
    }

    const locationData = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      timestamp: new Date().toISOString()
    };

    console.log(`📍 Ubicación actualizada para ${ws.role} ${ws.userId}:`, locationData);
    
    // Broadcast a todos los suscriptores del paquete
    if (packageId && this.packageSubscriptions.has(packageId)) {
      const updateData = {
        type: 'location_update',
        packageId: packageId,
        courierId: ws.userId,
        location: locationData,
        message: `Ubicación actualizada por courier ${ws.userId}`,
        timestamp: new Date().toISOString()
      };

      this.broadcastToPackageSubscribers(packageId, updateData);
    } else {
      // Enviar confirmación al emisor
      this.sendMessage(ws, {
        type: 'location_received',
        location: locationData,
        message: 'Ubicación recibida correctamente',
        timestamp: new Date().toISOString()
      });
    }
  }

  // Métodos de broadcast
  broadcastToPackageSubscribers(packageId, message) {
    if (!this.packageSubscriptions.has(packageId)) {
      return;
    }

    const subscribers = this.packageSubscriptions.get(packageId);
    console.log(`📢 Broadcasting a ${subscribers.size} suscriptores del paquete ${packageId}`);

    subscribers.forEach(userId => {
      const client = this.clients.get(userId);
      if (client && client.readyState === WebSocket.OPEN) {
        this.sendMessage(client, message);
      }
    });
  }

  broadcastToAll(message) {
    console.log(`📢 Broadcasting a ${this.clients.size} clientes`);
    
    this.clients.forEach((client, userId) => {
      if (client.readyState === WebSocket.OPEN) {
        this.sendMessage(client, message);
      }
    });
  }

  // Métodos de utilidad
  sendMessage(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  sendError(ws, error) {
    this.sendMessage(ws, {
      type: 'error',
      message: error,
      timestamp: new Date().toISOString()
    });
  }

  handleDisconnection(ws) {
    if (ws.userId) {
      // Remover de clientes registrados
      this.clients.delete(ws.userId);
      
      // Remover de todas las suscripciones
      this.packageSubscriptions.forEach((subscribers, packageId) => {
        subscribers.delete(ws.userId);
        if (subscribers.size === 0) {
          this.packageSubscriptions.delete(packageId);
        }
      });
      
      console.log(`📱 Cliente ${ws.userId} (${ws.role}) desconectado y limpiado`);
    }
  }

  setupHeartbeat() {
    const interval = setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (ws.isAlive === false) {
          console.log('💀 Terminando conexión muerta');
          return ws.terminate();
        }
        
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // Cada 30 segundos

    this.wss.on('close', () => {
      clearInterval(interval);
    });
  }

  // Métodos públicos para uso externo
  notifyPackageStatusChange(packageId, status, details = {}) {
    this.broadcastToPackageSubscribers(packageId, {
      type: 'package_update',
      packageId: packageId,
      status: status,
      timestamp: new Date().toISOString(),
      ...details
    });
  }

  getConnectedClients() {
    return {
      total: this.clients.size,
      subscriptions: this.packageSubscriptions.size,
      clients: Array.from(this.clients.entries()).map(([userId, ws]) => ({
        userId,
        role: ws.role,
        authenticated: ws.authenticated,
        connected: ws.readyState === WebSocket.OPEN
      }))
    };
  }
}

// Crear instancia única
const webSocketService = new WebSocketService();

module.exports = webSocketService;