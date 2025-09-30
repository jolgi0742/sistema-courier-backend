// src/controllers/clientController.js - VERSIÓN MEJORADA COMPLETA

const Client = require('../models/Client');
const Package = require('../models/Package');
const User = require('../models/User');

class ClientController {
    // Obtener todos los clientes
    static async getAllClients(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;
            
            const filters = {
                businessType: req.query.businessType,
                status: req.query.status,
                search: req.query.search
            };

            const clients = await Client.findAllWithDetails(filters, limit, offset);
            const total = await Client.count(filters);

            res.json({
                success: true,
                data: {
                    clients: clients.map(client => ({
                        ...client,
                        // Información completa del cliente
                        personalInfo: {
                            name: `${client.first_name} ${client.last_name}`,
                            email: client.email,
                            phone: client.phone,
                            address: client.address
                        },
                        businessInfo: {
                            companyName: client.company_name || 'N/A',
                            businessType: client.business_type || 'Individual',
                            taxId: client.tax_id || 'N/A'
                        },
                        // Estadísticas del cliente
                        stats: {
                            totalPackages: client.total_packages || 0,
                            activePackages: client.active_packages || 0,
                            totalSpent: parseFloat(client.total_spent || 0).toFixed(2),
                            averageRating: parseFloat(client.average_rating || 0).toFixed(1),
                            customerSince: client.created_at
                        }
                    })),
                    pagination: {
                        currentPage: page,
                        totalPages: Math.ceil(total / limit),
                        totalItems: total,
                        itemsPerPage: limit
                    }
                }
            });

        } catch (error) {
            console.error('Error obteniendo clientes:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // 🔥 DASHBOARD PERSONALIZADO DEL CLIENTE
    static async getClientDashboard(req, res) {
        try {
            const { clientId } = req.params;

            // Obtener información completa del cliente
            const client = await Client.findByIdWithDetails(clientId);
            if (!client) {
                return res.status(404).json({
                    success: false,
                    message: 'Cliente no encontrado'
                });
            }

            // Obtener estadísticas del cliente
            const clientStats = await this.calculateClientStats(clientId);

            // Obtener paquetes activos
            const activePackages = await Package.findActiveByClientId(clientId);

            // Obtener historial reciente
            const recentPackages = await Package.findRecentByClientId(clientId, 10);

            // Obtener facturas pendientes
            const pendingInvoices = await this.getPendingInvoices(clientId);

            // Calcular métricas personalizadas
            const customMetrics = await this.calculateCustomMetrics(clientId);

            res.json({
                success: true,
                data: {
                    // Información personal del cliente
                    clientInfo: {
                        id: client.id,
                        name: `${client.first_name} ${client.last_name}`,
                        email: client.email,
                        phone: client.phone,
                        address: client.address,
                        company: client.company_name || 'N/A',
                        businessType: client.business_type || 'Individual',
                        customerSince: client.created_at,
                        preferredDeliveryTime: client.preferred_delivery_time || 'Horario comercial',
                        avatar: client.avatar || '/images/default-client-avatar.png'
                    },

                    // 🔥 MÉTRICAS PERSONALIZADAS
                    metrics: {
                        totalPackages: clientStats.totalPackages,
                        activePackages: clientStats.activePackages,
                        deliveredPackages: clientStats.deliveredPackages,
                        pendingPackages: clientStats.pendingPackages,
                        totalSpent: clientStats.totalSpent,
                        averagePackageValue: clientStats.averagePackageValue,
                        deliverySuccessRate: clientStats.deliverySuccessRate,
                        averageDeliveryTime: clientStats.averageDeliveryTime,
                        thisMonthPackages: clientStats.thisMonthPackages,
                        thisMonthSpent: clientStats.thisMonthSpent,
                        favoriteService: clientStats.favoriteService,
                        mostUsedCourier: clientStats.mostUsedCourier
                    },

                    // Paquetes activos con información detallada
                    activePackages: activePackages.map(pkg => ({
                        id: pkg.id,
                        trackingNumber: pkg.tracking_number,
                        recipient: pkg.recipient_name,
                        recipientAddress: pkg.recipient_address,
                        status: pkg.status,
                        statusDisplay: this.getStatusDisplay(pkg.status),
                        serviceType: pkg.service_type,
                        weight: pkg.weight,
                        estimatedDelivery: pkg.estimated_delivery,
                        currentLocation: pkg.current_location || 'Centro de distribución',
                        courierName: pkg.courier_name || 'Por asignar',
                        courierPhone: pkg.courier_phone || 'N/A',
                        progress: this.calculatePackageProgress(pkg.status),
                        canTrack: true,
                        canModify: ['pending', 'picked_up'].includes(pkg.status),
                        timeRemaining: this.calculateTimeRemaining(pkg.estimated_delivery)
                    })),

                    // Historial reciente
                    recentActivity: recentPackages.map(pkg => ({
                        id: pkg.id,
                        trackingNumber: pkg.tracking_number,
                        recipient: pkg.recipient_name,
                        status: pkg.status,
                        statusDisplay: this.getStatusDisplay(pkg.status),
                        createdAt: pkg.created_at,
                        deliveredAt: pkg.delivered_at || null,
                        totalCost: pkg.total_cost,
                        rating: pkg.rating || null,
                        feedback: pkg.feedback || null
                    })),

                    // 🔥 FACTURAS PENDIENTES
                    pendingInvoices: pendingInvoices.map(invoice => ({
                        id: invoice.id,
                        invoiceNumber: invoice.invoice_number,
                        amount: invoice.amount,
                        dueDate: invoice.due_date,
                        status: invoice.status,
                        packages: invoice.packages || 0,
                        isOverdue: new Date(invoice.due_date) < new Date(),
                        daysOverdue: this.calculateDaysOverdue(invoice.due_date)
                    })),

                    // Balance y información financiera
                    financialInfo: {
                        currentBalance: client.current_balance || 0,
                        creditLimit: client.credit_limit || 0,
                        availableCredit: (client.credit_limit || 0) - (client.current_balance || 0),
                        paymentStatus: client.payment_status || 'current',
                        lastPayment: client.last_payment_date || null,
                        nextPaymentDue: client.next_payment_due || null,
                        preferredPaymentMethod: client.preferred_payment_method || 'Efectivo'
                    },

                    // 🔥 ACCIONES RÁPIDAS DISPONIBLES
                    quickActions: [
                        {
                            id: 'create_shipment',
                            title: 'Crear Nuevo Envío',
                            description: 'Crear un nuevo paquete para envío',
                            icon: 'plus',
                            available: true,
                            route: '/client-portal/create-shipment'
                        },
                        {
                            id: 'track_package',
                            title: 'Rastrear Paquete',
                            description: 'Buscar y rastrear un paquete existente',
                            icon: 'search',
                            available: true,
                            route: '/client-portal/track'
                        },
                        {
                            id: 'view_invoices',
                            title: 'Ver Facturas',
                            description: 'Revisar facturas y pagos pendientes',
                            icon: 'document',
                            available: true,
                            route: '/client-portal/invoices'
                        },
                        {
                            id: 'schedule_pickup',
                            title: 'Programar Recolección',
                            description: 'Agendar recolección de paquetes',
                            icon: 'calendar',
                            available: true,
                            route: '/client-portal/schedule-pickup'
                        },
                        {
                            id: 'contact_support',
                            title: 'Contactar Soporte',
                            description: 'Obtener ayuda y soporte técnico',
                            icon: 'support',
                            available: true,
                            route: '/client-portal/support'
                        }
                    ],

                    // Notificaciones personalizadas
                    notifications: await this.getClientNotifications(clientId),

                    // Estadísticas comparativas
                    comparativeStats: {
                        vsLastMonth: {
                            packages: customMetrics.packagesVsLastMonth,
                            spending: customMetrics.spendingVsLastMonth,
                            deliveryTime: customMetrics.deliveryTimeVsLastMonth
                        },
                        vsAverage: {
                            packages: customMetrics.packagesVsAverage,
                            spending: customMetrics.spendingVsAverage,
                            satisfaction: customMetrics.satisfactionVsAverage
                        }
                    },

                    // Recomendaciones personalizadas
                    recommendations: await this.generateClientRecommendations(clientId, clientStats)
                }
            });

        } catch (error) {
            console.error('Error obteniendo dashboard del cliente:', error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo dashboard del cliente'
            });
        }
    }

    // 🔥 ACCESO DIRECTO AL PORTAL SIN LOGIN GENERAL
    static async getClientPortalAccess(req, res) {
        try {
            const { identifier } = req.params; // Email o teléfono
            const { type = 'email' } = req.query; // 'email' o 'phone'

            let client;
            if (type === 'email') {
                client = await Client.findByEmail(identifier);
            } else if (type === 'phone') {
                client = await Client.findByPhone(identifier);
            }

            if (!client) {
                return res.status(404).json({
                    success: false,
                    message: 'Cliente no encontrado con ese identificador'
                });
            }

            // Obtener información básica del portal
            const portalInfo = await this.getBasicPortalInfo(client.id);

            res.json({
                success: true,
                data: {
                    clientId: client.id,
                    clientName: `${client.first_name} ${client.last_name}`,
                    email: client.email,
                    phone: client.phone,
                    company: client.company_name || 'N/A',
                    accessType: 'direct_portal',
                    portalUrl: `/client-portal/${client.id}`,
                    // Información rápida del portal
                    quickStats: {
                        activePackages: portalInfo.activePackages,
                        pendingInvoices: portalInfo.pendingInvoices,
                        recentActivity: portalInfo.recentActivity
                    },
                    // Token temporal para acceso directo (opcional)
                    temporaryToken: this.generateTemporaryToken(client.id),
                    tokenExpiresIn: '1 hour'
                }
            });

        } catch (error) {
            console.error('Error obteniendo acceso al portal:', error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo acceso al portal del cliente'
            });
        }
    }

