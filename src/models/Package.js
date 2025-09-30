// src/models/Package.js - MODELO COMPLETO SIN SEQUELIZE

// Base de datos en memoria para desarrollo
let packages = [
    {
        id: 1,
        tracking_number: 'ITB241216001',
        client_id: 1,
        client_name: 'Juan Pérez',
        client_email: 'juan.perez@email.com',
        client_phone: '+506 8888-9999',
        client_company: 'Empresa Ejemplo S.A.',
        client_business_type: 'Comercial',
        client_address: 'San José, Costa Rica',
        sender_name: 'María González',
        sender_phone: '+506 7777-8888',
        sender_address: 'Cartago, Costa Rica',
        recipient_name: 'Carlos Rodríguez',
        recipient_phone: '+506 6666-7777',
        recipient_address: 'Alajuela, Costa Rica',
        weight: 2.5,
        dimensions: { length: 30, width: 20, height: 15 },
        declared_value: 150.00,
        service_type: 'standard',
        status: 'in_transit',
        courier_id: 1,
        courier_name: 'Roberto Méndez',
        courier_phone: '+506 5555-6666',
        current_location: 'Centro de distribución Alajuela',
        estimated_delivery: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        total_cost: 25.50,
        base_cost: 15.00,
        weight_cost: 3.75,
        service_fee: 2.00,
        taxes: 4.75,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 2,
        tracking_number: 'ITB241216002',
        client_id: 2,
        client_name: 'Ana Morales',
        client_email: 'ana.morales@email.com',
        client_phone: '+506 4444-5555',
        client_company: 'Comercial La Paz',
        client_business_type: 'Retail',
        client_address: 'Heredia, Costa Rica',
        sender_name: 'Luis Vargas',
        sender_phone: '+506 3333-4444',
        sender_address: 'San José Centro',
        recipient_name: 'Patricia Jiménez',
        recipient_phone: '+506 2222-3333',
        recipient_address: 'Puntarenas, Costa Rica',
        weight: 1.2,
        dimensions: { length: 25, width: 15, height: 10 },
        declared_value: 75.00,
        service_type: 'express',
        status: 'pending',
        courier_id: null,
        courier_name: null,
        courier_phone: null,
        current_location: 'Almacén principal',
        estimated_delivery: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        total_cost: 18.75,
        base_cost: 12.00,
        weight_cost: 0.50,
        service_fee: 3.00,
        taxes: 3.25,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 3,
        tracking_number: 'ITB241216003',
        client_id: 1,
        client_name: 'Juan Pérez',
        client_email: 'juan.perez@email.com',
        client_phone: '+506 8888-9999',
        client_company: 'Empresa Ejemplo S.A.',
        client_business_type: 'Comercial',
        client_address: 'San José, Costa Rica',
        sender_name: 'Sandra López',
        sender_phone: '+506 1111-2222',
        sender_address: 'Limón, Costa Rica',
        recipient_name: 'Miguel Castro',
        recipient_phone: '+506 9999-0000',
        recipient_address: 'Guanacaste, Costa Rica',
        weight: 5.0,
        dimensions: { length: 40, width: 30, height: 25 },
        declared_value: 300.00,
        service_type: 'standard',
        status: 'delivered',
        courier_id: 2,
        courier_name: 'Carmen Solís',
        courier_phone: '+506 8888-7777',
        current_location: 'Entregado',
        estimated_delivery: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        actual_delivery: new Date().toISOString(),
        total_cost: 45.00,
        base_cost: 15.00,
        weight_cost: 10.00,
        service_fee: 2.00,
        taxes: 18.00,
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
    }
];

// Eventos de tracking en memoria
let trackingEvents = [
    {
        id: 1,
        package_id: 1,
        event_type: 'created',
        description: 'Paquete creado en el sistema',
        location: 'Almacén principal',
        event_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        performed_by: 'Sistema automático'
    },
    {
        id: 2,
        package_id: 1,
        event_type: 'picked_up',
        description: 'Paquete recolectado del remitente',
        location: 'Cartago, Costa Rica',
        event_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        performed_by: 'Roberto Méndez'
    },
    {
        id: 3,
        package_id: 1,
        event_type: 'in_transit',
        description: 'Paquete en tránsito hacia centro de distribución',
        location: 'Centro de distribución Alajuela',
        event_date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        performed_by: 'Sistema automático'
    },
    {
        id: 4,
        package_id: 3,
        event_type: 'created',
        description: 'Paquete creado en el sistema',
        location: 'Almacén principal',
        event_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        performed_by: 'Sistema automático'
    },
    {
        id: 5,
        package_id: 3,
        event_type: 'delivered',
        description: 'Paquete entregado exitosamente',
        location: 'Guanacaste, Costa Rica',
        event_date: new Date().toISOString(),
        performed_by: 'Carmen Solís'
    }
];

