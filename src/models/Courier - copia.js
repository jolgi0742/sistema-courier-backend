// src/models/Courier.js - MODELO SIMPLIFICADO SIN SEQUELIZE

// Base de datos en memoria
let couriers = [
    {
        id: 1,
        first_name: 'Roberto',
        last_name: 'Méndez',
        email: 'roberto.mendez@itobox.com',
        phone: '+506 5555-6666',
        address: 'San José, Costa Rica',
        vehicle_type: 'motocicleta',
        vehicle_plate: 'M123456',
        vehicle_capacity: '50kg',
        vehicle_model: 'Honda CRF 250',
        status: 'available',
        is_available: true,
        current_capacity: 2,
        max_capacity: 8,
        working_hours: '8:00 AM - 6:00 PM',
        current_location: 'Centro de distribución principal',
        coordinates: JSON.stringify({ lat: 9.9281, lng: -84.0907 }),
        assigned_zone: 'Zona Centro',
        total_deliveries: 247,
        successful_deliveries: 235,
        failed_deliveries: 12,
        average_rating: 4.7,
        total_ratings: 89,
        average_delivery_time: '45 min',
        on_time_rate: 94,
        last_seen: new Date().toISOString(),
        location_updated_at: new Date().toISOString(),
        created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 2,
        first_name: 'Carmen',
        last_name: 'Solís',
        email: 'carmen.solis@itobox.com',
        phone: '+506 8888-7777',
        address: 'Alajuela, Costa Rica',
        vehicle_type: 'auto',
        vehicle_plate: 'A789012',
        vehicle_capacity: '100kg',
        vehicle_model: 'Toyota Yaris',
        status: 'busy',
        is_available: true,
        current_capacity: 6,
        max_capacity: 10,
        working_hours: '9:00 AM - 7:00 PM',
        current_location: 'Ruta de entrega Alajuela',
        coordinates: JSON.stringify({ lat: 10.0162, lng: -84.2103 }),
        assigned_zone: 'Zona Norte',
        total_deliveries: 189,
        successful_deliveries: 182,
        failed_deliveries: 7,
        average_rating: 4.8,
        total_ratings: 67,
        average_delivery_time: '38 min',
        on_time_rate: 96,
        last_seen: new Date().toISOString(),
        location_updated_at: new Date().toISOString(),
        created_at: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 3,
        first_name: 'Diego',
        last_name: 'Ramírez',
        email: 'diego.ramirez@itobox.com',
        phone: '+506 3333-4444',
        address: 'Cartago, Costa Rica',
        vehicle_type: 'bicicleta',
        vehicle_plate: 'B001',
        vehicle_capacity: '25kg',
        vehicle_model: 'Trek Delivery',
        status: 'offline',
        is_available: false,
        current_capacity: 0,
        max_capacity: 5,
        working_hours: '6:00 AM - 2:00 PM',
        current_location: 'Fuera de servicio',
        coordinates: JSON.stringify({ lat: 9.8644, lng: -83.9186 }),
        assigned_zone: 'Zona Este',
        total_deliveries: 98,
        successful_deliveries: 95,
        failed_deliveries: 3,
        average_rating: 4.9,
        total_ratings: 34,
        average_delivery_time: '25 min',
        on_time_rate: 97,
        last_seen: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        location_updated_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
    }
];

let courierIdCounter = couriers.length + 1;

class Courier {
    // Obtener todos los couriers con detalles
    static async findAllWithDetails(filters = {}, limit = 20, offset = 0) {
        let filteredCouriers = [...couriers];

        // Aplicar filtros
        if (filters.status) {
            filteredCouriers = filteredCouriers.filter(courier => courier.status === filters.status);
        }
        if (filters.available !== undefined) {
            const isAvailable = filters.available === 'true' || filters.available === true;
            filteredCouriers = filteredCouriers.filter(courier => courier.is_available === isAvailable);
        }
        if (filters.zone) {
            filteredCouriers = filteredCouriers.filter(courier => 
                courier.assigned_zone.toLowerCase().includes(filters.zone.toLowerCase())
            );
        }

        // Paginación
        return filteredCouriers.slice(offset, offset + limit);
    }