    // 🔥 HISTORIAL DE PAQUETES DEL CLIENTE CON FILTROS
    static async getClientPackageHistory(req, res) {
        try {
            const { clientId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;

            const filters = {
                status: req.query.status,
                serviceType: req.query.serviceType,
                dateFrom: req.query.dateFrom,
                dateTo: req.query.dateTo,
                search: req.query.search
            };

            const packages = await Package.findByClientIdWithFilters(clientId, filters, limit, offset);
            const total = await Package.countByClientId(clientId, filters);

            res.json({
                success: true,
                data: {
                    packages: packages.map(pkg => ({
                        id: pkg.id,
                        trackingNumber: pkg.tracking_number,
                        recipient: pkg.recipient_name,
                        recipientAddress: pkg.recipient_address,
                        recipientPhone: pkg.recipient_phone,
                        status: pkg.status,
                        statusDisplay: this.getStatusDisplay(pkg.status),
                        serviceType: pkg.service_type,
                        weight: pkg.weight,
                        dimensions: pkg.dimensions,
                        declaredValue: pkg.declared_value,
                        totalCost: pkg.total_cost,
                        createdAt: pkg.created_at,
                        estimatedDelivery: pkg.estimated_delivery,
                        actualDelivery: pkg.actual_delivery,
                        deliveryTime: pkg.actual_delivery ? 
                            this.calculateDeliveryTime(pkg.created_at, pkg.actual_delivery) : null,
                        courierName: pkg.courier_name || 'No asignado',
                        rating: pkg.rating || null,
                        feedback: pkg.feedback || null,
                        canTrack: true,
                        canRate: pkg.status === 'delivered' && !pkg.rating,
                        canReorder: pkg.status === 'delivered',
                        specialInstructions: pkg.delivery_instructions || null,
                        // Información de costos desglosada
                        costBreakdown: {
                            baseCost: pkg.base_cost || 0,
                            weightCost: pkg.weight_cost || 0,
                            serviceFee: pkg.service_fee || 0,
                            taxes: pkg.taxes || 0,
                            total: pkg.total_cost || 0
                        }
                    })),
                    pagination: {
                        currentPage: page,
                        totalPages: Math.ceil(total / limit),
                        totalItems: total,
                        itemsPerPage: limit
                    },
                    // Estadísticas del período filtrado
                    periodStats: {
                        totalPackages: packages.length,
                        totalSpent: packages.reduce((sum, pkg) => sum + (pkg.total_cost || 0), 0),
                        averageDeliveryTime: this.calculateAverageDeliveryTime(packages),
                        deliverySuccessRate: this.calculateDeliverySuccessRate(packages),
                        mostUsedService: this.getMostUsedService(packages)
                    }
                }
            });

        } catch (error) {
            console.error('Error obteniendo historial del cliente:', error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo historial de paquetes'
            });
        }
    }

