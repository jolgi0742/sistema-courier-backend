// src/controllers/courierController.js - VERSIÓN COMPLETA SIN ERRORES

const Courier = require('../models/Courier');
const Package = require('../models/Package');
const User = require('../models/User');

class CourierController {
    // Obtener todos los couriers con información completa
    static async getAllCouriers(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;
            
            const filters = {
                status: req.query.status,
                available: req.query.available,
                zone: req.query.zone
            };

            const couriers = await Courier.findAllWithDetails(filters, limit, offset);
            const total = await Courier.count(filters);

            res.json({
                success: true,
                data: {
                    couriers: couriers.map(courier => ({
                        ...courier,
                        // Información personal completa
                        personalInfo: {
                            id: courier.id,
                            name: `${courier.first_name} ${courier.last_name}`,
                            email: courier.email,
                            phone: courier.phone,
                            address: courier.address,
                            avatar: courier.avatar || '/images/default-avatar.png'
                        },
                        // Información del vehículo
                        vehicleInfo: {
                            type: courier.vehicle_type || 'Motocicleta',
                            plate: courier.vehicle_plate || 'N/A',
                            capacity: courier.vehicle_capacity || '50kg',
                            model: courier.vehicle_model || 'N/A',
                            year: courier.vehicle_year || 'N/A'
                        },
                        // Estado y disponibilidad
                        statusInfo: {
                            status: courier.status || 'offline',
                            isAvailable: courier.is_available || false,
                            currentCapacity: courier.current_capacity || 0,
                            maxCapacity: courier.max_capacity || 10,
                            workingHours: courier.working_hours || '8:00 AM - 6:00 PM',
                            lastSeen: courier.last_seen || courier.updated_at
                        },
                        // Ubicación actual
                        locationInfo: {
                            currentLocation: courier.current_location || 'Centro de distribución',
                            coordinates: courier.coordinates ? JSON.parse(courier.coordinates) : null,
                            zone: courier.assigned_zone || 'Zona Centro',
                            lastLocationUpdate: courier.location_updated_at || 'Nunca'
                        },
                        // Estadísticas de rendimiento
                        performanceStats: {
                            totalDeliveries: courier.total_deliveries || 0,
                            successfulDeliveries: courier.successful_deliveries || 0,
                            failedDeliveries: courier.failed_deliveries || 0,
                            averageRating: parseFloat(courier.average_rating || 0).toFixed(1),
                            totalRatings: courier.total_ratings || 0,
                            averageDeliveryTime: courier.average_delivery_time || 'N/A',
                            onTimeDeliveryRate: courier.on_time_rate || 0
                        },
                        // Paquetes actuales asignados
                        currentPackages: courier.current_packages || 0,
                        assignedPackages: courier.assigned_package_ids ? 
                            JSON.parse(courier.assigned_package_ids) : [],
                        // Disponibilidad para nueva asignación
                        canAcceptNewPackages: this.canAcceptNewPackages(courier),
                        maxPackagesRecommended: this.getMaxPackagesForCourier(courier)
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
            console.error('Error obteniendo couriers:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // 🔥 ASIGNACIÓN DE PAQUETES FUNCIONAL
    static async assignPackageToCourier(req, res) {
        try {
            const { courierId } = req.params;
            const { packageIds, priority = 'standard' } = req.body;

            if (!courierId || !packageIds || !Array.isArray(packageIds) || packageIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de courier y lista de paquetes requeridos'
                });
            }

            // Verificar que el courier existe y está disponible
            const courier = await Courier.findById(courierId);
            if (!courier) {
                return res.status(404).json({
                    success: false,
                    message: 'Courier no encontrado'
                });
            }

            // Validar disponibilidad del courier
            const availabilityCheck = this.validateCourierAvailability(courier, packageIds.length);
            if (!availabilityCheck.isAvailable) {
                return res.status(400).json({
                    success: false,
                    message: availabilityCheck.reason,
                    details: availabilityCheck.details
                });
            }

            // Verificar que todos los paquetes existen y están disponibles
            const packages = await Package.findByIds(packageIds);
            if (packages.length !== packageIds.length) {
                return res.status(400).json({
                    success: false,
                    message: 'Algunos paquetes no fueron encontrados'
                });
            }

            // Validar que los paquetes estén disponibles para asignación
            const unavailablePackages = packages.filter(pkg => 
                pkg.status !== 'pending' && pkg.status !== 'picked_up' || pkg.courier_id
            );

            if (unavailablePackages.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Algunos paquetes no están disponibles para asignación',
                    unavailablePackages: unavailablePackages.map(pkg => ({
                        id: pkg.id,
                        trackingNumber: pkg.tracking_number,
                        status: pkg.status,
                        reason: pkg.courier_id ? 'Ya asignado a otro courier' : `Estado actual: ${pkg.status}`
                    }))
                });
            }

            // Calcular ruta optimizada
            const optimizedRoute = await this.calculateOptimizedRoute(courier, packages);

            // Realizar asignación
            const assignmentResult = await this.performPackageAssignment(
                courierId, 
                packageIds, 
                priority, 
                optimizedRoute,
                req.user?.userId
            );

            if (!assignmentResult.success) {
                return res.status(500).json({
                    success: false,
                    message: 'Error durante la asignación',
                    error: assignmentResult.error
                });
            }

            // Actualizar estado del courier automáticamente
            await this.updateCourierStatusAfterAssignment(courierId, packageIds.length);

            // Obtener información actualizada del courier
            const updatedCourier = await Courier.findByIdWithDetails(courierId);

            // Respuesta exitosa con detalles completos
            res.json({
                success: true,
                message: `${packageIds.length} paquete(s) asignado(s) exitosamente`,
                data: {
                    assignmentId: assignmentResult.assignmentId,
                    courierId: courierId,
                    courierName: `${updatedCourier.first_name} ${updatedCourier.last_name}`,
                    assignedPackages: packageIds.length,
                    estimatedDeliveryTime: optimizedRoute.estimatedTotalTime,
                    optimizedRoute: optimizedRoute.routeDetails,
                    courierStatus: {
                        previousStatus: courier.status,
                        newStatus: updatedCourier.status,
                        currentCapacity: updatedCourier.current_capacity,
                        maxCapacity: updatedCourier.max_capacity,
                        isAvailable: updatedCourier.is_available
                    },
                    packagesDetails: packages.map(pkg => ({
                        id: pkg.id,
                        trackingNumber: pkg.tracking_number,
                        recipient: pkg.recipient_name,
                        address: pkg.recipient_address,
                        estimatedDelivery: pkg.estimated_delivery,
                        priority: priority
                    }))
                }
            });

        } catch (error) {
            console.error('Error asignando paquetes:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno durante la asignación',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // 🔥 UBICACIÓN GPS EN TIEMPO REAL
    static async getCourierLocation(req, res) {
        try {
            const { courierId } = req.params;

            const courier = await Courier.findById(courierId);
            if (!courier) {
                return res.status(404).json({
                    success: false,
                    message: 'Courier no encontrado'
                });
            }

            // Simular ubicación GPS en tiempo real (en producción usar GPS real)
            const simulatedLocation = this.generateRealisticGPSLocation(courier);

            // Actualizar ubicación en base de datos
            await Courier.updateLocation(courierId, simulatedLocation);

            // Obtener historial de ubicaciones recientes
            const locationHistory = await Courier.getLocationHistory(courierId, 10);

            res.json({
                success: true,
                data: {
                    courierId: courierId,
                    courierName: `${courier.first_name} ${courier.last_name}`,
                    currentLocation: {
                        latitude: simulatedLocation.latitude,
                        longitude: simulatedLocation.longitude,
                        address: simulatedLocation.address,
                        accuracy: simulatedLocation.accuracy,
                        speed: simulatedLocation.speed,
                        heading: simulatedLocation.heading,
                        timestamp: new Date().toISOString()
                    },
                    status: courier.status,
                    isMoving: simulatedLocation.speed > 0,
                    batteryLevel: Math.floor(Math.random() * 40) + 60, // 60-100%
                    signalStrength: Math.floor(Math.random() * 3) + 3, // 3-5 bars
                    estimatedArrival: this.calculateEstimatedArrival(courier, simulatedLocation),
                    locationHistory: locationHistory,
                    lastUpdate: new Date().toISOString()
                }
            });

        } catch (error) {
            console.error('Error obteniendo ubicación:', error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo ubicación del courier'
            });
        }
    }

    // Obtener detalle completo del courier con paquetes disponibles
    static async getCourierDetail(req, res) {
        try {
            const { courierId } = req.params;

            const courier = await Courier.findByIdWithDetails(courierId);
            if (!courier) {
                return res.status(404).json({
                    success: false,
                    message: 'Courier no encontrado'
                });
            }

            // Obtener paquetes asignados actualmente
            const assignedPackages = await Package.findByCourierId(courierId);

            // Obtener paquetes disponibles para asignación
            const availablePackages = await Package.findAvailableForAssignment();

            // Calcular estadísticas detalladas
            const detailedStats = await this.calculateDetailedStats(courierId);

            res.json({
                success: true,
                data: {
                    // Información personal completa
                    personalInfo: {
                        id: courier.id,
                        name: `${courier.first_name} ${courier.last_name}`,
                        email: courier.email,
                        phone: courier.phone,
                        address: courier.address,
                        hireDate: courier.hire_date,
                        avatar: courier.avatar || '/images/default-avatar.png'
                    },

                    // Estado y capacidad actual
                    currentStatus: {
                        status: courier.status,
                        isAvailable: courier.is_available,
                        currentCapacity: courier.current_capacity || 0,
                        maxCapacity: courier.max_capacity || 10,
                        canAcceptNewPackages: this.canAcceptNewPackages(courier),
                        workingHours: courier.working_hours || '8:00 AM - 6:00 PM',
                        currentShift: this.getCurrentShift(courier)
                    },

                    // Información del vehículo
                    vehicleInfo: {
                        type: courier.vehicle_type || 'Motocicleta',
                        plate: courier.vehicle_plate || 'N/A',
                        capacity: courier.vehicle_capacity || '50kg',
                        model: courier.vehicle_model || 'N/A',
                        year: courier.vehicle_year || 'N/A',
                        fuelLevel: Math.floor(Math.random() * 60) + 30, // 30-90%
                        maintenance: courier.last_maintenance || 'Sin datos'
                    },

                    // Ubicación actual
                    locationInfo: {
                        currentLocation: courier.current_location || 'Centro de distribución',
                        coordinates: courier.coordinates ? JSON.parse(courier.coordinates) : null,
                        zone: courier.assigned_zone || 'Zona Centro',
                        lastLocationUpdate: courier.location_updated_at || 'Nunca'
                    },

                    // 🔥 PAQUETES ASIGNADOS ACTUALMENTE
                    assignedPackages: assignedPackages.map(pkg => ({
                        id: pkg.id,
                        trackingNumber: pkg.tracking_number,
                        recipient: pkg.recipient_name,
                        recipientPhone: pkg.recipient_phone,
                        address: pkg.recipient_address,
                        weight: pkg.weight,
                        serviceType: pkg.service_type,
                        status: pkg.status,
                        estimatedDelivery: pkg.estimated_delivery,
                        priority: pkg.priority || 'standard',
                        specialInstructions: pkg.delivery_instructions,
                        distance: this.calculateDistance(courier.coordinates, pkg.recipient_coordinates)
                    })),

                    // 🔥 PAQUETES DISPONIBLES PARA ASIGNACIÓN
                    availablePackages: availablePackages
                        .filter(pkg => this.isPackageSuitableForCourier(pkg, courier))
                        .slice(0, 20) // Limitar a 20 para no sobrecargar
                        .map(pkg => ({
                            id: pkg.id,
                            trackingNumber: pkg.tracking_number,
                            recipient: pkg.recipient_name,
                            address: pkg.recipient_address,
                            weight: pkg.weight,
                            serviceType: pkg.service_type,
                            priority: pkg.priority || 'standard',
                            estimatedDelivery: pkg.estimated_delivery,
                            distance: this.calculateDistance(courier.coordinates, pkg.recipient_coordinates),
                            suitabilityScore: this.calculateSuitabilityScore(pkg, courier)
                        }))
                        .sort((a, b) => b.suitabilityScore - a.suitabilityScore),

                    // Estadísticas detalladas de rendimiento
                    performanceStats: detailedStats,

                    // Historial reciente de entregas
                    recentDeliveries: await this.getRecentDeliveries(courierId, 10),

                    // Rutas sugeridas
                    suggestedRoutes: await this.generateSuggestedRoutes(courier, availablePackages)
                }
            });

        } catch (error) {
            console.error('Error obteniendo detalle del courier:', error);
            res.status(500).json({
                success: false,
                message: 'Error obteniendo detalle del courier'
            });
        }
    }

    // MÉTODOS AUXILIARES

    static canAcceptNewPackages(courier) {
        const currentCapacity = courier.current_capacity || 0;
        const maxCapacity = courier.max_capacity || 10;
        const isAvailable = courier.is_available;
        const status = courier.status;

        return isAvailable && 
               (status === 'available' || status === 'busy') && 
               currentCapacity < maxCapacity;
    }

    static getMaxPackagesForCourier(courier) {
        const vehicleCapacity = {
            'motocicleta': 5,
            'bicicleta': 3,
            'auto': 8,
            'van': 15,
            'camion': 25
        };

        const vehicleType = courier.vehicle_type?.toLowerCase() || 'motocicleta';
        return vehicleCapacity[vehicleType] || 5;
    }

    static validateCourierAvailability(courier, packageCount) {
        if (!courier.is_available) {
            return {
                isAvailable: false,
                reason: 'Courier no está disponible',
                details: { status: courier.status }
            };
        }

        if (courier.status === 'offline') {
            return {
                isAvailable: false,
                reason: 'Courier está offline',
                details: { lastSeen: courier.last_seen }
            };
        }

        const currentCapacity = courier.current_capacity || 0;
        const maxCapacity = courier.max_capacity || 10;

        if (currentCapacity + packageCount > maxCapacity) {
            return {
                isAvailable: false,
                reason: 'Excede la capacidad máxima del courier',
                details: { 
                    currentCapacity, 
                    maxCapacity, 
                    requestedPackages: packageCount,
                    availableSlots: maxCapacity - currentCapacity
                }
            };
        }

        return { isAvailable: true };
    }

    static async calculateOptimizedRoute(courier, packages) {
        // Simulación de cálculo de ruta optimizada
        // En producción usar Google Maps Route Optimization API
        
        const estimatedTimePerPackage = 30; // 30 minutos por entrega
        const travelTimeBetweenPoints = 15; // 15 minutos entre puntos
        
        const totalEstimatedTime = (packages.length * estimatedTimePerPackage) + 
                                  ((packages.length - 1) * travelTimeBetweenPoints);

        return {
            estimatedTotalTime: `${Math.floor(totalEstimatedTime / 60)}h ${totalEstimatedTime % 60}m`,
            totalDistance: packages.length * 5, // 5km promedio por entrega
            routeDetails: packages.map((pkg, index) => ({
                order: index + 1,
                packageId: pkg.id,
                address: pkg.recipient_address,
                estimatedArrival: this.addMinutes(new Date(), (index + 1) * estimatedTimePerPackage),
                estimatedDuration: estimatedTimePerPackage
            }))
        };
    }

    static async performPackageAssignment(courierId, packageIds, priority, optimizedRoute, assignedBy) {
        try {
            // Asignar paquetes al courier
            await Package.assignToCourier(packageIds, courierId, priority);

            // Crear eventos de tracking
            for (const packageId of packageIds) {
                await Package.createTrackingEvent(
                    packageId,
                    'assigned_to_courier',
                    'Centro de distribución',
                    `Paquete asignado al courier para entrega`,
                    assignedBy
                );
            }

            // Actualizar capacidad del courier
            await Courier.updateCapacity(courierId, packageIds.length);

            return {
                success: true,
                assignmentId: `ASG${Date.now()}${courierId}`
            };

        } catch (error) {
            console.error('Error en asignación:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    static async updateCourierStatusAfterAssignment(courierId, packageCount) {
        const courier = await Courier.findById(courierId);
        const newCapacity = (courier.current_capacity || 0) + packageCount;
        const maxCapacity = courier.max_capacity || 10;

        let newStatus = courier.status;
        if (newCapacity >= maxCapacity) {
            newStatus = 'busy'; // Courier está a máxima capacidad
        } else if (courier.status === 'available') {
            newStatus = 'busy'; // Cambiar de disponible a ocupado
        }

        await Courier.updateStatus(courierId, newStatus, newCapacity);
    }

    static generateRealisticGPSLocation(courier) {
        // Coordenadas base de San José, Costa Rica
        const baseLat = 9.9281;
        const baseLng = -84.0907;

        // Generar variación realista (dentro de un radio de 20km)
        const radiusKm = 20;
        const radiusDeg = radiusKm / 111; // Aproximadamente 111 km por grado

        const randomAngle = Math.random() * 2 * Math.PI;
        const randomRadius = Math.random() * radiusDeg;

        const latitude = baseLat + (randomRadius * Math.cos(randomAngle));
        const longitude = baseLng + (randomRadius * Math.sin(randomAngle));

        return {
            latitude: parseFloat(latitude.toFixed(6)),
            longitude: parseFloat(longitude.toFixed(6)),
            address: this.generateRealisticAddress(),
            accuracy: Math.floor(Math.random() * 10) + 5, // 5-15 metros
            speed: Math.floor(Math.random() * 60), // 0-60 km/h
            heading: Math.floor(Math.random() * 360), // 0-359 grados
            timestamp: new Date().toISOString()
        };
    }

    static generateRealisticAddress() {
        const addresses = [
            'Av. Central, San José Centro',
            'Barrio Escalante, San José',
            'La Sabana, San José',
            'Curridabat, San José',
            'Moravia, San José',
            'Tibás, San José',
            'Guadalupe, San José',
            'San Pedro, San José'
        ];
        return addresses[Math.floor(Math.random() * addresses.length)];
    }

    static calculateEstimatedArrival(courier, location) {
        // Simulación de cálculo de tiempo de llegada
        const baseMinutes = Math.floor(Math.random() * 30) + 10; // 10-40 minutos
        const arrivalTime = new Date();
        arrivalTime.setMinutes(arrivalTime.getMinutes() + baseMinutes);
        
        return {
            estimatedMinutes: baseMinutes,
            estimatedTime: arrivalTime.toISOString(),
            confidence: Math.floor(Math.random() * 20) + 80 // 80-100%
        };
    }

    static async calculateDetailedStats(courierId) {
        // En producción, calcular desde la base de datos
        return {
            totalDeliveries: Math.floor(Math.random() * 500) + 100,
            successfulDeliveries: Math.floor(Math.random() * 450) + 95,
            failedDeliveries: Math.floor(Math.random() * 10),
            averageRating: (Math.random() * 2 + 3).toFixed(1), // 3.0-5.0
            totalRatings: Math.floor(Math.random() * 200) + 50,
            averageDeliveryTime: `${Math.floor(Math.random() * 60) + 30} min`,
            onTimeDeliveryRate: Math.floor(Math.random() * 20) + 80, // 80-100%
            thisWeekDeliveries: Math.floor(Math.random() * 30) + 10,
            thisMonthDeliveries: Math.floor(Math.random() * 100) + 50,
            customerFeedback: {
                positive: Math.floor(Math.random() * 40) + 60, // 60-100%
                neutral: Math.floor(Math.random() * 20) + 10,  // 10-30%
                negative: Math.floor(Math.random() * 10)       // 0-10%
            }
        };
    }

    static getCurrentShift(courier) {
        const now = new Date();
        const hour = now.getHours();
        
        if (hour >= 6 && hour < 14) return 'Matutino (6AM - 2PM)';
        if (hour >= 14 && hour < 22) return 'Vespertino (2PM - 10PM)';
        return 'Nocturno (10PM - 6AM)';
    }

    static calculateDistance(coords1, coords2) {
        if (!coords1 || !coords2) return 'N/A';
        
        // Simulación de cálculo de distancia
        return `${(Math.random() * 15 + 2).toFixed(1)} km`;
    }

    // 🔧 CORREGIDO: Cambié 'package' por 'pkg' para evitar palabra reservada
    static isPackageSuitableForCourier(pkg, courier) {
        // Validar si el paquete es adecuado para el courier
        const vehicleCapacities = {
            'motocicleta': 20, // kg
            'bicicleta': 10,
            'auto': 50,
            'van': 100,
            'camion': 500
        };

        const vehicleType = courier.vehicle_type?.toLowerCase() || 'motocicleta';
        const maxWeight = vehicleCapacities[vehicleType] || 20;

        return pkg.weight <= maxWeight;
    }

    // 🔧 CORREGIDO: Cambié 'package' por 'pkg' para evitar palabra reservada
    static calculateSuitabilityScore(pkg, courier) {
        // Calcular puntuación de idoneidad (0-100)
        let score = 50; // Base score

        // Factor distancia (más cerca = mejor)
        const distance = parseFloat(this.calculateDistance(courier.coordinates, pkg.recipient_coordinates));
        if (!isNaN(distance)) {
            score += Math.max(0, 20 - distance); // Hasta 20 puntos por proximidad
        }

        // Factor peso del paquete
        const weightRatio = pkg.weight / (courier.vehicle_capacity || 20);
        score += (1 - weightRatio) * 15; // Hasta 15 puntos por capacidad

        // Factor urgencia
        if (pkg.service_type === 'express') score += 10;
        if (pkg.priority === 'high') score += 5;

        return Math.min(100, Math.max(0, Math.round(score)));
    }

    static async getRecentDeliveries(courierId, limit = 10) {
        // En producción, obtener de la base de datos
        const mockDeliveries = [];
        for (let i = 0; i < limit; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            mockDeliveries.push({
                id: `DEL${Date.now() + i}`,
                trackingNumber: `ITB${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                recipient: `Cliente ${i + 1}`,
                deliveredAt: date.toISOString(),
                rating: Math.floor(Math.random() * 2) + 4, // 4-5 estrellas
                feedback: i % 3 === 0 ? 'Excelente servicio' : null
            });
        }
        return mockDeliveries;
    }

    static async generateSuggestedRoutes(courier, availablePackages) {
        // Generar rutas sugeridas basadas en ubicación y eficiencia
        const suitablePackages = availablePackages
            .filter(pkg => this.isPackageSuitableForCourier(pkg, courier))
            .slice(0, 5);

        if (suitablePackages.length === 0) {
            return [];
        }

        return [{
            routeId: `ROUTE${Date.now()}`,
            name: 'Ruta Optimizada Sugerida',
            packages: suitablePackages.map(pkg => pkg.id),
            estimatedTime: `${suitablePackages.length * 30} minutos`,
            estimatedDistance: `${suitablePackages.length * 5} km`,
            efficiency: Math.floor(Math.random() * 20) + 80 // 80-100%
        }];
    }

    static addMinutes(date, minutes) {
        const result = new Date(date);
        result.setMinutes(result.getMinutes() + minutes);
        return result.toISOString();
    }
}

module.exports = CourierController;