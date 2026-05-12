import { describe, expect, it } from "vitest";

import { canAccessTenantApp } from "./access-policy";

describe("tenant access policy", () => {
  it("permite tenants ativos, em trial e em atraso operacional", () => {
    expect(canAccessTenantApp("active")).toBe(true);
    expect(canAccessTenantApp("trialing")).toBe(true);
    expect(canAccessTenantApp("past_due")).toBe(true);
  });

  it("bloqueia tenants suspensos ou cancelados", () => {
    expect(canAccessTenantApp("suspended")).toBe(false);
    expect(canAccessTenantApp("canceled")).toBe(false);
  });
});
