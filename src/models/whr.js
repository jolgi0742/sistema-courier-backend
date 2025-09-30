// src/models/whr.js - MODELO WHR SIN SEQUELIZE

// Base de datos en memoria para WHR (Warehouse Receipt)
let whrPackages = [
    {
        id: 1,
        whr_number: 'WHR241216001',
        shipper_name: 'PREMIER GLOBAL USA CORP',
        shipper_email: 'shipper@premierglobal.com',
        shipper_phone: '+1-305-555-0123',
        shipper_address: '8548 NW 72ND ST., MIAMI, FL 33166',
        consignee_name: 'DISTRIBUIDORA COSTARRICENSE S.A.',
        consignee_email: 'recepcion@distcr.com',
        consignee_phone: '+506-2222-3333',
        consignee_address: 'San José, Costa Rica',
        tracking_number: 'TRK241216001',
        pieces: 5,
        weight: 25.50,
        length: 120.0,
        width: 80.0,
        height: 60.0,
        volume: 0.576000,
        volume_weight: 5.990,
        declared_value: 1500.00,
        classification: 'pending',
        transport_type: null,
        email_sent: false,
        arrival_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        notes: 'Paquete frágil - manejar con cuidado'
    },
    {
        id: 2,
        whr_number: 'WHR241216002',
        shipper_name: 'GLOBAL LOGISTICS INC',
        shipper_email: 'exports@globallogistics.com',
        shipper_phone: '+1-786-555-0456',
        shipper_address: 'MIAMI, FL 33135',
        consignee_name: 'IMPORTACIONES DEL PACÍFICO',
        consignee_email: 'imports@pacifico.cr',
        consignee_phone: '+506-4444-5555',
        consignee_address: 'Puntarenas, Costa Rica',
        tracking_number: 'TRK241216002',
        pieces: 3,
        weight: 15.25,
        length: 90.0,
        width: 60.0,
        height: 45.0,
        volume: 0.243000,
        volume_weight: 2.527,
        declared_value: 750.00,
        classification: 'awb',
        transport_type: 'aereo',
        email_sent: true,
        arrival_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        notes: 'Documentos comerciales incluidos'
    },
    {
        id: 3,
        whr_number: 'WHR241216003',
        shipper_name: 'ATLANTIC SHIPPING CO',
        shipper_email: 'ocean@atlanticship.com',
        shipper_phone: '+1-954-555-0789',
        shipper_address: 'PORT EVERGLADES, FL 33316',
        consignee_name: 'COMERCIAL CENTROAMERICANA',
        consignee_email: 'operaciones@comcentro.cr',
        consignee_phone: '+506-6666-7777',
        consignee_address: 'Limón, Costa Rica',
        tracking_number: 'TRK241216003',
        pieces: 12,
        weight: 480.75,
        length: 200.0,
        width: 120.0,
        height: 100.0,
        volume: 2.400000,
        volume_weight: 24.960,
        declared_value: 8500.00,
        classification: 'bl',
        transport_type: 'maritimo',
        email_sent: true,
        arrival_date: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
        created_at: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString(),
        notes: 'Carga consolidada - múltiples productos'
    }
];

// Eventos de tracking para WHR
let whrTrackingEvents = [
    {
        id: 1,
        whr_id: 1,
        event_type: 'arrival',
        description: 'Paquete recibido en almacén',
        location: 'Almacén CAMCA',
        event_date: new Date().toISOString(),
        created_by: 'Sistema'
    },
    {
        id: 2,
        whr_id: 2,
        event_type: 'classified',
        description: 'Clasificado como carga aérea (AWB)',
        location: 'Oficina de clasificación',
        event_date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        created_by: 'Operador'
    },
    {
        id: 3,
        whr_id: 2,
        event_type: 'email_sent',
        description: 'Email de notificación enviado al consignatario',
        location: 'Sistema',
        event_date: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        created_by: 'Sistema automático'
    },
    {
        id: 4,
        whr_id: 3,
        event_type: 'classified',
        description: 'Clasificado como carga marítima (BL)',
        location: 'Oficina de clasificación',
        event_date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        created_by: 'Supervisor'
    }
];

// Contadores para IDs autoincrementales
let whrIdCounter = whrPackages.length + 1;
let whrEventIdCounter = whrTrackingEvents.length + 1;

