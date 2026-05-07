// @vitest-environment node
import { describe, test, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockCookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

describe("createSession", () => {
  beforeEach(() => vi.clearAllMocks());

  test("sets httpOnly cookie with a signed JWT", async () => {
    const { createSession } = await import("../auth");
    await createSession("user-1", "user@example.com");

    expect(mockCookieStore.set).toHaveBeenCalledOnce();
    const [name, token, options] = mockCookieStore.set.mock.calls[0];
    expect(name).toBe("auth-token");
    expect(token.split(".")).toHaveLength(3);
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
  });

  test("cookie expires ~7 days from now", async () => {
    const { createSession } = await import("../auth");
    const before = Date.now();
    await createSession("user-1", "user@example.com");
    const after = Date.now();

    const [, , options] = mockCookieStore.set.mock.calls[0];
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    expect(options.expires.getTime()).toBeGreaterThanOrEqual(before + sevenDaysMs - 1000);
    expect(options.expires.getTime()).toBeLessThanOrEqual(after + sevenDaysMs + 1000);
  });

  test("JWT payload contains userId and email", async () => {
    const { createSession } = await import("../auth");
    await createSession("user-42", "hello@world.com");

    const [, token] = mockCookieStore.set.mock.calls[0];
    const payload = JSON.parse(atob(token.split(".")[1]));
    expect(payload.userId).toBe("user-42");
    expect(payload.email).toBe("hello@world.com");
  });
});