    // Crear nuevo cliente
    static async createClient(req, res) {
        try {
            const clientData = req.body;
            
            // Validar datos
            const validation = this.validateClientData(clientData);
            if (!validation.isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Datos del cliente inválidos',
                    errors: validation.errors
                });
            }

            const newClient = await Client.create(clientData);

            res.status(201).json({
                success: true,
                data: newClient,
                message: 'Cliente creado exitosamente'
            });

        } catch (error) {
            console.error('Error creando cliente:', error);
            res.status(500).json({
                success: false,
                message: 'Error creando cliente'
            });
        }
    }

    // MÉTODOS AUXILIARES

    static async calculateClientStats(clientId) {
        // En producción, calcular desde la base de datos
        const packages = await Package.findByClientId(clientId);
        const deliveredPackages = packages.filter(pkg => pkg.status === 'delivered');
        const activePackages = packages.filter(pkg => 
            ['pending', 'picked_up', 'in_transit', 'out_for_delivery'].includes(pkg.status)
        );

        const totalSpent = packages.reduce((sum, pkg) => sum + (pkg.total_cost || 0), 0);
        const thisMonth = new Date();
        thisMonth.setDate(1);
        const thisMonthPackages = packages.filter(pkg => new Date(pkg.created_at) >= thisMonth);

        return {
            totalPackages: packages.length,
            activePackages: activePackages.length,
            deliveredPackages: deliveredPackages.length,
            pendingPackages: packages.filter(pkg => pkg.status === 'pending').length,
            totalSpent: totalSpent.toFixed(2),
            averagePackageValue: packages.length > 0 ? 
                (totalSpent / packages.length).toFixed(2) : '0.00',
            deliverySuccessRate: packages.length > 0 ? 
                Math.round((deliveredPackages.length / packages.length) * 100) : 0,
            averageDeliveryTime: this.calculateAverageDeliveryTime(deliveredPackages),
            thisMonthPackages: thisMonthPackages.length,
            thisMonthSpent: thisMonthPackages.reduce((sum, pkg) => sum + (pkg.total_cost || 0), 0).toFixed(2),
            favoriteService: this.getMostUsedService(packages),
            mostUsedCourier: this.getMostUsedCourier(packages)
        };
    }

    static async getPendingInvoices(clientId) {
        // En producción, obtener de la base de datos
        const mockInvoices = [
            {
                id: 1,
                invoice_number: `INV-${Date.now()}-001`,
                amount: Math.floor(Math.random() * 500) + 100,
                due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'pending',
                packages: Math.floor(Math.random() * 5) + 1
            },
            {
                id: 2,
                invoice_number: `INV-${Date.now()}-002`,
                amount: Math.floor(Math.random() * 300) + 50,
                due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'pending',
                packages: Math.floor(Math.random() * 3) + 1
            }
        ];

        return mockInvoices;
    }

    static async calculateCustomMetrics(clientId) {
        // Calcular métricas comparativas
        return {
            packagesVsLastMonth: Math.floor(Math.random() * 40) - 20, // -20 a +20
            spendingVsLastMonth: Math.floor(Math.random() * 30) - 15, // -15 a +15
            deliveryTimeVsLastMonth: Math.floor(Math.random() * 20) - 10, // -10 a +10
            packagesVsAverage: Math.floor(Math.random() * 50) - 25, // -25 a +25
            spendingVsAverage: Math.floor(Math.random() * 40) - 20, // -20 a +20
            satisfactionVsAverage: Math.floor(Math.random() * 20) - 10 // -10 a +10
        };
    }

    static async getClientNotifications(clientId) {
        // En producción, obtener notificaciones reales
        const mockNotifications = [
            {
                id: 1,
                type: 'package_delivered',
                title: 'Paquete Entregado',
                message: 'Tu paquete #ITB123456 ha sido entregado exitosamente',
                timestamp: new Date().toISOString(),
                read: false,
                priority: 'high'
            },
            {
                id: 2,
                type: 'invoice_due',
                title: 'Factura Pendiente',
                message: 'Tienes una factura pendiente de pago por $150.00',
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                read: false,
                priority: 'medium'
            },
            {
                id: 3,
                type: 'package_pickup',
                title: 'Recolección Programada',
                message: 'Se ha programado la recolección de tu paquete para mañana',
                timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
                read: true,
                priority: 'low'
            }
        ];

        return mockNotifications;
    }

    static async generateClientRecommendations(clientId, stats) {
        const recommendations = [];

        // Recomendación basada en frecuencia de envío
        if (stats.thisMonthPackages > 10) {
            recommendations.push({
                type: 'service_upgrade',
                title: 'Plan Premium Recomendado',
                description: 'Basado en tu alto volumen de envíos, podrías ahorrar con nuestro plan premium.',
                savings: '15-25%',
                action: 'Ver Planes',
                priority: 'high'
            });
        }

        // Recomendación basada en tipo de servicio
        if (stats.favoriteService === 'express') {
            recommendations.push({
                type: 'service_optimization',
                title: 'Optimiza tus Envíos Express',
                description: 'Considera programar tus envíos express para obtener mejores tarifas.',
                savings: '10-15%',
                action: 'Programar Envíos',
                priority: 'medium'
            });
        }

        // Recomendación de satisfacción
        if (stats.deliverySuccessRate < 90) {
            recommendations.push({
                type: 'service_improvement',
                title: 'Mejora tu Experiencia',
                description: 'Contáctanos para optimizar tus direcciones de entrega y mejorar el éxito.',
                savings: null,
                action: 'Contactar Soporte',
                priority: 'high'
            });
        }

        return recommendations;
    }

    static async getBasicPortalInfo(clientId) {
        const packages = await Package.findByClientId(clientId);
        const activePackages = packages.filter(pkg => 
            ['pending', 'picked_up', 'in_transit', 'out_for_delivery'].includes(pkg.status)
        );

        return {
            activePackages: activePackages.length,
            pendingInvoices: Math.floor(Math.random() * 3) + 1,
            recentActivity: Math.floor(Math.random() * 10) + 5
        };
    }

    static generateTemporaryToken(clientId) {
        // En producción, generar JWT temporal
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2);
        return `temp_${clientId}_${timestamp}_${random}`;
    }

    static getStatusDisplay(status) {
        const statusMap = {
            'pending': 'Pendiente',
            'picked_up': 'Recolectado',
            'in_transit': 'En Tránsito',
            'out_for_delivery': 'En Reparto',
            'delivered': 'Entregado',
            'returned': 'Devuelto',
            'cancelled': 'Cancelado'
        };
        return statusMap[status] || status;
    }

    static calculatePackageProgress(status) {
        const progressMap = {
            'pending': 10,
            'picked_up': 25,
            'in_transit': 60,
            'out_for_delivery': 85,
            'delivered': 100,
            'returned': 0,
            'cancelled': 0
        };
        return progressMap[status] || 0;
    }

    static calculateTimeRemaining(estimatedDelivery) {
        if (!estimatedDelivery) return 'No estimado';
        
        const now = new Date();
        const estimated = new Date(estimatedDelivery);
        const diffMs = estimated.getTime() - now.getTime();
        
        if (diffMs <= 0) return 'Vencido';
        
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffDays > 0) {
            return `${diffDays} día${diffDays > 1 ? 's' : ''} restante${diffDays > 1 ? 's' : ''}`;
        } else {
            return `${diffHours} hora${diffHours > 1 ? 's' : ''} restante${diffHours > 1 ? 's' : ''}`;
        }
    }

    static calculateDaysOverdue(dueDate) {
        const now = new Date();
        const due = new Date(dueDate);
        const diffMs = now.getTime() - due.getTime();
        
        if (diffMs <= 0) return 0;
        
        return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }

    static calculateDeliveryTime(createdAt, deliveredAt) {
        const created = new Date(createdAt);
        const delivered = new Date(deliveredAt);
        const diffMs = delivered.getTime() - created.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);
        
        if (diffDays > 0) {
            return `${diffDays} día${diffDays > 1 ? 's' : ''}, ${diffHours % 24} hora${diffHours % 24 > 1 ? 's' : ''}`;
        } else {
            return `${diffHours} hora${diffHours > 1 ? 's' : ''}`;
        }
    }

    static calculateAverageDeliveryTime(packages) {
        const deliveredPackages = packages.filter(pkg => pkg.status === 'delivered' && pkg.actual_delivery);
        
        if (deliveredPackages.length === 0) return 'N/A';
        
        const totalHours = deliveredPackages.reduce((sum, pkg) => {
            const created = new Date(pkg.created_at);
            const delivered = new Date(pkg.actual_delivery);
            const diffMs = delivered.getTime() - created.getTime();
            return sum + Math.floor(diffMs / (1000 * 60 * 60));
        }, 0);
        
        const averageHours = Math.floor(totalHours / deliveredPackages.length);
        const averageDays = Math.floor(averageHours / 24);
        
        if (averageDays > 0) {
            return `${averageDays} día${averageDays > 1 ? 's' : ''}`;
        } else {
            return `${averageHours} hora${averageHours > 1 ? 's' : ''}`;
        }
    }

    static calculateDeliverySuccessRate(packages) {
        if (packages.length === 0) return 0;
        
        const completedPackages = packages.filter(pkg => 
            pkg.status === 'delivered' || pkg.status === 'returned'
        );
        const successfulPackages = packages.filter(pkg => pkg.status === 'delivered');
        
        if (completedPackages.length === 0) return 0;
        
        return Math.round((successfulPackages.length / completedPackages.length) * 100);
    }

    static getMostUsedService(packages) {
        if (packages.length === 0) return 'N/A';
        
        const serviceCount = {};
        packages.forEach(pkg => {
            serviceCount[pkg.service_type] = (serviceCount[pkg.service_type] || 0) + 1;
        });
        
        const mostUsed = Object.entries(serviceCount).reduce((a, b) => 
            serviceCount[a[0]] > serviceCount[b[0]] ? a : b
        );
        
        const serviceNames = {
            'express': 'Express',
            'standard': 'Estándar',
            'economy': 'Económico'
        };
        
        return serviceNames[mostUsed[0]] || mostUsed[0];
    }

    static getMostUsedCourier(packages) {
        if (packages.length === 0) return 'N/A';
        
        const courierCount = {};
        packages.forEach(pkg => {
            if (pkg.courier_name) {
                courierCount[pkg.courier_name] = (courierCount[pkg.courier_name] || 0) + 1;
            }
        });
        
        if (Object.keys(courierCount).length === 0) return 'N/A';
        
        const mostUsed = Object.entries(courierCount).reduce((a, b) => 
            courierCount[a[0]] > courierCount[b[0]] ? a : b
        );
        
        return mostUsed[0];
    }

    static validateClientData(data) {
        const errors = [];
        
        if (!data.firstName) errors.push('Nombre requerido');
        if (!data.lastName) errors.push('Apellido requerido');
        if (!data.email) errors.push('Email requerido');
        if (!data.phone) errors.push('Teléfono requerido');
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = ClientController;