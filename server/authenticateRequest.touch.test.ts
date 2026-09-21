import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fs from "fs";
import * as path from "path";

vi.mock("./db", () => ({
  getUserByOpenId: vi.fn(),
  upsertUser: vi.fn(),
  touchUserLastSignedIn: vi.fn(),
}));

import * as db from "./db";
import { sdk } from "./_core/sdk";
import { COOKIE_NAME } from "../shared/const";

const req = { headers: { cookie: `${COOKIE_NAME}=tok` } } as any;
const existing = { id: 1, openId: "open-1", email: "a@b.c", name: "A" } as any;

describe("authenticateRequest last-seen touch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    vi.mocked(db.getUserByOpenId).mockReset().mockResolvedValue(undefined);
    vi.mocked(db.upsertUser).mockReset().mockResolvedValue(undefined);
    vi.mocked(db.touchUserLastSignedIn).mockReset().mockResolvedValue(undefined);
    vi.spyOn(sdk, "verifySession").mockResolvedValue({ openId: "open-1", appId: "x", name: "A" } as any);
  });

  it("existing user: 3 requests never upsert, only touch lastSignedIn", async () => {
    vi.mocked(db.getUserByOpenId).mockResolvedValue(existing);
    for (let i = 0; i < 3; i++) await sdk.authenticateRequest(req);
    expect(db.upsertUser).toHaveBeenCalledTimes(0);
    expect(db.touchUserLastSignedIn).toHaveBeenCalledTimes(3);
    for (const call of vi.mocked(db.touchUserLastSignedIn).mock.calls) {
      expect(call[0]).toBe("open-1");
      expect(call[1]).toBeDefined();
    }
  });

  it("touch failure is logged but does not block authentication", async () => {
    vi.mocked(db.getUserByOpenId).mockResolvedValue(existing);
    const err = new Error("db down");
    vi.mocked(db.touchUserLastSignedIn).mockRejectedValue(err);
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(sdk.authenticateRequest(req)).resolves.toBe(existing);
    expect(db.upsertUser).toHaveBeenCalledTimes(0);
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining("lastSignedIn"), err);
    errSpy.mockRestore();
  });

  it("missing user: first-time sync still upserts once", async () => {
    vi.mocked(db.getUserByOpenId)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(existing);
    vi.spyOn(sdk, "getUserInfoWithJwt").mockResolvedValue({
      openId: "open-1", name: "A", email: "a@b.c", loginMethod: "google", platform: "google",
    } as any);
    await sdk.authenticateRequest(req);
    expect(db.upsertUser).toHaveBeenCalledTimes(1);
  });
});

describe("source guards", () => {
  const read = (p: string) => fs.readFileSync(path.resolve(__dirname, p), "utf8");

  it("rate limiter uses real procedure names and covers direct signup", () => {
    const code = read("_core/index.ts");
    expect(code).toContain("emailAuth.signup");
    expect(code).toContain("emailAuth.requestPasswordReset");
    expect(code).not.toContain("emailAuth.register");
    expect(code).not.toContain("emailAuth.forgotPassword");
    expect(code).toMatch(/app\.use\("\/api\/trpc\/emailAuth\.requestPasswordReset",\s*authLimiter/);
    // signupLimiter counts successful requests and guards both signup paths
    const start = code.indexOf("const signupLimiter = rateLimit(");
    expect(start).toBeGreaterThan(-1);
    const def = code.slice(start, code.indexOf("});", start));
    expect(def).not.toContain("skipSuccessfulRequests");
    expect(code).toMatch(/app\.use\("\/api\/trpc\/emailAuth\.signup",\s*signupLimiter/);
    expect(code).toMatch(/app\.post\("\/api\/auth\/signup",\s*signupLimiter/);
    expect(code).not.toMatch(/emailAuth\.signup",\s*authLimiter/);
    expect(code).not.toMatch(/\/api\/auth\/signup",\s*authLimiter/);
  });

  it("touchUserLastSignedIn is update-only", () => {
    const code = read("db.ts");
    const start = code.indexOf("export async function touchUserLastSignedIn");
    const body = code.slice(start, code.indexOf("\n}\n", start));
    expect(start).toBeGreaterThan(-1);
    expect(body).toContain(".update(");
    expect(body).not.toContain(".insert(");
    expect(body).not.toContain("onDuplicateKey");
  });
});
