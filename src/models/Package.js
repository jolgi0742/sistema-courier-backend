// src/models/Package.js - MODELO DE PAQUETES EN MEMORIA

let packages = [
    {
        id: 1,
        tracking_number: 'ITO-2025-001',
        client_id: 1,
        client_name: 'Empresas ABC S.A.',
        courier_id: 1,
        courier_name: 'Carlos Rodríguez',
        courier_phone: '+506 8888-1111',
        origin: 'Miami, FL, USA',
        destination: 'San José, Costa Rica',
        weight: 2.5,
        dimensions: '30x20x15 cm',
        value: 250.00,
        status: 'delivered',
        priority: 'normal',
        service_type: 'standard',
        description: 'Documentos empresariales',
        delivery_notes: 'Entregado en recepción',
        estimated_delivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 2,
        tracking_number: 'ITO-2025-002',
        client_id: 2,
        client_name: 'Logística del Pacífico',
        courier_id: 2,
        courier_name: 'María González',
        courier_phone: '+506 8888-2222',
        origin: 'Los Angeles, CA, USA',
        destination: 'Puntarenas, Costa Rica',
        weight: 15.0,
        dimensions: '60x40x30 cm',
        value: 800.00,
        status: 'in_transit',
        priority: 'high',
        service_type: 'express',
        description: 'Repuestos industriales',
        delivery_notes: null,
        estimated_delivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 3,
        tracking_number: 'ITO-2025-003',
        client_id: 3,
        client_name: 'TechCorp Solutions',
        courier_id: null,
        courier_name: null,
        courier_phone: null,
        origin: 'New York, NY, USA',
        destination: 'San José, Escazú',
        weight: 1.2,
        dimensions: '25x15x10 cm',
        value: 1200.00,
        status: 'pending',
        priority: 'urgent',
        service_type: 'express',
        description: 'Equipos de computación',
        delivery_notes: null,
        estimated_delivery: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 4,
        tracking_number: 'ITO-2025-004',
        client_id: 4,
        client_name: 'Juan Pérez',
        courier_id: 3,
        courier_name: 'José Morales',
        courier_phone: '+506 8888-3333',
        origin: 'Houston, TX, USA',
        destination: 'Cartago, Costa Rica',
        weight: 0.8,
        dimensions: '20x15x8 cm',
        value: 150.00,
        status: 'confirmed',
        priority: 'normal',
        service_type: 'standard',
        description: 'Compra personal - medicamentos',
        delivery_notes: null,
        estimated_delivery: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 5,
        tracking_number: 'ITO-2025-005',
        client_id: 5,
        client_name: 'Distribuidora Nacional',
        courier_id: 4,
        courier_name: 'Ana Jiménez',
        courier_phone: '+506 8888-4444',
        origin: 'Chicago, IL, USA',
        destination: 'Cartago, Costa Rica',
        weight: 8.5,
        dimensions: '45x35x25 cm',
        value: 650.00,
        status: 'pickup_pending',
        priority: 'normal',
        service_type: 'standard',
        description: 'Productos para distribución',
        delivery_notes: null,
        estimated_delivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }
];

let packageIdCounter = packages.length + 1;
let trackingCounter = 6;

class Package {
    static async findAll(filters = {}) {
        try {
            let filteredPackages = [...packages];
            
            if (filters.search) {
                const search = filters.search.toLowerCase();
                filteredPackages = filteredPackages.filter(p => 
                    p.tracking_number.toLowerCase().includes(search) ||
                    p.client_name.toLowerCase().includes(search) ||
                    p.description.toLowerCase().includes(search)
                );
            }
            
            if (filters.status) {
                filteredPackages = filteredPackages.filter(p => p.status === filters.status);
            }
            
            if (filters.client_id) {
                filteredPackages = filteredPackages.filter(p => p.client_id == filters.client_id);
            }
            
            if (filters.courier_id) {
                filteredPackages = filteredPackages.filter(p => p.courier_id == filters.courier_id);
            }
            
            return filteredPackages;
        } catch (error) {
            throw error;
        }
    }
    
    static async getById(id) {
        return packages.find(p => p.id == id) || null;
    }
    
    static async getByTrackingNumber(trackingNumber) {
        return packages.find(p => p.tracking_number === trackingNumber) || null;
    }
    
    static async create(packageData) {
        const newPackage = {
            id: packageIdCounter++,
            tracking_number: `ITO-2025-${String(trackingCounter++).padStart(3, '0')}`,
            client_id: packageData.client_id,
            client_name: packageData.client_name,
            courier_id: packageData.courier_id || null,
            courier_name: packageData.courier_name || null,
            courier_phone: packageData.courier_phone || null,
            origin: packageData.origin,
            destination: packageData.destination,
            weight: packageData.weight || 0,
            dimensions: packageData.dimensions || '',
            value: packageData.value || 0,
            status: 'pending',
            priority: packageData.priority || 'normal',
            service_type: packageData.service_type || 'standard',
            description: packageData.description || '',
            delivery_notes: null,
            estimated_delivery: packageData.estimated_delivery || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        packages.push(newPackage);
        return newPackage;
    }
    
    static async update(id, updateData) {
        const packageIndex = packages.findIndex(p => p.id == id);
        if (packageIndex !== -1) {
            packages[packageIndex] = {
                ...packages[packageIndex],
                ...updateData,
                updated_at: new Date().toISOString()
            };
            return packages[packageIndex];
        }
        return null;
    }
    
    static async assignCourier(packageId, courierId, courierName, courierPhone) {
        const packageIndex = packages.findIndex(p => p.id == packageId);
        if (packageIndex !== -1) {
            packages[packageIndex].courier_id = courierId;
            packages[packageIndex].courier_name = courierName;
            packages[packageIndex].courier_phone = courierPhone;
            packages[packageIndex].status = 'confirmed';
            packages[packageIndex].updated_at = new Date().toISOString();
            return packages[packageIndex];
        }
        return null;
    }
    
    static async delete(id) {
        const packageIndex = packages.findIndex(p => p.id == id);
        if (packageIndex !== -1) {
            packages.splice(packageIndex, 1);
            return true;
        }
        return false;
    }
    
    static async getStats() {
        return {
            total: packages.length,
            pending: packages.filter(p => p.status === 'pending').length,
            confirmed: packages.filter(p => p.status === 'confirmed').length,
            in_transit: packages.filter(p => p.status === 'in_transit').length,
            delivered: packages.filter(p => p.status === 'delivered').length,
            total_value: packages.reduce((sum, p) => sum + p.value, 0)
        };
    }
}

console.log('📦 Modelo Package.js cargado - 5 paquetes de prueba');

module.exports = Package;