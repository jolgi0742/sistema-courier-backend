// src/models/Client.js - MODELO DE CLIENTES EN MEMORIA

// Base de datos en memoria para clientes
let clients = [
    {
        id: 1,
        name: 'Empresas ABC S.A.',
        email: 'contacto@abc.com',
        phone: '+506 2222-1111',
        address: 'San José, Costa Rica',
        company: 'Empresas ABC S.A.',
        contact_person: 'María González',
        client_type: 'business',
        is_active: true,
        created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        total_packages: 15
    },
    {
        id: 2,
        name: 'Logística del Pacífico',
        email: 'admin@logpac.co.cr',
        phone: '+506 2633-2222',
        address: 'Puntarenas, Costa Rica',
        company: 'Logística del Pacífico S.A.',
        contact_person: 'Carlos Rodríguez',
        client_type: 'business',
        is_active: true,
        created_at: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        total_packages: 8
    },
    {
        id: 3,
        name: 'TechCorp Solutions',
        email: 'info@techcorp.com',
        phone: '+506 4000-3333',
        address: 'San José, Escazú',
        company: 'TechCorp Solutions Inc.',
        contact_person: 'Ana Jiménez',
        client_type: 'business',
        is_active: true,
        created_at: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        total_packages: 22
    },
    {
        id: 4,
        name: 'Juan Pérez',
        email: 'juan.perez@email.com',
        phone: '+506 8888-4444',
        address: 'Cartago, Costa Rica',
        company: 'N/A',
        contact_person: 'Juan Pérez',
        client_type: 'individual',
        is_active: true,
        created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        total_packages: 3
    },
    {
        id: 5,
        name: 'Distribuidora Nacional',
        email: 'ventas@disnac.cr',
        phone: '+506 2575-5555',
        address: 'Cartago, Costa Rica',
        company: 'Distribuidora Nacional S.A.',
        contact_person: 'Roberto Castro',
        client_type: 'business',
        is_active: true,
        created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        total_packages: 12
    },
    {
        id: 6,
        name: 'Comercial del Norte',
        email: 'info@comercialnorte.com',
        phone: '+506 2460-6666',
        address: 'Alajuela, Costa Rica',
        company: 'Comercial del Norte Ltda.',
        contact_person: 'Patricia Vargas',
        client_type: 'business',
        is_active: true,
        created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        total_packages: 6
    },
    {
        id: 7,
        name: 'Importaciones Caribeñas',
        email: 'gerencia@importcaribe.cr',
        phone: '+506 2758-7777',
        address: 'Limón, Costa Rica',
        company: 'Importaciones Caribeñas S.A.',
        contact_person: 'Miguel Solano',
        client_type: 'business',
        is_active: true,
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        total_packages: 4
    }
];

let clientIdCounter = clients.length + 1;

class Client {
    // Obtener todos los clientes
    static async getAll(filters = {}) {
        try {
            let filteredClients = clients.filter(c => c.is_active);
            
            // Aplicar filtros si existen
            if (filters.search) {
                const search = filters.search.toLowerCase();
                filteredClients = filteredClients.filter(c => 
                    c.name.toLowerCase().includes(search) ||
                    c.email.toLowerCase().includes(search) ||
                    c.company.toLowerCase().includes(search)
                );
            }
            
            if (filters.client_type) {
                filteredClients = filteredClients.filter(c => c.client_type === filters.client_type);
            }
            
            return filteredClients;
        } catch (error) {
            throw error;
        }
    }
    
    // Obtener cliente por ID
    static async getById(id) {
        return clients.find(c => c.id == id && c.is_active) || null;
    }
    
    // Crear nuevo cliente
    static async create(clientData) {
        const newClient = {
            id: clientIdCounter++,
            name: clientData.name,
            email: clientData.email,
            phone: clientData.phone || null,
            address: clientData.address || null,
            company: clientData.company || clientData.name,
            contact_person: clientData.contact_person || clientData.name,
            client_type: clientData.client_type || 'individual',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            total_packages: 0
        };
        
        clients.push(newClient);
        return newClient;
    }
    
    // Actualizar cliente
    static async update(id, updateData) {
        const clientIndex = clients.findIndex(c => c.id == id);
        if (clientIndex !== -1) {
            clients[clientIndex] = {
                ...clients[clientIndex],
                ...updateData,
                updated_at: new Date().toISOString()
            };
            return clients[clientIndex];
        }
        return null;
    }
    
    // Eliminar cliente (soft delete)
    static async delete(id) {
        const clientIndex = clients.findIndex(c => c.id == id);
        if (clientIndex !== -1) {
            clients[clientIndex].is_active = false;
            clients[clientIndex].updated_at = new Date().toISOString();
            return true;
        }
        return false;
    }
    
    // Obtener estadísticas
    static async getStats() {
        const activeClients = clients.filter(c => c.is_active);
        const totalPackages = activeClients.reduce((sum, c) => sum + c.total_packages, 0);
        
        return {
            total: activeClients.length,
            business: activeClients.filter(c => c.client_type === 'business').length,
            individual: activeClients.filter(c => c.client_type === 'individual').length,
            total_packages: totalPackages,
            avg_packages: activeClients.length > 0 ? Math.round(totalPackages / activeClients.length) : 0
        };
    }
}

console.log('📋 Modelo Client.js cargado - 7 clientes disponibles');

module.exports = Client;