class WHR {
    // Crear nuevo WHR
    static async create(whrData) {
        try {
            const newWHR = {
                id: whrIdCounter++,
                whr_number: this.generateWHRNumber(),
                shipper_name: whrData.shipperName || '',
                shipper_email: whrData.shipperEmail || '',
                shipper_phone: whrData.shipperPhone || '',
                shipper_address: whrData.shipperAddress || '',
                consignee_name: whrData.consigneeName || '',
                consignee_email: whrData.consigneeEmail || '',
                consignee_phone: whrData.consigneePhone || '',
                consignee_address: whrData.consigneeAddress || '',
                tracking_number: whrData.trackingNumber || this.generateTrackingNumber(),
                pieces: whrData.pieces || 1,
                weight: parseFloat(whrData.weight) || 0,
                length: parseFloat(whrData.length) || 0,
                width: parseFloat(whrData.width) || 0,
                height: parseFloat(whrData.height) || 0,
                volume: this.calculateVolume(whrData.length, whrData.width, whrData.height),
                volume_weight: this.calculateVolumeWeight(whrData.length, whrData.width, whrData.height),
                declared_value: parseFloat(whrData.declaredValue) || 0,
                classification: 'pending',
                transport_type: null,
                email_sent: false,
                arrival_date: whrData.arrivalDate || new Date().toISOString(),
                notes: whrData.notes || '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            whrPackages.push(newWHR);

            // Crear evento inicial
            await this.createTrackingEvent(
                newWHR.id,
                'created',
                'Almacén CAMCA',
                'WHR creado en el sistema',
                'Sistema'
            );

            return newWHR;
        } catch (error) {
            console.error('Error creando WHR:', error);
            throw error;
        }
    }

    // Buscar WHR por ID
    static async findById(id) {
        try {
            return whrPackages.find(whr => whr.id == id) || null;
        } catch (error) {
            console.error('Error buscando WHR por ID:', error);
            return null;
        }
    }

    // Buscar WHR por número
    static async findByWHRNumber(whrNumber) {
        try {
            return whrPackages.find(whr => whr.whr_number === whrNumber) || null;
        } catch (error) {
            console.error('Error buscando WHR por número:', error);
            return null;
        }
    }

    // Obtener todos los WHRs con filtros
    static async findAll(filters = {}, limit = 50, offset = 0) {
        try {
            let filteredWHRs = [...whrPackages];

            // Aplicar filtros
            if (filters.classification) {
                filteredWHRs = filteredWHRs.filter(whr => whr.classification === filters.classification);
            }
            if (filters.transport_type) {
                filteredWHRs = filteredWHRs.filter(whr => whr.transport_type === filters.transport_type);
            }
            if (filters.email_sent !== undefined) {
                filteredWHRs = filteredWHRs.filter(whr => whr.email_sent === filters.email_sent);
            }
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                filteredWHRs = filteredWHRs.filter(whr =>
                    whr.whr_number.toLowerCase().includes(searchTerm) ||
                    whr.tracking_number.toLowerCase().includes(searchTerm) ||
                    whr.consignee_name.toLowerCase().includes(searchTerm) ||
                    whr.shipper_name.toLowerCase().includes(searchTerm)
                );
            }

            // Ordenar por fecha de creación (más recientes primero)
            filteredWHRs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

            // Paginación
            return filteredWHRs.slice(offset, offset + limit);
        } catch (error) {
            console.error('Error obteniendo WHRs:', error);
            return [];
        }
    }

    // Contar WHRs con filtros
    static async count(filters = {}) {
        try {
            let filteredWHRs = [...whrPackages];

            if (filters.classification) {
                filteredWHRs = filteredWHRs.filter(whr => whr.classification === filters.classification);
            }
            if (filters.transport_type) {
                filteredWHRs = filteredWHRs.filter(whr => whr.transport_type === filters.transport_type);
            }

            return filteredWHRs.length;
        } catch (error) {
            console.error('Error contando WHRs:', error);
            return 0;
        }
    }

    // Actualizar clasificación del WHR
    static async updateClassification(id, classification, transportType) {
        try {
            const whrIndex = whrPackages.findIndex(whr => whr.id == id);
            if (whrIndex !== -1) {
                whrPackages[whrIndex].classification = classification;
                whrPackages[whrIndex].transport_type = transportType;
                whrPackages[whrIndex].updated_at = new Date().toISOString();

                // Crear evento de tracking
                await this.createTrackingEvent(
                    id,
                    'classified',
                    'Oficina de clasificación',
                    `Clasificado como ${classification} - ${transportType}`,
                    'Operador'
                );

                return whrPackages[whrIndex];
            }
            return null;
        } catch (error) {
            console.error('Error actualizando clasificación:', error);
            return null;
        }
    }

