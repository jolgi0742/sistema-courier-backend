// backend/src/models/Quote.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Quote = sequelize.define('Quote', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  quote_number: {
    type: DataTypes.STRING(20),
    unique: true,
    allowNull: false
  },
  
  // Información del solicitante
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  
  user_role: {
    type: DataTypes.ENUM('admin', 'client', 'agent'),
    allowNull: false
  },
  
  client_name: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  
  client_email: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  
  agent_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  
  // Detalles del envío
  origin: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  
  destination: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  
  weight: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false
  },
  
  dimensions: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  
  declared_value: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  
  // Tipo de servicio
  service_type: {
    type: DataTypes.ENUM('standard', 'express', 'overnight', 'same_day'),
    defaultValue: 'standard'
  },
  
  urgency: {
    type: DataTypes.ENUM('normal', 'urgent', 'emergency'),
    defaultValue: 'normal'
  },
  
  pickup_type: {
    type: DataTypes.ENUM('office', 'home', 'remote'),
    defaultValue: 'office'
  },
  
  // Cálculos automáticos
  distance_km: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true
  },
  
  base_cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  
  weight_cost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  
  distance_cost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  
  service_cost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  
  urgency_cost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  
  pickup_cost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  
  insurance_cost: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  
  tax_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  
  // Estado y seguimiento
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'expired', 'converted'),
    defaultValue: 'pending'
  },
  
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  
  // Información adicional
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  special_instructions: {
    type: DataTypes.TEXT,
    allowNull: true
  }
  
}, {
  tableName: 'quotes',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  
  // Hooks para generar quote_number automáticamente
  hooks: {
    beforeCreate: async (quote) => {
      if (!quote.quote_number) {
        const year = new Date().getFullYear();
        const count = await Quote.count({
          where: sequelize.where(
            sequelize.fn('YEAR', sequelize.col('created_at')), 
            year
          )
        });
        quote.quote_number = `QT-${year}-${String(count + 1).padStart(3, '0')}`;
      }
      
      // Calcular fecha de expiración si no se proporciona
      if (!quote.expires_at) {
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 7); // 7 días por defecto
        quote.expires_at = expirationDate;
      }
    }
  }
});

// Modelo para historial de estados
const QuoteStatusHistory = sequelize.define('QuoteStatusHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  quote_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'quotes',
      key: 'id'
    }
  },
  
  old_status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'expired', 'converted'),
    allowNull: true
  },
  
  new_status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'expired', 'converted'),
    allowNull: false
  },
  
  changed_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  
  reason: {
    type: DataTypes.TEXT,
    allowNull: true
  }
  
}, {
  tableName: 'quote_status_history',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false
});

// Definir relaciones
Quote.belongsTo(sequelize.models.User || require('./User'), { 
  foreignKey: 'user_id', 
  as: 'user' 
});

Quote.belongsTo(sequelize.models.User || require('./User'), { 
  foreignKey: 'agent_id', 
  as: 'agent' 
});

Quote.hasMany(QuoteStatusHistory, { 
  foreignKey: 'quote_id', 
  as: 'statusHistory' 
});

QuoteStatusHistory.belongsTo(Quote, { 
  foreignKey: 'quote_id', 
  as: 'quote' 
});

QuoteStatusHistory.belongsTo(sequelize.models.User || require('./User'), { 
  foreignKey: 'changed_by', 
  as: 'changedBy' 
});

module.exports = { Quote, QuoteStatusHistory };