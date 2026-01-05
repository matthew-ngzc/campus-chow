// @int
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../../src/app.js";
import { sequelize } from "../../src/config/db.js";
import { User } from "../../src/models/User.js";
import bcrypt from "bcryptjs";

const ISS = process.env.JWT_ISSUER || "auth-service";
const SECRET = process.env.JWT_SECRET;

function signToken(payload) {
  return jwt.sign({ iss: ISS, ...payload }, SECRET, { algorithm: "HS256", expiresIn: "1h" });
}

describe("user-service integration (@int)", () => {
  beforeAll(async () => {
    // Connect + recreate schema fresh
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it("register → login → me", async () => {
    // register
    const r1 = await request(app)
      .post("/api/user/auth/register")
      .send({ email: "a@a.com", password: "pass1234", name: "A", phone: "123" })
      .expect(201);

    expect(r1.body).toHaveProperty("id");

    // login
    const r2 = await request(app)
      .post("/api/user/auth/login")
      .send({ email: "a@a.com", password: "pass1234" })
      .expect(200);

    const token = r2.body.accessToken;
    expect(token).toBeTruthy();

    // me
    const r3 = await request(app)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(r3.body.email).toBe("a@a.com");
  });

  it("admin can list/update/delete managed users; user cannot", async () => {
    // seed one normal user
    const u = await User.create({
      email: "b@b.com",
      hashed_password: await bcrypt.hash("pass1234", 10),
      role: "USER",
      name: "B"
    });

    // non-admin token
    const userToken = signToken({ id: String(u.id), role: "USER", email: u.email });

    // forbidden
    await request(app)
      .get("/api/user/management")
      .set("Authorization", `Bearer ${userToken}`)
      .expect(403);

    // admin token
    const adminToken = signToken({ id: "999", role: "ADMIN", email: "admin@x.com" });

    // list
    const list = await request(app)
      .get("/api/user/management?page=0&size=10")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(list.body).toHaveProperty("data");
    expect(Array.isArray(list.body.data)).toBe(true);

    // update
    const upd = await request(app)
      .patch(`/api/user/management/${u.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "B2", coins: 5 })
      .expect(200);

    expect(upd.body.name).toBe("B2");
    expect(upd.body.coins).toBe(5);

    // delete
    await request(app)
      .delete(`/api/user/management/${u.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(204);
  });

  it("updateMyPassword happy path", async () => {
    const u = await User.create({
      email: "c@c.com",
      hashed_password: await bcrypt.hash("oldpass123", 10),
      role: "USER",
      name: "C"
    });

    const token = signToken({ id: String(u.id), role: "USER", email: u.email });

    await request(app)
      .patch("/api/users/me/password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "oldpass123", newPassword: "newpass123" })
      .expect(200);
  });
});
