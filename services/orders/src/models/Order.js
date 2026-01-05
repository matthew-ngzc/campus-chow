import { Model, DataTypes } from "sequelize";
import { sequelize } from "../db/client.js";

export class Order extends Model {}

Order.init(
  {
    orderId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "order_id",
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "customer_id",
    },
    customerEmail: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: "customer_email",
    },
    merchantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "merchant_id",
    },
    deliveryTime: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "delivery_time",
    },
    deliveryCompletionTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "delivery_completion_time",
    },
    paymentDeadlineTime: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "payment_deadline_time",
    },
    building: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        len: [1, 20],
        is: /^[A-Za-z0-9]+$/i,
      },
    },
    roomType: {
      type: DataTypes.STRING(24),
      allowNull: false,
      field: "room_type",
      validate: {
        len: [1, 24],
        is: /^[A-Za-z0-9 ]+$/i,
      },
    },
    roomNumber: {
      type: DataTypes.STRING(10),
      allowNull: false,
      field: "room_number",
      validate: {
        len: [1, 10],
        is: /^[A-Za-z0-9-]+$/i,
      },
    },
    amountSubtotalCents: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "amount_subtotal_cents",
    },
    amountDeliveryFeeCents: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100,
      field: "amount_delivery_fee_cents",
    },
    amountTotalCents: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "amount_total_cents",
    },
    orderStatus: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "order_status",
    },
    cancelReasonCode: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "cancel_reason_code",
    },
    createdTime: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: "created_time",
    },
    updatedTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "updated_time",
    },
  },
  {
    sequelize,
    modelName: "Order",
    tableName: "orders",
    timestamps: false,
  }
);
