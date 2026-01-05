// @unit
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as userCtrl from "../../src/controllers/user.controller.js";
import * as userModel from "../../src/models/User.js";

describe("user.controller (@unit)", () => {
  beforeEach(() => vi.restoreAllMocks());

  const mkRes = () => {
    const res = { statusCode: 200, body: null };
    res.status = vi.fn((c) => { res.statusCode = c; return res; });
    res.json = vi.fn((b) => { res.body = b; return res; });
    return res;
  };

  it("getMe → 200 user", async () => {
    const req = { user: { id: 1 } };
    const res = mkRes();

    vi.spyOn(userModel.User, "findByPk").mockResolvedValue({
      id: 1, email: "a@a.com", name: "A", phone: "1", profile_picture: null, coins: 0, role: "USER", created_at: new Date()
    });

    await userCtrl.getMe(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe("a@a.com");
  });

  it("updateMe email duplicate → 409", async () => {
    const req = { user: { id: 1 }, body: { email: "dup@a.com" } };
    const res = mkRes();

    const current = { id: 1, email: "old@a.com", save: vi.fn() };
    vi.spyOn(userModel.User, "findByPk").mockResolvedValue(current);
    vi.spyOn(userModel.User, "findOne").mockResolvedValue({ id: 2, email: "dup@a.com" });

    await userCtrl.updateMe(req, res);
    expect(res.statusCode).toBe(409);
    expect(res.body.error).toMatch(/email already in use/i);
  });
});
