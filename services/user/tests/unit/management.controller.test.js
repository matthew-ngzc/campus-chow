// @unit
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as mgmtCtrl from "../../src/controllers/management.controller.js";
import * as userModel from "../../src/models/User.js";

describe("management.controller (@unit)", () => {
  beforeEach(() => vi.restoreAllMocks());
  const mkRes = () => {
    const res = { statusCode: 200, body: null };
    res.status = vi.fn((c) => { res.statusCode = c; return res; });
    res.json = vi.fn((b) => { res.body = b; return res; });
    res.send = vi.fn(() => res);
    return res;
  };

  it("listManagedUsers default paging", async () => {
    const req = { query: {} };
    const res = mkRes();
    vi.spyOn(userModel.User, "findAndCountAll").mockResolvedValue({
      rows: [{ id: 1, email: "a@a.com" }], count: 1
    });
    await mgmtCtrl.listManagedUsers(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body.total).toBe(1);
  });

  it("updateManagedUser invalid email → 400", async () => {
    const req = { params: { id: 1 }, body: { email: "bad" } };
    const res = mkRes();
    vi.spyOn(userModel.User, "findByPk").mockResolvedValue({ id: 1, email: "x@x.com" });
    await mgmtCtrl.updateManagedUser(req, res);
    expect(res.statusCode).toBe(400);
  });
});
