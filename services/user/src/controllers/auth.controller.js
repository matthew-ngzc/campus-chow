import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import amqp from 'amqplib';

const toPublic = (u) => ({
  id: u.id,
  email: u.email,
  name: u.name,
  phone: u.phone,
  profile_picture: u.profile_picture,
  coins: u.coins,
  role: u.role,
  created_at: u.created_at, 
});

const rabbitmqUrl = `amqp://${process.env.RABBITMQ_USERNAME}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`;

async function sendWelcomeEmailToQueue(email, name) {
  try {
    const connection = await amqp.connect(rabbitmqUrl);
    const channel = await connection.createChannel();

    const exchange = 'smunch.events';
    const routingKey = 'user.welcome';

    const emailEvent = {
      to: email,
      subject: 'Welcome to Campus Chow 🎉',
      template: 'welcome_user',
      variables: {
        customerName: name,
      }
    };

    await channel.assertExchange(exchange, 'topic', { durable: true });
    await channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(emailEvent)), {
      persistent: true,
      headers: {
        sourceService: 'user',  
        sentAt: new Date().toISOString(), 
        messageId: generateUUID(),  
      }
    });

    console.log(`Welcome email event sent to queue for ${email}`);
    await channel.close();
    await connection.close();
  } catch (error) {
    console.error("Error sending welcome email event:", error);
  }
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/**
 * POST /api/user/auth/register
 */
export const register = async (req, res) => {
  const { email, password, name, phone } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: "email & password required" });
  }

  const exists = await User.findOne({ where: { email: email.toLowerCase() } });
  if (exists) return res.status(409).json({ message: "email already registered" });

  const hashed_password = await bcrypt.hash(password, 10);
  const u = await User.create({
    email: email.toLowerCase(),
    name,
    phone,
    hashed_password,
    role: "USER",
  });

  await sendWelcomeEmailToQueue(email, name);

  return res.status(201).json({ id: u.id, email: u.email });
};

/**
 * POST /api/user/auth/login
 * returns { accessToken, user: {...} }
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const u = await User.findOne({ where: { email: email.toLowerCase() } });
    if (!u) return res.status(401).json({ message: "Invalid email or password" });

    const ok = await bcrypt.compare(password, u.hashed_password);
    if (!ok) return res.status(401).json({ message: "Invalid email or password" });

    const payload = {
      sub: String(u.id),
      id: String(u.id),
      email: email,
      role: u.role || "USER",
      iss: process.env.JWT_ISSUER || "auth-service", // must match Kong key_claim_name
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      algorithm: "HS256",
      expiresIn: process.env.JWT_EXPIRES || "1d",
    });

    // optional: async update last_login
    User.update({ last_login: new Date() }, { where: { id: u.id } }).catch(() => {});

    return res.json({
      accessToken,
      user: toPublic(u),
    });
  } catch (err) {
    console.error("[login] error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