// Contadores para IDs autoincrementales
let packageIdCounter = packages.length + 1;
let eventIdCounter = trackingEvents.length + 1;

class Package {
    // Obtener todos los paquetes con detalles
    static async findAllWithDetails(filters = {}, limit = 20, offset = 0) {
        try {
            let filteredPackages = [...packages];

            // Aplicar filtros
            if (filters.status) {
                filteredPackages = filteredPackages.filter(pkg => pkg.status === filters.status);
            }
            if (filters.clientId) {
                filteredPackages = filteredPackages.filter(pkg => pkg.client_id == filters.clientId);
            }
            if (filters.courierId) {
                filteredPackages = filteredPackages.filter(pkg => pkg.courier_id == filters.courierId);
            }
            if (filters.dateFrom) {
                filteredPackages = filteredPackages.filter(pkg => 
                    new Date(pkg.created_at) >= new Date(filters.dateFrom)
                );
            }
            if (filters.dateTo) {
                filteredPackages = filteredPackages.filter(pkg => 
                    new Date(pkg.created_at) <= new Date(filters.dateTo)
                );
            }

            // Ordenar por fecha de creación (más recientes primero)
            filteredPackages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            // Paginación
            const paginatedPackages = filteredPackages.slice(offset, offset + limit);

            return paginatedPackages;
        } catch (error) {
            console.error('Error en findAllWithDetails:', error);
            return [];
        }
    }

    // Contar paquetes con filtros
    static async count(filters = {}) {
        try {
            let filteredPackages = [...packages];

            if (filters.status) {
                filteredPackages = filteredPackages.filter(pkg => pkg.status === filters.status);
            }
            if (filters.clientId) {
                filteredPackages = filteredPackages.filter(pkg => pkg.client_id == filters.clientId);
            }
            if (filters.courierId) {
                filteredPackages = filteredPackages.filter(pkg => pkg.courier_id == filters.courierId);
            }

            return filteredPackages.length;
        } catch (error) {
            console.error('Error en count:', error);
            return 0;
        }
    }

    // Buscar por número de tracking con detalles completos
    static async findByTrackingNumberWithDetails(trackingNumber) {
        try {
            const pkg = packages.find(pkg => pkg.tracking_number === trackingNumber);
            return pkg || null;
        } catch (error) {
            console.error('Error en findByTrackingNumberWithDetails:', error);
            return null;
        }
    }

    // Obtener historial de tracking
    static async getTrackingHistory(packageId) {
        try {
            return trackingEvents.filter(event => event.package_id == packageId)
                .sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
        } catch (error) {
            console.error('Error en getTrackingHistory:', error);
            return [];
        }
    }

    // Crear nuevo paquete
    static async create(packageData) {
        try {
            const newPackage = {
                id: packageIdCounter++,
                tracking_number: this.generateTrackingNumber(),
                client_id: packageData.clientId || null,
                client_name: packageData.clientName || 'Cliente No Registrado',
                client_email: packageData.clientEmail || '',
                client_phone: packageData.clientPhone || '',
                client_company: packageData.clientCompany || '',
                client_business_type: packageData.clientBusinessType || 'Individual',
                client_address: packageData.clientAddress || '',
                sender_name: packageData.senderName,
                sender_phone: packageData.senderPhone || '',
                sender_address: packageData.senderAddress,
                recipient_name: packageData.recipientName,
                recipient_phone: packageData.recipientPhone || '',
                recipient_address: packageData.recipientAddress,
                weight: packageData.weight,
                dimensions: packageData.dimensions || {},
                declared_value: packageData.declaredValue || 0,
                service_type: packageData.serviceType || 'standard',
                status: 'pending',
                courier_id: null,
                courier_name: null,
                courier_phone: null,
                current_location: 'Almacén principal',
                estimated_delivery: packageData.estimatedDelivery || 
                    new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
                total_cost: packageData.total_cost || 0,
                base_cost: packageData.base_cost || 0,
                weight_cost: packageData.weight_cost || 0,
                service_fee: packageData.service_fee || 0,
                taxes: packageData.taxes || 0,
                delivery_instructions: packageData.deliveryInstructions || '',
                special_handling: packageData.specialHandling || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                created_by: packageData.created_by || null
            };

            packages.push(newPackage);

            // Crear evento inicial de tracking
            await this.createTrackingEvent(
                newPackage.id,
                'created',
                'Almacén principal',
                'Paquete creado y registrado en el sistema',
                packageData.created_by
            );

            return newPackage;
        } catch (error) {
            console.error('Error en create:', error);
            throw error;
        }
    }

