import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const User = sequelize.define("User", {
  id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true },
  email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(100) },
  phone: { type: DataTypes.STRING(32) },
  hashed_password: { type: DataTypes.STRING(255), allowNull: false },
  coins: { type: DataTypes.INTEGER, defaultValue: 0 },
  profile_picture: { type: DataTypes.STRING(512) },
  role: { type: DataTypes.STRING(20), allowNull: false, defaultValue: "USER" }
}, {
  tableName: "users",
  timestamps: true,
  createdAt: "created_at",
  updatedAt: false
});
