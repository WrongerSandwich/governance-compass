import { describe, it, expect } from "vitest";
import { groupMemberHandle, memberHandleKey } from "@/lib/group-privacy";

const KEY = "test-secret";
const USER = "cku4t0z1w0000abcdefghijkl";

describe("groupMemberHandle", () => {
  it("returns the same handle for the same member every time", () => {
    expect(groupMemberHandle(KEY, "group-1", USER)).toBe(
      groupMemberHandle(KEY, "group-1", USER)
    );
  });

  it("gives one member different handles in different groups", () => {
    expect(groupMemberHandle(KEY, "group-1", USER)).not.toBe(
      groupMemberHandle(KEY, "group-2", USER)
    );
  });

  it("gives different members different handles in one group", () => {
    expect(groupMemberHandle(KEY, "group-1", USER)).not.toBe(
      groupMemberHandle(KEY, "group-1", "another-user")
    );
  });

  it("never embeds the raw user id", () => {
    expect(groupMemberHandle(KEY, "group-1", USER)).not.toContain(USER);
  });

  it("is not reproducible without the server key", () => {
    expect(groupMemberHandle(KEY, "group-1", USER)).not.toBe(
      groupMemberHandle("other-secret", "group-1", USER)
    );
  });
});

describe("memberHandleKey", () => {
  it("uses the configured auth secret", () => {
    expect(memberHandleKey({ NEXTAUTH_SECRET: "configured" })).toBe("configured");
  });

  it("falls back to AUTH_SECRET when NEXTAUTH_SECRET is unset", () => {
    expect(memberHandleKey({ AUTH_SECRET: "v5-style" })).toBe("v5-style");
  });

  it("returns a stable generated key when no secret is configured", () => {
    const first = memberHandleKey({});
    expect(first).not.toBe("");
    expect(memberHandleKey({})).toBe(first);
  });
});