    // Buscar por ID
    static async findById(id) {
        try {
            return packages.find(pkg => pkg.id == id) || null;
        } catch (error) {
            console.error('Error en findById:', error);
            return null;
        }
    }

    // Buscar múltiples por IDs
    static async findByIds(ids) {
        try {
            return packages.filter(pkg => ids.includes(pkg.id));
        } catch (error) {
            console.error('Error en findByIds:', error);
            return [];
        }
    }

    // Buscar paquetes por cliente
    static async findByClientId(clientId) {
        try {
            return packages.filter(pkg => pkg.client_id == clientId)
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        } catch (error) {
            console.error('Error en findByClientId:', error);
            return [];
        }
    }

    // Buscar paquetes activos por cliente
    static async findActiveByClientId(clientId) {
        try {
            const activeStatuses = ['pending', 'picked_up', 'in_transit', 'out_for_delivery'];
            return packages.filter(pkg => 
                pkg.client_id == clientId && activeStatuses.includes(pkg.status)
            );
        } catch (error) {
            console.error('Error en findActiveByClientId:', error);
            return [];
        }
    }

    // Buscar paquetes recientes por cliente
    static async findRecentByClientId(clientId, limit = 10) {
        try {
            return packages
                .filter(pkg => pkg.client_id == clientId)
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                .slice(0, limit);
        } catch (error) {
            console.error('Error en findRecentByClientId:', error);
            return [];
        }
    }

