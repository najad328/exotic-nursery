import { describe, it, expect } from "vitest";
import { validateEnv, MOBILE_REQUIRED_ENV, ADMIN_REQUIRED_ENV } from "../env";

describe("validateEnv", () => {
  it("passes when all required vars are present", () => {
    expect(() =>
      validateEnv(["FOO", "BAR"], { FOO: "a", BAR: "b" })
    ).not.toThrow();
  });

  it("throws when a required var is missing", () => {
    expect(() => validateEnv(["FOO", "BAR"], { FOO: "a" })).toThrow(
      "Missing required environment variables"
    );
  });

  it("lists all missing vars in the error", () => {
    expect(() => validateEnv(["A", "B", "C"], {})).toThrow("- A");
    expect(() => validateEnv(["A", "B", "C"], {})).toThrow("- B");
    expect(() => validateEnv(["A", "B", "C"], {})).toThrow("- C");
  });

  it("treats empty string as missing", () => {
    expect(() => validateEnv(["FOO"], { FOO: "" })).toThrow(
      "Missing required environment variables"
    );
  });

  it("treats undefined as missing", () => {
    expect(() => validateEnv(["FOO"], { FOO: undefined })).toThrow(
      "Missing required environment variables"
    );
  });

  it("includes .env hint in error message", () => {
    expect(() => validateEnv(["FOO"], {})).toThrow("Check your .env file");
  });
});

describe("environment variable constants", () => {
  it("MOBILE_REQUIRED_ENV has Supabase vars", () => {
    expect(MOBILE_REQUIRED_ENV).toContain("EXPO_PUBLIC_SUPABASE_URL");
    expect(MOBILE_REQUIRED_ENV).toContain("EXPO_PUBLIC_SUPABASE_ANON_KEY");
  });

  it("ADMIN_REQUIRED_ENV has Supabase vars", () => {
    expect(ADMIN_REQUIRED_ENV).toContain("NEXT_PUBLIC_SUPABASE_URL");
    expect(ADMIN_REQUIRED_ENV).toContain("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  });
});
