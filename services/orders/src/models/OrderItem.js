import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db/client.js';
import { Order } from './Order.js';

export class OrderItem extends Model {}

OrderItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Order,
        key: 'order_id',
      },
      onDelete: 'CASCADE',
      field: 'order_id',
    },
    menuItemId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'menu_item_id',
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    unitPriceCents: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'unit_price_cents',
    },
    qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    options: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  },
  {
    sequelize,
    modelName: 'OrderItem',
    tableName: 'order_items',
    timestamps: false,
  }
);

// Associations
Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
