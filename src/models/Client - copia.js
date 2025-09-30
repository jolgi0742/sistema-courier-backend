// src/models/Client.js - MODELO SIMPLIFICADO SIN SEQUELIZE

// Base de datos en memoria
let clients = [
    {
        id: 1,
        first_name: 'Juan',
        last_name: 'Pérez',
        email: 'juan.perez@email.com',
        phone: '+506 8888-9999',
        address: 'San José, Costa Rica',
        company_name: 'Empresa Ejemplo S.A.',
        business_type: 'Comercial',
        tax_id: '3-101-123456',
        credit_limit: 5000.00,
        current_balance: 450.00,
        payment_status: 'current',
        preferred_delivery_time: 'Horario comercial (8AM-5PM)',
        total_packages: 15,
        total_spent: 875.50,
        average_rating: 4.8,
        customer_since: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        last_payment_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        next_payment_due: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        preferred_payment_method: 'Transferencia bancaria',
        created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 2,
        first_name: 'Ana',
        last_name: 'Morales',
        email: 'ana.morales@email.com',
        phone: '+506 4444-5555',
        address: 'Heredia, Costa Rica',
        company_name: 'Comercial La Paz',
        business_type: 'Retail',
        tax_id: '3-101-789012',
        credit_limit: 3000.00,
        current_balance: 125.00,
        payment_status: 'current',
        preferred_delivery_time: 'Mañanas (8AM-12PM)',
        total_packages: 8,
        total_spent: 320.75,
        average_rating: 4.6,
        customer_since: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        last_payment_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        next_payment_due: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString(),
        preferred_payment_method: 'Tarjeta de crédito',
        created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 3,
        first_name: 'Carlos',
        last_name: 'Rodríguez',
        email: 'carlos.rodriguez@email.com',
        phone: '+506 6666-7777',
        address: 'Cartago, Costa Rica',
        company_name: null,
        business_type: 'Individual',
        tax_id: '1-1234-5678',
        credit_limit: 1000.00,
        current_balance: 0.00,
        payment_status: 'current',
        preferred_delivery_time: 'Tardes (1PM-6PM)',
        total_packages: 3,
        total_spent: 85.25,
        average_rating: 5.0,
        customer_since: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        last_payment_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        next_payment_due: null,
        preferred_payment_method: 'Efectivo',
        created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
    }
];

let clientIdCounter = clients.length + 1;

class Client {
    // Obtener todos los clientes con detalles
    static async findAllWithDetails(filters = {}, limit = 20, offset = 0) {
        let filteredClients = [...clients];

        // Aplicar filtros
        if (filters.businessType) {
            filteredClients = filteredClients.filter(client => 
                client.business_type === filters.businessType
            );
        }
        if (filters.status) {
            filteredClients = filteredClients.filter(client => 
                client.payment_status === filters.status
            );
        }
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filteredClients = filteredClients.filter(client =>
                client.first_name.toLowerCase().includes(searchTerm) ||
                client.last_name.toLowerCase().includes(searchTerm) ||
                client.email.toLowerCase().includes(searchTerm) ||
                (client.company_name && client.company_name.toLowerCase().includes(searchTerm))
            );
        }

        // Calcular estadísticas adicionales para cada cliente
        return filteredClients.slice(offset, offset + limit).map(client => ({
            ...client,
            active_packages: Math.floor(Math.random() * 5), // Simulado
            client_name: `${client.first_name} ${client.last_name}`
        }));
    }

    // Contar clientes
    static async count(filters = {}) {
        let filteredClients = [...clients];

        if (filters.businessType) {
            filteredClients = filteredClients.filter(client => 
                client.business_type === filters.businessType
            );
        }
        if (filters.status) {
            filteredClients = filteredClients.filter(client => 
                client.payment_status === filters.status
            );
        }

        return filteredClients.length;
    }

    // Buscar cliente por ID con detalles completos
    static async findByIdWithDetails(id) {
        const client = clients.find(c => c.id == id);
        if (!client) return null;

        // Agregar estadísticas calculadas
        return {
            ...client,
            available_credit: client.credit_limit - client.current_balance,
            days_as_customer: Math.floor((new Date() - new Date(client.customer_since)) / (1000 * 60 * 60 * 24)),
            average_monthly_spending: client.total_spent / 12, // Simulado
            client_name: `${client.first_name} ${client.last_name}`
        };
    }

    // Buscar cliente por ID
    static async findById(id) {
        return clients.find(client => client.id == id) || null;
    }

    // Buscar cliente por email
    static async findByEmail(email) {
        return clients.find(client => client.email === email) || null;
    }

    // Buscar cliente por teléfono
    static async findByPhone(phone) {
        return clients.find(client => client.phone === phone) || null;
    }

    // Crear nuevo cliente
    static async create(clientData) {
        const newClient = {
            id: clientIdCounter++,
            ...clientData,
            total_packages: 0,
            total_spent: 0.00,
            average_rating: 0,
            current_balance: 0.00,
            payment_status: 'current',
            customer_since: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
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

    // Actualizar balance del cliente
    static async updateBalance(clientId, amount) {
        const clientIndex = clients.findIndex(c => c.id == clientId);
        if (clientIndex !== -1) {
            clients[clientIndex].current_balance += amount;
            clients[clientIndex].total_spent += Math.max(0, amount);
            clients[clientIndex].updated_at = new Date().toISOString();
        }
    }

    // Obtener estadísticas de clientes
    static async getStatistics() {
        const total = clients.length;
        const commercial = clients.filter(c => c.business_type === 'Comercial').length;
        const retail = clients.filter(c => c.business_type === 'Retail').length;
        const individual = clients.filter(c => c.business_type === 'Individual').length;
        
        const totalSpent = clients.reduce((sum, c) => sum + c.total_spent, 0);
        const totalPackages = clients.reduce((sum, c) => sum + c.total_packages, 0);
        const averageRating = clients.reduce((sum, c) => sum + c.average_rating, 0) / total || 0;

        const currentClients = clients.filter(c => c.payment_status === 'current').length;
        const overdueClients = clients.filter(c => c.payment_status === 'overdue').length;

        return {
            total,
            commercial,
            retail,
            individual,
            totalSpent: totalSpent.toFixed(2),
            totalPackages,
            averageRating: averageRating.toFixed(1),
            currentClients,
            overdueClients,
            averageSpendingPerClient: total > 0 ? (totalSpent / total).toFixed(2) : '0.00',
            averagePackagesPerClient: total > 0 ? Math.round(totalPackages / total) : 0
        };
    }
}

module.exports = Client;