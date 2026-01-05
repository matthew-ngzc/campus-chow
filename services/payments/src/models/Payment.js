import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../db/client.js';
import { PAYMENT_STATUSES } from '../api/constants/enums.constants.js';

export class Payment extends Model {}

Payment.init(
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    orderId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'order_id',
    },
    amountCents: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'amount_cents',
    },
    paymentStatus: {
      type: DataTypes.ENUM(...Object.values(PAYMENT_STATUSES)),
      allowNull: false,
      defaultValue: PAYMENT_STATUSES.PENDING,
      field: 'payment_status',
    },
    paymentReference: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: 'payment_reference',
    },
    paymentDeadline: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'payment_deadline',
    },
    transactionRef: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'transaction_ref',
    },
    transactionAmt: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'transaction_amt',
    },
    transactionDatetime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'transaction_datetime',
    },
    screenshotUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'screenshot_url',
    },
    matchingTransactionId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'matching_transaction_id',
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    modelName: 'Payment',
    tableName: 'payments',
    timestamps: false,

    indexes: [
      {
        name: 'payments_order_id_unique',
        unique: true,
        fields: ['order_id'],
      },
      {
        name: 'payments_transaction_ref_unique',
        unique: true,
        fields: ['transaction_ref'],
      },
      {
        name: 'payments_payment_ref_idx',
        unique: false,
        fields: ['payment_reference'],
      },
      {
        name: 'payments_status_idx',
        fields: ['payment_status'],
      },
      {
        name: 'payments_deadline_idx',
        fields: ['payment_deadline'],
      },
    ],
  }
);