    // Contar couriers
    static async count(filters = {}) {
        let filteredCouriers = [...couriers];

        if (filters.status) {
            filteredCouriers = filteredCouriers.filter(courier => courier.status === filters.status);
        }
        if (filters.available !== undefined) {
            const isAvailable = filters.available === 'true' || filters.available === true;
            filteredCouriers = filteredCouriers.filter(courier => courier.is_available === isAvailable);
        }

        return filteredCouriers.length;
    }

    // Buscar courier por ID
    static async findById(id) {
        return couriers.find(courier => courier.id == id) || null;
    }

    // Buscar courier por ID con detalles completos
    static async findByIdWithDetails(id) {
        const courier = couriers.find(c => c.id == id);
        if (!courier) return null;

        // Agregar información adicional calculada
        return {
            ...courier,
            efficiency_score: Math.floor(Math.random() * 20) + 80, // 80-100%
            current_packages: courier.current_capacity,
            available_capacity: courier.max_capacity - courier.current_capacity
        };
    }

    // Actualizar ubicación del courier
    static async updateLocation(courierId, locationData) {
        const courierIndex = couriers.findIndex(c => c.id == courierId);
        if (courierIndex !== -1) {
            couriers[courierIndex].coordinates = JSON.stringify({
                lat: locationData.latitude,
                lng: locationData.longitude
            });
            couriers[courierIndex].current_location = locationData.address;
            couriers[courierIndex].location_updated_at = new Date().toISOString();
            couriers[courierIndex].last_seen = new Date().toISOString();
            couriers[courierIndex].updated_at = new Date().toISOString();
        }
    }

    // Obtener historial de ubicaciones (simulado)
    static async getLocationHistory(courierId, limit = 10) {
        // Simular historial de ubicaciones
        const history = [];
        const baseCoords = { lat: 9.9281, lng: -84.0907 };
        
        for (let i = 0; i < limit; i++) {
            const timeAgo = i * 10; // cada 10 minutos
            history.push({
                latitude: baseCoords.lat + (Math.random() - 0.5) * 0.1,
                longitude: baseCoords.lng + (Math.random() - 0.5) * 0.1,
                timestamp: new Date(Date.now() - timeAgo * 60 * 1000).toISOString(),
                accuracy: Math.floor(Math.random() * 10) + 5,
                speed: Math.floor(Math.random() * 40)
            });
        }
        
        return history;
    }

    // Actualizar capacidad del courier
    static async updateCapacity(courierId, additionalPackages) {
        const courierIndex = couriers.findIndex(c => c.id == courierId);
        if (courierIndex !== -1) {
            couriers[courierIndex].current_capacity += additionalPackages;
            couriers[courierIndex].updated_at = new Date().toISOString();
        }
    }

    // Actualizar estado del courier
    static async updateStatus(courierId, newStatus, newCapacity = null) {
        const courierIndex = couriers.findIndex(c => c.id == courierId);
        if (courierIndex !== -1) {
            couriers[courierIndex].status = newStatus;
            if (newCapacity !== null) {
                couriers[courierIndex].current_capacity = newCapacity;
            }
            couriers[courierIndex].updated_at = new Date().toISOString();
            couriers[courierIndex].last_seen = new Date().toISOString();
        }
    }

    // Crear nuevo courier
    static async create(courierData) {
        const newCourier = {
            id: courierIdCounter++,
            ...courierData,
            current_capacity: 0,
            total_deliveries: 0,
            successful_deliveries: 0,
            failed_deliveries: 0,
            average_rating: 0,
            total_ratings: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_seen: new Date().toISOString()
        };

        couriers.push(newCourier);
        return newCourier;
    }

    // Obtener estadísticas de couriers
    static async getStatistics() {
        const total = couriers.length;
        const available = couriers.filter(c => c.is_available && c.status === 'available').length;
        const busy = couriers.filter(c => c.status === 'busy').length;
        const offline = couriers.filter(c => c.status === 'offline').length;

        const totalDeliveries = couriers.reduce((sum, c) => sum + c.total_deliveries, 0);
        const totalSuccessful = couriers.reduce((sum, c) => sum + c.successful_deliveries, 0);
        const averageRating = couriers.reduce((sum, c) => sum + c.average_rating, 0) / total || 0;

        return {
            total,
            available,
            busy,
            offline,
            totalDeliveries,
            successRate: total > 0 ? Math.round((totalSuccessful / totalDeliveries) * 100) || 0 : 0,
            averageRating: averageRating.toFixed(1)
        };
    }
}

module.exports = Courier;