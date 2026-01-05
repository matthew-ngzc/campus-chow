import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db/client.js';

export class Transaction extends Model {}

Transaction.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    transactionRef: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'transaction_ref',
    },
    amountCents: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'amount_cents',
    },
    dateTime: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'date_time',
    },
    sender: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    receiver: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    modelName: 'Transaction',
    tableName: 'transactions',
    timestamps: false,

    indexes: [
      {
        name: 'transactions_transaction_ref_unique',
        unique: true,
        fields: ['transaction_ref'],
      },
      {
        name: 'transactions_sender_idx',
        fields: ['sender'],
      },
      {
        name: 'transactions_receiver_idx',
        fields: ['receiver'],
      },
      {
        name: 'transactions_date_time_idx',
        fields: ['date_time'],
      },
    ],
  }
);