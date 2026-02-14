// ── Products Master Data Tests ──
// Validates integrity and consistency of product definitions

import { describe, it, expect } from "vitest";
import { PRODUCTS } from "../products";
import { ProductFamily } from "../types";

const VALID_FAMILIES: ProductFamily[] = [
  "Azure",
  "Dynamics 365",
  "Microsoft 365",
  "Power Platform",
  "Security",
  "Other",
];

describe("Products master data", () => {
  it("should have at least 15 products defined", () => {
    expect(PRODUCTS.length).toBeGreaterThanOrEqual(15);
  });

  it("should have unique product IDs", () => {
    const ids = PRODUCTS.map((p) => p.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("should have valid ProductFamily for all products", () => {
    PRODUCTS.forEach((product) => {
      expect(VALID_FAMILIES).toContain(product.family);
    });
  });

  it("should have required fields for every product", () => {
    PRODUCTS.forEach((product) => {
      expect(product.id).toBeTruthy();
      expect(product.name).toBeTruthy();
      expect(product.family).toBeTruthy();
      expect(product.sources).toBeDefined();
      expect(product.sources.length).toBeGreaterThan(0);
    });
  });

  it("should have at least one product per major family", () => {
    const familyCounts = new Map<string, number>();
    PRODUCTS.forEach((p) => {
      familyCounts.set(p.family, (familyCounts.get(p.family) || 0) + 1);
    });
    const majorFamilies = ["Azure", "Dynamics 365", "Microsoft 365", "Power Platform", "Security"];
    majorFamilies.forEach((family) => {
      expect(familyCounts.get(family)).toBeGreaterThanOrEqual(1);
    });
  });
});
