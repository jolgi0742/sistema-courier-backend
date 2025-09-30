// src/controllers/dashboardController.js - CONTROLADOR COMPLETO

const Package = require('../models/Package');
const Courier = require('../models/Courier');
const Client = require('../models/Client');
const User = require('../models/User');
const WHR = require('../models/whr');

class DashboardController {
    // Obtener estadísticas principales del dashboard
    static async getStats(req, res) {
        try {
            // Obtener estadísticas de todos los modelos
            const packageStats = await Package.getStatistics();
            const courierStats = await Courier.getStatistics();
            const clientStats = await Client.getStatistics();
            const userStats = await User.getStatistics();
            const whrStats = await WHR.getStatistics();

            // Calcular métricas adicionales
            const totalRevenue = parseFloat(packageStats.total_revenue || 0);
            const monthlyGrowth = Math.floor(Math.random() * 15) + 5; // 5-20% simulado
            const customerSatisfaction = 4.6; // Simulado

            res.json({
                success: true,
                data: {
                    // Métricas principales
                    mainMetrics: {
                        totalPackages: packageStats.total,
                        activePackages: packageStats.pending + packageStats.in_transit + packageStats.out_for_delivery,
                        deliveredPackages: packageStats.delivered,
                        totalRevenue: totalRevenue.toFixed(2),
                        totalClients: clientStats.total,
                        activeCouriers: courierStats.available + courierStats.busy,
                        customerSatisfaction: customerSatisfaction
                    },

                    // Estadísticas de paquetes
                    packageStats: {
                        total: packageStats.total,
                        pending: packageStats.pending,
                        picked_up: packageStats.picked_up,
                        in_transit: packageStats.in_transit,
                        out_for_delivery: packageStats.out_for_delivery,
                        delivered: packageStats.delivered,
                        returned: packageStats.returned,
                        averageWeight: packageStats.avg_weight,
                        totalValue: packageStats.total_value,
                        deliveryRate: packageStats.total > 0 ? 
                            Math.round((packageStats.delivered / packageStats.total) * 100) : 0
                    },

                    // Estadísticas de couriers
                    courierStats: {
                        total: courierStats.total,
                        available: courierStats.available,
                        busy: courierStats.busy,
                        offline: courierStats.offline,
                        totalDeliveries: courierStats.totalDeliveries,
                        successRate: courierStats.successRate,
                        averageRating: courierStats.averageRating
                    },

                    // Estadísticas de clientes
                    clientStats: {
                        total: clientStats.total,
                        commercial: clientStats.commercial,
                        retail: clientStats.retail,
                        individual: clientStats.individual,
                        totalSpent: clientStats.totalSpent,
                        averageSpending: clientStats.averageSpendingPerClient,
                        averagePackages: clientStats.averagePackagesPerClient
                    },

                    // Estadísticas de usuarios
                    userStats: {
                        total: userStats.total,
                        admins: userStats.admins,
                        clients: userStats.clients,
                        couriers: userStats.couriers,
                        verified: userStats.verified,
                        verificationRate: userStats.verificationRate
                    },

                    // Estadísticas WHR (Warehouse Receipt)
                    whrStats: {
                        total: whrStats.total,
                        pending: whrStats.pending,
                        awb: whrStats.awb,
                        bl: whrStats.bl,
                        emailsSent: whrStats.emailsSent,
                        emailsPending: whrStats.emailsPending,
                        totalWeight: whrStats.totalWeight,
                        totalValue: whrStats.totalValue,
                        totalVolume: whrStats.totalVolume
                    },

                    // Métricas de crecimiento
                    growthMetrics: {
                        monthlyGrowth: monthlyGrowth,
                        revenueGrowth: Math.floor(Math.random() * 10) + 8, // 8-18%
                        clientGrowth: Math.floor(Math.random() * 8) + 5, // 5-13%
                        deliveryImprovement: Math.floor(Math.random() * 5) + 3 // 3-8%
                    },

                    // Timestamp
                    timestamp: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Error obteniendo estadísticas del dashboard:', error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo estadísticas del dashboard',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Obtener actividad reciente
    static async getRecentActivity(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 20;

            // Simular actividad reciente (en producción, obtener de la base de datos)
            const recentActivity = [
                {
                    id: 1,
                    type: 'package_created',
                    title: 'Nuevo paquete creado',
                    description: 'Paquete ITB241216004 creado por Juan Pérez',
                    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
                    icon: 'package',
                    color: 'blue',
                    user: 'Juan Pérez',
                    details: { trackingNumber: 'ITB241216004' }
                },
                {
                    id: 2,
                    type: 'package_delivered',
                    title: 'Paquete entregado',
                    description: 'Paquete ITB241216001 entregado exitosamente',
                    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
                    icon: 'check-circle',
                    color: 'green',
                    user: 'Roberto Méndez',
                    details: { trackingNumber: 'ITB241216001', recipient: 'Carlos Rodríguez' }
                },
                {
                    id: 3,
                    type: 'courier_assigned',
                    title: 'Courier asignado',
                    description: '3 paquetes asignados a Carmen Solís',
                    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                    icon: 'user-plus',
                    color: 'purple',
                    user: 'Sistema',
                    details: { courierName: 'Carmen Solís', packageCount: 3 }
                },
                {
                    id: 4,
                    type: 'client_registered',
                    title: 'Nuevo cliente registrado',
                    description: 'Cliente María Fernández se registró en el sistema',
                    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
                    icon: 'user-plus',
                    color: 'blue',
                    user: 'María Fernández',
                    details: { clientType: 'Individual' }
                },
                {
                    id: 5,
                    type: 'whr_created',
                    title: 'WHR creado',
                    description: 'Warehouse Receipt WHR241216004 creado',
                    timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
                    icon: 'file-text',
                    color: 'orange',
                    user: 'Sistema CAMCA',
                    details: { whrNumber: 'WHR241216004' }
                },
                {
                    id: 6,
                    type: 'payment_received',
                    title: 'Pago recibido',
                    description: 'Pago de $245.50 recibido de Empresa Ejemplo S.A.',
                    timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
                    icon: 'dollar-sign',
                    color: 'green',
                    user: 'Sistema de pagos',
                    details: { amount: 245.50, client: 'Empresa Ejemplo S.A.' }
                },
                {
                    id: 7,
                    type: 'package_picked_up',
                    title: 'Paquete recolectado',
                    description: 'Paquete ITB241216002 recolectado por Diego Ramírez',
                    timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
                    icon: 'truck',
                    color: 'blue',
                    user: 'Diego Ramírez',
                    details: { trackingNumber: 'ITB241216002' }
                },
                {
                    id: 8,
                    type: 'system_alert',
                    title: 'Alerta del sistema',
                    description: 'Capacidad de almacén al 85%',
                    timestamp: new Date(Date.now() - 150 * 60 * 1000).toISOString(),
                    icon: 'alert-triangle',
                    color: 'yellow',
                    user: 'Sistema',
                    details: { capacity: 85, threshold: 80 }
                }
            ];

            res.json({
                success: true,
                data: recentActivity.slice(0, limit)
            });

        } catch (error) {
            console.error('Error obteniendo actividad reciente:', error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo actividad reciente'
            });
        }
    }

    // Obtener métricas de rendimiento
    static async getPerformanceMetrics(req, res) {
        try {
            const period = req.query.period || '7d'; // 7d, 30d, 90d

            // Simular métricas de rendimiento (en producción, calcular desde la base de datos)
            const performanceMetrics = {
                deliveryTime: {
                    average: '2.4 días',
                    target: '3.0 días',
                    improvement: '+12%',
                    trend: 'up'
                },
                onTimeDelivery: {
                    rate: 94.2,
                    target: 95.0,
                    improvement: '+2.1%',
                    trend: 'up'
                },
                customerSatisfaction: {
                    score: 4.6,
                    target: 4.5,
                    improvement: '+0.2',
                    trend: 'up'
                },
                courierEfficiency: {
                    score: 88.5,
                    target: 85.0,
                    improvement: '+5.2%',
                    trend: 'up'
                },
                costPerDelivery: {
                    amount: 12.45,
                    target: 13.00,
                    improvement: '-4.2%',
                    trend: 'down',
                    currency: 'USD'
                },
                revenuePerPackage: {
                    amount: 25.75,
                    target: 24.00,
                    improvement: '+7.3%',
                    trend: 'up',
                    currency: 'USD'
                }
            };

            // Datos de gráficos para el período seleccionado
            const chartData = this.generateChartData(period);

            res.json({
                success: true,
                data: {
                    period,
                    metrics: performanceMetrics,
                    charts: chartData,
                    lastUpdated: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Error obteniendo métricas de rendimiento:', error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo métricas de rendimiento'
            });
        }
    }

    // Obtener top couriers
    static async getTopCouriers(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 10;

            // Obtener todos los couriers y ordenar por rendimiento
            const couriers = await Courier.findAllWithDetails({}, 50, 0);
            
            const topCouriers = couriers
                .sort((a, b) => {
                    // Ordenar por una combinación de entregas exitosas y calificación
                    const scoreA = (a.successful_deliveries || 0) * (a.average_rating || 0);
                    const scoreB = (b.successful_deliveries || 0) * (b.average_rating || 0);
                    return scoreB - scoreA;
                })
                .slice(0, limit)
                .map((courier, index) => ({
                    rank: index + 1,
                    id: courier.id,
                    name: `${courier.first_name} ${courier.last_name}`,
                    avatar: courier.avatar || '/images/default-avatar.png',
                    totalDeliveries: courier.total_deliveries || 0,
                    successfulDeliveries: courier.successful_deliveries || 0,
                    rating: parseFloat(courier.average_rating || 0).toFixed(1),
                    onTimeRate: courier.on_time_rate || 0,
                    vehicle: courier.vehicle_type || 'N/A',
                    zone: courier.assigned_zone || 'N/A',
                    status: courier.status,
                    isAvailable: courier.is_available,
                    thisMonthDeliveries: Math.floor(Math.random() * 50) + 10, // Simulado
                    efficiency: Math.floor(Math.random() * 20) + 80 // 80-100%
                }));

            res.json({
                success: true,
                data: topCouriers
            });

        } catch (error) {
            console.error('Error obteniendo top couriers:', error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo top couriers'
            });
        }
    }

    // Obtener alertas del sistema
    static async getSystemAlerts(req, res) {
        try {
            // Simular alertas del sistema
            const alerts = [
                {
                    id: 1,
                    type: 'warning',
                    title: 'Capacidad de almacén alta',
                    message: 'El almacén principal está al 85% de su capacidad',
                    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
                    priority: 'high',
                    status: 'active',
                    action: 'Revisar espacio disponible'
                },
                {
                    id: 2,
                    type: 'info',
                    title: 'Actualización del sistema',
                    message: 'Nueva versión disponible v2.1.0',
                    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                    priority: 'medium',
                    status: 'active',
                    action: 'Programar actualización'
                },
                {
                    id: 3,
                    type: 'success',
                    title: 'Objetivo mensual alcanzado',
                    message: 'Se alcanzó el objetivo de 1000 entregas este mes',
                    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
                    priority: 'low',
                    status: 'resolved',
                    action: 'Celebrar el logro'
                }
            ];

            const activeAlerts = alerts.filter(alert => alert.status === 'active');

            res.json({
                success: true,
                data: {
                    total: alerts.length,
                    active: activeAlerts.length,
                    alerts: alerts
                }
            });

        } catch (error) {
            console.error('Error obteniendo alertas del sistema:', error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo alertas del sistema'
            });
        }
    }

    // Método auxiliar para generar datos de gráficos
    static generateChartData(period) {
        const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
        const deliveryData = [];
        const revenueData = [];
        const packageData = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            deliveryData.push({
                date: date.toISOString().split('T')[0],
                delivered: Math.floor(Math.random() * 50) + 20,
                onTime: Math.floor(Math.random() * 45) + 18,
                delayed: Math.floor(Math.random() * 8) + 1
            });

            revenueData.push({
                date: date.toISOString().split('T')[0],
                revenue: parseFloat((Math.random() * 2000 + 800).toFixed(2)),
                target: 1500
            });

            packageData.push({
                date: date.toISOString().split('T')[0],
                created: Math.floor(Math.random() * 30) + 15,
                delivered: Math.floor(Math.random() * 25) + 10,
                inTransit: Math.floor(Math.random() * 15) + 5
            });
        }

        return {
            deliveryTrend: deliveryData,
            revenueTrend: revenueData,
            packageTrend: packageData
        };
    }
}

module.exports = DashboardController;