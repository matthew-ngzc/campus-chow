// tests/unit/auth.controller.test.js
// @unit
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as authCtrl from "../../src/controllers/auth.controller.js";
import * as userModel from "../../src/models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// auto-mock RabbitMQ so register() won't try real network
vi.mock("amqplib", () => import("../__mocks__/amqplib.js"));

describe("auth.controller (@unit)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mkRes = () => {
    const res = { statusCode: 200, body: null };
    res.status = vi.fn((c) => {
      res.statusCode = c;
      return res;
    });
    res.json = vi.fn((b) => {
      res.body = b;
      return res;
    });
    res.send = vi.fn(() => res);
    return res;
  };

  it("register → 201 + id/email", async () => {
    const req = {
      body: { email: "a@a.com", password: "pass1234", name: "A", phone: "123" },
    };
    const res = mkRes();

    vi.spyOn(userModel.User, "findOne").mockResolvedValue(null);
    vi.spyOn(userModel.User, "create").mockResolvedValue({ id: 1, email: "a@a.com" });

    await authCtrl.register(req, res);

    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({ id: 1, email: "a@a.com" });
  });

  it("login → 200 + token + user", async () => {
    // force password match
    vi.spyOn(bcrypt, "compare").mockResolvedValue(true);

    const req = { body: { email: "a@a.com", password: "pass1234" } };
    const res = mkRes();

    const hashed_password = "$2a$10$somethingfakebutok";
    vi.spyOn(userModel.User, "findOne").mockResolvedValue({
      id: 9,
      email: "a@a.com",
      role: "USER",
      hashed_password,
    });

    const tokenSpy = vi.spyOn(jwt, "sign");

    await authCtrl.login(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("accessToken");
    expect(tokenSpy).toHaveBeenCalled();
    expect(res.body).toHaveProperty("user");
    expect(res.body.user.email).toBe("a@a.com");
  });
});