    // Marcar email como enviado
    static async markEmailSent(id) {
        try {
            const whrIndex = whrPackages.findIndex(whr => whr.id == id);
            if (whrIndex !== -1) {
                whrPackages[whrIndex].email_sent = true;
                whrPackages[whrIndex].updated_at = new Date().toISOString();

                // Crear evento de tracking
                await this.createTrackingEvent(
                    id,
                    'email_sent',
                    'Sistema',
                    'Email de notificación enviado al consignatario',
                    'Sistema automático'
                );

                return whrPackages[whrIndex];
            }
            return null;
        } catch (error) {
            console.error('Error marcando email como enviado:', error);
            return null;
        }
    }

    // Obtener historial de tracking
    static async getTrackingHistory(whrId) {
        try {
            return whrTrackingEvents
                .filter(event => event.whr_id == whrId)
                .sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
        } catch (error) {
            console.error('Error obteniendo historial de tracking:', error);
            return [];
        }
    }

    // Crear evento de tracking
    static async createTrackingEvent(whrId, eventType, location, description, createdBy) {
        try {
            const newEvent = {
                id: whrEventIdCounter++,
                whr_id: whrId,
                event_type: eventType,
                description: description,
                location: location,
                event_date: new Date().toISOString(),
                created_by: createdBy || 'Sistema',
                created_at: new Date().toISOString()
            };

            whrTrackingEvents.push(newEvent);
            return newEvent;
        } catch (error) {
            console.error('Error creando evento de tracking:', error);
            return null;
        }
    }

    // Obtener estadísticas
    static async getStatistics() {
        try {
            const total = whrPackages.length;
            const pending = whrPackages.filter(whr => whr.classification === 'pending').length;
            const awb = whrPackages.filter(whr => whr.classification === 'awb').length;
            const bl = whrPackages.filter(whr => whr.classification === 'bl').length;
            const emailsSent = whrPackages.filter(whr => whr.email_sent).length;

            const totalWeight = whrPackages.reduce((sum, whr) => sum + whr.weight, 0);
            const totalValue = whrPackages.reduce((sum, whr) => sum + whr.declared_value, 0);
            const totalVolume = whrPackages.reduce((sum, whr) => sum + whr.volume, 0);

            return {
                total,
                pending,
                awb,
                bl,
                emailsSent,
                emailsPending: total - emailsSent,
                totalWeight: totalWeight.toFixed(2),
                totalValue: totalValue.toFixed(2),
                totalVolume: totalVolume.toFixed(6),
                averageWeight: total > 0 ? (totalWeight / total).toFixed(2) : 0,
                averageValue: total > 0 ? (totalValue / total).toFixed(2) : 0
            };
        } catch (error) {
            console.error('Error obteniendo estadísticas WHR:', error);
            return {
                total: 0,
                pending: 0,
                awb: 0,
                bl: 0,
                emailsSent: 0,
                emailsPending: 0,
                totalWeight: 0,
                totalValue: 0,
                totalVolume: 0,
                averageWeight: 0,
                averageValue: 0
            };
        }
    }

    // Eliminar WHR
    static async delete(id) {
        try {
            const whrIndex = whrPackages.findIndex(whr => whr.id == id);
            if (whrIndex !== -1) {
                whrPackages.splice(whrIndex, 1);
                
                // Eliminar eventos de tracking relacionados
                whrTrackingEvents = whrTrackingEvents.filter(event => event.whr_id != id);
                
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error eliminando WHR:', error);
            return false;
        }
    }

    // MÉTODOS DE UTILIDAD

    // Generar número WHR único
    static generateWHRNumber() {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const sequence = (whrIdCounter).toString().padStart(3, '0');
        
        const whrNumber = `WHR${year}${month}${day}${sequence}`;
        
        // Verificar que no exista ya
        if (whrPackages.find(whr => whr.whr_number === whrNumber)) {
            return this.generateWHRNumber(); // Recursivo hasta encontrar uno único
        }
        
        return whrNumber;
    }

    // Generar número de tracking único
    static generateTrackingNumber() {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const sequence = (whrIdCounter).toString().padStart(3, '0');
        
        return `TRK${year}${month}${day}${sequence}`;
    }

    // Calcular volumen en metros cúbicos
    static calculateVolume(length, width, height) {
        if (!length || !width || !height) return 0;
        // Convertir de cm a m³ y aplicar factor de conversión
        return parseFloat(((length * width * height) * 0.000578746).toFixed(6));
    }

    // Calcular peso volumétrico
    static calculateVolumeWeight(length, width, height) {
        const volume = this.calculateVolume(length, width, height);
        return parseFloat((volume * 10.4).toFixed(3));
    }
}

module.exports = WHR;