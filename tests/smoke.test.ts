import { describe, expect, it } from "vitest";
import { asset } from "@/lib/asset";

describe("asset", () => {
  it("returns a root-relative path when no basePath is set", () => {
    expect(asset("/images/logo.webp")).toBe("/images/logo.webp");
  });

  it("normalizes paths missing a leading slash", () => {
    expect(asset("images/logo.webp")).toBe("/images/logo.webp");
  });
});