    // Buscar paquetes por cliente con filtros
    static async findByClientIdWithFilters(clientId, filters = {}, limit = 20, offset = 0) {
        try {
            let clientPackages = packages.filter(pkg => pkg.client_id == clientId);

            // Aplicar filtros
            if (filters.status) {
                clientPackages = clientPackages.filter(pkg => pkg.status === filters.status);
            }
            if (filters.serviceType) {
                clientPackages = clientPackages.filter(pkg => pkg.service_type === filters.serviceType);
            }
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                clientPackages = clientPackages.filter(pkg =>
                    pkg.tracking_number.toLowerCase().includes(searchTerm) ||
                    pkg.recipient_name.toLowerCase().includes(searchTerm) ||
                    pkg.recipient_address.toLowerCase().includes(searchTerm)
                );
            }
            if (filters.dateFrom) {
                clientPackages = clientPackages.filter(pkg => 
                    new Date(pkg.created_at) >= new Date(filters.dateFrom)
                );
            }
            if (filters.dateTo) {
                clientPackages = clientPackages.filter(pkg => 
                    new Date(pkg.created_at) <= new Date(filters.dateTo)
                );
            }

            // Ordenar por fecha de creación (más recientes primero)
            clientPackages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            // Paginación
            return clientPackages.slice(offset, offset + limit);
        } catch (error) {
            console.error('Error en findByClientIdWithFilters:', error);
            return [];
        }
    }

    // Contar paquetes por cliente
    static async countByClientId(clientId, filters = {}) {
        try {
            let clientPackages = packages.filter(pkg => pkg.client_id == clientId);

            if (filters.status) {
                clientPackages = clientPackages.filter(pkg => pkg.status === filters.status);
            }
            if (filters.serviceType) {
                clientPackages = clientPackages.filter(pkg => pkg.service_type === filters.serviceType);
            }

            return clientPackages.length;
        } catch (error) {
            console.error('Error en countByClientId:', error);
            return 0;
        }
    }

    // Buscar paquetes por courier
    static async findByCourierId(courierId) {
        try {
            return packages.filter(pkg => pkg.courier_id == courierId)
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        } catch (error) {
            console.error('Error en findByCourierId:', error);
            return [];
        }
    }

    // Buscar paquetes disponibles para asignación
    static async findAvailableForAssignment() {
        try {
            return packages.filter(pkg => 
                (pkg.status === 'pending' || pkg.status === 'picked_up') && 
                !pkg.courier_id
            ).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        } catch (error) {
            console.error('Error en findAvailableForAssignment:', error);
            return [];
        }
    }

    // Asignar paquetes a courier
    static async assignToCourier(packageIds, courierId, priority = 'standard') {
        try {
            packageIds.forEach(packageId => {
                const packageIndex = packages.findIndex(pkg => pkg.id == packageId);
                if (packageIndex !== -1) {
                    packages[packageIndex].courier_id = courierId;
                    packages[packageIndex].priority = priority;
                    packages[packageIndex].status = 'assigned_to_courier';
                    packages[packageIndex].updated_at = new Date().toISOString();
                }
            });
            return true;
        } catch (error) {
            console.error('Error en assignToCourier:', error);
            return false;
        }
    }

    // Crear evento de tracking
    static async createTrackingEvent(packageId, eventType, location, description, userId = null) {
        try {
            const newEvent = {
                id: eventIdCounter++,
                package_id: packageId,
                event_type: eventType,
                location: location,
                description: description,
                event_date: new Date().toISOString(),
                performed_by: userId ? `Usuario ${userId}` : 'Sistema automático',
                created_by_user_id: userId
            };

            trackingEvents.push(newEvent);
            return newEvent;
        } catch (error) {
            console.error('Error en createTrackingEvent:', error);
            return null;
        }
    }

    // Generar número de tracking único
    static generateTrackingNumber() {
        const prefix = 'ITB';
        const date = new Date();
        const dateStr = date.getFullYear().toString().slice(-2) + 
                       (date.getMonth() + 1).toString().padStart(2, '0') + 
                       date.getDate().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 999) + 1;
        const trackingNumber = `${prefix}${dateStr}${random.toString().padStart(3, '0')}`;
        
        // Verificar que no exista ya
        if (packages.find(pkg => pkg.tracking_number === trackingNumber)) {
            return this.generateTrackingNumber(); // Recursivo hasta encontrar uno único
        }
        
        return trackingNumber;
    }

    // Obtener estadísticas
    static async getStatistics(clientId = null) {
        try {
            let targetPackages = packages;
            
            if (clientId) {
                targetPackages = packages.filter(pkg => pkg.client_id == clientId);
            }

            const stats = {
                total: targetPackages.length,
                pending: targetPackages.filter(pkg => pkg.status === 'pending').length,
                picked_up: targetPackages.filter(pkg => pkg.status === 'picked_up').length,
                in_transit: targetPackages.filter(pkg => pkg.status === 'in_transit').length,
                out_for_delivery: targetPackages.filter(pkg => pkg.status === 'out_for_delivery').length,
                delivered: targetPackages.filter(pkg => pkg.status === 'delivered').length,
                returned: targetPackages.filter(pkg => pkg.status === 'returned').length,
                avg_weight: targetPackages.length > 0 ? 
                    (targetPackages.reduce((sum, pkg) => sum + pkg.weight, 0) / targetPackages.length).toFixed(2) : 0,
                total_value: targetPackages.reduce((sum, pkg) => sum + pkg.declared_value, 0).toFixed(2),
                total_revenue: targetPackages.reduce((sum, pkg) => sum + pkg.total_cost, 0).toFixed(2)
            };

            return stats;
        } catch (error) {
            console.error('Error en getStatistics:', error);
            return {
                total: 0,
                pending: 0,
                picked_up: 0,
                in_transit: 0,
                out_for_delivery: 0,
                delivered: 0,
                returned: 0,
                avg_weight: 0,
                total_value: 0,
                total_revenue: 0
            };
        }
    }

    // Actualizar estado del paquete
    static async updateStatus(packageId, newStatus, location = null, description = null, userId = null) {
        try {
            const packageIndex = packages.findIndex(pkg => pkg.id == packageId);
            if (packageIndex !== -1) {
                packages[packageIndex].status = newStatus;
                packages[packageIndex].updated_at = new Date().toISOString();
                
                if (location) {
                    packages[packageIndex].current_location = location;
                }
                
                if (newStatus === 'delivered') {
                    packages[packageIndex].actual_delivery = new Date().toISOString();
                }

                // Crear evento de tracking
                await this.createTrackingEvent(
                    packageId,
                    newStatus,
                    location || packages[packageIndex].current_location,
                    description || `Paquete actualizado a estado: ${newStatus}`,
                    userId
                );

                return packages[packageIndex];
            }
            return null;
        } catch (error) {
            console.error('Error en updateStatus:', error);
            return null;
        }
    }

    // Eliminar paquete
    static async delete(packageId) {
        try {
            const packageIndex = packages.findIndex(pkg => pkg.id == packageId);
            if (packageIndex !== -1) {
                packages.splice(packageIndex, 1);
                
                // Eliminar eventos de tracking relacionados
                trackingEvents = trackingEvents.filter(event => event.package_id != packageId);
                
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error en delete:', error);
            return false;
        }
    }
}

module.exports = Package;