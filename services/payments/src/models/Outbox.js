import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db/client.js';

export class Outbox extends Model {}

Outbox.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
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
    properties: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    exchange: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'published_at',
    },
  },
  {
    sequelize,
    modelName: 'Outbox',
    tableName: 'outbox',
    timestamps: false,

    indexes: [
      {
        name: 'outbox_published_at_idx',
        fields: ['published_at'],
      },
      {
        name: 'outbox_routing_key_idx',
        fields: ['routing_key'],
      },
      {
        name: 'outbox_exchange_idx',
        fields: ['exchange'],
      },
      {
        name: 'outbox_unpublished_idx',
        fields: ['published_at'],
        where: {
          published_at: null,
        },
      },
    ],
  }
);
