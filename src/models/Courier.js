// src/models/Courier.js - MODELO DE COURIERS EN MEMORIA

// Base de datos en memoria para couriers
let couriers = [
    {
        id: 1,
        name: 'Carlos Rodríguez',
        email: 'carlos.courier@itobox.com',
        phone: '+506 8888-1111',
        license_number: 'LIC-001-CR',
        vehicle_type: 'motorcycle',
        vehicle_plate: 'MOTO-123',
        zone: 'San José Centro',
        status: 'disponible',
        rating: 4.8,
        total_deliveries: 156,
        is_active: true,
        location: {
            lat: 9.9281,
            lng: -84.0907,
            address: 'San José, Costa Rica'
        },
        created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 2,
        name: 'María González',
        email: 'maria.courier@itobox.com',
        phone: '+506 8888-2222',
        license_number: 'LIC-002-CR',
        vehicle_type: 'car',
        vehicle_plate: 'CAR-456',
        zone: 'Cartago',
        status: 'ocupado',
        rating: 4.9,
        total_deliveries: 203,
        is_active: true,
        location: {
            lat: 9.8644,
            lng: -83.9186,
            address: 'Cartago, Costa Rica'
        },
        created_at: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 3,
        name: 'José Morales',
        email: 'jose.courier@itobox.com',
        phone: '+506 8888-3333',
        license_number: 'LIC-003-CR',
        vehicle_type: 'bike',
        vehicle_plate: 'BIKE-789',
        zone: 'Heredia',
        status: 'disponible',
        rating: 4.7,
        total_deliveries: 89,
        is_active: true,
        location: {
            lat: 9.9980,
            lng: -84.1205,
            address: 'Heredia, Costa Rica'
        },
        created_at: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 4,
        name: 'Ana Jiménez',
        email: 'ana.courier@itobox.com',
        phone: '+506 8888-4444',
        license_number: 'LIC-004-CR',
        vehicle_type: 'van',
        vehicle_plate: 'VAN-101',
        zone: 'Alajuela',
        status: 'disponible',
        rating: 4.6,
        total_deliveries: 134,
        is_active: true,
        location: {
            lat: 10.0162,
            lng: -84.2119,
            address: 'Alajuela, Costa Rica'
        },
        created_at: new Date(Date.now() - 250 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 5,
        name: 'Roberto Castro',
        email: 'roberto.courier@itobox.com',
        phone: '+506 8888-5555',
        license_number: 'LIC-005-CR',
        vehicle_type: 'motorcycle',
        vehicle_plate: 'MOTO-202',
        zone: 'Puntarenas',
        status: 'offline',
        rating: 4.5,
        total_deliveries: 78,
        is_active: true,
        location: {
            lat: 9.9763,
            lng: -84.8353,
            address: 'Puntarenas, Costa Rica'
        },
        created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 6,
        name: 'Patricia Vargas',
        email: 'patricia.courier@itobox.com',
        phone: '+506 8888-6666',
        license_number: 'LIC-006-CR',
        vehicle_type: 'car',
        vehicle_plate: 'CAR-303',
        zone: 'Limón',
        status: 'disponible',
        rating: 4.8,
        total_deliveries: 112,
        is_active: true,
        location: {
            lat: 9.9914,
            lng: -83.0353,
            address: 'Limón, Costa Rica'
        },
        created_at: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 7,
        name: 'Miguel Solano',
        email: 'miguel.courier@itobox.com',
        phone: '+506 8888-7777',
        license_number: 'LIC-007-CR',
        vehicle_type: 'motorcycle',
        vehicle_plate: 'MOTO-404',
        zone: 'Guanacaste',
        status: 'ocupado',
        rating: 4.4,
        total_deliveries: 67,
        is_active: true,
        location: {
            lat: 10.4577,
            lng: -85.6557,
            address: 'Guanacaste, Costa Rica'
        },
        created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 8,
        name: 'Laura Pérez',
        email: 'laura.courier@itobox.com',
        phone: '+506 8888-8888',
        license_number: 'LIC-008-CR',
        vehicle_type: 'bike',
        vehicle_plate: 'BIKE-505',
        zone: 'San José Este',
        status: 'disponible',
        rating: 4.9,
        total_deliveries: 145,
        is_active: true,
        location: {
            lat: 9.9370,
            lng: -84.0788,
            address: 'San José Este, Costa Rica'
        },
        created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 9,
        name: 'David Fernández',
        email: 'david.courier@itobox.com',
        phone: '+506 8888-9999',
        license_number: 'LIC-009-CR',
        vehicle_type: 'van',
        vehicle_plate: 'VAN-606',
        zone: 'San José Oeste',
        status: 'disponible',
        rating: 4.7,
        total_deliveries: 98,
        is_active: true,
        location: {
            lat: 9.9325,
            lng: -84.1026,
            address: 'San José Oeste, Costa Rica'
        },
        created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 10,
        name: 'Carmen Ramírez',
        email: 'carmen.courier@itobox.com',
        phone: '+506 8888-0000',
        license_number: 'LIC-010-CR',
        vehicle_type: 'car',
        vehicle_plate: 'CAR-707',
        zone: 'Escazú',
        status: 'disponible',
        rating: 4.8,
        total_deliveries: 167,
        is_active: true,
        location: {
            lat: 9.9189,
            lng: -84.1375,
            address: 'Escazú, Costa Rica'
        },
        created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 11,
        name: 'Fernando Vega',
        email: 'fernando.courier@itobox.com',
        phone: '+506 8888-1234',
        license_number: 'LIC-011-CR',
        vehicle_type: 'motorcycle',
        vehicle_plate: 'MOTO-808',
        zone: 'Desamparados',
        status: 'offline',
        rating: 4.6,
        total_deliveries: 76,
        is_active: true,
        location: {
            lat: 9.9092,
            lng: -84.0648,
            address: 'Desamparados, Costa Rica'
        },
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 12,
        name: 'Sofía Herrera',
        email: 'sofia.courier@itobox.com',
        phone: '+506 8888-5678',
        license_number: 'LIC-012-CR',
        vehicle_type: 'bike',
        vehicle_plate: 'BIKE-909',
        zone: 'Curridabat',
        status: 'disponible',
        rating: 4.9,
        total_deliveries: 123,
        is_active: true,
        location: {
            lat: 9.9189,
            lng: -84.0407,
            address: 'Curridabat, Costa Rica'
        },
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 13,
        name: 'Andrés Mora',
        email: 'andres.courier@itobox.com',
        phone: '+506 8888-9012',
        license_number: 'LIC-013-CR',
        vehicle_type: 'van',
        vehicle_plate: 'VAN-010',
        zone: 'Tibás',
        status: 'ocupado',
        rating: 4.5,
        total_deliveries: 54,
        is_active: true,
        location: {
            lat: 9.9528,
            lng: -84.0889,
            address: 'Tibás, Costa Rica'
        },
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
    }
];

let courierIdCounter = couriers.length + 1;

class Courier {
    // Obtener todos los couriers
    static async getAll(filters = {}) {
        try {
            let filteredCouriers = couriers.filter(c => c.is_active);
            
            // Aplicar filtros
            if (filters.search) {
                const search = filters.search.toLowerCase();
                filteredCouriers = filteredCouriers.filter(c => 
                    c.name.toLowerCase().includes(search) ||
                    c.email.toLowerCase().includes(search) ||
                    c.zone.toLowerCase().includes(search) ||
                    c.vehicle_plate.toLowerCase().includes(search)
                );
            }
            
            if (filters.status) {
                filteredCouriers = filteredCouriers.filter(c => c.status === filters.status);
            }
            
            if (filters.zone) {
                filteredCouriers = filteredCouriers.filter(c => c.zone === filters.zone);
            }
            
            if (filters.vehicle_type) {
                filteredCouriers = filteredCouriers.filter(c => c.vehicle_type === filters.vehicle_type);
            }
            
            return filteredCouriers;
        } catch (error) {
            throw error;
        }
    }
    
    // Obtener courier por ID
    static async getById(id) {
        return couriers.find(c => c.id == id && c.is_active) || null;
    }
    
    // Obtener couriers disponibles
    static async getAvailable() {
        return couriers.filter(c => c.is_active && c.status === 'disponible');
    }
    
    // Crear nuevo courier
    static async create(courierData) {
        const newCourier = {
            id: courierIdCounter++,
            name: courierData.name,
            email: courierData.email,
            phone: courierData.phone || null,
            license_number: courierData.license_number,
            vehicle_type: courierData.vehicle_type || 'motorcycle',
            vehicle_plate: courierData.vehicle_plate,
            zone: courierData.zone || 'San José',
            status: 'disponible',
            rating: 5.0,
            total_deliveries: 0,
            is_active: true,
            location: courierData.location || {
                lat: 9.9281,
                lng: -84.0907,
                address: 'San José, Costa Rica'
            },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        couriers.push(newCourier);
        return newCourier;
    }
    
    // Actualizar courier
    static async update(id, updateData) {
        const courierIndex = couriers.findIndex(c => c.id == id);
        if (courierIndex !== -1) {
            couriers[courierIndex] = {
                ...couriers[courierIndex],
                ...updateData,
                updated_at: new Date().toISOString()
            };
            return couriers[courierIndex];
        }
        return null;
    }
    
    // Actualizar estado
    static async updateStatus(id, status) {
        const courierIndex = couriers.findIndex(c => c.id == id);
        if (courierIndex !== -1) {
            couriers[courierIndex].status = status;
            couriers[courierIndex].updated_at = new Date().toISOString();
            return couriers[courierIndex];
        }
        return null;
    }
    
    // Actualizar ubicación
    static async updateLocation(id, location) {
        const courierIndex = couriers.findIndex(c => c.id == id);
        if (courierIndex !== -1) {
            couriers[courierIndex].location = location;
            couriers[courierIndex].updated_at = new Date().toISOString();
            return couriers[courierIndex];
        }
        return null;
    }
    
    // Eliminar courier (soft delete)
    static async delete(id) {
        const courierIndex = couriers.findIndex(c => c.id == id);
        if (courierIndex !== -1) {
            couriers[courierIndex].is_active = false;
            couriers[courierIndex].updated_at = new Date().toISOString();
            return true;
        }
        return false;
    }
    
    // Obtener estadísticas
    static async getStats() {
        const activeCouriers = couriers.filter(c => c.is_active);
        const disponibles = activeCouriers.filter(c => c.status === 'disponible').length;
        const ocupados = activeCouriers.filter(c => c.status === 'ocupado').length;
        const offline = activeCouriers.filter(c => c.status === 'offline').length;
        const totalDeliveries = activeCouriers.reduce((sum, c) => sum + c.total_deliveries, 0);
        const avgRating = activeCouriers.length > 0 ? 
            activeCouriers.reduce((sum, c) => sum + c.rating, 0) / activeCouriers.length : 0;
        
        return {
            total: activeCouriers.length,
            disponibles,
            ocupados,
            offline,
            total_deliveries: totalDeliveries,
            avg_deliveries: activeCouriers.length > 0 ? Math.round(totalDeliveries / activeCouriers.length) : 0,
            avg_rating: Math.round(avgRating * 10) / 10,
            by_vehicle: {
                motorcycle: activeCouriers.filter(c => c.vehicle_type === 'motorcycle').length,
                car: activeCouriers.filter(c => c.vehicle_type === 'car').length,
                bike: activeCouriers.filter(c => c.vehicle_type === 'bike').length,
                van: activeCouriers.filter(c => c.vehicle_type === 'van').length
            }
        };
    }
}

console.log('🚚 Modelo Courier.js cargado - 13 couriers disponibles');

module.exports = Courier;