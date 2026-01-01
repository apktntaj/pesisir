/**
 * Shipment Validation Tests
 *
 * Following HtDP: Tests/Examples BEFORE implementation
 * These tests verify the validation schemas work correctly
 */

import { describe, it, expect } from "vitest";
import {
  CreateShipmentSchema,
  UpdateStatusSchema,
  ShipmentStatusSchema,
  phoneNumberSchema,
  blNumberSchema,
  isValidStatusTransition,
  getNextValidStatuses,
  VALID_SHIPMENT_EXAMPLE,
  MINIMAL_SHIPMENT_EXAMPLE,
} from "./shipment";

describe("ShipmentStatusSchema", () => {
  it("accepts valid statuses", () => {
    const validStatuses = [
      "created",
      "sailing",
      "pre_arrival",
      "arrived",
      "clearing",
      "released",
      "delivered",
    ];

    validStatuses.forEach((status) => {
      const result = ShipmentStatusSchema.safeParse(status);
      expect(result.success).toBe(true);
    });
  });

  it("rejects invalid statuses", () => {
    const result = ShipmentStatusSchema.safeParse("invalid_status");
    expect(result.success).toBe(false);
  });
});

describe("blNumberSchema", () => {
  it("accepts valid BL numbers", () => {
    const validBLs = [
      "OOLU1234567890",
      "MAEU123456",
      "BL-001",
      "ABC/123/XYZ",
      "TEST1234",
    ];

    validBLs.forEach((bl) => {
      const result = blNumberSchema.safeParse(bl);
      expect(result.success, `Expected ${bl} to be valid`).toBe(true);
    });
  });

  it("rejects BL numbers with invalid characters", () => {
    const invalidBLs = ["BL@123", "BL 123", "BL#123"];

    invalidBLs.forEach((bl) => {
      const result = blNumberSchema.safeParse(bl);
      expect(result.success, `Expected ${bl} to be invalid`).toBe(false);
    });
  });

  it("rejects too short BL numbers", () => {
    const result = blNumberSchema.safeParse("AB");
    expect(result.success).toBe(false);
  });
});

describe("phoneNumberSchema", () => {
  it("accepts valid Indonesian phone numbers", () => {
    const validPhones = [
      "081234567890",
      "08123456789",
      "+6281234567890",
      "6281234567890",
    ];

    validPhones.forEach((phone) => {
      const result = phoneNumberSchema.safeParse(phone);
      expect(result.success, `Expected ${phone} to be valid`).toBe(true);
    });
  });

  it("normalizes phone numbers to 628xxx format", () => {
    expect(phoneNumberSchema.parse("081234567890")).toBe("6281234567890");
    expect(phoneNumberSchema.parse("+6281234567890")).toBe("6281234567890");
    expect(phoneNumberSchema.parse("6281234567890")).toBe("6281234567890");
  });

  it("rejects invalid phone numbers", () => {
    const invalidPhones = ["12345", "081", "+1234567890", "abc"];

    invalidPhones.forEach((phone) => {
      const result = phoneNumberSchema.safeParse(phone);
      expect(result.success, `Expected ${phone} to be invalid`).toBe(false);
    });
  });
});

describe("CreateShipmentSchema", () => {
  it("accepts VALID_SHIPMENT_EXAMPLE", () => {
    const result = CreateShipmentSchema.safeParse(VALID_SHIPMENT_EXAMPLE);
    expect(result.success).toBe(true);
  });

  it("accepts MINIMAL_SHIPMENT_EXAMPLE", () => {
    const result = CreateShipmentSchema.safeParse(MINIMAL_SHIPMENT_EXAMPLE);
    expect(result.success).toBe(true);
  });

  it("rejects missing required fields", () => {
    const invalid = {
      bl_number: "BL-001",
      // missing shipper, consignee, pod, variant
    };
    const result = CreateShipmentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects invalid variant", () => {
    const invalid = {
      ...MINIMAL_SHIPMENT_EXAMPLE,
      variant: "INVALID",
    };
    const result = CreateShipmentSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});

describe("UpdateStatusSchema", () => {
  it("accepts valid status update", () => {
    const result = UpdateStatusSchema.safeParse({
      status: "sailing",
      notes: "Kapal berangkat",
    });
    expect(result.success).toBe(true);
  });

  it("accepts status without notes", () => {
    const result = UpdateStatusSchema.safeParse({
      status: "arrived",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = UpdateStatusSchema.safeParse({
      status: "invalid",
    });
    expect(result.success).toBe(false);
  });
});

describe("isValidStatusTransition", () => {
  it("allows forward transitions", () => {
    expect(isValidStatusTransition("created", "sailing")).toBe(true);
    expect(isValidStatusTransition("created", "delivered")).toBe(true);
    expect(isValidStatusTransition("sailing", "arrived")).toBe(true);
    expect(isValidStatusTransition("clearing", "released")).toBe(true);
  });

  it("rejects backward transitions", () => {
    expect(isValidStatusTransition("sailing", "created")).toBe(false);
    expect(isValidStatusTransition("delivered", "created")).toBe(false);
    expect(isValidStatusTransition("released", "clearing")).toBe(false);
  });

  it("rejects same status transition", () => {
    expect(isValidStatusTransition("created", "created")).toBe(false);
    expect(isValidStatusTransition("sailing", "sailing")).toBe(false);
  });
});

describe("getNextValidStatuses", () => {
  it("returns all subsequent statuses from created", () => {
    const next = getNextValidStatuses("created");
    expect(next).toEqual([
      "sailing",
      "pre_arrival",
      "arrived",
      "clearing",
      "released",
      "delivered",
    ]);
  });

  it("returns remaining statuses from mid-workflow", () => {
    const next = getNextValidStatuses("arrived");
    expect(next).toEqual(["clearing", "released", "delivered"]);
  });

  it("returns empty array from delivered (final status)", () => {
    const next = getNextValidStatuses("delivered");
    expect(next).toEqual([]);
  });
});
