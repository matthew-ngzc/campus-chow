import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db/client.js';

export class Inbox extends Model {}

Inbox.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    messageId: {
      type: DataTypes.TEXT,
      allowNull: true,
      unique: true,
      field: 'message_id',
    },
    routingKey: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'routing_key',
    },
    payload: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    receivedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'received_at',
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'processed_at',
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'received',
      allowNull: true,
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'error_message',
    },
    properties: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Inbox',
    tableName: 'inbox',
    timestamps: false,
  }
);
