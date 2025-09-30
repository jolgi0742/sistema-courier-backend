// backend/src/models/Courier.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Courier = sequelize.define('Courier', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active'
    },
    available: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    vehicle_type: {
      type: DataTypes.ENUM('motorcycle', 'car', 'bicycle', 'truck', 'van'),
      allowNull: false
    },
    license_plate: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 5.00,
      validate: {
        min: 0,
        max: 5
      }
    },
    total_deliveries: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    location_lat: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true
    },
    location_lng: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true
    },
    last_location_update: {
      type: DataTypes.DATE,
      allowNull: true
    },
    emergency_contact: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    emergency_phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    hire_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'couriers',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Courier;
};